// components/workflow/SequentialWorkflow.tsx
import { cn } from "@/lib/utils";
import { Check, Clock, AlertCircle, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

export type WorkflowStep = {
  id: string;
  label: string;
  department: string;
  status: "pending" | "active" | "completed" | "blocked";
  assignedTo?: string;
  completedAt?: Date;
  canProceed: boolean;
  isCurrentStep: boolean;
};

interface SequentialWorkflowProps {
  steps: WorkflowStep[];
  currentDepartment: string;
  onStepClick?: (stepId: string) => void;
  className?: string;
}

export function SequentialWorkflow({
  steps,
  currentDepartment,
  onStepClick,
  className,
}: SequentialWorkflowProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className='relative'>
        {/* Progress line */}
        <div className='absolute left-0 right-0 top-4 h-0.5 bg-gray-200' />
        <div
          className='absolute left-0 top-4 h-0.5 bg-primary transition-all duration-500'
          style={{
            width: `${(steps.filter((s) => s.status === "completed").length / (steps.length - 1)) * 100}%`,
          }}
        />

        {/* Steps */}
        <div className='relative flex justify-between'>
          {steps.map((step, index) => {
            const isClickable = step.canProceed && onStepClick;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "flex flex-col items-center",
                  isClickable && "cursor-pointer"
                )}
                onClick={() => isClickable && onStepClick(step.id)}>
                {/* Step indicator */}
                <div
                  className={cn(
                    "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300",
                    step.status === "completed" &&
                      "border-primary bg-primary text-white",
                    step.status === "active" &&
                      "border-primary bg-white text-primary",
                    step.status === "pending" &&
                      "border-gray-300 bg-white text-gray-400",
                    step.status === "blocked" &&
                      "border-gray-200 bg-gray-100 text-gray-400",
                    step.isCurrentStep && "ring-4 ring-primary/20",
                    isClickable && "hover:scale-110 hover:shadow-md"
                  )}>
                  {step.status === "completed" ? (
                    <Check className='h-4 w-4' />
                  ) : step.status === "active" ? (
                    <Clock className='h-4 w-4' />
                  ) : step.status === "blocked" ? (
                    <AlertCircle className='h-4 w-4' />
                  ) : (
                    <span className='text-xs font-medium'>{index + 1}</span>
                  )}
                </div>

                {/* Step label */}
                <div className='mt-2 text-center'>
                  <p
                    className={cn(
                      "text-xs font-medium",
                      step.status === "completed" && "text-primary",
                      step.status === "active" && "text-primary font-semibold",
                      step.status === "pending" && "text-gray-500",
                      step.status === "blocked" && "text-gray-400"
                    )}>
                    {step.label}
                  </p>
                  {step.assignedTo && (
                    <p className='mt-1 text-xs text-muted-foreground flex items-center justify-center gap-1'>
                      <User className='h-3 w-3' />
                      {step.assignedTo}
                    </p>
                  )}
                  {step.completedAt && (
                    <p className='mt-0.5 text-xs text-muted-foreground'>
                      {step.completedAt.toLocaleDateString()}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Department info */}
      <Card className='mt-8'>
        <CardContent className='p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-muted-foreground'>
                Current Department
              </p>
              <p className='text-lg font-semibold'>{currentDepartment}</p>
            </div>
            <Badge
              variant={
                steps.find((s) => s.isCurrentStep)?.status === "active"
                  ? "default"
                  : "outline"
              }>
              {steps.find((s) => s.isCurrentStep)?.status === "active"
                ? "In Progress"
                : "Pending"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
