// lib/workflow-mutations.ts
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

// ============================================================================
// TYPES
// ============================================================================

export type Department =
  | "tailoring"
  | "beading"
  | "quality_control"
  | "fitting";

export type OrderStatus =
  | "pending_assignment"
  | "with_tailor"
  | "with_beader"
  | "with_QC"
  | "with_fitter"
  | "ready_for_collection"
  | "collected"
  | "cancelled";

export type PriorityLevel = "low" | "medium" | "high" | "urgent";

type QueueItemId =
  | Id<"tailoringQueue">
  | Id<"beadingQueue">
  | Id<"qualityControlQueue">
  | Id<"fittingQueue">;

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook for workflow operations
 */
export function useWorkflowOperations() {
  const startQueueItem = useMutation(api.workflow.startQueueItem);
  const completeQueueItem = useMutation(api.workflow.completeQueueItem);
  const putOnHoldMutation = useMutation(api.workflow.putOnHold);
  const resumeFromHoldMutation = useMutation(api.workflow.resumeFromHold);
  const updatePriorityMutation = useMutation(api.workflow.updateQueuePriority);
  const addToQueueMutation = useMutation(api.workflow.addToQueue);

  /**
   * Start work on a queue item
   */
  const startWork = async (
    queueItemId: QueueItemId,
    department: Department,
    staffId: Id<"staff">
  ): Promise<void> => {
    try {
      await startQueueItem({
        queueItemId,
        department,
        staffId,
      });

      toast.success("Work started", {
        description: "You have started working on this order",
      });
    } catch (error) {
      console.error("Error starting work:", error);
      toast.error("Failed to start work", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
      throw error;
    }
  };

  /**
   * Complete work and move to next department
   */
  const completeAndMove = async (
    orderId: Id<"orders">,
    department: Department,
    staffId: Id<"staff">,
    queueItemId: QueueItemId,
    notes?: string
  ): Promise<void> => {
    try {
      // Complete current queue item
      await completeQueueItem({
        queueItemId,
        department,
        staffId,
        notes,
      });

      toast.success("Work completed", {
        description: "Order has been moved to the next stage",
      });
    } catch (error) {
      console.error("Error completing work:", error);
      toast.error("Failed to complete work", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
      throw error;
    }
  };

  /**
   * Put queue item on hold
   */
  const putOnHold = async (
    queueItemId: QueueItemId,
    department: Department,
    staffId: Id<"staff">,
    reason?: string
  ): Promise<void> => {
    try {
      await putOnHoldMutation({
        queueItemId,
        department,
        staffId,
        reason,
      });

      toast.success("Item put on hold", {
        description: reason || "Item has been paused",
      });
    } catch (error) {
      console.error("Error putting item on hold:", error);
      toast.error("Failed to put item on hold", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
      throw error;
    }
  };

  /**
   * Resume queue item from hold
   */
  const resumeFromHold = async (
    queueItemId: QueueItemId,
    department: Department,
    staffId: Id<"staff">
  ): Promise<void> => {
    try {
      await resumeFromHoldMutation({
        queueItemId,
        department,
        staffId,
      });

      toast.success("Item resumed", {
        description: "Work can now continue on this item",
      });
    } catch (error) {
      console.error("Error resuming item:", error);
      toast.error("Failed to resume item", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
      throw error;
    }
  };

  /**
   * Update queue item priority
   */
  const updatePriority = async (
    queueItemId: QueueItemId,
    department: Department,
    priority: PriorityLevel,
    staffId: Id<"staff">
  ): Promise<void> => {
    try {
      await updatePriorityMutation({
        queueItemId,
        department,
        priority,
        staffId,
      });

      toast.success("Priority updated", {
        description: `Priority set to ${priority}`,
      });
    } catch (error) {
      console.error("Error updating priority:", error);
      toast.error("Failed to update priority", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
      throw error;
    }
  };

  /**
   * Add order to workflow queue
   */
  const addToQueue = async (
    orderId: Id<"orders">,
    department: Department,
    staffId: Id<"staff">,
    assignedBy: Id<"staff">,
    priority?: PriorityLevel
  ): Promise<void> => {
    try {
      await addToQueueMutation({
        orderId,
        department,
        staffId,
        priority,
        assignedBy,
      });

      toast.success("Added to queue", {
        description: `Order added to ${department} queue`,
      });
    } catch (error) {
      console.error("Error adding to queue:", error);
      toast.error("Failed to add to queue", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
      throw error;
    }
  };

  return {
    startWork,
    completeAndMove,
    putOnHold,
    resumeFromHold,
    updatePriority,
    addToQueue,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get next department in workflow
 */
export function getNextDepartment(
  currentDepartment: Department
): Department | null {
  const departmentFlow: Record<Department, Department | null> = {
    tailoring: "beading",
    beading: "quality_control",
    quality_control: "fitting",
    fitting: null, // End of workflow
  };

  return departmentFlow[currentDepartment];
}

/**
 * Get order status for department
 */
export function getOrderStatusForDepartment(
  department: Department
): OrderStatus {
  const statusMap: Record<Department, OrderStatus> = {
    tailoring: "with_tailor",
    beading: "with_beader",
    quality_control: "with_QC",
    fitting: "with_fitter",
  };

  return statusMap[department];
}

/**
 * Get department display name
 */
export function getDepartmentDisplayName(department: Department): string {
  const displayNames: Record<Department, string> = {
    tailoring: "Tailoring",
    beading: "Beading",
    quality_control: "Quality Control",
    fitting: "Fitting",
  };

  return displayNames[department];
}

/**
 * Validate if staff can work on department
 */
export function canStaffWorkOnDepartment(
  staffRole: string,
  department: Department
): boolean {
  const roleMapping: Record<Department, string[]> = {
    tailoring: ["tailor", "admin"],
    beading: ["beader", "admin"],
    quality_control: ["qc_officer", "admin"],
    fitting: ["fitting_officer", "admin"],
  };

  return roleMapping[department].includes(staffRole);
}
