// components/workflow/CompleteDepartmentDialog.tsx
"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { CheckCircle, AlertTriangle, ArrowRight, Clock } from "lucide-react";

interface CompleteDepartmentDialogProps {
  order: Doc<"orders">;
  department: "tailoring" | "beading" | "quality_control" | "fitting";
  currentStaffId: Id<"staff">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export default function CompleteDepartmentDialog({
  order,
  department,
  currentStaffId,
  open,
  onOpenChange,
  onComplete,
}: CompleteDepartmentDialogProps) {
  const [notes, setNotes] = useState("");
  const [qcResult, setQcResult] = useState<
    "passed" | "failed" | "requires_rework"
  >("passed");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const completeQueueItem = useMutation(api.workflow.completeQueueItem);

  const departmentLabels = {
    tailoring: "Tailoring",
    beading: "Beading",
    quality_control: "Quality Control",
    fitting: "Fitting",
  };

  const handleSubmit = async () => {
    if (!order) return;

    setIsSubmitting(true);
    try {
      // For QC department, we need to handle special cases
      if (department === "quality_control") {
        // Update queue item with QC result
        await completeQueueItem({
          queueItemId: order.currentQueueItemId as any,
          department,
          staffId: currentStaffId,
          notes: `${qcResult.toUpperCase()}: ${notes}`,
        });

        // If QC failed or requires rework, we might need to move back to previous department
        if (qcResult === "failed" || qcResult === "requires_rework") {
          toast.warning("Quality Check Result", {
            description: `Order marked as ${qcResult}. It will be sent back for rework.`,
          });
        } else {
          toast.success("Quality Check Passed", {
            description:
              "Order passed quality control and is ready for fitting.",
          });
        }
      } else {
        // For other departments
        await completeQueueItem({
          queueItemId: order.currentQueueItemId as any,
          department,
          staffId: currentStaffId,
          notes,
        });

        toast.success("Department Complete", {
          description: `Order moved to next department successfully.`,
        });
      }

      onComplete();
      onOpenChange(false);
      setNotes("");
      setQcResult("passed");
    } catch (error) {
      console.error("Failed to complete department:", error);
      toast.error("Failed to complete", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <CheckCircle className='h-5 w-5 text-green-500' />
            Complete {departmentLabels[department]}
          </DialogTitle>
          <DialogDescription>
            Order #{order.orderNumber} • {order.name}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Order Info */}
          <div className='rounded-lg border p-3'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='font-medium'>{order.garmentType}</p>
                <p className='text-sm text-muted-foreground'>
                  Fabric: {order.fabricSample?.fabricType}
                </p>
              </div>
              <Badge variant='outline'>{order.status.replace("_", " ")}</Badge>
            </div>
          </div>

          {/* Special instructions reminder */}
          {order.specialInstructions && (
            <div className='rounded-lg border border-amber-200 bg-amber-50 p-3'>
              <div className='flex items-start gap-2'>
                <AlertTriangle className='h-4 w-4 text-amber-600 mt-0.5' />
                <div>
                  <p className='text-sm font-medium text-amber-800'>
                    Special Instructions
                  </p>
                  <p className='text-sm text-amber-700 mt-1'>
                    {order.specialInstructions}
                  </p>
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* QC Specific Form */}
          {department === "quality_control" && (
            <div className='space-y-3'>
              <Label>Quality Check Result</Label>
              <RadioGroup
                value={qcResult}
                onValueChange={(
                  value: "passed" | "failed" | "requires_rework"
                ) => setQcResult(value)}
                className='space-y-2'>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='passed' id='passed' />
                  <Label
                    htmlFor='passed'
                    className='flex items-center gap-2 font-normal cursor-pointer'>
                    <div className='h-2 w-2 rounded-full bg-green-500' />
                    Passed - Ready for fitting
                  </Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='requires_rework' id='rework' />
                  <Label
                    htmlFor='rework'
                    className='flex items-center gap-2 font-normal cursor-pointer'>
                    <div className='h-2 w-2 rounded-full bg-amber-500' />
                    Requires Rework - Send back to beading
                  </Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='failed' id='failed' />
                  <Label
                    htmlFor='failed'
                    className='flex items-center gap-2 font-normal cursor-pointer'>
                    <div className='h-2 w-2 rounded-full bg-red-500' />
                    Failed - Major issues detected
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Notes for all departments */}
          <div className='space-y-2'>
            <Label htmlFor='notes'>
              {department === "quality_control"
                ? "QC Notes"
                : "Completion Notes"}
            </Label>
            <Textarea
              id='notes'
              placeholder={
                department === "quality_control"
                  ? "Add any quality check observations..."
                  : "Add completion notes or observations..."
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Next step info */}
          <div className='rounded-lg border p-3'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <ArrowRight className='h-4 w-4 text-primary' />
                <span className='text-sm font-medium'>Next Step:</span>
              </div>
              <Badge variant='secondary'>
                {department === "tailoring"
                  ? "Beading"
                  : department === "beading"
                    ? "Quality Control"
                    : department === "quality_control"
                      ? "Fitting"
                      : "Ready for Collection"}
              </Badge>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Clock className='h-4 w-4 mr-2 animate-spin' />
                Completing...
              </>
            ) : (
              <>
                <CheckCircle className='h-4 w-4 mr-2' />
                Complete {departmentLabels[department]}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
