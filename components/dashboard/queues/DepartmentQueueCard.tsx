// components/dashboard/queues/DepartmentQueueCard.tsx
"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { motion } from "framer-motion";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  Clock,
  CheckCircle,
  AlertTriangle,
  MoreVertical,
  Play,
  Pause,
  TrendingUp,
  User,
  Calendar,
  Package,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

type QueueItem = {
  queueItem: any;
  order: Doc<"orders">;
  staff: Doc<"staff">;
};

type Department = "tailoring" | "beading" | "quality_control" | "fitting";

interface DepartmentQueueCardProps {
  department: Department;
  title: string;
  items: QueueItem[];
  isLoading: boolean;
  onItemAction?: () => void;
}

const departmentConfig: Record<
  Department,
  {
    color: string;
    icon: React.ReactNode;
    statuses: {
      pending: { label: string; color: string };
      in_progress: { label: string; color: string };
      completed: { label: string; color: string };
      on_hold?: { label: string; color: string };
      passed?: { label: string; color: string };
      failed?: { label: string; color: string };
      requires_rework?: { label: string; color: string };
      requires_adjustment?: { label: string; color: string };
    };
  }
> = {
  tailoring: {
    color: "bg-blue-500",
    icon: <Clock className='h-4 w-4' />,
    statuses: {
      pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
      in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-800" },
      completed: { label: "Completed", color: "bg-green-100 text-green-800" },
      on_hold: { label: "On Hold", color: "bg-gray-100 text-gray-800" },
    },
  },
  beading: {
    color: "bg-purple-500",
    icon: <Package className='h-4 w-4' />,
    statuses: {
      pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
      in_progress: {
        label: "In Progress",
        color: "bg-purple-100 text-purple-800",
      },
      completed: { label: "Completed", color: "bg-green-100 text-green-800" },
      on_hold: { label: "On Hold", color: "bg-gray-100 text-gray-800" },
    },
  },
  quality_control: {
    color: "bg-orange-500",
    icon: <CheckCircle className='h-4 w-4' />,
    statuses: {
      pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
      in_progress: {
        label: "In Progress",
        color: "bg-orange-100 text-orange-800",
      },
      passed: { label: "Passed", color: "bg-green-100 text-green-800" },
      failed: { label: "Failed", color: "bg-red-100 text-red-800" },
      requires_rework: {
        label: "Rework",
        color: "bg-amber-100 text-amber-800",
      },
    },
  },
  fitting: {
    color: "bg-green-500",
    icon: <User className='h-4 w-4' />,
    statuses: {
      pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
      in_progress: {
        label: "In Progress",
        color: "bg-green-100 text-green-800",
      },
      completed: {
        label: "Completed",
        color: "bg-emerald-100 text-emerald-800",
      },
      requires_adjustment: {
        label: "Adjustment",
        color: "bg-amber-100 text-amber-800",
      },
    },
  },
};

const priorityConfig = {
  urgent: { label: "Urgent", color: "bg-red-100 text-red-800" },
  high: { label: "High", color: "bg-orange-100 text-orange-800" },
  medium: { label: "Medium", color: "bg-yellow-100 text-yellow-800" },
  low: { label: "Low", color: "bg-green-100 text-green-800" },
};

export default function DepartmentQueueCard({
  department,
  title,
  items,
  isLoading,
  onItemAction,
}: DepartmentQueueCardProps) {
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showHoldDialog, setShowHoldDialog] = useState(false);

  const config = departmentConfig[department];
  const statusConfig = config.statuses;

  // Mutations
  const startQueueItem = useMutation(api.workflow.startQueueItem);
  const completeQueueItem = useMutation(api.workflow.completeQueueItem);
  const putOnHold = useMutation(api.workflow.putOnHold);
  const resumeFromHold = useMutation(api.workflow.resumeFromHold);

  const handleStartItem = async (item: QueueItem) => {
    try {
      await startQueueItem({
        queueItemId: item.queueItem._id,
        department,
        staffId: item.staff._id,
      });

      toast.success("Work started", {
        description: `Started working on order ${item.order.orderNumber}`,
      });

      onItemAction?.();
    } catch (error) {
      toast.error("Failed to start work", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
    }
  };

  const handleCompleteItem = async (item: QueueItem) => {
    try {
      await completeQueueItem({
        queueItemId: item.queueItem._id,
        department,
        staffId: item.staff._id,
      });

      toast.success("Work completed", {
        description: `Completed work on order ${item.order.orderNumber}`,
      });

      setShowCompleteDialog(false);
      onItemAction?.();
    } catch (error) {
      toast.error("Failed to complete work", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
    }
  };

  const handleToggleHold = async (item: QueueItem) => {
    try {
      if (item.queueItem.status === "on_hold") {
        await resumeFromHold({
          queueItemId: item.queueItem._id,
          department,
          staffId: item.staff._id,
        });
        toast.success("Resumed from hold");
      } else {
        await putOnHold({
          queueItemId: item.queueItem._id,
          department,
          staffId: item.staff._id,
          reason: "Temporary hold",
        });
        toast.success("Put on hold");
      }

      setShowHoldDialog(false);
      onItemAction?.();
    } catch (error) {
      toast.error("Failed to update status", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
    }
  };

  // Filter items by status
  const pendingItems = items.filter(
    (item) => item.queueItem.status === "pending"
  );
  const inProgressItems = items.filter(
    (item) => item.queueItem.status === "in_progress"
  );
  const onHoldItems = items.filter(
    (item) => item.queueItem.status === "on_hold"
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className='h-6 w-32' />
        </CardHeader>
        <CardContent className='space-y-3'>
          <Skeleton className='h-20 w-full' />
          <Skeleton className='h-20 w-full' />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className='h-full'>
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center gap-2'>
            <div
              className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center",
                config.color
              )}>
              {config.icon}
            </div>
            <div>
              {title}
              <div className='flex items-center gap-2 mt-1'>
                <Badge variant='outline' className='text-xs'>
                  {items.length} total
                </Badge>
                {pendingItems.length > 0 && (
                  <Badge
                    variant='secondary'
                    className='text-xs bg-yellow-100 text-yellow-800'>
                    {pendingItems.length} pending
                  </Badge>
                )}
              </div>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className='pb-3'>
          {/* Tabs for different statuses */}
          <div className='space-y-4'>
            {/* In Progress Items */}
            {inProgressItems.length > 0 && (
              <div>
                <div className='flex items-center justify-between mb-2'>
                  <h4 className='text-sm font-medium flex items-center gap-2'>
                    <Play className='h-3 w-3 text-blue-500' />
                    In Progress ({inProgressItems.length})
                  </h4>
                </div>
                <div className='space-y-3'>
                  {inProgressItems.map((item, index) => (
                    <motion.div
                      key={item.queueItem._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}>
                      <QueueItemCard
                        item={item}
                        department={department}
                        onAction={(action) => {
                          setSelectedItem(item);
                          if (action === "complete")
                            setShowCompleteDialog(true);
                          if (action === "hold") setShowHoldDialog(true);
                        }}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Items */}
            {pendingItems.length > 0 && (
              <div>
                <div className='flex items-center justify-between mb-2'>
                  <h4 className='text-sm font-medium flex items-center gap-2'>
                    <Clock className='h-3 w-3 text-yellow-500' />
                    Pending ({pendingItems.length})
                  </h4>
                </div>
                <div className='space-y-3'>
                  {pendingItems.map((item, index) => (
                    <motion.div
                      key={item.queueItem._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}>
                      <QueueItemCard
                        item={item}
                        department={department}
                        onAction={(action) => {
                          setSelectedItem(item);
                          if (action === "start") handleStartItem(item);
                        }}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* On Hold Items */}
            {onHoldItems.length > 0 && (
              <div>
                <div className='flex items-center justify-between mb-2'>
                  <h4 className='text-sm font-medium flex items-center gap-2'>
                    <Pause className='h-3 w-3 text-gray-500' />
                    On Hold ({onHoldItems.length})
                  </h4>
                </div>
                <div className='space-y-3'>
                  {onHoldItems.map((item, index) => (
                    <motion.div
                      key={item.queueItem._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}>
                      <QueueItemCard
                        item={item}
                        department={department}
                        onAction={(action) => {
                          setSelectedItem(item);
                          if (action === "resume") handleToggleHold(item);
                        }}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {items.length === 0 && (
              <div className='text-center py-8'>
                <Clock className='h-12 w-12 mx-auto text-muted-foreground mb-3' />
                <p className='text-muted-foreground'>No items in queue</p>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className='pt-0'>
          <div className='w-full'>
            <Separator className='mb-3' />
            <div className='flex items-center justify-between text-sm'>
              <div className='text-muted-foreground'>
                Last updated: {formatDate(Date.now())}
              </div>
              <TrendingUp className='h-4 w-4 text-primary' />
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* Complete Dialog */}
      <AlertDialog
        open={showCompleteDialog}
        onOpenChange={setShowCompleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Work</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this work as completed? This will
              move the order to the next department.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedItem && handleCompleteItem(selectedItem)}>
              Complete Work
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hold Dialog */}
      <AlertDialog open={showHoldDialog} onOpenChange={setShowHoldDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedItem?.queueItem.status === "on_hold"
                ? "Resume from Hold"
                : "Put on Hold"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedItem?.queueItem.status === "on_hold"
                ? "Are you sure you want to resume this work?"
                : "Are you sure you want to put this work on hold? The order will be paused."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedItem && handleToggleHold(selectedItem)}>
              {selectedItem?.queueItem.status === "on_hold"
                ? "Resume"
                : "Put on Hold"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Individual Queue Item Component
function QueueItemCard({
  item,
  department,
  onAction,
}: {
  item: QueueItem;
  department: Department;
  onAction: (action: "start" | "complete" | "hold" | "resume") => void;
}) {
  const config = departmentConfig[department];
  const statusConfig = config.statuses;
  const status = item.queueItem.status as keyof typeof statusConfig;
  const priority = item.queueItem.priority as keyof typeof priorityConfig;

  const isPending = status === "pending";
  const isInProgress = status === "in_progress";
  const isOnHold = status === "on_hold";

  const calculateUrgency = (expectedDate: number) => {
    const daysUntil = Math.ceil(
      (expectedDate - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntil < 0) return "overdue";
    if (daysUntil <= 1) return "urgent";
    if (daysUntil <= 3) return "high";
    return "normal";
  };

  const urgency = calculateUrgency(item.order.expectedCollectionDate);

  return (
    <Card
      className={cn(
        "border hover:shadow-md transition-shadow",
        urgency === "overdue" && "border-red-200 bg-red-50/50",
        urgency === "urgent" && "border-orange-200 bg-orange-50/50"
      )}>
      <CardContent className='p-4'>
        <div className='space-y-3'>
          {/* Header */}
          <div className='flex items-start justify-between'>
            <div>
              <p className='font-mono font-medium'>{item.order.orderNumber}</p>
              <p className='text-sm text-muted-foreground'>{item.order.name}</p>
            </div>
            <div className='flex flex-col items-end gap-1'>
              <Badge className={cn("text-xs", statusConfig[status]?.color)}>
                {statusConfig[status]?.label}
              </Badge>
              <Badge className={cn("text-xs", priorityConfig[priority]?.color)}>
                {priorityConfig[priority]?.label}
              </Badge>
            </div>
          </div>

          {/* Details */}
          <div className='grid grid-cols-2 gap-2 text-sm'>
            <div>
              <p className='text-muted-foreground'>Garment</p>
              <p className='font-medium'>{item.order.garmentType}</p>
            </div>
            <div>
              <p className='text-muted-foreground'>Assigned</p>
              <div className='flex items-center gap-1'>
                <User className='h-3 w-3' />
                <span className='font-medium truncate'>{item.staff.name}</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className='flex items-center justify-between text-xs'>
            <div className='flex items-center gap-1'>
              <Calendar className='h-3 w-3' />
              <span className='text-muted-foreground'>
                Due: {formatDate(item.order.expectedCollectionDate)}
              </span>
            </div>
            {urgency !== "normal" && (
              <Badge
                variant='outline'
                className={cn(
                  urgency === "overdue" && "border-red-300 text-red-700",
                  urgency === "urgent" && "border-orange-300 text-orange-700",
                  urgency === "high" && "border-yellow-300 text-yellow-700"
                )}>
                <AlertTriangle className='h-3 w-3 mr-1' />
                {urgency === "overdue"
                  ? "Overdue"
                  : urgency === "urgent"
                    ? "Due today"
                    : "Due soon"}
              </Badge>
            )}
          </div>

          {/* Actions */}
          <div className='flex items-center justify-between pt-2'>
            <div className='text-xs text-muted-foreground'>
              Assigned: {formatDate(item.queueItem.assignedAt)}
            </div>
            <div className='flex items-center gap-2'>
              {isPending && (
                <Button
                  size='sm'
                  onClick={() => onAction("start")}
                  className='h-7 text-xs'>
                  <Play className='h-3 w-3 mr-1' />
                  Start
                </Button>
              )}
              {isInProgress && (
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => onAction("complete")}
                  className='h-7 text-xs'>
                  <CheckCircle className='h-3 w-3 mr-1' />
                  Complete
                </Button>
              )}
              {(isPending || isInProgress) && (
                <Button
                  size='sm'
                  variant='ghost'
                  onClick={() => onAction("hold")}
                  className='h-7 text-xs'>
                  <Pause className='h-3 w-3 mr-1' />
                  Hold
                </Button>
              )}
              {isOnHold && (
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => onAction("resume")}
                  className='h-7 text-xs'>
                  <Play className='h-3 w-3 mr-1' />
                  Resume
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size='sm' variant='ghost' className='h-7 w-7 p-0'>
                    <MoreVertical className='h-4 w-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuItem>View Details</DropdownMenuItem>
                  <DropdownMenuItem>Change Priority</DropdownMenuItem>
                  <DropdownMenuItem>Reassign</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton component
function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}
