"use client";

import { useState, useMemo, useCallback, memo, useDeferredValue, useTransition } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import {
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  User,
  Search,
  X,
  ChevronDown,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";

type Order = Doc<"orders">;
type Staff = Doc<"staff"> & {
  availability: "available" | "busy";
  totalCompleted: number;
  currentAssignment?: {
    orderId: Id<"orders">;
    orderNumber: string;
    stage: string;
  };
};

type StageType = "tailoring" | "beading" | "fitting" | "qc";

const STAGE_CONFIG = {
  tailoring: {
    role: "tailor",
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    textColor: "text-blue-700 dark:text-blue-300",
    icon: Sparkles,
    label: "Tailoring",
  },
  beading: {
    role: "beader",
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    textColor: "text-purple-700 dark:text-purple-300",
    icon: Zap,
    label: "Beading",
  },
  fitting: {
    role: "fitter",
    color: "from-pink-500 to-pink-600",
    bgColor: "bg-pink-50 dark:bg-pink-950/30",
    textColor: "text-pink-700 dark:text-pink-300",
    icon: User,
    label: "Fitting",
  },
  qc: {
    role: "qc",
    color: "from-green-500 to-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    textColor: "text-green-700 dark:text-green-300",
    icon: CheckCircle2,
    label: "QC",
  },
} as const;

export default function WorkflowPage() {
  const [selectedStage, setSelectedStage] = useState<StageType>("tailoring");
  const [searchQuery, setSearchQuery] = useState("");
  const [staffSheetOpen, setStaffSheetOpen] = useState(false);
  const [isStageTransitioning, startStageTransition] = useTransition();

  // Defers the filter computation so the input stays responsive
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const isSearchStale = searchQuery !== deferredSearchQuery;

  // ✅ Optimized queries
  const orders = useQuery(api.orders.getActiveOrders);
  const allStaff = useQuery(api.staff.getStaffForWorkflow, {});

  const assignStaff = useMutation(api.orders.assignStaffToOrder);
  const completeStage = useMutation(api.orders.completeCurrentStage);

  const { sessionClaims } = useAuth();
  const canManage =
    sessionClaims?.metadata?.role === "admin" ||
    sessionClaims?.metadata?.role === "consultant";

  // ✅ FIXED: Single optimized computation - NO transitions, instant updates
  const workflowData = useMemo(() => {
    if (!orders || !allStaff) {
      return {
        stageOrders: [],
        stageCounts: { tailoring: 0, beading: 0, fitting: 0, qc: 0 },
        stageStaff: [],
        availableStaff: [],
      };
    }

    const counts = { tailoring: 0, beading: 0, fitting: 0, qc: 0 };
    const ordersByStage: Record<StageType, Order[]> = {
      tailoring: [],
      beading: [],
      fitting: [],
      qc: [],
    };

    // Single pass through orders
    for (const order of orders) {
      const stage =
        order.workflowStage === "pending" ? "tailoring" : order.workflowStage;

      if (stage in counts) {
        counts[stage as StageType]++;
        ordersByStage[stage as StageType].push(order);
      }
    }

    // Filter staff for current stage
    const stageRole = STAGE_CONFIG[selectedStage].role;
    const stageStaff = allStaff.filter(
      (s) => s.role === stageRole && s.isActive,
    );
    const availableStaff = stageStaff.filter(
      (s) => s.availability === "available",
    );

    return {
      stageOrders: ordersByStage[selectedStage],
      stageCounts: counts,
      stageStaff,
      availableStaff,
    };
  }, [orders, allStaff, selectedStage]);

  const filteredOrders = useMemo(() => {
    if (!deferredSearchQuery.trim()) return workflowData.stageOrders;
    const query = deferredSearchQuery.toLowerCase();
    return workflowData.stageOrders.filter(
      (order) =>
        order.name.toLowerCase().includes(query) ||
        order.orderNumber.toLowerCase().includes(query),
    );
  }, [workflowData.stageOrders, deferredSearchQuery]);

  const handleStageChange = useCallback((stage: StageType) => {
    startStageTransition(() => {
      setSelectedStage(stage);
      setSearchQuery("");
    });
  }, []);

  const handleAssign = useCallback(
    async (orderId: Id<"orders">, staffId: Id<"staff">) => {
      try {
        await assignStaff({ orderId, staffId });
        toast.success("Staff assigned successfully");
      } catch (error) {
        toast.error("Failed to assign staff", {
          description: (error as Error).message,
        });
      }
    },
    [assignStaff],
  );

  const handleComplete = useCallback(
    async (orderId: Id<"orders">) => {
      try {
        const result = await completeStage({ orderId });
        toast.success(`Stage completed! Order moved to ${result.nextStage}`);
      } catch (error) {
        toast.error("Failed to complete stage", {
          description: (error as Error).message,
        });
      }
    },
    [completeStage],
  );

  const config = STAGE_CONFIG[selectedStage];
  const isLoading = orders === undefined || allStaff === undefined;

  return (
    <div className='min-h-screen lg:ml-16'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='mb-6'>
          <h1 className='text-3xl md:text-4xl font-bold mb-2'>Workflow</h1>
          <p className='text-sm text-muted-foreground'>
            Manage orders through production stages
          </p>
        </div>

        {/* Stage Tabs — 2×2 grid on mobile, horizontal row on sm+ */}
        <div className='mb-6'>
          <div className='grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:gap-2 sm:overflow-x-auto sm:pb-2 scrollbar-hide'>
            {(
              Object.entries(STAGE_CONFIG) as [
                StageType,
                (typeof STAGE_CONFIG)[StageType],
              ][]
            ).map(([stage, cfg]) => {
              const isActive = selectedStage === stage;
              const Icon = cfg.icon;
              const count = workflowData.stageCounts[stage];

              return (
                <button
                  key={stage}
                  onClick={() => handleStageChange(stage)}
                  disabled={isStageTransitioning}
                  className={`
                    flex items-center justify-between gap-2 px-3 py-3 rounded-xl
                    transition-all duration-200 text-sm font-medium
                    sm:whitespace-nowrap sm:justify-start sm:px-4 sm:py-2.5 sm:rounded-lg
                    ${
                      isActive
                        ? `bg-gradient-to-r ${cfg.color} text-white shadow-lg sm:scale-105`
                        : "bg-card hover:bg-accent border"
                    }
                    ${isStageTransitioning ? "opacity-60 cursor-wait" : ""}
                  `}>
                  <div className='flex items-center gap-2'>
                    <Icon className='w-4 h-4 shrink-0' />
                    <span>{cfg.label}</span>
                  </div>
                  <Badge
                    variant={isActive ? "secondary" : "outline"}
                    className='shrink-0 sm:ml-1'>
                    {count}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>

        {isLoading ? (
          <LoadingState />
        ) : (
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6'>
            {/* Orders Column */}
            <div className='lg:col-span-2 space-y-4'>
              {/* Search + Staff button row */}
              <div className='flex gap-2'>
                <div className='relative flex-1'>
                  <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
                  <Input
                    type='text'
                    placeholder='Search by name or order number...'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className='pl-10 pr-10 h-11'
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'>
                      <X className='w-4 h-4' />
                    </button>
                  )}
                </div>

                {/* Mobile Staff Button */}
                <Sheet open={staffSheetOpen} onOpenChange={setStaffSheetOpen}>
                  <SheetTrigger asChild>
                    <Button variant='outline' className='lg:hidden h-11 px-3 shrink-0'>
                      <Users className='w-4 h-4' />
                      <span className='ml-2 hidden sm:inline'>
                        Staff ({workflowData.availableStaff.length})
                      </span>
                      <Badge variant='secondary' className='ml-2 sm:hidden'>
                        {workflowData.availableStaff.length}
                      </Badge>
                      <ChevronDown className='w-3.5 h-3.5 ml-1' />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side='bottom' className='h-[85vh] px-4'>
                    <SheetHeader className='mb-4'>
                      <SheetTitle className='flex items-center gap-2'>
                        <Users className='w-5 h-5' />
                        {config.label} Staff
                      </SheetTitle>
                    </SheetHeader>
                    <div className='space-y-3 overflow-y-auto max-h-[calc(85vh-100px)] pr-2'>
                      {workflowData.stageStaff.length === 0 ? (
                        <EmptyStaffState />
                      ) : (
                        workflowData.stageStaff.map((member) => (
                          <StaffCard key={member._id} staff={member} />
                        ))
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Results Summary */}
              {searchQuery && (
                <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                  <Search className='w-4 h-4' />
                  <span>
                    {isSearchStale ? (
                      <Loader2 className='w-3 h-3 inline animate-spin mr-1' />
                    ) : null}
                    {filteredOrders.length}{" "}
                    {filteredOrders.length === 1 ? "order" : "orders"} found
                  </span>
                </div>
              )}

              {/* Orders Grid */}
              {filteredOrders.length === 0 && !isSearchStale ? (
                <EmptyState
                  hasSearch={!!deferredSearchQuery}
                  onClearSearch={() => setSearchQuery("")}
                  stageName={config.label}
                />
              ) : (
                <div
                  className={`grid gap-4 md:grid-cols-2 transition-opacity duration-150 ${
                    isSearchStale || isStageTransitioning ? "opacity-50" : "opacity-100"
                  }`}>
                  {filteredOrders.map((order) => (
                    <OrderCard
                      key={order._id}
                      order={order}
                      availableStaff={workflowData.availableStaff}
                      canManage={canManage}
                      onAssign={handleAssign}
                      onComplete={handleComplete}
                      stageConfig={config}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Desktop Staff Column */}
            <div className='hidden lg:block space-y-4'>
              <div className='flex items-center justify-between'>
                <h2 className='text-lg font-semibold flex items-center gap-2'>
                  <Users className='w-5 h-5' />
                  {config.label} Staff
                </h2>
                <Badge variant='secondary'>
                  {workflowData.availableStaff.length} available
                </Badge>
              </div>
              <div className='space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-2'>
                {workflowData.stageStaff.length === 0 ? (
                  <EmptyStaffState />
                ) : (
                  workflowData.stageStaff.map((member) => (
                    <StaffCard key={member._id} staff={member} />
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// ORDER CARD COMPONENT
// ============================================
const OrderCard = memo(function OrderCard({
  order,
  availableStaff,
  canManage,
  onAssign,
  onComplete,
  stageConfig,
}: {
  order: Order;
  availableStaff: Staff[];
  canManage: boolean;
  onAssign: (orderId: Id<"orders">, staffId: Id<"staff">) => Promise<void>;
  onComplete: (orderId: Id<"orders">) => Promise<void>;
  stageConfig: (typeof STAGE_CONFIG)[StageType];
}) {
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const hasAssignment = !!order.currentlyAssignedTo;

  // Build work history
  const workHistory = useMemo(() => {
    const history = [];
    if (order.assignedTailor)
      history.push({
        role: "Tailor",
        name: order.assignedTailor.staffName,
        completed: !!order.assignedTailor.completedAt,
      });
    if (order.assignedBeader)
      history.push({
        role: "Beader",
        name: order.assignedBeader.staffName,
        completed: !!order.assignedBeader.completedAt,
      });
    if (order.assignedFitter)
      history.push({
        role: "Fitter",
        name: order.assignedFitter.staffName,
        completed: !!order.assignedFitter.completedAt,
      });
    if (order.assignedQC)
      history.push({
        role: "QC",
        name: order.assignedQC.staffName,
        completed: !!order.assignedQC.completedAt,
      });
    return history;
  }, [order]);

  const handleAssign = async () => {
    if (!selectedStaffId) return;
    setIsAssigning(true);
    try {
      await onAssign(order._id, selectedStaffId as Id<"staff">);
      setSelectedStaffId("");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await onComplete(order._id);
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <Card className='group hover:shadow-md transition-all duration-200 border-2 hover:border-primary/20'>
      <CardHeader className='pb-3 p-4'>
        <div className='flex justify-between items-start gap-3'>
          <div className='flex-1 min-w-0'>
            <h3 className='font-bold truncate text-sm md:text-base group-hover:text-primary transition-colors'>
              {order.name}
            </h3>
            <p className='text-xs text-muted-foreground font-mono mt-0.5'>
              {order.orderNumber}
            </p>
            <p className='text-xs md:text-sm text-muted-foreground mt-1 truncate'>
              {order.garmentType}
            </p>
          </div>
          <Badge variant='secondary' className='text-xs font-semibold shrink-0'>
            {order.progress}%
          </Badge>
        </div>
      </CardHeader>

      <CardContent className='space-y-3 p-4 pt-0'>
        <Progress value={order.progress} className='h-2' />

        {/* Current Assignment */}
        {order.currentlyAssignedTo && (
          <div className={`${stageConfig.bgColor} border rounded-lg p-2.5`}>
            <div className='flex items-center gap-2'>
              <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse' />
              <p className={`text-xs font-medium ${stageConfig.textColor}`}>
                Working: {order.currentlyAssignedTo.staffName}
              </p>
            </div>
          </div>
        )}

        {/* Work History */}
        {workHistory.length > 0 && (
          <div className='space-y-1.5'>
            <p className='text-xs text-muted-foreground font-medium'>
              History:
            </p>
            <div className='space-y-1'>
              {workHistory.map((work, idx) => (
                <div
                  key={idx}
                  className='flex items-center gap-2 text-xs bg-muted/50 rounded px-2 py-1'>
                  <span className='text-muted-foreground font-medium'>
                    {work.role}:
                  </span>
                  <span className='font-medium truncate flex-1'>
                    {work.name}
                  </span>
                  {work.completed && (
                    <CheckCircle2 className='w-3 h-3 text-green-500 shrink-0' />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {canManage && (
          <div className='pt-1'>
            {!hasAssignment ? (
              <div className='space-y-2'>
                <Select
                  value={selectedStaffId}
                  onValueChange={setSelectedStaffId}
                  disabled={isAssigning}>
                  <SelectTrigger className='h-9 text-sm'>
                    <SelectValue placeholder='Select staff member...' />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStaff.length === 0 ? (
                      <div className='p-3 text-center'>
                        <AlertCircle className='w-8 h-8 mx-auto mb-2 text-muted-foreground' />
                        <p className='text-xs text-muted-foreground'>
                          No staff available
                        </p>
                      </div>
                    ) : (
                      availableStaff.map((s) => (
                        <SelectItem key={s._id} value={s._id}>
                          <div className='flex items-center gap-2'>
                            <div className='w-2 h-2 bg-green-500 rounded-full' />
                            {s.name}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleAssign}
                  disabled={!selectedStaffId || isAssigning}
                  className={`w-full h-9 text-sm bg-gradient-to-r ${stageConfig.color}`}
                  size='sm'>
                  {isAssigning ? (
                    <>
                      <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                      Assigning...
                    </>
                  ) : (
                    "Assign Staff"
                  )}
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={isCompleting}
                className={`w-full h-9 text-sm bg-gradient-to-r ${stageConfig.color}`}
                size='sm'>
                {isCompleting ? (
                  <>
                    <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                    Completing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className='w-4 h-4 mr-2' />
                    Complete Stage
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

// ============================================
// STAFF CARD COMPONENT
// ============================================
const StaffCard = memo(function StaffCard({ staff }: { staff: Staff }) {
  const isBusy = staff.availability === "busy";

  return (
    <Card className='transition-all hover:shadow-md'>
      <CardContent className='p-3.5'>
        <div className='flex items-start gap-3'>
          <Avatar className='w-11 h-11 shrink-0'>
            <AvatarFallback
              className={`text-sm font-semibold ${
                isBusy
                  ? "bg-gradient-to-br from-red-500 to-red-600"
                  : "bg-gradient-to-br from-blue-500 to-purple-600"
              } text-white`}>
              {staff.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-2 mb-1.5'>
              <h3 className='text-sm font-semibold truncate'>{staff.name}</h3>
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isBusy ? "bg-red-400 animate-pulse" : "bg-green-400"
                }`}
              />
            </div>

            <Badge
              variant='outline'
              className={`text-xs mb-2 ${
                isBusy
                  ? "border-red-300 text-red-600 dark:border-red-800 dark:text-red-400"
                  : "border-green-300 text-green-600 dark:border-green-800 dark:text-green-400"
              }`}>
              {isBusy ? "Busy" : "Available"}
            </Badge>

            {staff.currentAssignment && (
              <div className='bg-muted/50 rounded p-2 mb-2'>
                <p className='text-xs text-muted-foreground mb-0.5'>
                  Working on:
                </p>
                <p className='text-xs font-mono font-medium truncate'>
                  {staff.currentAssignment.orderNumber}
                </p>
              </div>
            )}

            {staff.totalCompleted > 0 && (
              <div className='flex items-center gap-3 text-xs text-muted-foreground'>
                <span>
                  <span className='font-semibold text-foreground'>
                    {staff.totalCompleted}
                  </span>{" "}
                  completed
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

// ============================================
// LOADING STATE
// ============================================
function LoadingState() {
  return (
    <div className='flex flex-col items-center justify-center py-20'>
      <Loader2 className='w-12 h-12 animate-spin text-primary mb-4' />
      <p className='text-sm text-muted-foreground'>Loading workflow data...</p>
    </div>
  );
}

// ============================================
// EMPTY STATE
// ============================================
function EmptyState({
  hasSearch,
  onClearSearch,
  stageName,
}: {
  hasSearch: boolean;
  onClearSearch: () => void;
  stageName: string;
}) {
  return (
    <div className='text-center py-16 px-4'>
      <div className='mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4'>
        {hasSearch ? (
          <Search className='w-8 h-8 text-muted-foreground' />
        ) : (
          <Clock className='w-8 h-8 text-muted-foreground' />
        )}
      </div>
      <h3 className='text-lg font-semibold mb-2'>
        {hasSearch ? "No orders found" : `No orders in ${stageName}`}
      </h3>
      <p className='text-sm text-muted-foreground mb-4'>
        {hasSearch
          ? "Try adjusting your search terms"
          : `There are no orders currently in the ${stageName.toLowerCase()} stage`}
      </p>
      {hasSearch && (
        <Button onClick={onClearSearch} variant='outline' size='sm'>
          <X className='w-4 h-4 mr-2' />
          Clear search
        </Button>
      )}
    </div>
  );
}

// ============================================
// EMPTY STAFF STATE
// ============================================
function EmptyStaffState() {
  return (
    <div className='text-center py-12'>
      <User className='w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50' />
      <p className='text-sm text-muted-foreground'>No staff in this role</p>
    </div>
  );
}
