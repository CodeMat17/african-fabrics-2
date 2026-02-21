"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

import type {
  OrderDetails,
  StaffSummary,
  AssignableStage,
} from "@/convex/workflow";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  order?: OrderDetails;
  staff?: StaffSummary[]
  stage: OrderDetails["workflowStage"];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AssignStaffSheet({
  order,
  stage,
  open,
  onOpenChange,
}: Props) {
  // Fetch staff summaries with availability
  const staff = useQuery(api.workflow.getStaffSummaries) as
    | StaffSummary[]
    | undefined;

  const assignStage = useMutation(api.workflow.assignStage);

  const assignableStages: AssignableStage[] = [
    "tailoring",
    "beading",
    "fitting",
    "qc",
  ];
  const currentStage: AssignableStage =
    stage === "not_assigned" || stage === "completed" ? "tailoring" : stage;

  const [selectedStaffId, setSelectedStaffId] = useState<Id<"staff"> | null>(
    null,
  );
  const [isAssigning, setIsAssigning] = useState<boolean>(false);

  /* ---------- Filter staff by current stage & role ---------- */
  const stageRoleMap: Record<AssignableStage, StaffSummary["role"]> = {
    tailoring: "tailor",
    beading: "beader",
    fitting: "fitter",
    qc: "qc",
  };

  const filteredStaff = useMemo(() => {
    if (!staff) return [];
    const role = stageRoleMap[currentStage];
    return staff.filter((s) => s.role === role);
  }, [staff, currentStage]);

  const defaultStaffId = useMemo<Id<"staff"> | null>(
    () => filteredStaff[0]?._id ?? null,
    [filteredStaff],
  );

  const effectiveSelectedId: Id<"staff"> | undefined =
    selectedStaffId ?? defaultStaffId ?? undefined;

  const handleAssign = async (): Promise<void> => {
    if (!effectiveSelectedId) return;

    try {
      setIsAssigning(true);

      await assignStage({
        orderId: order._id,
        stage: currentStage,
        staffId: effectiveSelectedId,
      });

      toast.success(`Staff assigned successfully to ${currentStage}`);
      setSelectedStaffId(null);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to assign staff. Please try again.");
    } finally {
      setIsAssigning(false);
    }
  };

  if (!staff) return <div className='p-6 text-center'>Loading staff...</div>;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='w-full sm:max-w-md'>
        <SheetHeader>
          <SheetTitle>Assign Staff</SheetTitle>
        </SheetHeader>

        <div className='mt-6 space-y-6 px-4'>
          <Badge variant='outline'>
            {order.orderNumber} •{" "}
            {currentStage.charAt(0).toUpperCase() + currentStage.slice(1)}
          </Badge>

          <Select
            value={effectiveSelectedId}
            onValueChange={(value: string) =>
              setSelectedStaffId(value as Id<"staff">)
            }>
            <SelectTrigger>
              <SelectValue placeholder='Select staff' />
            </SelectTrigger>
            <SelectContent>
              {filteredStaff.map((s) => {
                const isAvailable = s.availability === "available";
                return (
                  <SelectItem key={s._id} value={s._id} disabled={!isAvailable}>
                    <div className='flex items-center justify-between gap-2 w-full'>
                      <span className='font-medium'>{s.name}</span>
                      <Badge
                        variant={isAvailable ? "secondary" : "destructive"}>
                        {s.availability}
                      </Badge>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <SheetFooter className='mt-8'>
          <Button
            onClick={handleAssign}
            disabled={!effectiveSelectedId || isAssigning}>
            {isAssigning ? "Assigning..." : "Assign"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
