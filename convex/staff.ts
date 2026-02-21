import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";

/* ==================== TYPES ==================== */

type StaffRole = "tailor" | "beader" | "fitter" | "qc";

interface StaffWithAvailability extends Doc<"staff"> {
  availability: "available" | "busy";
  currentAssignment?: {
    orderId: Id<"orders">;
    orderNumber: string;
    stage: string;
  };
}

/* ==================== CREATE STAFF ==================== */

export const createStaff = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    role: v.union(
      v.literal("tailor"),
      v.literal("beader"),
      v.literal("fitter"),
      v.literal("qc"),
    ),
  },
  handler: async (ctx, args) => {
    // Check if phone already exists
    const existingStaff = await ctx.db
      .query("staff")
      .withIndex("by_phone", (q) => q.eq("phone", args.phone))
      .first();

    if (existingStaff) {
      throw new Error(`Staff ${args.name} with this phone number already exists`);
    }

    const now = Date.now();

    const staffId = await ctx.db.insert("staff", {
      name: args.name,
      phone: args.phone,
      role: args.role,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return staffId;
  },
});

/* ==================== GET ALL STAFF ==================== */

export const getAllStaff = query({
  args: {},
  handler: async (ctx): Promise<StaffWithAvailability[]> => {
    const staff = await ctx.db.query("staff").order("desc").collect();

    // Enrich with availability status
    const enrichedStaff = await Promise.all(
      staff.map(async (member) => {
        const availability = await getStaffAvailability(ctx, member._id);
        return {
          ...member,
          ...availability,
        };
      }),
    );

    return enrichedStaff;
  },
});

/* ==================== GET STAFF BY ROLE ==================== */

export const getStaffByRole = query({
  args: {
    role: v.union(
      v.literal("tailor"),
      v.literal("beader"),
      v.literal("fitter"),
      v.literal("qc"),
    ),
  },
  handler: async (ctx, { role }): Promise<StaffWithAvailability[]> => {
    const staff = await ctx.db
      .query("staff")
      .withIndex("by_role", (q) => q.eq("role", role))
      .collect();

    // Enrich with availability status
    const enrichedStaff = await Promise.all(
      staff.map(async (member) => {
        const availability = await getStaffAvailability(ctx, member._id);
        return {
          ...member,
          ...availability,
        };
      }),
    );

    return enrichedStaff;
  },
});

/* ==================== GET AVAILABLE STAFF BY ROLE ==================== */

export const getAvailableStaffByRole = query({
  args: {
    role: v.union(
      v.literal("tailor"),
      v.literal("beader"),
      v.literal("fitter"),
      v.literal("qc"),
    ),
  },
  handler: async (ctx, { role }): Promise<StaffWithAvailability[]> => {
    // Get all active staff with this role
    const staff = await ctx.db
      .query("staff")
      .withIndex("by_active_role", (q) =>
        q.eq("isActive", true).eq("role", role),
      )
      .collect();

    // Filter to only available staff (no active assignments)
    const availableStaff: StaffWithAvailability[] = [];

    for (const member of staff) {
      const activeAssignment = await ctx.db
        .query("staffAssignments")
        .withIndex("by_staff_and_status", (q) =>
          q.eq("staffId", member._id).eq("status", "active"),
        )
        .first();

      if (!activeAssignment) {
        availableStaff.push({
          ...member,
          availability: "available",
        });
      }
    }

    return availableStaff;
  },
});

/* ==================== GET STAFF BY ID ==================== */

export const getStaffById = query({
  args: {
    staffId: v.id("staff"),
  },
  handler: async (ctx, { staffId }): Promise<StaffWithAvailability | null> => {
    const staff = await ctx.db.get(staffId);

    if (!staff) {
      return null;
    }

    const availability = await getStaffAvailability(ctx, staffId);

    return {
      ...staff,
      ...availability,
    };
  },
});

/* ==================== UPDATE STAFF ==================== */

export const updateStaff = mutation({
  args: {
    staffId: v.id("staff"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(
      v.union(
        v.literal("tailor"),
        v.literal("beader"),
        v.literal("fitter"),
        v.literal("qc"),
      ),
    ),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { staffId, ...updates } = args;

    const staff = await ctx.db.get(staffId);
    if (!staff) {
      throw new Error("Staff member not found");
    }

    // If phone is being updated, check for duplicates
    if (updates.phone && updates.phone !== staff.phone) {
      const existingStaff = await ctx.db
        .query("staff")
        .withIndex("by_phone", (q) => q.eq("phone", updates.phone!))
        .first();

      if (existingStaff) {
        throw new Error(`Staff ${staff.name} with this phone number already exists`);
      }
    }

    // Check if staff has active assignments before deactivating
    if (updates.isActive === false) {
      const activeAssignment = await ctx.db
        .query("staffAssignments")
        .withIndex("by_staff_and_status", (q) =>
          q.eq("staffId", staffId).eq("status", "active"),
        )
        .first();

      if (activeAssignment) {
        throw new Error(
          "Cannot deactivate staff member with active assignments. " +
            "Please complete or reassign current orders first.",
        );
      }
    }

    await ctx.db.patch(staffId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return staffId;
  },
});

/* ==================== DELETE STAFF ==================== */

export const deleteStaff = mutation({
  args: {
    staffId: v.id("staff"),
  },
  handler: async (ctx, { staffId }) => {
    const staff = await ctx.db.get(staffId);
    if (!staff) {
      throw new Error("Staff member not found");
    }

    // Check for active assignments
    const activeAssignment = await ctx.db
      .query("staffAssignments")
      .withIndex("by_staff_and_status", (q) =>
        q.eq("staffId", staffId).eq("status", "active"),
      )
      .first();

    if (activeAssignment) {
      throw new Error(
        "Cannot delete staff member with active assignments. " +
          "Please complete or reassign current orders first.",
      );
    }

    // Soft delete by marking as inactive instead of hard delete
    // This preserves historical data
    await ctx.db.patch(staffId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return staffId;
  },
});

/* ==================== GET STAFF WORKLOAD ==================== */

export const getStaffWorkload = query({
  args: {
    staffId: v.id("staff"),
  },
  handler: async (ctx, { staffId }) => {
    const staff = await ctx.db.get(staffId);
    if (!staff) {
      throw new Error("Staff member not found");
    }

    // Get active assignment
    const activeAssignment = await ctx.db
      .query("staffAssignments")
      .withIndex("by_staff_and_status", (q) =>
        q.eq("staffId", staffId).eq("status", "active"),
      )
      .first();

    // Get completed assignments count
    const completedAssignments = await ctx.db
      .query("staffAssignments")
      .withIndex("by_staff_and_status", (q) =>
        q.eq("staffId", staffId).eq("status", "completed"),
      )
      .collect();

    // Get stage history
    const stageHistory = await ctx.db
      .query("stageHistory")
      .withIndex("by_staff", (q) => q.eq("assignedStaffId", staffId))
      .collect();

    // Calculate average completion time
    const completedStages = stageHistory.filter(
      (stage) => stage.status === "completed" && stage.duration,
    );

    const avgCompletionTime =
      completedStages.length > 0
        ? completedStages.reduce(
            (sum, stage) => sum + (stage.duration || 0),
            0,
          ) / completedStages.length
        : 0;

    return {
      staff: {
        _id: staff._id,
        name: staff.name,
        role: staff.role,
      },
      activeAssignment: activeAssignment
        ? {
            orderId: activeAssignment.orderId,
            orderNumber: activeAssignment.orderNumber,
            stage: activeAssignment.stage,
            assignedAt: activeAssignment.assignedAt,
          }
        : null,
      statistics: {
        totalCompleted: completedAssignments.length,
        totalStagesCompleted: completedStages.length,
        avgCompletionTimeMs: Math.round(avgCompletionTime),
        avgCompletionTimeHours:
          Math.round((avgCompletionTime / (1000 * 60 * 60)) * 10) / 10,
      },
    };
  },
});

/* ==================== GET ALL STAFF WORKLOADS ==================== */

export const getAllStaffWorkloads = query({
  args: {},
  handler: async (ctx) => {
    const allStaff = await ctx.db.query("staff").collect();

    const workloads = await Promise.all(
      allStaff.map(async (staff) => {
        const activeAssignment = await ctx.db
          .query("staffAssignments")
          .withIndex("by_staff_and_status", (q) =>
            q.eq("staffId", staff._id).eq("status", "active"),
          )
          .first();

        const completedCount = await ctx.db
          .query("staffAssignments")
          .withIndex("by_staff_and_status", (q) =>
            q.eq("staffId", staff._id).eq("status", "completed"),
          )
          .collect();

        return {
          staffId: staff._id,
          name: staff.name,
          role: staff.role,
          isActive: staff.isActive,
          availability: activeAssignment
            ? ("busy" as const)
            : ("available" as const),
          currentOrder: activeAssignment
            ? {
                orderId: activeAssignment.orderId,
                orderNumber: activeAssignment.orderNumber,
                stage: activeAssignment.stage,
              }
            : null,
          completedCount: completedCount.length,
        };
      }),
    );

    return workloads;
  },
});

/* ==================== HELPER FUNCTIONS ==================== */

/**
 * Get staff availability status
 * Single source of truth: derived from active assignments
 */
async function getStaffAvailability(
  ctx: QueryCtx | MutationCtx,
  staffId: Id<"staff">,
): Promise<{
  availability: "available" | "busy";
  currentAssignment?: {
    orderId: Id<"orders">;
    orderNumber: string;
    stage: string;
  };
}> {
  // Check for active assignment
  const activeAssignment = await ctx.db
    .query("staffAssignments")
    .withIndex("by_staff_and_status", (q) =>
      q.eq("staffId", staffId).eq("status", "active"),
    )
    .first();

  if (activeAssignment) {
    return {
      availability: "busy",
      currentAssignment: {
        orderId: activeAssignment.orderId,
        orderNumber: activeAssignment.orderNumber,
        stage: activeAssignment.stage,
      },
    };
  }

  return {
    availability: "available",
  };
}

/* ==================== STAFF PERFORMANCE METRICS ==================== */

export const getStaffPerformanceMetrics = query({
  args: {
    staffId: v.optional(v.id("staff")),
    role: v.optional(
      v.union(
        v.literal("tailor"),
        v.literal("beader"),
        v.literal("fitter"),
        v.literal("qc"),
      ),
    ),
  },
  handler: async (ctx, { staffId, role }) => {
    let staffMembers: Doc<"staff">[];

    if (staffId) {
      const staff = await ctx.db.get(staffId);
      staffMembers = staff ? [staff] : [];
    } else if (role) {
      staffMembers = await ctx.db
        .query("staff")
        .withIndex("by_role", (q) => q.eq("role", role))
        .collect();
    } else {
      staffMembers = await ctx.db.query("staff").collect();
    }

    const metrics = await Promise.all(
      staffMembers.map(async (staff) => {
        const stageHistory = await ctx.db
          .query("stageHistory")
          .withIndex("by_staff", (q) => q.eq("assignedStaffId", staff._id))
          .collect();

        const completed = stageHistory.filter(
          (stage) => stage.status === "completed",
        );
        const inProgress = stageHistory.filter(
          (stage) => stage.status === "in_progress",
        );

        const durations = completed
          .filter((stage) => stage.duration)
          .map((stage) => stage.duration!);

        const avgDuration =
          durations.length > 0
            ? durations.reduce((sum, d) => sum + d, 0) / durations.length
            : 0;

        const minDuration = durations.length > 0 ? Math.min(...durations) : 0;
        const maxDuration = durations.length > 0 ? Math.max(...durations) : 0;

        return {
          staff: {
            _id: staff._id,
            name: staff.name,
            role: staff.role,
            isActive: staff.isActive,
          },
          metrics: {
            totalAssignments: stageHistory.length,
            completedAssignments: completed.length,
            inProgressAssignments: inProgress.length,
            avgCompletionTimeHours:
              Math.round((avgDuration / (1000 * 60 * 60)) * 10) / 10,
            minCompletionTimeHours:
              Math.round((minDuration / (1000 * 60 * 60)) * 10) / 10,
            maxCompletionTimeHours:
              Math.round((maxDuration / (1000 * 60 * 60)) * 10) / 10,
          },
        };
      }),
    );

    return metrics;
  },
});
