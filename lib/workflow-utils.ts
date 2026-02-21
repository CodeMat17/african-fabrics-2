// lib/workflow-utils.ts
/**
 * Workflow Types
 */
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

export type StaffRole =
  | "tailor"
  | "beader"
  | "qc_officer"
  | "fitting_officer"
  | "admin"
  | "consultant";

/**
 * Workflow sequence definition
 */
export const WORKFLOW_SEQUENCE: Department[] = [
  "tailoring",
  "beading",
  "quality_control",
  "fitting",
];

/**
 * Order type interface
 */
export interface Order {
  _id: string;
  orderNumber: string;
  name: string;
  status: OrderStatus;
  garmentType: string;
  expectedCollectionDate: number;
  assignedTailor?: string;
  assignedBeader?: string;
  assignedQcOfficer?: string;
  assignedFittingOfficer?: string;
}

/**
 * Get current department based on order status
 */
export function getCurrentDepartment(status: OrderStatus): Department | null {
  switch (status) {
    case "with_tailor":
      return "tailoring";
    case "with_beader":
      return "beading";
    case "with_QC":
      return "quality_control";
    case "with_fitter":
      return "fitting";
    default:
      return null;
  }
}

/**
 * Get the next department in the workflow sequence
 */
export function getNextDepartment(
  currentStatus: OrderStatus
): Department | null {
  const currentDept = getCurrentDepartment(currentStatus);
  if (!currentDept) {
    // If no current department, start with tailoring
    return "tailoring";
  }

  const currentIndex = WORKFLOW_SEQUENCE.indexOf(currentDept);
  if (currentIndex === -1 || currentIndex >= WORKFLOW_SEQUENCE.length - 1) {
    return null; // No next department
  }

  return WORKFLOW_SEQUENCE[currentIndex + 1];
}

/**
 * Check if an order can be assigned to a specific department
 */
export function canAssignToDepartment(
  order: Order,
  department: Department
): boolean {
  // If order is cancelled or collected, cannot assign
  if (order.status === "cancelled" || order.status === "collected") {
    return false;
  }

  switch (department) {
    case "tailoring":
      // Can assign to tailoring if:
      // 1. Order is pending assignment
      // 2. Order is already with tailor (re-assign)
      return (
        order.status === "pending_assignment" || order.status === "with_tailor"
      );

    case "beading":
      // Can assign to beading if:
      // 1. Order is with tailor (ready for next step)
      // 2. Order is already with beader (re-assign)
      return order.status === "with_tailor" || order.status === "with_beader";

    case "quality_control":
      // Can assign to QC if:
      // 1. Order is with beader (ready for next step)
      // 2. Order is already with QC (re-assign)
      return order.status === "with_beader" || order.status === "with_QC";

    case "fitting":
      // Can assign to fitting if:
      // 1. Order is with QC (ready for next step)
      // 2. Order is already with fitter (re-assign)
      return order.status === "with_QC" || order.status === "with_fitter";

    default:
      return false;
  }
}

/**
 * Get the required role for a department
 */
export function getRoleForDepartment(department: Department): StaffRole {
  switch (department) {
    case "tailoring":
      return "tailor";
    case "beading":
      return "beader";
    case "quality_control":
      return "qc_officer";
    case "fitting":
      return "fitting_officer";
  }
}

/**
 * Get status for department assignment
 */
export function getStatusForDepartment(department: Department): OrderStatus {
  switch (department) {
    case "tailoring":
      return "with_tailor";
    case "beading":
      return "with_beader";
    case "quality_control":
      return "with_QC";
    case "fitting":
      return "with_fitter";
  }
}

/**
 * Get workflow progress percentage
 */
export function getWorkflowProgress(order: Order): number {
  const status = order.status;

  switch (status) {
    case "pending_assignment":
      return 0;
    case "with_tailor":
      return 25;
    case "with_beader":
      return 50;
    case "with_QC":
      return 75;
    case "with_fitter":
      return 90;
    case "ready_for_collection":
    case "collected":
      return 100;
    case "cancelled":
      return 0;
    default:
      return 0;
  }
}

/**
 * Get workflow step information
 */
export function getWorkflowStepInfo(order: Order): {
  currentStep: number;
  totalSteps: number;
  stepName: string;
  nextStepName: string | null;
} {
  const status = order.status;
  const totalSteps = WORKFLOW_SEQUENCE.length + 2; // +2 for pending and completed steps

  let currentStep = 0;
  let stepName = "Pending Assignment";
  let nextStepName: string | null = "Tailoring";

  switch (status) {
    case "pending_assignment":
      currentStep = 0;
      stepName = "Pending Assignment";
      nextStepName = "Tailoring";
      break;
    case "with_tailor":
      currentStep = 1;
      stepName = "Tailoring";
      nextStepName = "Beading";
      break;
    case "with_beader":
      currentStep = 2;
      stepName = "Beading";
      nextStepName = "Quality Control";
      break;
    case "with_QC":
      currentStep = 3;
      stepName = "Quality Control";
      nextStepName = "Fitting";
      break;
    case "with_fitter":
      currentStep = 4;
      stepName = "Fitting";
      nextStepName = "Ready for Collection";
      break;
    case "ready_for_collection":
      currentStep = 5;
      stepName = "Ready for Collection";
      nextStepName = "Completed";
      break;
    case "collected":
      currentStep = 6;
      stepName = "Completed";
      nextStepName = null;
      break;
    case "cancelled":
      currentStep = 0;
      stepName = "Cancelled";
      nextStepName = null;
      break;
  }

  return {
    currentStep,
    totalSteps,
    stepName,
    nextStepName,
  };
}

/**
 * Check if order can move to next department
 */
export function canMoveToNextDepartment(order: Order): boolean {
  const nextDept = getNextDepartment(order.status);
  return nextDept !== null;
}

/**
 * Get department display name
 */
export function getDepartmentDisplayName(department: Department): string {
  switch (department) {
    case "tailoring":
      return "Tailoring";
    case "beading":
      return "Beading";
    case "quality_control":
      return "Quality Control";
    case "fitting":
      return "Fitting";
  }
}

/**
 * Get department icon
 */
export function getDepartmentIcon(department: Department) {
  switch (department) {
    case "tailoring":
      return Scissors;
    case "beading":
      return Tag;
    case "quality_control":
      return CheckSquare;
    case "fitting":
      return User;
    default:
      return Users;
  }
}

/**
 * Get status color
 */
export function getStatusColor(status: OrderStatus): string {
  switch (status) {
    case "pending_assignment":
      return "text-amber-500 bg-amber-50 border-amber-200";
    case "with_tailor":
      return "text-blue-500 bg-blue-50 border-blue-200";
    case "with_beader":
      return "text-purple-500 bg-purple-50 border-purple-200";
    case "with_QC":
      return "text-indigo-500 bg-indigo-50 border-indigo-200";
    case "with_fitter":
      return "text-pink-500 bg-pink-50 border-pink-200";
    case "ready_for_collection":
      return "text-emerald-500 bg-emerald-50 border-emerald-200";
    case "collected":
      return "text-gray-500 bg-gray-50 border-gray-200";
    case "cancelled":
      return "text-red-500 bg-red-50 border-red-200";
    default:
      return "text-gray-500 bg-gray-50 border-gray-200";
  }
}

// Import icons for the getDepartmentIcon function
import { Scissors, Tag, CheckSquare, User, Users } from "lucide-react";
