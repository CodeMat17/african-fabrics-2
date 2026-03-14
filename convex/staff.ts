import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/* ==================== GET ALL STAFF ==================== */

export const getAllStaff = query({
  args: {},
  handler: async (ctx) => {
    const allStaff = await ctx.db.query("staff").order("desc").collect();

    // Only fetch active (uncollected) orders — collected orders can never have
    // an active assignment, so there is no reason to load them here.
    const activeOrders = await ctx.db
      .query("orders")
      .withIndex("by_collected", (q) => q.eq("collected", false))
      .collect();

    // Pre-computed historical stats — written by completeCurrentStage.
    // Avoids scanning the full orders history on every subscription tick.
    const cacheEntries = await ctx.db.query("staffPerformanceCache").collect();
    const cacheMap = new Map(cacheEntries.map((c) => [c.staffId as string, c]));

    // Build current-assignment map from active orders only
    const assignmentMap = new Map<
      string,
      { orderId: Id<"orders">; orderNumber: string; stage: string }
    >();
    for (const order of activeOrders) {
      if (order.currentlyAssignedTo) {
        assignmentMap.set(order.currentlyAssignedTo.staffId, {
          orderId: order._id,
          orderNumber: order.orderNumber,
          stage: order.currentlyAssignedTo.stage,
        });
      }
    }

    return allStaff.map((staff) => {
      const currentAssignment = assignmentMap.get(staff._id);
      const cache = cacheMap.get(staff._id as string);
      return {
        ...staff,
        availability: currentAssignment ? ("busy" as const) : ("available" as const),
        currentAssignment,
        totalCompleted: cache?.totalOrders ?? 0,
        avgCompletionTimeHours: cache
          ? cache.avgDuration / (1000 * 60 * 60)
          : 0,
      };
    });
  },
});

/* ========= GET STAFF FOR WORKFLOW ========== */

export const getStaffForWorkflow = query({
  args: {},
  handler: async (ctx) => {
    const allStaff = await ctx.db.query("staff").collect();

    // Active orders only — no need to load historical collected orders
    const activeOrders = await ctx.db
      .query("orders")
      .withIndex("by_collected", (q) => q.eq("collected", false))
      .collect();

    // Use the performance cache for completion counts
    const cacheEntries = await ctx.db.query("staffPerformanceCache").collect();
    const cacheMap = new Map(
      cacheEntries.map((c) => [c.staffId as string, c.totalOrders]),
    );

    const assignmentMap = new Map<
      string,
      { orderId: Id<"orders">; orderNumber: string; stage: string }
    >();
    for (const order of activeOrders) {
      if (order.currentlyAssignedTo) {
        assignmentMap.set(order.currentlyAssignedTo.staffId, {
          orderId: order._id,
          orderNumber: order.orderNumber,
          stage: order.currentlyAssignedTo.stage,
        });
      }
    }

    return allStaff.map((staff) => {
      const currentAssignment = assignmentMap.get(staff._id);
      return {
        ...staff,
        availability: currentAssignment ? ("busy" as const) : ("available" as const),
        currentAssignment,
        totalCompleted: cacheMap.get(staff._id as string) ?? 0,
      };
    });
  },
});

/* ==================== GET STAFF BY ID ==================== */

export const getStaffById = query({
  args: {
    staffId: v.id("staff"),
  },
  handler: async (ctx, { staffId }) => {
    return await ctx.db.get(staffId);
  },
});

/* ==================== GET STAFF WORKLOAD ==================== */

export const getStaffWorkload = query({
  args: { staffId: v.id("staff") },
  handler: async (ctx, { staffId }) => {
    const staff = await ctx.db.get(staffId);
    if (!staff) return null;

    // Current assignment — O(1) index lookup instead of full scan
    const currentOrder = await ctx.db
      .query("orders")
      .withIndex("by_current_staff", (q) =>
        q.eq("currentlyAssignedTo.staffId", staffId),
      )
      .first();

    // Historical stats from cache — no order scan needed
    const cache = await ctx.db
      .query("staffPerformanceCache")
      .withIndex("by_staff", (q) => q.eq("staffId", staffId))
      .first();

    return {
      staffId,
      staffName: staff.name,
      role: staff.role,
      currentAssignment: currentOrder
        ? {
            orderId: currentOrder._id,
            orderNumber: currentOrder.orderNumber,
            stage: currentOrder.currentlyAssignedTo!.stage,
          }
        : null,
      statistics: {
        totalCompleted: cache?.totalOrders ?? 0,
        totalDuration: (cache?.avgDuration ?? 0) * (cache?.totalOrders ?? 0),
        averageDuration: cache?.avgDuration ?? 0,
      },
    };
  },
});

/* ==================== REBUILD PERFORMANCE CACHE ==================== */
// Run this once from the Convex dashboard after deploying to seed historical stats.
// After that, completeCurrentStage keeps the cache up-to-date incrementally.

export const rebuildPerformanceCache = mutation({
  args: {},
  handler: async (ctx) => {
    // Wipe existing entries
    const existing = await ctx.db.query("staffPerformanceCache").collect();
    for (const entry of existing) await ctx.db.delete(entry._id);

    const allOrders = await ctx.db.query("orders").collect();
    const statsMap = new Map<
      string,
      { totalOrders: number; totalDuration: number }
    >();

    for (const order of allOrders) {
      for (const assignment of [
        order.assignedTailor,
        order.assignedBeader,
        order.assignedFitter,
        order.assignedQC,
      ]) {
        if (assignment?.completedAt) {
          const key = assignment.staffId as string;
          const s = statsMap.get(key) ?? { totalOrders: 0, totalDuration: 0 };
          statsMap.set(key, {
            totalOrders: s.totalOrders + 1,
            totalDuration: s.totalDuration + (assignment.duration ?? 0),
          });
        }
      }
    }

    const now = Date.now();
    for (const [staffIdStr, stats] of statsMap) {
      await ctx.db.insert("staffPerformanceCache", {
        staffId: staffIdStr as Id<"staff">,
        totalOrders: stats.totalOrders,
        avgDuration:
          stats.totalOrders > 0
            ? stats.totalDuration / stats.totalOrders
            : 0,
        lastCalculated: now,
      });
    }

    return { rebuilt: statsMap.size };
  },
});

/* ==================== CREATE STAFF ==================== */

export const createStaff = mutation({
  args: {
    name: v.string(),
    role: v.union(
      v.literal("tailor"),
      v.literal("beader"),
      v.literal("fitter"),
      v.literal("qc"),
    ),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const staffId = await ctx.db.insert("staff", {
      name: args.name,
      role: args.role,
      phone: args.phone || "",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return staffId;
  },
});

/* ==================== UPDATE STAFF ==================== */

export const updateStaff = mutation({
  args: {
    staffId: v.id("staff"),
    name: v.optional(v.string()),
    role: v.optional(
      v.union(
        v.literal("tailor"),
        v.literal("beader"),
        v.literal("fitter"),
        v.literal("qc"),
      ),
    ),
    phone: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { staffId, ...updates } = args;
    await ctx.db.patch(staffId, updates);
  },
});

/* ==================== DELETE STAFF ==================== */

export const deleteStaff = mutation({
  args: {
    staffId: v.id("staff"),
    forceDelete: v.optional(v.boolean()),
  },
  handler: async (ctx, { staffId, forceDelete }) => {
    const staff = await ctx.db.get(staffId);
    if (!staff) {
      throw new Error("Staff member not found");
    }

    // O(1) index lookup — no full table scan
    const activeOrder = await ctx.db
      .query("orders")
      .withIndex("by_current_staff", (q) =>
        q.eq("currentlyAssignedTo.staffId", staffId),
      )
      .first();

    if (activeOrder) {
      throw new Error(
        "Cannot remove staff with an active assignment. Complete or reassign their current order first.",
      );
    }

    // Soft delete (deactivate) — always safe
    if (!forceDelete) {
      await ctx.db.patch(staffId, { isActive: false });
      return {
        deletionType: "soft" as const,
        message: `${staff.name} has been deactivated and can no longer be assigned to orders.`,
      };
    }

    // Hard delete — check history using stage-specific indexes (each returns
    // at most one row via .first(), so we load almost no data)
    const historyOrder =
      (await ctx.db
        .query("orders")
        .withIndex("by_tailor", (q) => q.eq("assignedTailor.staffId", staffId))
        .first()) ??
      (await ctx.db
        .query("orders")
        .withIndex("by_beader", (q) => q.eq("assignedBeader.staffId", staffId))
        .first()) ??
      (await ctx.db
        .query("orders")
        .withIndex("by_fitter", (q) => q.eq("assignedFitter.staffId", staffId))
        .first()) ??
      (await ctx.db
        .query("orders")
        .withIndex("by_qc", (q) => q.eq("assignedQC.staffId", staffId))
        .first());

    if (historyOrder) {
      await ctx.db.patch(staffId, { isActive: false });
      return {
        deletionType: "soft" as const,
        message: `${staff.name} has historical order records and was deactivated instead of deleted.`,
      };
    }

    // Clean up performance cache entry before deleting
    const cacheEntry = await ctx.db
      .query("staffPerformanceCache")
      .withIndex("by_staff", (q) => q.eq("staffId", staffId))
      .first();
    if (cacheEntry) await ctx.db.delete(cacheEntry._id);

    await ctx.db.delete(staffId);
    return {
      deletionType: "hard" as const,
      message: `${staff.name} has been permanently deleted.`,
    };
  },
});
