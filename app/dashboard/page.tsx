"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { motion } from "framer-motion";
import {
  Package,
  Users,
  CheckCircle2,
  Clock,
  Scissors,
  Sparkles,
  User,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";

type Order = Doc<"orders">;
type Staff = Doc<"staff"> & {
  availability: "available" | "busy";
  currentAssignment?: {
    orderId: string;
    orderNumber: string;
    stage: string;
  };
};

type StaffRole = "tailor" | "beader" | "fitter" | "qc";

export default function DashboardPage() {
  const stats = useQuery(api.orders.getDashboardStats);
  const recentOrders = useQuery(api.orders.getActiveOrders);
  const allStaff = useQuery(api.staff.getAllStaff);

  // Get recent orders (last 5)
  const displayOrders = recentOrders?.slice(0, 5) || [];

  // Get busy staff
  const busyStaff =
    allStaff?.filter((s) => s.availability === "busy").slice(0, 4) || [];

  return (
    <div className='min-h-screen lg:ml-16'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-6 md:mb-8'>
          <h1 className='text-4xl font-medium mb-2'>DASHBOARD</h1>
          <p className='text-muted-foreground text-sm'>
            Overview of your tailoring operations
          </p>
        </motion.div>

        {/* Main Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className='grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8'>
          <StatsCard
            title='Total Orders'
            value={stats?.orders.total || 0}
            icon={<Package className='w-5 h-5' />}
            color='blue'
            trend='+12%'
          />
          <StatsCard
            title='Active Orders'
            value={stats?.orders.active || 0}
            icon={<Clock className='w-5 h-5' />}
            color='cyan'
            trend='+5%'
          />
          <StatsCard
            title='Total Staff'
            value={stats?.staff.total || 0}
            icon={<Users className='w-5 h-5' />}
            color='purple'
            trend='+2'
          />
          <StatsCard
            title='Available Staff'
            value={stats?.staff.available || 0}
            icon={<CheckCircle2 className='w-5 h-5' />}
            color='green'
            trend={`${stats?.staff.available || 0}/${stats?.staff.total || 0}`}
          />
        </motion.div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6'>
          {/* Workflow Stages */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className='lg:col-span-2'>
            <Card className='h-full'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Sparkles className='w-5 h-5 text-cyan-500' />
                  Workflow Pipeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <WorkflowStage
                    name='Pending'
                    count={stats?.orders.byStage.pending || 0}
                    color='slate'
                    icon='⏸️'
                  />
                  <WorkflowStage
                    name='Tailoring'
                    count={stats?.orders.byStage.tailoring || 0}
                    color='cyan'
                    icon='✂️'
                  />
                  <WorkflowStage
                    name='Beading'
                    count={stats?.orders.byStage.beading || 0}
                    color='purple'
                    icon='💎'
                  />
                  <WorkflowStage
                    name='Fitting'
                    count={stats?.orders.byStage.fitting || 0}
                    color='pink'
                    icon='📏'
                  />
                  <WorkflowStage
                    name='Quality Control'
                    count={stats?.orders.byStage.qc || 0}
                    color='green'
                    icon='✓'
                  />
                  <WorkflowStage
                    name='Completed'
                    count={stats?.orders.byStage.completed || 0}
                    color='blue'
                    icon='✓'
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Staff by Role */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}>
            <Card className='h-full'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Users className='w-5 h-5 text-purple-500' />
                  Staff Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <StaffRoleItem
                    role='Tailors'
                    count={stats?.staff.byRole.tailor || 0}
                    icon={<Scissors className='w-4 h-4' />}
                    color='cyan'
                  />
                  <StaffRoleItem
                    role='Beaders'
                    count={stats?.staff.byRole.beader || 0}
                    icon={<Sparkles className='w-4 h-4' />}
                    color='purple'
                  />
                  <StaffRoleItem
                    role='Fitters'
                    count={stats?.staff.byRole.fitter || 0}
                    icon={<User className='w-4 h-4' />}
                    color='pink'
                  />
                  <StaffRoleItem
                    role='QC'
                    count={stats?.staff.byRole.qc || 0}
                    icon={<ShieldCheck className='w-4 h-4' />}
                    color='green'
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6'>
          {/* Recent Orders */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between'>
                <CardTitle className='flex items-center gap-2'>
                  <Package className='w-5 h-5 text-cyan-500' />
                  Recent Orders
                </CardTitle>
                <Link
                  href='/dashboard/orders'
                  className='text-xs text-cyan-500 hover:text-cyan-600 dark:hover:text-cyan-400 flex items-center gap-1'>
                  View all
                  <ArrowRight className='w-3 h-3' />
                </Link>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {displayOrders.length === 0 ? (
                    <div className='text-center py-8 text-muted-foreground'>
                      <Package className='w-12 h-12 mx-auto mb-2 opacity-50' />
                      <p className='text-sm'>No recent orders</p>
                    </div>
                  ) : (
                    displayOrders.map((order) => (
                      <OrderItem key={order._id} order={order} />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Active Staff */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between'>
                <CardTitle className='flex items-center gap-2'>
                  <Users className='w-5 h-5 text-purple-500' />
                  Staff Working Now
                </CardTitle>
                <Link
                  href='/dashboard/staff'
                  className='text-xs text-cyan-500 hover:text-cyan-600 dark:hover:text-cyan-400 flex items-center gap-1'>
                  View all
                  <ArrowRight className='w-3 h-3' />
                </Link>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {busyStaff.length === 0 ? (
                    <div className='text-center py-8 text-muted-foreground'>
                      <Users className='w-12 h-12 mx-auto mb-2 opacity-50' />
                      <p className='text-sm'>No staff currently working</p>
                    </div>
                  ) : (
                    busyStaff.map((staff) => (
                      <StaffItem key={staff._id} staff={staff} />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function StatsCard({
  title,
  value,
  icon,
  color,
  trend,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: "blue" | "cyan" | "purple" | "green";
  trend: string;
}) {
  const colorClasses: Record<
    typeof color,
    { card: string; icon: string; badge: string }
  > = {
    blue: {
      card: "border-blue-200 dark:border-blue-900",
      icon: "text-blue-600 dark:text-blue-400",
      badge: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    },
    cyan: {
      card: "border-cyan-200 dark:border-cyan-900",
      icon: "text-cyan-600 dark:text-cyan-400",
      badge: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300",
    },
    purple: {
      card: "border-purple-200 dark:border-purple-900",
      icon: "text-purple-600 dark:text-purple-400",
      badge:
        "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
    },
    green: {
      card: "border-green-200 dark:border-green-900",
      icon: "text-green-600 dark:text-green-400",
      badge:
        "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
    },
  };

  const classes = colorClasses[color];

  return (
    <Card className={`${classes.card}`}>
      <CardContent className='p-4 sm:p-6'>
        <div className='flex items-center justify-between mb-2'>
          <div className={classes.icon}>{icon}</div>
          <Badge className={`${classes.badge} text-xs border-0`}>{trend}</Badge>
        </div>
        <div className='text-2xl sm:text-3xl font-bold mb-1'>{value}</div>
        <div className='text-xs sm:text-sm text-muted-foreground uppercase tracking-wider'>
          {title}
        </div>
      </CardContent>
    </Card>
  );
}

function WorkflowStage({
  name,
  count,
  color,
  icon,
}: {
  name: string;
  count: number;
  color: "slate" | "cyan" | "purple" | "pink" | "green" | "blue";
  icon: string;
}) {
  const colorClasses: Record<typeof color, string> = {
    slate: "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300",
    cyan: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300",
    purple:
      "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
    pink: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300",
    green: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  };

  return (
    <div className='flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors'>
      <div className='flex items-center gap-3'>
        <span className='text-xl'>{icon}</span>
        <span className='text-sm font-medium'>{name}</span>
      </div>
      <Badge className={`${colorClasses[color]} border-0`}>{count}</Badge>
    </div>
  );
}

function StaffRoleItem({
  role,
  count,
  icon,
  color,
}: {
  role: string;
  count: number;
  icon: React.ReactNode;
  color: "cyan" | "purple" | "pink" | "green";
}) {
  const colorClasses: Record<typeof color, string> = {
    cyan: "text-cyan-600 dark:text-cyan-400",
    purple: "text-purple-600 dark:text-purple-400",
    pink: "text-pink-600 dark:text-pink-400",
    green: "text-green-600 dark:text-green-400",
  };

  return (
    <div className='flex items-center justify-between'>
      <div className='flex items-center gap-2'>
        <div className={colorClasses[color]}>{icon}</div>
        <span className='text-sm text-muted-foreground'>{role}</span>
      </div>
      <span className='text-lg font-bold'>{count}</span>
    </div>
  );
}

function OrderItem({ order }: { order: Order }) {
  const getStatusColor = (): string => {
    if (order.workflowStage === "completed")
      return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
    if (order.currentlyAssignedTo)
      return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300";
    return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300";
  };

  return (
    <div className='flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent transition-colors'>
      <div className='flex-1 min-w-0'>
        <p className='text-sm font-medium truncate'>{order.name}</p>
        <p className='text-xs text-muted-foreground font-mono'>
          {order.orderNumber}
        </p>
      </div>
      <div className='flex items-center gap-2'>
        <Badge className={`${getStatusColor()} border-0 text-xs`}>
          {order.workflowStage}
        </Badge>
        <div className='text-xs font-bold text-cyan-600 dark:text-cyan-400'>
          {order.progress}%
        </div>
      </div>
    </div>
  );
}

function StaffItem({ staff }: { staff: Staff }) {
  const roleEmoji: Record<StaffRole, string> = {
    tailor: "✂️",
    beader: "💎",
    fitter: "📏",
    qc: "✓",
  };

  return (
    <div className='flex items-center gap-3 p-3 rounded-lg border bg-card'>
      <Avatar className='w-10 h-10'>
        <AvatarFallback className='bg-gradient-to-br from-cyan-500 to-purple-500 text-white text-sm'>
          {staff.name.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div className='flex-1 min-w-0'>
        <p className='text-sm font-medium truncate'>{staff.name}</p>
        <div className='flex items-center gap-2 mt-1'>
          <span className='text-xs'>{roleEmoji[staff.role as StaffRole]}</span>
          <span className='text-xs text-muted-foreground capitalize'>
            {staff.role}
          </span>
        </div>
      </div>
      <div className='flex items-center gap-1'>
        <div className='w-2 h-2 bg-red-500 dark:bg-red-400 rounded-full animate-pulse' />
        <span className='text-xs text-red-600 dark:text-red-400 font-medium'>
          Busy
        </span>
      </div>
    </div>
  );
}
