import { mutation, query, MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/* ==================== TYPES ==================== */

type WorkflowStage =
  | "pending"
  | "tailoring"
  | "beading"
  | "fitting"
  | "qc"
  | "completed";
type StaffRole = "tailor" | "beader" | "fitter" | "qc";

const STAGE_ROLE_MAP: Record<string, StaffRole> = {
  tailoring: "tailor",
  beading: "beader",
  fitting: "fitter",
  qc: "qc",
};

const STAGE_PROGRESS_MAP: Record<WorkflowStage, number> = {
  pending: 0,
  tailoring: 25,
  beading: 50,
  fitting: 75,
  qc: 90,
  completed: 100,
};

const WORKFLOW_STAGES: WorkflowStage[] = [
  "pending",
  "tailoring",
  "beading",
  "fitting",
  "qc",
  "completed",
];

/* ==================== ORDER NUMBER GENERATION ==================== */

const generatePrefixFromName = (name: string): string => {
  const cleaned = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z\s]/g, "");

  const parts = cleaned.split(/\s+/).filter(Boolean);

  let letters = "";

  if (parts.length >= 3) {
    letters = parts[0][0] + parts[1][0] + parts[2][0];
  } else if (parts.length === 2) {
    const first = parts[0][0];
    const second = parts[1][0];
    const extra = parts[0][1] ?? parts[1][1] ?? "X";
    letters = first + second + extra;
  } else if (parts.length === 1) {
    const word = parts[0];
    letters = (word + "XXX").slice(0, 3);
  } else {
    letters = "XXX";
  }

  return letters;
};

export const generateOrderNumber = async (
  ctx: MutationCtx | QueryCtx,
  name: string,
): Promise<string> => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, "0");

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const orders = await ctx.db.query("orders").collect();

  const monthlyCount = orders.filter(
    (order) => order.createdAt >= startOfMonth,
  ).length;

  const prefix = generatePrefixFromName(name);

  return `${prefix}-${year}${month}-${String(monthlyCount + 1).padStart(4, "0")}`;
};

/* ==================== CREATE ORDER ==================== */

export const createOrder = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    email: v.string(),
    garmentType: v.string(),
    gender: v.union(v.literal("male"), v.literal("female")),
    expectedCollectionDate: v.number(),

    fabricSample: v.object({
      fabricPhotoUrl: v.optional(v.string()),
      fabricPhotoStorageId: v.optional(v.id("_storage")),
      fabricType: v.string(),
    }),

    maleMeasurements: v.optional(v.any()),
    femaleMeasurements: v.optional(v.any()),
    specialInstructions: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    if (args.gender === "male" && !args.maleMeasurements) {
      throw new Error("Male measurements required");
    }
    if (args.gender === "female" && !args.femaleMeasurements) {
      throw new Error("Female measurements required");
    }

    const now = Date.now();
    const orderNumber = await generateOrderNumber(ctx, args.name);

    const orderId = await ctx.db.insert("orders", {
      orderNumber,
      name: args.name,
      phone: args.phone,
      email: args.email,
      garmentType: args.garmentType,
      gender: args.gender,
      expectedCollectionDate: args.expectedCollectionDate,
      collected: false,

      maleMeasurements: args.maleMeasurements,
      femaleMeasurements: args.femaleMeasurements,

      fabricSample: args.fabricSample,
      specialInstructions: args.specialInstructions,

      workflowStage: "pending",
      progress: 0,
      createdAt: now,
      updatedAt: now,
    });

    return { orderId, orderNumber };
  },
});

/* ==================== GET ALL ORDERS ==================== */

export const getOrders = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("orders").order("desc").collect();
  },
});

/* ==================== GET ORDERS BY STAGE ==================== */

export const getOrdersByStage = query({
  args: {
    workflowStage: v.union(
      v.literal("pending"),
      v.literal("tailoring"),
      v.literal("beading"),
      v.literal("fitting"),
      v.literal("qc"),
      v.literal("completed"),
    ),
  },
  handler: async (ctx, { workflowStage }) => {
    return ctx.db
      .query("orders")
      .withIndex("by_stage", (q) => q.eq("workflowStage", workflowStage))
      .collect();
  },
});

/* ==================== GET ACTIVE ORDERS ==================== */

export const getActiveOrders = query({
  args: {},
  handler: async (ctx) =>
    ctx.db
      .query("orders")
      .withIndex("by_collected", (q) => q.eq("collected", false))
      .collect(),
});

/* ==================== GET COLLECTED ORDERS ==================== */

export const getCollectedOrders = query({
  args: {},
  handler: async (ctx) =>
    ctx.db
      .query("orders")
      .withIndex("by_collected", (q) => q.eq("collected", true))
      .collect(),
});

/* ==================== GET ORDER BY ID ==================== */

export const getOrderById = query({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, { orderId }) => {
    const order = await ctx.db.get(orderId);
    if (!order) return null;

    // Get stage history
    const stageHistory = await ctx.db
      .query("stageHistory")
      .withIndex("by_order", (q) => q.eq("orderId", orderId))
      .collect();

    // Get current assignment if any
    let currentAssignment = null;
    if (order.currentAssignedStaffId) {
      const staff = await ctx.db.get(order.currentAssignedStaffId);
      if (staff) {
        currentAssignment = {
          staffId: staff._id,
          staffName: staff.name,
          staffRole: staff.role,
        };
      }
    }

    return {
      ...order,
      stageHistory: stageHistory.sort((a, b) => a.startedAt - b.startedAt),
      currentAssignment,
    };
  },
});

/* ==================== UPDATE ORDER ==================== */

export const updateOrder = mutation({
  args: {
    orderId: v.id("orders"),
    payload: v.object({
      name: v.optional(v.string()),
      phone: v.optional(v.string()),
      email: v.optional(v.string()),
      garmentType: v.optional(v.string()),
      expectedCollectionDate: v.optional(v.number()),
      maleMeasurements: v.optional(v.any()),
      femaleMeasurements: v.optional(v.any()),
      fabricSample: v.optional(
        v.object({
          fabricPhotoUrl: v.optional(v.string()),
          fabricPhotoStorageId: v.optional(v.id("_storage")),
          fabricType: v.string(),
        }),
      ),
      specialInstructions: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { orderId, payload }) => {
    const order = await ctx.db.get(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    if (order.collected) {
      throw new Error("Cannot update collected orders");
    }

    let orderNumber: string | undefined;

    // Regenerate order number if name changed
    if (payload.name && payload.name !== order.name) {
      orderNumber = await generateOrderNumber(ctx, payload.name);
    }

    await ctx.db.patch(orderId, {
      ...payload,
      ...(orderNumber ? { orderNumber } : {}),
      updatedAt: Date.now(),
    });
  },
});

/* ==================== DELETE ORDER ==================== */

export const deleteOrder = mutation({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, { orderId }) => {
    const order = await ctx.db.get(orderId);

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.collected) {
      throw new Error("Cannot delete collected orders");
    }

    // Check if order has active assignment
    if (order.currentAssignedStaffId) {
      throw new Error(
        "Cannot delete order with active assignment. " +
          "Please complete or cancel the current stage first.",
      );
    }

    const storageId = order.fabricSample?.fabricPhotoStorageId;

    // Delete fabric image from storage if it exists
    if (storageId) {
      await ctx.storage.delete(storageId);
    }

    // Delete stage history
    const stageHistory = await ctx.db
      .query("stageHistory")
      .withIndex("by_order", (q) => q.eq("orderId", orderId))
      .collect();

    for (const stage of stageHistory) {
      await ctx.db.delete(stage._id);
    }

    // Delete staff assignments
    const assignments = await ctx.db
      .query("staffAssignments")
      .withIndex("by_order", (q) => q.eq("orderId", orderId))
      .collect();

    for (const assignment of assignments) {
      await ctx.db.delete(assignment._id);
    }

    await ctx.db.delete(orderId);

    return orderId;
  },
});

/* ==================== ASSIGN STAFF TO ORDER ==================== */

export const assignStaffToOrder = mutation({
  args: {
    orderId: v.id("orders"),
    staffId: v.id("staff"),
  },
  handler: async (ctx, { orderId, staffId }) => {
    const order = await ctx.db.get(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    if (order.collected) {
      throw new Error("Cannot assign staff to collected orders");
    }

    const staff = await ctx.db.get(staffId);
    if (!staff) {
      throw new Error("Staff not found");
    }

    if (!staff.isActive) {
      throw new Error("Staff member is not active");
    }

    // Check if staff already has an active assignment
    const existingAssignment = await ctx.db
      .query("staffAssignments")
      .withIndex("by_staff_and_status", (q) =>
        q.eq("staffId", staffId).eq("status", "active"),
      )
      .first();

    if (existingAssignment) {
      throw new Error(
        `Staff member is already assigned to order ${existingAssignment.orderNumber}`,
      );
    }

    // Determine the current stage
    const currentStage = order.workflowStage;

    if (currentStage === "pending") {
      // Start with tailoring
      if (staff.role !== "tailor") {
        throw new Error("Order must start with a tailor");
      }
      await startStage(ctx, orderId, staffId, "tailoring");
    } else if (currentStage === "completed") {
      throw new Error("Order is already completed");
    } else {
      // Check if the staff role matches the current stage
      const requiredRole = STAGE_ROLE_MAP[currentStage];
      if (staff.role !== requiredRole) {
        throw new Error(
          `Current stage requires a ${requiredRole}, but staff is a ${staff.role}`,
        );
      }

      // Check if there's already an active assignment for this order
      if (order.currentAssignedStaffId) {
        throw new Error("Order already has an active staff assignment");
      }

      // Start the current stage with this staff
      await startStage(
        ctx,
        orderId,
        staffId,
        currentStage as "tailoring" | "beading" | "fitting" | "qc",
      );
    }

    return { success: true };
  },
});

/* ==================== COMPLETE CURRENT STAGE ==================== */

export const completeCurrentStage = mutation({
  args: {
    orderId: v.id("orders"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { orderId, notes }) => {
    const order = await ctx.db.get(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    if (!order.currentAssignedStaffId) {
      throw new Error("No active staff assignment for this order");
    }

    const currentStage = order.workflowStage;
    if (currentStage === "pending" || currentStage === "completed") {
      throw new Error("Cannot complete stage in current workflow state");
    }

    const now = Date.now();

    // Complete the current stage in stage history
    const activeStageHistory = await ctx.db
      .query("stageHistory")
      .withIndex("by_order_and_stage", (q) =>
        q.eq("orderId", orderId).eq("stage", currentStage as "tailoring"),
      )
      .filter((q) => q.eq(q.field("status"), "in_progress"))
      .first();

    if (activeStageHistory) {
      const duration = now - activeStageHistory.startedAt;
      await ctx.db.patch(activeStageHistory._id, {
        completedAt: now,
        duration,
        status: "completed",
        notes,
      });
    }

    // Complete the staff assignment
    const activeAssignment = await ctx.db
      .query("staffAssignments")
      .withIndex("by_staff_and_status", (q) =>
        q.eq("staffId", order.currentAssignedStaffId!).eq("status", "active"),
      )
      .first();

    if (activeAssignment) {
      await ctx.db.patch(activeAssignment._id, {
        status: "completed",
        completedAt: now,
      });
    }

    // Move to next stage
    const nextStage = getNextStage(currentStage);

    await ctx.db.patch(orderId, {
      workflowStage: nextStage,
      progress: STAGE_PROGRESS_MAP[nextStage],
      currentAssignedStaffId: undefined,
      currentAssignedStaffRole: undefined,
      updatedAt: now,
    });

    return {
      success: true,
      nextStage,
      orderCompleted: nextStage === "completed",
    };
  },
});

/* ==================== MARK ORDER AS COLLECTED ==================== */

export const markCollected = mutation({
  args: { orderId: v.id("orders") },
  handler: async (ctx, { orderId }) => {
    const order = await ctx.db.get(orderId);
    if (!order) throw new Error("Order not found");
    if (order.collected) throw new Error("Order already collected");

    if (order.workflowStage !== "completed") {
      throw new Error("Can only collect completed orders");
    }

    await ctx.db.patch(orderId, {
      collected: true,
      collectedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/* ==================== GET ORDER TIMELINE ==================== */

export const getOrderTimeline = query({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, { orderId }) => {
    const order = await ctx.db.get(orderId);
    if (!order) return null;

    const stageHistory = await ctx.db
      .query("stageHistory")
      .withIndex("by_order", (q) => q.eq("orderId", orderId))
      .collect();

    const timeline = stageHistory
      .sort((a, b) => a.startedAt - b.startedAt)
      .map((stage) => ({
        stage: stage.stage,
        staffName: stage.assignedStaffName,
        staffRole: stage.assignedStaffRole,
        startedAt: stage.startedAt,
        completedAt: stage.completedAt,
        duration: stage.duration,
        status: stage.status,
        notes: stage.notes,
      }));

    return {
      orderNumber: order.orderNumber,
      customerName: order.name,
      currentStage: order.workflowStage,
      progress: order.progress,
      timeline,
    };
  },
});

/* ==================== GET DASHBOARD STATISTICS ==================== */

export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const allOrders = await ctx.db.query("orders").collect();

    const activeOrders = allOrders.filter((o) => !o.collected);
    const completedOrders = allOrders.filter((o) => o.collected);

    const ordersByStage = {
      pending: activeOrders.filter((o) => o.workflowStage === "pending").length,
      tailoring: activeOrders.filter((o) => o.workflowStage === "tailoring")
        .length,
      beading: activeOrders.filter((o) => o.workflowStage === "beading").length,
      fitting: activeOrders.filter((o) => o.workflowStage === "fitting").length,
      qc: activeOrders.filter((o) => o.workflowStage === "qc").length,
      completed: activeOrders.filter((o) => o.workflowStage === "completed")
        .length,
    };

    // Get all staff
    const allStaff = await ctx.db.query("staff").collect();
    const activeStaff = allStaff.filter((s) => s.isActive);

    // Get staff workload
    const staffByRole = {
      tailor: activeStaff.filter((s) => s.role === "tailor").length,
      beader: activeStaff.filter((s) => s.role === "beader").length,
      fitter: activeStaff.filter((s) => s.role === "fitter").length,
      qc: activeStaff.filter((s) => s.role === "qc").length,
    };

    // Get busy staff count
    const activeAssignments = await ctx.db
      .query("staffAssignments")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    const busyStaff = activeAssignments.length;

    return {
      orders: {
        total: allOrders.length,
        active: activeOrders.length,
        completed: completedOrders.length,
        byStage: ordersByStage,
      },
      staff: {
        total: allStaff.length,
        active: activeStaff.length,
        busy: busyStaff,
        available: activeStaff.length - busyStaff,
        byRole: staffByRole,
      },
    };
  },
});

/* ==================== HELPER FUNCTIONS ==================== */

async function startStage(
  ctx: MutationCtx,
  orderId: Id<"orders">,
  staffId: Id<"staff">,
  stage: "tailoring" | "beading" | "fitting" | "qc",
) {
  const order = await ctx.db.get(orderId);
  const staff = await ctx.db.get(staffId);

  if (!order || !staff) {
    throw new Error("Order or staff not found");
  }

  const now = Date.now();

  // Create stage history entry
  await ctx.db.insert("stageHistory", {
    orderId,
    orderNumber: order.orderNumber,
    stage,
    assignedStaffId: staffId,
    assignedStaffName: staff.name,
    assignedStaffRole: staff.role as StaffRole,
    startedAt: now,
    status: "in_progress",
  });

  // Create staff assignment
  await ctx.db.insert("staffAssignments", {
    staffId,
    staffName: staff.name,
    staffRole: staff.role as StaffRole,
    orderId,
    orderNumber: order.orderNumber,
    stage,
    status: "active",
    assignedAt: now,
  });

  // Update order
  await ctx.db.patch(orderId, {
    workflowStage: stage,
    progress: STAGE_PROGRESS_MAP[stage],
    currentAssignedStaffId: staffId,
    currentAssignedStaffRole: staff.role as StaffRole,
    updatedAt: now,
  });
}

function getNextStage(currentStage: WorkflowStage): WorkflowStage {
  const currentIndex = WORKFLOW_STAGES.indexOf(currentStage);
  if (currentIndex === -1 || currentIndex === WORKFLOW_STAGES.length - 1) {
    return "completed";
  }
  return WORKFLOW_STAGES[currentIndex + 1];
}
