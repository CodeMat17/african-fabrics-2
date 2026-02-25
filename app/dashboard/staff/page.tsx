"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Users,
  UserPlus,
  CheckCircle2,
  Clock,
  TrendingUp,
  MoreVertical,
  Edit,
  Trash2,
  Loader,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AddStaffSheet from "@/components/dashboard/staff/AddStaffSheet";
import UpdateStaffSheet from "@/components/dashboard/staff/UpdateStaffSheet";
import DeleteStaffSheet from "@/components/dashboard/staff/DeleteStaffSheet";
import { useAuth } from "@clerk/nextjs";

type Staff = Doc<"staff"> & {
  availability: "available" | "busy";
  totalCompleted: number;
  avgCompletionTimeHours: number;
  currentAssignment?: {
    orderId: string;
    orderNumber: string;
    stage: string;
  };
};

type FilterType = "all" | "tailor" | "beader" | "fitter" | "qc";

const ROLE_CONFIG = {
  tailor: { label: "Tailor", color: "cyan", icon: "✂️" },
  beader: { label: "Beader", color: "purple", icon: "💎" },
  fitter: { label: "Fitter", color: "pink", icon: "📏" },
  qc: { label: "QC", color: "green", icon: "✓" },
} as const;

export default function StaffPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);

  // ✅ FIX: Pass empty object
  const allStaff = useQuery(api.staff.getAllStaff, {});

  const filteredStaff = useMemo(() => {
    if (!allStaff) return [];

    let filtered = allStaff;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((staff) =>
        staff.name.toLowerCase().includes(query),
      );
    }

    if (filterType !== "all") {
      filtered = filtered.filter((staff) => staff.role === filterType);
    }

    return filtered;
  }, [allStaff, searchQuery, filterType]);

  const stats = useMemo(() => {
    if (!allStaff) {
      return {
        total: 0,
        available: 0,
        busy: 0,
        byRole: { tailor: 0, beader: 0, fitter: 0, qc: 0 },
      };
    }

    const available = allStaff.filter(
      (s) => s.availability === "available",
    ).length;
    const busy = allStaff.filter((s) => s.availability === "busy").length;

    const byRole = {
      tailor: allStaff.filter((s) => s.role === "tailor").length,
      beader: allStaff.filter((s) => s.role === "beader").length,
      fitter: allStaff.filter((s) => s.role === "fitter").length,
      qc: allStaff.filter((s) => s.role === "qc").length,
    };

    return { total: allStaff.length, available, busy, byRole };
  }, [allStaff]);


  return (
    <div className='min-h-screen lg:ml-16'>

      {allStaff === undefined ? <div className="flex items-center justify-center px-4 py-32"><Loader className="w-6 h-6 mr-3 animate-spin" /> Loading staff data...</div> :
        <div className='max-w-7xl mx-auto'>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className='mb-6 md:mb-8'>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4'>
              <div>
                <h1 className='text-4xl font-semibold mb-2'>STAFF</h1>
                <p className='text-muted-foreground text-sm'>
                  {filteredStaff.length} staff members
                </p>
              </div>
              <Button
                onClick={() => setIsAddStaffOpen(true)}
                className='w-full sm:w-auto'>
                <UserPlus className='w-4 h-4 mr-2' />
                Add Staff
              </Button>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className='grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 mb-6'>
              <StatsCard
                label='Total Staff'
                value={stats.total}
                color='blue'
                icon={<Users className='w-5 h-5' />}
              />
              <StatsCard
                label='Available'
                value={stats.available}
                color='green'
                icon={<CheckCircle2 className='w-5 h-5' />}
              />
              <StatsCard
                label='Busy'
                value={stats.busy}
                color='red'
                icon={<Clock className='w-5 h-5' />}
              />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className='grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
              <Input
                placeholder='Search staff by name...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-10'
              />
            </div>

            <Select
              value={filterType}
              onValueChange={(value: FilterType) => setFilterType(value)}>
              <SelectTrigger>
                <div className='flex items-center gap-2'>
                  <Filter className='w-4 h-4' />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Roles</SelectItem>
                <SelectItem value='tailor'>Tailors</SelectItem>
                <SelectItem value='beader'>Beaders</SelectItem>
                <SelectItem value='fitter'>Fitters</SelectItem>
                <SelectItem value='qc'>Quality Control</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>

            <motion.div
              layout
              className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4'>
              <AnimatePresence mode='popLayout'>
                {filteredStaff.map((staff, idx) => (
                  <StaffCard key={staff._id} staff={staff} index={idx} />
                ))}
              </AnimatePresence>
            </motion.div>
          

          {filteredStaff.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className='text-center py-20'>
              <Users className='w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50' />
              <p className='text-muted-foreground'>No staff members found</p>
            </motion.div>
          )}
        </div>
      }

      <AddStaffSheet open={isAddStaffOpen} onOpenChange={setIsAddStaffOpen} />
    </div>
  );
}

function StatsCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: "blue" | "green" | "red" | "cyan";
  icon: React.ReactNode;
}) {
  const colorClasses: Record<
    typeof color,
    { card: string; icon: string; value: string }
  > = {
    blue: {
      card: "border-blue-200 dark:border-blue-900",
      icon: "text-blue-600 dark:text-blue-400",
      value: "text-blue-600 dark:text-blue-400",
    },
    green: {
      card: "border-green-200 dark:border-green-900",
      icon: "text-green-600 dark:text-green-400",
      value: "text-green-600 dark:text-green-400",
    },
    red: {
      card: "border-red-200 dark:border-red-900",
      icon: "text-red-600 dark:text-red-400",
      value: "text-red-600 dark:text-red-400",
    },
    cyan: {
      card: "border-cyan-200 dark:border-cyan-900",
      icon: "text-cyan-600 dark:text-cyan-400",
      value: "text-cyan-600 dark:text-cyan-400",
    },
  };

  const classes = colorClasses[color];

  return (
    <Card className={`${classes.card} py-0`}>
      <CardContent className='p-4 sm:p-6'>
        <div className='flex items-center justify-between mb-2'>
          <div className={classes.icon}>{icon}</div>
          <TrendingUp className='w-4 h-4 text-muted-foreground' />
        </div>
        <div className={`text-2xl sm:text-3xl font-bold mb-1 ${classes.value}`}>
          {value}
        </div>
        <div className='text-xs sm:text-sm text-muted-foreground uppercase tracking-wider'>
          {label}
        </div>
      </CardContent>
    </Card>
  );
}

function StaffCard({ staff, index }: { staff: Staff; index: number }) {

 const { sessionClaims } = useAuth();
  const isAdmin = sessionClaims?.metadata?.role === "admin";
  const isConsultant = sessionClaims?.metadata?.role === "consultant";

  const [updateOpen, setUpdateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isBusy = staff.availability === "busy";
  const roleConfig = ROLE_CONFIG[staff.role as keyof typeof ROLE_CONFIG];

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        transition={{
          delay: index * 0.05,
          type: "spring",
          stiffness: 260,
          damping: 20,
        }}
        whileHover={{ scale: 1.02, y: -4 }}
        className='group'>
        <Card
          className={`transition-all overflow-hidden ${
            isBusy
              ? "border-red-200 dark:border-red-900 hover:border-red-300 dark:hover:border-red-800"
              : "border-green-200 dark:border-green-900 hover:border-green-300 dark:hover:border-green-800"
          }`}>
          <CardHeader className='pb-3'>
            <div className='flex items-start justify-between gap-2 mb-3'>
              <div className='flex items-start gap-3 flex-1 min-w-0'>
                <Avatar className='w-12 h-12 sm:w-14 sm:h-14'>
                  <AvatarFallback className='bg-gradient-to-br from-cyan-500 to-purple-500 text-white text-lg font-bold'>
                    {staff.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <div className='flex-1 min-w-0'>
                  <div className='flex items-start justify-between gap-2 mb-2'>
                    <h3 className='text-base sm:text-lg font-semibold truncate'>
                      {staff.name}
                    </h3>
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isBusy
                          ? "bg-red-500 dark:bg-red-400"
                          : "bg-green-500 dark:bg-green-400"
                      } animate-pulse shrink-0 mt-1`}
                    />
                  </div>

                  <div className='flex flex-wrap gap-2 mb-2'>
                    <Badge className='text-xs'>
                      <span className='mr-1'>{roleConfig?.icon}</span>
                      {roleConfig?.label}
                    </Badge>
                    <Badge
                      className={`text-xs ${
                        isBusy
                          ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-900"
                          : "bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-900"
                      }`}>
                      {isBusy ? "BUSY" : "AVAILABLE"}
                    </Badge>
                  </div>

                  <p className='text-xs text-muted-foreground truncate'>
                    {staff.phone}
                  </p>
                </div>
              </div>

              
              {
                (isAdmin || isConsultant) &&
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-8 w-8 shrink-0'>
                      <MoreVertical className='h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem onClick={() => setUpdateOpen(true)}>
                      <Edit className='mr-2 h-4 w-4' />
                      Update
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setDeleteOpen(true)}
                      className='text-red-600 focus:text-red-600'>
                      <Trash2 className='mr-2 h-4 w-4' />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              }
            </div>
          </CardHeader>

          <CardContent className='space-y-3'>
            {staff.currentAssignment && (
              <div className='bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-lg p-3'>
                <p className='text-xs text-red-700 dark:text-red-300 font-medium mb-1'>
                  Currently Working On:
                </p>
                <p className='text-xs text-muted-foreground font-mono'>
                  {staff.currentAssignment.orderNumber}
                </p>
                <p className='text-xs text-muted-foreground mt-1 capitalize'>
                  Stage: {staff.currentAssignment.stage}
                </p>
              </div>
            )}

            {staff.totalCompleted > 0 && (
              <div className='grid grid-cols-2 gap-3 pt-3 border-t'>
                <div>
                  <p className='text-xs text-muted-foreground mb-1'>
                    Completed
                  </p>
                  <p className='text-lg font-bold text-cyan-600 dark:text-cyan-400'>
                    {staff.totalCompleted}
                  </p>
                </div>
                <div>
                  <p className='text-xs text-muted-foreground mb-1'>Avg Time</p>
                  <p className='text-lg font-bold text-purple-600 dark:text-purple-400'>
                    {staff.avgCompletionTimeHours.toFixed(1)}h
                  </p>
                </div>
              </div>
            )}

            {!isBusy && (
              <div className='flex items-center gap-2 text-xs text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900 rounded-lg p-2'>
                <CheckCircle2 className='w-3 h-3' />
                <span>Ready for assignment</span>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <UpdateStaffSheet
        staff={staff}
        open={updateOpen}
        onOpenChange={setUpdateOpen}
      />
      <DeleteStaffSheet
        staff={staff}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}
