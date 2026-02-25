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

// ✅ Type-safe assignment structure
type StaffAssignment = {
  staffId: Id<"staff">;
  staffName: string;
  assignedAt: number;
  completedAt?: number;
  duration?: number;
  notes?: string;
};

// ✅ Type-safe current assignment structure
type CurrentAssignment = {
  staffId: Id<"staff">;
  staffName: string;
  stage: "tailoring" | "beading" | "fitting" | "qc";
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

    const timeline: Array<{
      stage: string;
      staffName: string;
      staffId: Id<"staff">;
      assignedAt: number;
      completedAt?: number;
      duration?: number;
      notes?: string;
      status: "completed" | "in_progress";
    }> = [];

    if (order.assignedTailor) {
      timeline.push({
        stage: "tailoring",
        staffName: order.assignedTailor.staffName,
        staffId: order.assignedTailor.staffId,
        assignedAt: order.assignedTailor.assignedAt,
        completedAt: order.assignedTailor.completedAt,
        duration: order.assignedTailor.duration,
        notes: order.assignedTailor.notes,
        status: order.assignedTailor.completedAt ? "completed" : "in_progress",
      });
    }

    if (order.assignedBeader) {
      timeline.push({
        stage: "beading",
        staffName: order.assignedBeader.staffName,
        staffId: order.assignedBeader.staffId,
        assignedAt: order.assignedBeader.assignedAt,
        completedAt: order.assignedBeader.completedAt,
        duration: order.assignedBeader.duration,
        notes: order.assignedBeader.notes,
        status: order.assignedBeader.completedAt ? "completed" : "in_progress",
      });
    }

    if (order.assignedFitter) {
      timeline.push({
        stage: "fitting",
        staffName: order.assignedFitter.staffName,
        staffId: order.assignedFitter.staffId,
        assignedAt: order.assignedFitter.assignedAt,
        completedAt: order.assignedFitter.completedAt,
        duration: order.assignedFitter.duration,
        notes: order.assignedFitter.notes,
        status: order.assignedFitter.completedAt ? "completed" : "in_progress",
      });
    }

    if (order.assignedQC) {
      timeline.push({
        stage: "qc",
        staffName: order.assignedQC.staffName,
        staffId: order.assignedQC.staffId,
        assignedAt: order.assignedQC.assignedAt,
        completedAt: order.assignedQC.completedAt,
        duration: order.assignedQC.duration,
        notes: order.assignedQC.notes,
        status: order.assignedQC.completedAt ? "completed" : "in_progress",
      });
    }

    return {
      ...order,
      timeline: timeline.sort((a, b) => a.assignedAt - b.assignedAt),
      currentAssignment: order.currentlyAssignedTo || null,
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

    if (order.currentlyAssignedTo) {
      throw new Error(
        `Cannot delete order with active assignment. ${order.currentlyAssignedTo.staffName} is currently working on this order. Please complete or cancel the assignment first.`,
      );
    }

    const storageId = order.fabricSample?.fabricPhotoStorageId;

    if (storageId) {
      await ctx.storage.delete(storageId);
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

    // Check if staff is already busy
    const orders = await ctx.db.query("orders").collect();
    const staffCurrentOrder = orders.find(
      (o) => o.currentlyAssignedTo?.staffId === staffId,
    );

    if (staffCurrentOrder) {
      throw new Error(
        `Staff member is already assigned to order ${staffCurrentOrder.orderNumber}`,
      );
    }

    if (order.currentlyAssignedTo) {
      throw new Error(
        `Order already has ${order.currentlyAssignedTo.staffName} assigned. Please complete current stage first.`,
      );
    }

    const currentStage = order.workflowStage;
    const now = Date.now();

    // ✅ CORRECT LOGIC: When order is IN a stage, you assign the worker for THAT stage
    type AssignmentFieldKey =
      | "assignedTailor"
      | "assignedBeader"
      | "assignedFitter"
      | "assignedQC";
    type StageKey = "tailoring" | "beading" | "fitting" | "qc";

    let assignmentField: AssignmentFieldKey;
    let stageToWork: StageKey;

    // The KEY insight: order.workflowStage tells you what NEEDS to be done
    // So if stage = "tailoring", you need a TAILOR to work on it
    if (currentStage === "pending" || currentStage === "tailoring") {
      // Order needs tailoring work
      if (staff.role !== "tailor") {
        throw new Error("This order needs a tailor");
      }
      assignmentField = "assignedTailor";
      stageToWork = "tailoring";
    } else if (currentStage === "beading") {
      // Order needs beading work
      if (staff.role !== "beader") {
        throw new Error("This order needs a beader");
      }
      // Make sure tailoring is complete
      if (!order.assignedTailor?.completedAt) {
        throw new Error("Tailoring must be completed first");
      }
      assignmentField = "assignedBeader";
      stageToWork = "beading";
    } else if (currentStage === "fitting") {
      // Order needs fitting work
      if (staff.role !== "fitter") {
        throw new Error("This order needs a fitter");
      }
      // Make sure beading is complete
      if (!order.assignedBeader?.completedAt) {
        throw new Error("Beading must be completed first");
      }
      assignmentField = "assignedFitter";
      stageToWork = "fitting";
    } else if (currentStage === "qc") {
      // Order needs QC work
      if (staff.role !== "qc") {
        throw new Error("This order needs QC");
      }
      // Make sure fitting is complete
      if (!order.assignedFitter?.completedAt) {
        throw new Error("Fitting must be completed first");
      }
      assignmentField = "assignedQC";
      stageToWork = "qc";
    } else if (currentStage === "completed") {
      throw new Error("Order is already completed");
    } else {
      throw new Error("Invalid workflow stage");
    }

    const newAssignment: StaffAssignment = {
      staffId: staff._id,
      staffName: staff.name,
      assignedAt: now,
    };

    const currentAssignment: CurrentAssignment = {
      staffId: staff._id,
      staffName: staff.name,
      stage: stageToWork,
    };

    await ctx.db.patch(orderId, {
      workflowStage: stageToWork,
      progress: STAGE_PROGRESS_MAP[stageToWork],
      [assignmentField]: newAssignment,
      currentlyAssignedTo: currentAssignment,
      updatedAt: now,
    });

    return { success: true, stage: stageToWork };
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

    if (!order.currentlyAssignedTo) {
      throw new Error("No active assignment for this order");
    }

    const currentStage = order.workflowStage;
    const now = Date.now();

    type AssignmentFieldKey =
      | "assignedTailor"
      | "assignedBeader"
      | "assignedFitter"
      | "assignedQC";

    let assignmentField: AssignmentFieldKey;
    let assignment: StaffAssignment | undefined;

    if (currentStage === "tailoring") {
      assignmentField = "assignedTailor";
      assignment = order.assignedTailor;
    } else if (currentStage === "beading") {
      assignmentField = "assignedBeader";
      assignment = order.assignedBeader;
    } else if (currentStage === "fitting") {
      assignmentField = "assignedFitter";
      assignment = order.assignedFitter;
    } else if (currentStage === "qc") {
      assignmentField = "assignedQC";
      assignment = order.assignedQC;
    } else {
      throw new Error("Cannot complete stage in current workflow state");
    }

    if (!assignment) {
      throw new Error("No assignment found for current stage");
    }

    const completedAssignment: StaffAssignment = {
      ...assignment,
      completedAt: now,
      duration: now - assignment.assignedAt,
      notes: notes || assignment.notes,
    };

    await ctx.db.patch(orderId, {
      [assignmentField]: completedAssignment,
      currentlyAssignedTo: undefined,
      updatedAt: now,
    });

    const nextStage = getNextStage(currentStage);

    if (nextStage !== currentStage) {
      await ctx.db.patch(orderId, {
        workflowStage: nextStage,
        progress: STAGE_PROGRESS_MAP[nextStage],
        updatedAt: now,
      });

      if (nextStage === "completed") {
        await ctx.db.patch(orderId, {
          completedAt: now,
        });
      }
    }

    return {
      success: true,
      nextStage,
      orderCompleted: nextStage === "completed",
      duration: completedAssignment.duration,
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

    type TimelineEntry = {
      stage: string;
      staffName: string;
      staffRole: StaffRole;
      startedAt: number;
      completedAt?: number;
      duration?: number;
      status: "completed" | "in_progress";
      notes?: string;
    };

    const timeline: TimelineEntry[] = [];

    if (order.assignedTailor) {
      timeline.push({
        stage: "tailoring",
        staffName: order.assignedTailor.staffName,
        staffRole: "tailor",
        startedAt: order.assignedTailor.assignedAt,
        completedAt: order.assignedTailor.completedAt,
        duration: order.assignedTailor.duration,
        status: order.assignedTailor.completedAt ? "completed" : "in_progress",
        notes: order.assignedTailor.notes,
      });
    }

    if (order.assignedBeader) {
      timeline.push({
        stage: "beading",
        staffName: order.assignedBeader.staffName,
        staffRole: "beader",
        startedAt: order.assignedBeader.assignedAt,
        completedAt: order.assignedBeader.completedAt,
        duration: order.assignedBeader.duration,
        status: order.assignedBeader.completedAt ? "completed" : "in_progress",
        notes: order.assignedBeader.notes,
      });
    }

    if (order.assignedFitter) {
      timeline.push({
        stage: "fitting",
        staffName: order.assignedFitter.staffName,
        staffRole: "fitter",
        startedAt: order.assignedFitter.assignedAt,
        completedAt: order.assignedFitter.completedAt,
        duration: order.assignedFitter.duration,
        status: order.assignedFitter.completedAt ? "completed" : "in_progress",
        notes: order.assignedFitter.notes,
      });
    }

    if (order.assignedQC) {
      timeline.push({
        stage: "qc",
        staffName: order.assignedQC.staffName,
        staffRole: "qc",
        startedAt: order.assignedQC.assignedAt,
        completedAt: order.assignedQC.completedAt,
        duration: order.assignedQC.duration,
        status: order.assignedQC.completedAt ? "completed" : "in_progress",
        notes: order.assignedQC.notes,
      });
    }

    return {
      orderNumber: order.orderNumber,
      customerName: order.name,
      currentStage: order.workflowStage,
      progress: order.progress,
      timeline: timeline.sort((a, b) => a.startedAt - b.startedAt),
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

    const allStaff = await ctx.db.query("staff").collect();
    const activeStaff = allStaff.filter((s) => s.isActive);

    const staffByRole = {
      tailor: activeStaff.filter((s) => s.role === "tailor").length,
      beader: activeStaff.filter((s) => s.role === "beader").length,
      fitter: activeStaff.filter((s) => s.role === "fitter").length,
      qc: activeStaff.filter((s) => s.role === "qc").length,
    };

    const busyStaff = allOrders.filter((o) => o.currentlyAssignedTo).length;

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

function getNextStage(currentStage: WorkflowStage): WorkflowStage {
  const currentIndex = WORKFLOW_STAGES.indexOf(currentStage);
  if (currentIndex === -1 || currentIndex === WORKFLOW_STAGES.length - 1) {
    return "completed";
  }
  return WORKFLOW_STAGES[currentIndex + 1];
}
