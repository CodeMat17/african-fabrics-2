"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  User,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";

type Order = Doc<"orders">;
type Staff = Doc<"staff"> & {
  availability: "available" | "busy";
  currentAssignment?: {
    orderId: Id<"orders">;
    orderNumber: string;
    stage: string;
  };
};

type StageType = "tailoring" | "beading" | "fitting" | "qc";

const STAGE_CONFIG = {
  tailoring: { role: "tailor", color: "blue", icon: Sparkles },
  beading: { role: "beader", color: "purple", icon: Zap },
  fitting: { role: "fitter", color: "pink", icon: User },
  qc: { role: "qc", color: "green", icon: CheckCircle2 },
} as const;

export default function WorkflowPage() {
  const [selectedStage, setSelectedStage] = useState<StageType>("tailoring");

  const orders = useQuery(api.orders.getActiveOrders);
  const allStaff = useQuery(api.staff.getAllStaff);

  const assignStaff = useMutation(api.orders.assignStaffToOrder);
  const completeStage = useMutation(api.orders.completeCurrentStage);

  const stageOrders = orders?.filter(
    (o) =>
      o.workflowStage === selectedStage ||
      (selectedStage === "tailoring" && o.workflowStage === "pending"),
  );

  const stageStaff = allStaff?.filter(
    (s) => s.role === STAGE_CONFIG[selectedStage].role,
  );

  const isLoadingOrders = orders === undefined;
  const isLoadingStaff = allStaff === undefined;

  const handleAssign = async (orderId: Id<"orders">, staffId: Id<"staff">) => {
    try {
      await assignStaff({ orderId, staffId });
      toast("Staff Assigned", {
        description: "Staff member has been assigned to the order",
      });
    } catch (error) {
      toast.error("Assignment Failed", {
        description: (error as Error).message,
      });
    }
  };

  const handleComplete = async (orderId: Id<"orders">) => {
    try {
      const result = await completeStage({ orderId });
      toast("Stage Completed", {
        description: `Order moved to ${result.nextStage}`,
      });
    } catch (error) {
      toast.error("Completion Failed", {
        description: (error as Error).message,
      });
    }
  };

  const config = STAGE_CONFIG[selectedStage];
  const StageIcon = config.icon;

  return (
    <div className='min-h-screen lg:ml-16'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-8'>
          <h1 className='text-4xl  font-bold  mb-4'>WORKFLOW</h1>

          {/* Stage Selector */}
          <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
            {(Object.keys(STAGE_CONFIG) as StageType[]).map((stage) => {
              const cfg = STAGE_CONFIG[stage];
              const Icon = cfg.icon;
              const count =
                orders?.filter(
                  (o) =>
                    o.workflowStage === stage ||
                    (stage === "tailoring" && o.workflowStage === "pending"),
                ).length || 0;

              return (
                <motion.button
                  key={stage}
                  onClick={() => setSelectedStage(stage)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative p-4 rounded-xl  transition-all border ${
                    selectedStage === stage
                      ? `dark:bg-${cfg.color}-500/20  shadow-lg shadow-${cfg.color}-500/20`
                      : "bg-slate-50 shadow-md dark:bg-slate-900/50 "
                  }`}>
                  <div className='flex items-center justify-between mb-2'>
                    <Icon
                      className={`w-5 h-5 ${selectedStage === stage ? `text-${cfg.color}-400` : "text-slate-500"}`}
                    />
                    <Badge
                      className={`${selectedStage === stage ? `bg-${cfg.color}-500` : "bg-slate-700"} text-xs`}>
                      {count}
                    </Badge>
                  </div>
                  <p
                    className={`text-sm font-medium uppercase ${selectedStage === stage ? "text-blue-600" : "text-muted-foreground"}`}>
                    {stage}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Orders Column */}
          <div className='lg:col-span-2 space-y-4'>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className='flex items-center gap-3 mb-4'>
              <StageIcon className={`w-6 h-6 text-${config.color}-400`} />
              <h2 className='text-xl font-semibold'>
                Orders in {selectedStage}
              </h2>
            </motion.div>

            <div
              className='space-y-3 grid grid-cols-1 md:grid-cols-2 gap-4
            '>
              <AnimatePresence mode='popLayout'>
                {isLoadingOrders ? (
                  <>
                    <OrderSkeleton />
                    <OrderSkeleton />
                    <OrderSkeleton />
                  </>
                ) : (
                  stageOrders?.map((order, idx) => (
                    <OrderWorkflowCard
                      key={order._id}
                      order={order}
                      staff={stageStaff}
                      index={idx}
                      onAssign={handleAssign}
                      onComplete={handleComplete}
                      stageColor={config.color}
                    />
                  ))
                )}
              </AnimatePresence>

              {isLoadingOrders && stageOrders?.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className='text-center py-12 text-slate-500'>
                  <Clock className='w-12 h-12 mx-auto mb-3 opacity-50' />
                  <p>No orders in this stage</p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Staff Column */}
          <div className='space-y-4'>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className='flex items-center gap-3 mb-4'>
              <Users className={`w-6 h-6 text-${config.color}-400`} />
              <h2 className='text-xl font-semibold'>
                {STAGE_CONFIG[selectedStage].role}s
              </h2>
            </motion.div>

            <div className='space-y-3'>
              {isLoadingStaff ? (
                <>
                  <StaffSkeleton />
                  <StaffSkeleton />
                  <StaffSkeleton />
                </>
              ) : (
                stageStaff?.map((staff, idx) => (
                  <StaffCard
                    key={staff._id}
                    staff={staff}
                    index={idx}
                    color={config.color}
                  />
                ))
              )}

              {!isLoadingStaff && stageStaff?.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className='text-center py-8 text-slate-500'>
                  <User className='w-10 h-10 mx-auto mb-2 opacity-50' />
                  <p className='text-sm'>No staff available</p>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderWorkflowCard({
  order,
  staff,
  index,
  onAssign,
  onComplete,
  stageColor,
}: {
  order: Order;
  staff?: Staff[];
  index: number;
  onAssign: (orderId: Id<"orders">, staffId: Id<"staff">) => Promise<void>;
  onComplete: (orderId: Id<"orders">) => Promise<void>;
  stageColor: string;
  }) {
  
    const { sessionClaims } = useAuth();
    const isAdmin = sessionClaims?.metadata?.role === "admin";
    const isConsultant = sessionClaims?.metadata?.role === "consultant";
  
  
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const timeline = useQuery(api.orders.getOrderTimeline, {
    orderId: order._id,
  });
  const hasAssignment = !!order.currentAssignedStaffId;
  const availableStaff = staff?.filter((s) => s.availability === "available");

  const handleAssignClick = async () => {
    if (!selectedStaffId) return;
    setIsAssigning(true);
    try {
      await onAssign(order._id, selectedStaffId as Id<"staff">);
      setSelectedStaffId("");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleCompleteClick = async () => {
    setIsCompleting(true);
    try {
      await onComplete(order._id);
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05 }}>
      <Card className=' hover:border-cyan-500/50 transition-all backdrop-blur-sm'>
        <CardHeader className='pb-3'>
          <div className='flex items-start justify-between gap-3'>
            <div>
              <h3 className='text-lg font-bold'>{order.name}</h3>
              <p className='text-xs text-muted-foreground font-mono'>
                {order.orderNumber}
              </p>
              <p className='text-sm text-muted-foreground mt-1'>
                {order.garmentType}
              </p>
            </div>
            <Badge
              className={`bg-${stageColor}-500/0 text-${stageColor}-300 border-${stageColor}-600/30`}>
              {order.progress}%
            </Badge>
          </div>
        </CardHeader>

        <CardContent className='space-y-3'>
          <Progress value={order.progress} className='h-2' />

          {/* Staff History */}
          {timeline && timeline.timeline.length > 0 && (
            <div className='space-y-2'>
              <p className='text-xs text-muted-foreground uppercase tracking-wider'>
                Staff History
              </p>
              <div className='flex flex-wrap gap-2'>
                {timeline.timeline.map((stage, i) => (
                  <div
                    key={i}
                    className='flex items-center gap-2 rounded-lg px-3 py-1.5 border'>
                    <div>
                      <p className='text-xs text-muted-foreground font-medium'>
                        {stage.staffName}
                      </p>
                      <p className='text-[10px] text-mutedforeground'>
                        {stage.stage}
                      </p>
                    </div>
                    {stage.status === "completed" && (
                      <CheckCircle2 className='w-3 h-3 text-green-400' />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assignment Section */}
          {(isAdmin ||isConsultant) &&
            <div>
              {!hasAssignment ? (
                <div className='space-y-2'>
                  <Select
                    value={selectedStaffId}
                    onValueChange={setSelectedStaffId}>
                    <SelectTrigger className=''>
                      <SelectValue placeholder='Select staff member...' />
                    </SelectTrigger>
                    <SelectContent className=''>
                      {availableStaff?.map((s) => (
                        <SelectItem key={s._id} value={s._id}>
                          <div className='flex items-center gap-2'>
                            <div className='w-2 h-2 bg-green-400 rounded-full' />
                            {s.name}
                          </div>
                        </SelectItem>
                      ))}
                      {staff
                        ?.filter((s) => s.availability === "busy")
                        .map((s) => (
                          <SelectItem key={s._id} value={s._id} disabled>
                            <div className='flex items-center gap-2 opacity-50'>
                              <div className='w-2 h-2 bg-red-400 rounded-full' />
                              {s.name} (Busy)
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  <Button
                    onClick={handleAssignClick}
                    disabled={!selectedStaffId || isAssigning}
                    className='w-full bg-cyan-500 hover:bg-cyan-600'>
                    {isAssigning ? "Assigning..." : "Assign Staff"}
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleCompleteClick}
                  disabled={isCompleting}
                  className='w-full bg-green-500 hover:bg-green-600'>
                  <CheckCircle2 className='w-4 h-4 mr-2' />
                  {isCompleting ? "Completing..." : "Mark as Complete"}
                </Button>
              )}
            </div>
          }
        </CardContent>
      </Card>
    </motion.div>
  );
}

function StaffCard({
  staff,
  index,
  color,
}: {
  staff: Staff;
  index: number;
  color: string;
}) {
  const workload = useQuery(api.staff.getStaffWorkload, { staffId: staff._id });
  const isBusy = staff.availability === "busy";

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}>
      <Card
        className={` transition-all py-0 ${
          isBusy ? "border-red-500/30" : "border-green-500/30"
        }`}>
        <CardContent className='p-4'>
          <div className='flex items-start gap-3'>
            <Avatar className='w-10 h-10'>
              <AvatarFallback
                className={`bg-gradient-to-br from-${color}-500 to-purple-500 text-lg`}>
                {staff.name.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className='flex-1 min-w-0'>
              <div className='flex items-center gap-2 mb-1'>
                <h3 className='text-sm font-semibold truncate'>
                  {staff.name}
                </h3>
                <div
                  className={`w-2 h-2 rounded-full ${isBusy ? "bg-red-400" : "bg-green-400"} animate-pulse`}
                />
              </div>

              <Badge
                className={`text-xs mb-2 ${
                  isBusy
                    ? "bg-red-500/10 text-red-500 border-red-500/20"
                    : "bg-green-500/10 text-green-500 border-green-500/20"
                }`}>
                {isBusy ? "BUSY" : "AVAILABLE"}
              </Badge>

              {staff.currentAssignment && (
                <div className=' rounded p-2 border mt-2'>
                  <p className='text-xs text-muted-forground'>Working on:</p>
                  <p className='text-xs text-blue-400 font-mono'>
                    {staff.currentAssignment.orderNumber}
                  </p>
                </div>
              )}

              {workload && (
                <div className='mt-2 text-xs text-muted-forground'>
                  <p>Completed: {workload.statistics.totalCompleted} orders</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Loading Skeleton Components
function OrderSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-slate-700 rounded w-3/4"></div>
            <div className="h-3 bg-slate-800 rounded w-1/2"></div>
            <div className="h-4 bg-slate-800 rounded w-2/3"></div>
          </div>
          <div className="h-6 w-12 bg-slate-700 rounded"></div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-2 bg-slate-700 rounded w-full"></div>
        <div className="space-y-2">
          <div className="h-3 bg-slate-800 rounded w-1/4"></div>
          <div className="flex gap-2">
            <div className="h-10 bg-slate-800 rounded w-1/3"></div>
            <div className="h-10 bg-slate-800 rounded w-1/3"></div>
          </div>
        </div>
        <div className="h-10 bg-slate-700 rounded w-full"></div>
      </CardContent>
    </Card>
  );
}

function StaffSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-slate-700 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-4 bg-slate-700 rounded w-24"></div>
              <div className="w-2 h-2 bg-slate-700 rounded-full"></div>
            </div>
            <div className="h-5 bg-slate-800 rounded w-16"></div>
            <div className="h-8 bg-slate-800 rounded w-full"></div>
            <div className="h-3 bg-slate-800 rounded w-3/4"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}