"use client";

import { useState, useMemo, useEffect, useDeferredValue } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import {
  Search,
  Filter,
  Clock,
  Package,
  AlertCircle,
  CheckCircle2,
  Loader2,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  User,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import dayjs from "dayjs";
import { toast } from "sonner";
import ViewOrderSheet from "@/components/dashboard/orders/ViewOrderSheet";
import UpdateOrderSheet from "@/components/dashboard/orders/UpdateOrderSheet";
import DeleteOrderSheet from "@/components/dashboard/orders/DeleteOderSheet";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";

type Order = Doc<"orders">;
type FilterType =
  | "all"
  | "unassigned"
  | "tailoring"
  | "beading"
  | "fitting"
  | "qc"
  | "urgent"
  | "overdue"
  | "completed"
  | "collected";

const ITEMS_PER_PAGE = 21;

export default function OrdersPage() {
  const [searchInput, setSearchInput] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  const deferredSearch = useDeferredValue(searchInput);

  const orders = useQuery(api.orders.getOrders);
  const markCollected = useMutation(api.orders.markCollected);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];

    let filtered = orders;

    if (deferredSearch) {
      const query = deferredSearch.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.name.toLowerCase().includes(query) ||
          order.orderNumber.toLowerCase().includes(query),
      );
    }

    const fourDays = 4 * 24 * 60 * 60 * 1000;

    if (filterType !== "all") {
      filtered = filtered.filter((order) => {
        switch (filterType) {
          case "unassigned":
            return !order.currentlyAssignedTo && !order.collected;
          case "tailoring":
            return order.workflowStage === "tailoring" && !order.collected;
          case "beading":
            return order.workflowStage === "beading" && !order.collected;
          case "fitting":
            return order.workflowStage === "fitting" && !order.collected;
          case "qc":
            return order.workflowStage === "qc" && !order.collected;
          case "urgent":
            return (
              order.expectedCollectionDate - currentTime < fourDays &&
              order.expectedCollectionDate > currentTime &&
              !order.collected
            );
          case "overdue":
            return (
              order.expectedCollectionDate < currentTime && !order.collected
            );
          case "completed":
            return order.workflowStage === "completed" && !order.collected;
          case "collected":
            return order.collected === true;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [orders, deferredSearch, filterType, currentTime]);

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const handleMarkCollected = async (orderId: Id<"orders">) => {
    try {
      await markCollected({ orderId });
      toast.success("Order Marked as Collected");
    } catch (error) {
      toast.error("Failed to Mark Collected", {
        description: (error as Error).message,
      });
    }
  };

  const isSearching = searchInput !== deferredSearch;

  return (
    <div className='min-h-screen lg:ml-16'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='flex justify-between mb-6 gap-4'>
          <div>
            <h1 className='text-4xl font-bold mb-1'>ORDERS</h1>
            <p className='text-muted-foreground text-sm flex items-center gap-2'>
              {orders === undefined ? (
                <Loader2 className='w-3 h-3 animate-spin' />
              ) : (
                filteredOrders.length
              )}{" "}
              orders found
            </p>
          </div>
          <Button asChild>
            <Link href='/dashboard/new-order'>Create Order</Link>
          </Button>
        </div>

        {/* Controls */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500' />
            <Input
              placeholder='Search orders...'
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setCurrentPage(1);
              }}
              className='pl-10 pr-10'
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'>
                <X className='w-4 h-4' />
              </button>
            )}
            {isSearching && (
              <Loader2 className='absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-blue-500' />
            )}
          </div>

          <Select
            value={filterType}
            onValueChange={(value: FilterType) => {
              setFilterType(value);
              setCurrentPage(1);
            }}>
            <SelectTrigger>
              <div className='flex items-center gap-2'>
                <Filter className='w-4 h-4' />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Orders</SelectItem>
              <SelectItem value='unassigned'>Unassigned</SelectItem>
              <SelectItem value='tailoring'>Tailoring</SelectItem>
              <SelectItem value='beading'>Beading</SelectItem>
              <SelectItem value='fitting'>Fitting</SelectItem>
              <SelectItem value='qc'>Quality Control</SelectItem>
              <SelectItem value='urgent'>Urgent</SelectItem>
              <SelectItem value='overdue'>Overdue</SelectItem>
              <SelectItem value='completed'>Completed</SelectItem>
              <SelectItem value='collected'>Collected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loading State & Orders Card */}
        {orders === undefined ? (
          <div className='text-center py-20'>
            <Loader2 className='w-16 h-16 text-muted-foreground mx-auto mb-4 animate-spin' />
            <p className='text-slate-500'>Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className='text-center py-20'>
            <Package className='w-16 h-16 text-slate-700 mx-auto mb-4' />
            <p className='text-slate-500'>No orders found</p>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8'>
            {paginatedOrders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                currentTime={currentTime}
                onMarkCollected={handleMarkCollected}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className='flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-2'>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className='w-full sm:w-auto px-4 py-2 bg-slate-800/50 text-slate-400 rounded-lg border border-slate-700 hover:bg-slate-800 hover:text-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm'>
              Previous
            </button>

            <div className='flex gap-1 sm:gap-2 flex-wrap justify-center'>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  if (totalPages <= 5) return true;
                  if (page === 1 || page === totalPages) return true;
                  if (Math.abs(page - currentPage) <= 1) return true;
                  return false;
                })
                .map((page, idx, arr) => {
                  const prevPage = arr[idx - 1];
                  const showEllipsis = prevPage && page - prevPage > 1;

                  return (
                    <div
                      key={page}
                      className='flex items-center gap-1 sm:gap-2'>
                      {showEllipsis && (
                        <span className='text-slate-600 text-xs sm:text-base'>
                          ...
                        </span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg border transition-all text-sm ${
                          currentPage === page
                            ? "bg-cyan-500 text-white border-cyan-400"
                            : "bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-cyan-400"
                        }`}>
                        {page}
                      </button>
                    </div>
                  );
                })}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className='w-full sm:w-auto px-4 py-2 text-slate-400 rounded-lg border border-slate-700 hover:bg-slate-800 hover:text-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm'>
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function OrderCard({
  order,
  currentTime,
  onMarkCollected,
}: {
  order: Order;
  currentTime: number;
  onMarkCollected: (orderId: Id<"orders">) => Promise<void>;
}) {
  const { sessionClaims } = useAuth();
  const isAdmin = sessionClaims?.metadata?.role === "admin";
  const isConsultant = sessionClaims?.metadata?.role === "consultant";

  const [isMarking, setIsMarking] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const status = getOrderStatus(order, currentTime);
  const isCompleted = order.workflowStage === "completed" && !order.collected;

  const handleMarkCollected = async () => {
    setIsMarking(true);
    try {
      await onMarkCollected(order._id);
    } finally {
      setIsMarking(false);
    }
  };

  // ✅ Get list of staff who worked on this order
  const workHistory = [];
  if (order.assignedTailor)
    workHistory.push({
      role: "Tailor",
      name: order.assignedTailor.staffName,
      completed: !!order.assignedTailor.completedAt,
    });
  if (order.assignedBeader)
    workHistory.push({
      role: "Beader",
      name: order.assignedBeader.staffName,
      completed: !!order.assignedBeader.completedAt,
    });
  if (order.assignedFitter)
    workHistory.push({
      role: "Fitter",
      name: order.assignedFitter.staffName,
      completed: !!order.assignedFitter.completedAt,
    });
  if (order.assignedQC)
    workHistory.push({
      role: "QC",
      name: order.assignedQC.staffName,
      completed: !!order.assignedQC.completedAt,
    });

  return (
    <>
      <Card className='hover:border-cyan-500/50 transition-all backdrop-blur-sm overflow-hidden'>
        <CardHeader>
          <div className='flex items-center justify-between gap-2 shrink-0'>
            <Badge className={`${status.color} border px-2 py-1 text-xs`}>
              {status.label}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' size='icon' className='h-8 w-8'>
                  <MoreVertical className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem onClick={() => setViewOpen(true)}>
                  <Eye className='mr-2 h-4 w-4' />
                  View
                </DropdownMenuItem>
                {(isAdmin || isConsultant) && (
                  <DropdownMenuItem onClick={() => setUpdateOpen(true)}>
                    <Edit className='mr-2 h-4 w-4' />
                    Update
                  </DropdownMenuItem>
                )}
                {(isAdmin || isConsultant) && (
                  <DropdownMenuItem
                    onClick={() => setDeleteOpen(true)}
                    className='text-red-600 focus:text-red-600'>
                    <Trash2 className='mr-2 h-4 w-4' />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className='flex-1 min-w-0'>
            <h3 className='text-lg font-bold truncate'>{order.name}</h3>
            <p className='text-sm font-mono text-muted-foreground'>
              {order.orderNumber}
            </p>
          </div>
        </CardHeader>

        <CardContent className='space-y-3'>
          <div className='flex items-center gap-2 text-sm'>
            <Package className='w-4 h-4 text-cyan-500' />
            <span>{order.garmentType}</span>
          </div>

          <div className='space-y-2'>
            <div className='flex items-center justify-between text-xs'>
              <span className='text-muted-foreground uppercase tracking-wider'>
                {order.workflowStage.replace("_", " ")}
              </span>
              <span className='text-cyan-400 font-bold'>{order.progress}%</span>
            </div>
            <Progress value={order.progress} className='h-1.5' />
          </div>

          {/* ✅ Show staff work history */}
          {workHistory.length > 0 && (
            <div className='space-y-1'>
              <p className='text-xs text-muted-foreground font-medium'>
                Staff:
              </p>
              <div className='space-y-1'>
                {workHistory.map((work, idx) => (
                  <div key={idx} className='flex items-center gap-2 text-xs'>
                    <User className='w-3 h-3 text-muted-foreground' />
                    <span className='text-muted-foreground'>{work.role}:</span>
                    <span className='font-medium'>{work.name}</span>
                    {work.completed && (
                      <CheckCircle2 className='w-3 h-3 text-green-500 ml-auto' />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {order.collected && order.collectedAt ? (
            <div className='bg-green-500/10 border border-green-500/20 rounded-lg p-3'>
              <div className='flex items-center gap-2'>
                <CheckCircle2 className='w-4 h-4 text-green-500 shrink-0' />
                <div className='flex-1'>
                  <p className='text-sm font-medium text-green-600 dark:text-green-400'>
                    Order Collected
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {dayjs(order.collectedAt).format("MMM D, YYYY [at] h:mm A")}
                  </p>
                </div>
              </div>
            </div>
          ) : isCompleted ? (
            isAdmin || isConsultant ? (
              <Button
                onClick={handleMarkCollected}
                disabled={isMarking}
                type='button'
                className='w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'>
                {isMarking ? (
                  <>
                    <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                    Marking...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className='w-4 h-4 mr-2' />
                    Mark as Collected
                  </>
                )}
              </Button>
            ) : (
              <p className='text-xs text-red-500 text-center py-1 px-1 bg-red-100 rounded-lg'>
                Only Admins & Consultants can mark orders as collected
              </p>
            )
          ) : order.currentlyAssignedTo ? (
            <div className='flex items-center gap-2 rounded-lg p-2 border text-xs'>
              <div className='w-2 h-2 bg-green-400 rounded-full animate-pulse' />
              <span>Assigned to {order.currentlyAssignedTo.staffName}</span>
            </div>
          ) : (
            <div className='flex items-center gap-2 rounded-lg p-2 border text-xs'>
              <AlertCircle className='w-4 h-4 text-amber-400' />
              <span>Awaiting assignment</span>
            </div>
          )}

          {!order.collected && (
            <div className='flex items-center gap-2 text-xs text-muted-foreground'>
              <Clock className='w-3 h-3' />
              <span>
                Due: {dayjs(order.expectedCollectionDate).format("MMM D, YYYY")}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <ViewOrderSheet
        open={viewOpen}
        onOpenChange={setViewOpen}
        order={order}
      />
      <UpdateOrderSheet
        open={updateOpen}
        onOpenChange={setUpdateOpen}
        order={order}
      />
      <DeleteOrderSheet
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        order={order}
      />
    </>
  );
}

function getOrderStatus(order: Order, now: number) {
  const fourDays = 4 * 24 * 60 * 60 * 1000;

  if (order.collected)
    return {
      label: "Collected",
      color: "bg-green-500/10 text-green-500 border-green-500/20",
    };
  if (order.expectedCollectionDate < now)
    return {
      label: "Overdue",
      color: "bg-red-500/10 text-red-500 border-red-500/20",
    };
  if (order.expectedCollectionDate - now < fourDays)
    return {
      label: "Urgent",
      color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    };
  if (order.workflowStage === "completed")
    return {
      label: "Completed",
      color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    };
  return {
    label: "In Progress",
    color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  };
}
