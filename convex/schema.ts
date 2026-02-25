// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";


export default defineSchema({
  staff: defineTable({
    name: v.string(),
    phone: v.string(),
    role: v.union(
      v.literal("tailor"),
      v.literal("beader"),
      v.literal("fitter"),
      v.literal("qc"),
    ),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_role", ["role"])
    .index("by_phone", ["phone"])
    .index("by_active", ["isActive"])
    .index("by_active_role", ["isActive", "role"]),

   staffPerformanceCache: defineTable({
    staffId: v.id("staff"),
    totalOrders: v.number(),
    avgDuration: v.number(),
    lastCalculated: v.number(),
  }).index("by_staff", ["staffId"]),


  orders: defineTable({
    orderNumber: v.string(),
    name: v.string(),
    phone: v.string(),
    email: v.string(),
    garmentType: v.string(),
    gender: v.union(v.literal("male"), v.literal("female")),
    expectedCollectionDate: v.number(),

    maleMeasurements: v.optional(
      v.object({
        forehead: v.optional(v.string()),
        forearm: v.optional(v.string()),
        wrist: v.optional(v.string()),
        torsoCircum: v.optional(v.string()),
        pantsLength: v.optional(v.string()),
        chest: v.optional(v.string()),
        chestAtAmpits: v.optional(v.string()),
        thighAtCrotch: v.optional(v.string()),
        midThigh: v.optional(v.string()),
        knee: v.optional(v.string()),
        belowKnee: v.optional(v.string()),
        calf: v.optional(v.string()),
        ankle: v.optional(v.string()),
        bicep: v.optional(v.string()),
        elbow: v.optional(v.string()),
        waist: v.optional(v.string()),
        hips: v.optional(v.string()),
        shoulders: v.optional(v.string()),
        sleeveLength: v.optional(v.string()),
        topLength: v.optional(v.string()),
        trouserLength: v.optional(v.string()),
        thigh: v.optional(v.string()),
        neck: v.optional(v.string()),
      }),
    ),

    // Female Measurements (optional - only when gender is female)
    femaleMeasurements: v.optional(
      v.object({
        neck: v.optional(v.string()),
        bust: v.optional(v.string()),
        overBust: v.optional(v.string()),
        underBust: v.optional(v.string()),
        neckToHeel: v.optional(v.string()),
        neckToAboveKnee: v.optional(v.string()),
        armLength: v.optional(v.string()),
        shoulderSeam: v.optional(v.string()),
        armHole: v.optional(v.string()),
        foreArm: v.optional(v.string()),
        vNeckCut: v.optional(v.string()),
        aboveKneeToAnkle: v.optional(v.string()),
        waistToAboveKnee: v.optional(v.string()),
        waist: v.optional(v.string()),
        hips: v.optional(v.string()),
        shoulders: v.optional(v.string()),
        sleeveLength: v.optional(v.string()),
        armhole: v.optional(v.string()),
        skirtLength: v.optional(v.string()),
        blouseLength: v.optional(v.string()),
      }),
    ),

    fabricSample: v.object({
      fabricPhotoUrl: v.optional(v.string()),
      fabricPhotoStorageId: v.optional(v.id("_storage")),
      fabricType: v.string(),
    }),

    workflowStage: v.union(
      v.literal("pending"), // Order created, not yet assigned
      v.literal("tailoring"), // Being tailored
      v.literal("beading"), // Being beaded
      v.literal("fitting"), // Being fitted
      v.literal("qc"), // Quality control
      v.literal("completed"),
    ),

    progress: v.number(), // 0 → 100

    // ✅ PROFESSIONAL: Staff assignments embedded in order
    assignedTailor: v.optional(
      v.object({
        staffId: v.id("staff"),
        staffName: v.string(),
        assignedAt: v.number(),
        completedAt: v.optional(v.number()),
        duration: v.optional(v.number()),
        notes: v.optional(v.string()),
      }),
    ),

    assignedBeader: v.optional(
      v.object({
        staffId: v.id("staff"),
        staffName: v.string(),
        assignedAt: v.number(),
        completedAt: v.optional(v.number()),
        duration: v.optional(v.number()),
        notes: v.optional(v.string()),
      }),
    ),

    assignedFitter: v.optional(
      v.object({
        staffId: v.id("staff"),
        staffName: v.string(),
        assignedAt: v.number(),
        completedAt: v.optional(v.number()),
        duration: v.optional(v.number()),
        notes: v.optional(v.string()),
      }),
    ),

    assignedQC: v.optional(
      v.object({
        staffId: v.id("staff"),
        staffName: v.string(),
        assignedAt: v.number(),
        completedAt: v.optional(v.number()),
        duration: v.optional(v.number()),
        notes: v.optional(v.string()),
      }),
    ),

    // Current assignment (for quick "who's working on this?" queries)
    currentlyAssignedTo: v.optional(
      v.object({
        staffId: v.id("staff"),
        staffName: v.string(),
        stage: v.union(
          v.literal("tailoring"),
          v.literal("beading"),
          v.literal("fitting"),
          v.literal("qc"),
        ),
      }),
    ),

    // currentAssignedStaffId: v.optional(v.id("staff")),
    // currentAssignedStaffRole: v.optional(
    //   v.union(
    //     v.literal("tailor"),
    //     v.literal("beader"),
    //     v.literal("fitter"),
    //     v.literal("qc"),
    //   ),
    // ),

    specialInstructions: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    completed: v.optional(v.boolean()),
    completedAt: v.optional(v.number()),
    collected: v.optional(v.boolean()),
    collectedAt: v.optional(v.number()),
  })
    .index("by_number", ["orderNumber"])
    .index("by_collected", ["collected"])
    .index("by_stage", ["workflowStage"])
    .index("by_customer", ["name"])
    .index("by_created", ["createdAt"])

    // ✅ NEW: Indexes for staff queries
    .index("by_tailor", ["assignedTailor.staffId"])
    .index("by_beader", ["assignedBeader.staffId"])
    .index("by_fitter", ["assignedFitter.staffId"])
    .index("by_qc", ["assignedQC.staffId"]),

  // Tracks the journey of each order through stages
  stageHistory: defineTable({
    orderId: v.id("orders"),
    orderNumber: v.string(),

    stage: v.union(
      v.literal("tailoring"),
      v.literal("beading"),
      v.literal("fitting"),
      v.literal("qc"),
    ),

    assignedStaffId: v.id("staff"),
    assignedStaffName: v.string(),
    assignedStaffRole: v.union(
      v.literal("tailor"),
      v.literal("beader"),
      v.literal("fitter"),
      v.literal("qc"),
    ),

    // Stage lifecycle
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    duration: v.optional(v.number()), // in milliseconds

    // Status
    status: v.union(v.literal("in_progress"), v.literal("completed")),

    // Optional notes from staff
    notes: v.optional(v.string()),
  })
    .index("by_order", ["orderId"])
    .index("by_staff", ["assignedStaffId"])
    .index("by_stage", ["stage"])
    .index("by_status", ["status"])
    .index("by_order_and_stage", ["orderId", "stage"])
    .index("by_staff_and_status", ["assignedStaffId", "status"]),

  // Single source of truth for staff availability
  // A staff is "busy" if they have an active assignment
  // convex/schema.ts - Updated staffAssignments table

  staffAssignments: defineTable({
    staffId: v.id("staff"),
    staffName: v.string(),
    staffRole: v.union(
      v.literal("tailor"),
      v.literal("beader"),
      v.literal("fitter"),
      v.literal("qc"),
    ),
    orderId: v.id("orders"),
    orderNumber: v.string(),
    stage: v.union(
      v.literal("tailoring"),
      v.literal("beading"),
      v.literal("fitting"),
      v.literal("qc"),
    ),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled"), // ✅ NEW: For when orders are deleted
    ),
    assignedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_order", ["orderId"])
    .index("by_staff", ["staffId"])
    .index("by_status", ["status"])
    .index("by_staff_and_status", ["staffId", "status"]),
});

/**
 * Type Exports for use in mutations and queries
 */
export type StaffRole = "tailor" | "beader" | "fitter" | "qc";
export type WorkflowStage = "pending" | "tailoring" | "beading" | "fitting" | "qc" | "completed";
export type AssignmentStatus = "active" | "completed";
export type StageHistoryStatus = "in_progress" | "completed";

/**
 * Workflow Stage Order
 * Defines the strict order of stages
 */
export const WORKFLOW_STAGES: WorkflowStage[] = [
  "pending",
  "tailoring",
  "beading",
  "fitting",
  "qc",
  "completed"
];

/**
 * Stage to Role Mapping
 * Defines which role handles which stage
 */
export const STAGE_ROLE_MAP: Record<string, StaffRole> = {
  tailoring: "tailor",
  beading: "beader",
  fitting: "fitter",
  qc: "qc",
};

/**
 * Progress Calculation by Stage
 */
export const STAGE_PROGRESS_MAP: Record<WorkflowStage, number> = {
  pending: 0,
  tailoring: 25,
  beading: 50,
  fitting: 75,
  qc: 90,
  completed: 100,
};
