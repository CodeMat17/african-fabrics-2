// components/dashboard/workflow/WorkflowDashboard.tsx
"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Icons
import {
  Scissors,
  Tag,
  CheckSquare,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  Play,
  Pause,
  TrendingUp,
  Users,
  Package,
  Calendar,
} from "lucide-react";

// Hooks
import { useWorkflowOperations } from "@/lib/workflow-mutations";

// ============================================================================
// TYPES
// ============================================================================

type Department = "tailoring" | "beading" | "quality_control" | "fitting";

type PriorityLevel = "low" | "medium" | "high" | "urgent";

type QueueStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "on_hold"
  | "passed";

interface QueueItem {
  _id:
    | Id<"tailoringQueue">
    | Id<"beadingQueue">
    | Id<"qualityControlQueue">
    | Id<"fittingQueue">;
  _creationTime: number;
  orderId: Id<"orders">;
  assignedAt: number;
  status: QueueStatus;
  priority: PriorityLevel;
  startedAt?: number;
  completedAt?: number;
}

interface Order {
  _id: Id<"orders">;
  _creationTime: number;
  orderNumber: string;
  name: string;
  garmentType: string;
}

interface Staff {
  _id: Id<"staff">;
  name: string;
}

interface EnrichedQueueItem {
  queueItem: QueueItem;
  order: Order;
  staff: Staff;
}

interface DepartmentStats {
  department: Department;
  pending: number;
  inProgress: number;
  completed: number;
  avgCompletionTime: number;
  totalItems: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format timestamp to readable time
 */
const formatTime = (timestamp?: number): string => {
  if (!timestamp) return "N/A";
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Get priority badge component
 */
const getPriorityBadge = (priority: PriorityLevel) => {
  const badgeConfig: Record<
    PriorityLevel,
    { variant: "default" | "destructive"; className: string; label: string }
  > = {
    urgent: {
      variant: "destructive",
      className: "text-xs",
      label: "Urgent",
    },
    high: {
      variant: "default",
      className: "bg-orange-500 text-white text-xs",
      label: "High",
    },
    medium: {
      variant: "default",
      className: "bg-yellow-500 text-white text-xs",
      label: "Medium",
    },
    low: {
      variant: "default",
      className: "bg-blue-500 text-white text-xs",
      label: "Low",
    },
  };

  const config = badgeConfig[priority];

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
};

/**
 * Get progress percentage based on department
 */
const getProgressPercentage = (department: Department): number => {
  const progressMap: Record<Department, number> = {
    tailoring: 25,
    beading: 50,
    quality_control: 75,
    fitting: 90,
  };

  return progressMap[department];
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function WorkflowDashboard() {
  const [activeTab, setActiveTab] = useState<Department>("tailoring");

  // Fetch data
  const tailoringQueue = useQuery(api.workflow.getQueueByDepartment, {
    department: "tailoring",
    limit: 50,
  });

  const beadingQueue = useQuery(api.workflow.getQueueByDepartment, {
    department: "beading",
    limit: 50,
  });

  const qcQueue = useQuery(api.workflow.getQueueByDepartment, {
    department: "quality_control",
    limit: 50,
  });

  const fittingQueue = useQuery(api.workflow.getQueueByDepartment, {
    department: "fitting",
    limit: 50,
  });

  const departmentStats = useQuery(api.workflow.getDepartmentStats, {
    department: activeTab,
  });

  // Workflow operations
  const { startWork, completeAndMove, putOnHold, resumeFromHold } =
    useWorkflowOperations();

  // Get current queue based on active tab
  const currentQueue = useMemo((): EnrichedQueueItem[] => {
    switch (activeTab) {
      case "tailoring":
        return (tailoringQueue as EnrichedQueueItem[]) || [];
      case "beading":
        return (beadingQueue as EnrichedQueueItem[]) || [];
      case "quality_control":
        return (qcQueue as EnrichedQueueItem[]) || [];
      case "fitting":
        return (fittingQueue as EnrichedQueueItem[]) || [];
      default:
        return [];
    }
  }, [activeTab, tailoringQueue, beadingQueue, qcQueue, fittingQueue]);

  // Filter queues by status
  const pendingItems = useMemo(
    () => currentQueue.filter((item) => item.queueItem.status === "pending"),
    [currentQueue]
  );

  const inProgressItems = useMemo(
    () =>
      currentQueue.filter((item) => item.queueItem.status === "in_progress"),
    [currentQueue]
  );

  const completedItems = useMemo(() => {
    const completedStatus: QueueStatus =
      activeTab === "quality_control" ? "passed" : "completed";
    return currentQueue.filter(
      (item) => item.queueItem.status === completedStatus
    );
  }, [currentQueue, activeTab]);

  const onHoldItems = useMemo(
    () => currentQueue.filter((item) => item.queueItem.status === "on_hold"),
    [currentQueue]
  );

  // Handle start work
  const handleStartWork = async (
    queueItemId:
      | Id<"tailoringQueue">
      | Id<"beadingQueue">
      | Id<"qualityControlQueue">
      | Id<"fittingQueue">,
    staffId: Id<"staff">
  ): Promise<void> => {
    try {
      await startWork(queueItemId, activeTab, staffId);
    } catch (error) {
      console.error("Failed to start work:", error);
    }
  };

  // Handle complete work
  const handleCompleteWork = async (
    orderId: Id<"orders">,
    queueItemId:
      | Id<"tailoringQueue">
      | Id<"beadingQueue">
      | Id<"qualityControlQueue">
      | Id<"fittingQueue">,
    staffId: Id<"staff">
  ): Promise<void> => {
    try {
      await completeAndMove(orderId, activeTab, staffId, queueItemId);
    } catch (error) {
      console.error("Failed to complete work:", error);
    }
  };

  // Handle put on hold
  const handlePutOnHold = async (
    queueItemId:
      | Id<"tailoringQueue">
      | Id<"beadingQueue">
      | Id<"qualityControlQueue">
      | Id<"fittingQueue">,
    staffId: Id<"staff">,
    reason: string
  ): Promise<void> => {
    try {
      await putOnHold(queueItemId, activeTab, staffId, reason);
    } catch (error) {
      console.error("Failed to put on hold:", error);
    }
  };

  // Handle resume from hold
  const handleResumeFromHold = async (
    queueItemId:
      | Id<"tailoringQueue">
      | Id<"beadingQueue">
      | Id<"qualityControlQueue">
      | Id<"fittingQueue">,
    staffId: Id<"staff">
  ): Promise<void> => {
    try {
      await resumeFromHold(queueItemId, activeTab, staffId);
    } catch (error) {
      console.error("Failed to resume from hold:", error);
    }
  };

  // Get progress percentage
  const progressPercentage = getProgressPercentage(activeTab);

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div>
          <h1 className='text-3xl font-bold'>Workflow Dashboard</h1>
          <p className='text-muted-foreground'>
            Manage and track orders through the production workflow
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Badge variant='outline' className='text-sm'>
            <TrendingUp className='h-3 w-3 mr-1' />
            Real-time Updates
          </Badge>
        </div>
      </div>

      {/* Department Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as Department)}>
        <TabsList className='grid grid-cols-2 md:grid-cols-4 w-full'>
          <TabsTrigger value='tailoring' className='flex items-center gap-2'>
            <Scissors className='h-4 w-4' />
            Tailoring
          </TabsTrigger>
          <TabsTrigger value='beading' className='flex items-center gap-2'>
            <Tag className='h-4 w-4' />
            Beading
          </TabsTrigger>
          <TabsTrigger
            value='quality_control'
            className='flex items-center gap-2'>
            <CheckSquare className='h-4 w-4' />
            Quality Control
          </TabsTrigger>
          <TabsTrigger value='fitting' className='flex items-center gap-2'>
            <User className='h-4 w-4' />
            Fitting
          </TabsTrigger>
        </TabsList>

        {/* Department Stats */}
        <TabsContent value={activeTab} className='mt-6'>
          {departmentStats && (
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
              <Card>
                <CardContent className='p-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm text-muted-foreground'>Pending</p>
                      <p className='text-2xl font-bold'>
                        {departmentStats.pending}
                      </p>
                    </div>
                    <Clock className='h-8 w-8 text-amber-500 opacity-50' />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className='p-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm text-muted-foreground'>
                        In Progress
                      </p>
                      <p className='text-2xl font-bold'>
                        {departmentStats.inProgress}
                      </p>
                    </div>
                    <Play className='h-8 w-8 text-blue-500 opacity-50' />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className='p-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm text-muted-foreground'>Completed</p>
                      <p className='text-2xl font-bold'>
                        {departmentStats.completed}
                      </p>
                    </div>
                    <CheckCircle className='h-8 w-8 text-emerald-500 opacity-50' />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className='p-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm text-muted-foreground'>Avg. Time</p>
                      <p className='text-2xl font-bold'>
                        {departmentStats.avgCompletionTime}h
                      </p>
                    </div>
                    <Calendar className='h-8 w-8 text-purple-500 opacity-50' />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Workflow Queue Sections */}
          <div className='space-y-6'>
            {/* In Progress Section */}
            {inProgressItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Play className='h-5 w-5 text-blue-500' />
                    In Progress ({inProgressItems.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className='h-[400px] pr-4'>
                    <div className='space-y-4'>
                      {inProgressItems.map((item) => (
                        <motion.div
                          key={item.queueItem._id}
                          layout
                          className='p-4 border rounded-lg hover:shadow-md transition-shadow'>
                          <div className='flex justify-between items-start'>
                            <div className='space-y-2'>
                              <div className='flex items-center gap-2'>
                                <h3 className='font-semibold'>
                                  {item.order.name}
                                </h3>
                                {getPriorityBadge(item.queueItem.priority)}
                              </div>
                              <p className='text-sm text-muted-foreground'>
                                Order: {item.order.orderNumber}
                              </p>
                              <p className='text-sm'>
                                <Package className='inline h-3 w-3 mr-1' />
                                {item.order.garmentType}
                              </p>
                              <div className='flex items-center gap-4 text-sm'>
                                <span className='flex items-center gap-1'>
                                  <Users className='h-3 w-3' />
                                  {item.staff.name}
                                </span>
                                <span className='flex items-center gap-1'>
                                  <Clock className='h-3 w-3' />
                                  Started:{" "}
                                  {formatTime(item.queueItem.startedAt)}
                                </span>
                              </div>
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant='ghost' size='icon'>
                                  <MoreVertical className='h-4 w-4' />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align='end'>
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleCompleteWork(
                                      item.order._id,
                                      item.queueItem._id,
                                      item.staff._id
                                    )
                                  }>
                                  <CheckCircle className='h-4 w-4 mr-2' />
                                  Mark Complete
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handlePutOnHold(
                                      item.queueItem._id,
                                      item.staff._id,
                                      "Paused for adjustments"
                                    )
                                  }>
                                  <Pause className='h-4 w-4 mr-2' />
                                  Put on Hold
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <AlertCircle className='h-4 w-4 mr-2' />
                                  View Details
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {/* Progress indicator */}
                          <div className='mt-4'>
                            <div className='flex justify-between text-sm mb-1'>
                              <span>Progress</span>
                              <span className='font-medium'>
                                {progressPercentage}%
                              </span>
                            </div>
                            <div className='w-full bg-muted rounded-full h-2'>
                              <div
                                className='bg-primary h-2 rounded-full transition-all duration-500'
                                style={{ width: `${progressPercentage}%` }}
                              />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Pending Section */}
            {pendingItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Clock className='h-5 w-5 text-amber-500' />
                    Pending ({pendingItems.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className='h-[300px] pr-4'>
                    <div className='space-y-3'>
                      {pendingItems.map((item) => (
                        <motion.div
                          key={item.queueItem._id}
                          layout
                          className='p-3 border rounded-lg hover:bg-muted/50 transition-colors'>
                          <div className='flex justify-between items-center'>
                            <div>
                              <h4 className='font-medium'>{item.order.name}</h4>
                              <p className='text-sm text-muted-foreground'>
                                {item.order.orderNumber} • Assigned to{" "}
                                {item.staff.name}
                              </p>
                            </div>
                            <div className='flex items-center gap-2'>
                              {getPriorityBadge(item.queueItem.priority)}
                              <Button
                                size='sm'
                                onClick={() =>
                                  handleStartWork(
                                    item.queueItem._id,
                                    item.staff._id
                                  )
                                }>
                                <Play className='h-3 w-3 mr-1' />
                                Start
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* On Hold Section */}
            {onHoldItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Pause className='h-5 w-5 text-orange-500' />
                    On Hold ({onHoldItems.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className='h-[200px] pr-4'>
                    <div className='space-y-3'>
                      {onHoldItems.map((item) => (
                        <div
                          key={item.queueItem._id}
                          className='p-3 border rounded-lg'>
                          <div className='flex justify-between items-center'>
                            <div>
                              <h4 className='font-medium'>{item.order.name}</h4>
                              <p className='text-sm text-muted-foreground'>
                                {item.order.orderNumber}
                              </p>
                            </div>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() =>
                                handleResumeFromHold(
                                  item.queueItem._id,
                                  item.staff._id
                                )
                              }>
                              Resume
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {currentQueue.length === 0 && (
              <Card>
                <CardContent className='p-12 text-center'>
                  <Package className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
                  <h3 className='text-lg font-semibold mb-2'>
                    No items in queue
                  </h3>
                  <p className='text-muted-foreground'>
                    There are currently no orders in the {activeTab} department.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
