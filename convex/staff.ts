import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/* ==================== GET ALL STAFF ==================== */

export const getAllStaff = query({
  args: {},
  handler: async (ctx) => {
    const allStaff = await ctx.db.query("staff").order('desc').collect();
    const allOrders = await ctx.db.query("orders").collect();

    // Build assignment map, completed count, and total duration in a single pass
    const assignmentMap = new Map<string, { orderId: Id<"orders">; orderNumber: string; stage: string }>();
    const completedCountMap = new Map<string, number>();
    const totalDurationMap = new Map<string, number>();

    for (const order of allOrders) {
      if (order.currentlyAssignedTo) {
        assignmentMap.set(order.currentlyAssignedTo.staffId, {
          orderId: order._id,
          orderNumber: order.orderNumber,
          stage: order.currentlyAssignedTo.stage,
        });
      }

      for (const assignment of [
        order.assignedTailor,
        order.assignedBeader,
        order.assignedFitter,
        order.assignedQC,
      ]) {
        if (assignment?.completedAt) {
          const key = assignment.staffId as string;
          completedCountMap.set(key, (completedCountMap.get(key) ?? 0) + 1);
          totalDurationMap.set(key, (totalDurationMap.get(key) ?? 0) + (assignment.duration ?? 0));
        }
      }
    }

    return allStaff.map((staff) => {
      const currentAssignment = assignmentMap.get(staff._id);
      const totalCompleted = completedCountMap.get(staff._id) ?? 0;
      const totalDuration = totalDurationMap.get(staff._id) ?? 0;
      const avgCompletionTimeHours =
        totalCompleted > 0 ? totalDuration / totalCompleted / (1000 * 60 * 60) : 0;

      return {
        ...staff,
        availability: currentAssignment ? ("busy" as const) : ("available" as const),
        currentAssignment,
        totalCompleted,
        avgCompletionTimeHours,
      };
    });
  },
});

/* ========= GET STAFF FOR WORKFLOW (OPTIMIZED) ========== */

export const getStaffForWorkflow = query({
  args: {},
  handler: async (ctx) => {
    const allStaff = await ctx.db.query("staff").collect();
    const allOrders = await ctx.db.query("orders").collect();

    // Build active assignment map and completed count map in a single pass
    const assignmentMap = new Map<string, { orderId: Id<"orders">; orderNumber: string; stage: string }>();
    const completedCountMap = new Map<string, number>();

    for (const order of allOrders) {
      if (order.currentlyAssignedTo) {
        assignmentMap.set(order.currentlyAssignedTo.staffId, {
          orderId: order._id,
          orderNumber: order.orderNumber,
          stage: order.currentlyAssignedTo.stage,
        });
      }

      for (const assignment of [
        order.assignedTailor,
        order.assignedBeader,
        order.assignedFitter,
        order.assignedQC,
      ]) {
        if (assignment?.completedAt) {
          const key = assignment.staffId as string;
          completedCountMap.set(key, (completedCountMap.get(key) ?? 0) + 1);
        }
      }
    }

    return allStaff.map((staff) => {
      const currentAssignment = assignmentMap.get(staff._id);
      return {
        ...staff,
        availability: currentAssignment ? ("busy" as const) : ("available" as const),
        currentAssignment,
        totalCompleted: completedCountMap.get(staff._id) ?? 0,
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
  args: {
    staffId: v.id("staff"),
  },
  handler: async (ctx, { staffId }) => {
    const staff = await ctx.db.get(staffId);
    if (!staff) return null;

    // ✅ Get all orders and check assignments
    const allOrders = await ctx.db.query("orders").collect();

    // Count completed work by this staff member
    let totalCompleted = 0;
    let totalDuration = 0;

    for (const order of allOrders) {
      // Check each stage assignment
      if (
        order.assignedTailor?.staffId === staffId &&
        order.assignedTailor.completedAt
      ) {
        totalCompleted++;
        totalDuration += order.assignedTailor.duration || 0;
      }
      if (
        order.assignedBeader?.staffId === staffId &&
        order.assignedBeader.completedAt
      ) {
        totalCompleted++;
        totalDuration += order.assignedBeader.duration || 0;
      }
      if (
        order.assignedFitter?.staffId === staffId &&
        order.assignedFitter.completedAt
      ) {
        totalCompleted++;
        totalDuration += order.assignedFitter.duration || 0;
      }
      if (
        order.assignedQC?.staffId === staffId &&
        order.assignedQC.completedAt
      ) {
        totalCompleted++;
        totalDuration += order.assignedQC.duration || 0;
      }
    }

    // Find current assignment
    const currentOrder = allOrders.find(
      (order) => order.currentlyAssignedTo?.staffId === staffId,
    );

    return {
      staffId,
      staffName: staff.name,
      role: staff.role,
      currentAssignment: currentOrder
        ? {
            orderId: currentOrder._id,
            orderNumber: currentOrder.orderNumber,
            stage: currentOrder.currentlyAssignedTo!.stage,
            assignedAt:
              currentOrder.currentlyAssignedTo!.stage === "tailoring"
                ? currentOrder.assignedTailor?.assignedAt
                : currentOrder.currentlyAssignedTo!.stage === "beading"
                  ? currentOrder.assignedBeader?.assignedAt
                  : currentOrder.currentlyAssignedTo!.stage === "fitting"
                    ? currentOrder.assignedFitter?.assignedAt
                    : currentOrder.assignedQC?.assignedAt,
          }
        : null,
      statistics: {
        totalCompleted,
        totalDuration,
        averageDuration:
          totalCompleted > 0 ? totalDuration / totalCompleted : 0,
      },
    };
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

    const allOrders = await ctx.db.query("orders").collect();

    // Block any action if staff has an active (in-progress) assignment
    const hasActiveAssignment = allOrders.some(
      (order) => order.currentlyAssignedTo?.staffId === staffId,
    );
    if (hasActiveAssignment) {
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

    // Hard delete — only if no historical assignments exist
    const hasHistory = allOrders.some(
      (order) =>
        order.assignedTailor?.staffId === staffId ||
        order.assignedBeader?.staffId === staffId ||
        order.assignedFitter?.staffId === staffId ||
        order.assignedQC?.staffId === staffId,
    );

    if (hasHistory) {
      // Fall back to deactivation to preserve historical records
      await ctx.db.patch(staffId, { isActive: false });
      return {
        deletionType: "soft" as const,
        message: `${staff.name} has historical order records and was deactivated instead of deleted.`,
      };
    }

    await ctx.db.delete(staffId);
    return {
      deletionType: "hard" as const,
      message: `${staff.name} has been permanently deleted.`,
    };
  },
});
