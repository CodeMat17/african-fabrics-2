"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shirt,
  Clock,
  CheckCircle,
  User,
  Calendar,
  MoveRight,
  Users,
  FileText,
  Filter,
  Search,
  Scissors,
  CalendarDays,
  Phone as PhoneIcon,
  Target,
  ArrowRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";

// Types
interface ClothSample {
  imageUrl?: string;
  fabricType: string;
  color: string;
  pattern?: string;
}

interface FittingOrder {
  id: string;
  clientName: string;
  clientPhone: string;
  email: string;
  garmentType: string;
  orderDate: Date;
  collectionDate: Date;
  amount: number;
  assignedTo: string | null;
  assignedDate: Date | null;
  priority: "high" | "medium" | "low";
  status:
    | "awaiting_schedule"
    | "scheduled"
    | "in_progress"
    | "completed"
    | "needs_adjustment"
    | "ready_collection";
  fittingDate: Date | null;
  fittingTime: string | null;
  progress: number;
  fittingType: "initial" | "final" | "adjustment";
  previousAdjustments: string[];
  notes: string;
  fittingRoom: string | null;
  estimatedDuration: number;
  result?: "approved" | "needs_adjustment";
  adjustmentsNeeded?: string[];
  clothSample: ClothSample;
}

// Mock data for fitting queue
const mockFittingQueue: FittingOrder[] = [
  {
    id: "AS240101015",
    clientName: "Chinedu Okafor",
    clientPhone: "+234 811 234 5678",
    email: "chinedu@email.com",
    garmentType: "Ankara Suit",
    orderDate: new Date("2024-01-29"),
    collectionDate: new Date("2024-02-15"),
    amount: 45000,
    assignedTo: "Fitting Specialist Grace",
    assignedDate: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    priority: "medium",
    status: "scheduled",
    fittingDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    fittingTime: "10:00 AM",
    progress: 100,
    fittingType: "final",
    previousAdjustments: ["Sleeves shortened", "Waist taken in"],
    notes: "Client prefers snug fit",
    fittingRoom: "Room A",
    estimatedDuration: 45,
    clothSample: {
      imageUrl:
        "https://images.unsplash.com/photo-1617870952340-db4ee5aff13c?w=160&h=160&fit=crop",
      fabricType: "Ankara",
      color: "Gold/Yellow",
      pattern: "Traditional",
    },
  },
  {
    id: "AS240101016",
    clientName: "Fatima Ibrahim",
    clientPhone: "+234 812 345 6789",
    email: "fatima@email.com",
    garmentType: "Boubou",
    orderDate: new Date("2024-01-30"),
    collectionDate: new Date("2024-02-16"),
    amount: 52000,
    assignedTo: null,
    assignedDate: null,
    priority: "high",
    status: "awaiting_schedule",
    fittingDate: null,
    fittingTime: null,
    progress: 100,
    fittingType: "initial",
    previousAdjustments: [],
    notes: "Elderly client - needs comfortable fit",
    fittingRoom: null,
    estimatedDuration: 60,
    clothSample: {
      imageUrl:
        "https://images.unsplash.com/photo-1564584217132-2271feaeb3c5?w=160&h=160&fit=crop",
      fabricType: "Boubou",
      color: "White/Gold",
      pattern: "Traditional",
    },
  },
  {
    id: "AS240101017",
    clientName: "Samuel Adekunle",
    clientPhone: "+234 813 456 7890",
    email: "samuel@email.com",
    garmentType: "Agbada",
    orderDate: new Date("2024-01-31"),
    collectionDate: new Date("2024-02-17"),
    amount: 68000,
    assignedTo: "Fitting Specialist John",
    assignedDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
    priority: "high",
    status: "in_progress",
    fittingDate: new Date(),
    fittingTime: "2:00 PM",
    progress: 100,
    fittingType: "final",
    previousAdjustments: ["Shoulders adjusted", "Length modified"],
    notes: "Client running late by 15 minutes",
    fittingRoom: "Room B",
    estimatedDuration: 60,
    clothSample: {
      imageUrl:
        "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=160&h=160&fit=crop",
      fabricType: "Damask",
      color: "Cream",
      pattern: "Embroidered",
    },
  },
  {
    id: "AS240101018",
    clientName: "Aminata Diop",
    clientPhone: "+221 80 456 7890",
    email: "aminata@email.com",
    garmentType: "Kaftan",
    orderDate: new Date("2024-02-01"),
    collectionDate: new Date("2024-02-18"),
    amount: 38000,
    assignedTo: "Fitting Specialist Grace",
    assignedDate: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    priority: "medium",
    status: "completed",
    fittingDate: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    fittingTime: "11:00 AM",
    progress: 100,
    fittingType: "final",
    previousAdjustments: ["Minor hem adjustment"],
    notes: "Perfect fit - client very satisfied",
    fittingRoom: "Room A",
    estimatedDuration: 30,
    result: "approved",
    adjustmentsNeeded: [],
    clothSample: {
      imageUrl:
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=160&h=160&fit=crop",
      fabricType: "Ankara",
      color: "Blue/Red",
      pattern: "Geometric",
    },
  },
  {
    id: "AS240101019",
    clientName: "Kofi Asante",
    clientPhone: "+233 21 567 8901",
    email: "kofi@email.com",
    garmentType: "Kente Suit",
    orderDate: new Date("2024-02-02"),
    collectionDate: new Date("2024-02-19"),
    amount: 75000,
    assignedTo: "Fitting Specialist John",
    assignedDate: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    priority: "medium",
    status: "needs_adjustment",
    fittingDate: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    fittingTime: "9:00 AM",
    progress: 100,
    fittingType: "initial",
    previousAdjustments: [],
    notes: "Sleeves too long, waist too loose",
    fittingRoom: "Room C",
    estimatedDuration: 45,
    result: "needs_adjustment",
    adjustmentsNeeded: ["Shorten sleeves by 2cm", "Take in waist"],
    clothSample: {
      imageUrl:
        "https://images.unsplash.com/photo-1542295669297-4d352b042bca?w=160&h=160&fit=crop",
      fabricType: "Kente",
      color: "Multicolor",
      pattern: "Traditional",
    },
  },
];

const statusConfig = {
  awaiting_schedule: {
    label: "Awaiting Schedule",
    color: "bg-gray-500",
    icon: Clock,
  },
  scheduled: { label: "Scheduled", color: "bg-blue-500", icon: CalendarDays },
  in_progress: { label: "In Progress", color: "bg-yellow-500", icon: User },
  completed: { label: "Completed", color: "bg-green-500", icon: CheckCircle },
  needs_adjustment: {
    label: "Needs Adjustment",
    color: "bg-red-500",
    icon: Scissors,
  },
  ready_collection: {
    label: "Ready for Collection",
    color: "bg-purple-500",
    icon: MoveRight,
  },
} as const;

const fittingTypeConfig = {
  initial: { label: "Initial Fitting", color: "bg-blue-500" },
  final: { label: "Final Fitting", color: "bg-green-500" },
  adjustment: { label: "Adjustment Fitting", color: "bg-yellow-500" },
} as const;

const fittingSpecialists = [
  {
    id: "fit1",
    name: "Fitting Specialist Grace",
    expertise: ["formal", "traditional"],
    currentLoad: 2,
    maxLoad: 5,
  },
  {
    id: "fit2",
    name: "Fitting Specialist John",
    expertise: ["suits", "ceremonial"],
    currentLoad: 1,
    maxLoad: 5,
  },
  {
    id: "fit3",
    name: "Fitting Specialist Amina",
    expertise: ["women", "modest"],
    currentLoad: 0,
    maxLoad: 4,
  },
] as const;



// Fitting Order Card Component
function FittingOrderCard({
  order,
  onMarkComplete,
  onToggleExpand,
}: {
  order: FittingOrder;
  onMarkComplete: () => void;
  onToggleExpand: () => void;
  expanded: boolean;
}) {
  const collectionDate = new Date(order.collectionDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysUntilCollection = Math.ceil(
    (collectionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  const getUrgencyClass = () => {
    if (daysUntilCollection <= 1) {
      return "border-red-500/30 bg-red-500/5";
    } else if (daysUntilCollection <= 3) {
      return "border-amber-500/30 bg-amber-500/5";
    } else if (order.priority === "high") {
      return "border-orange-500/30 bg-orange-500/5";
    }
    return "border-border/50 bg-card/50";
  };

  const getFittingStatus = () => {
    if (order.status === "in_progress") return "Currently in fitting";
    if (
      order.status === "scheduled" &&
      order.fittingDate &&
      order.fittingTime
    ) {
      const isToday =
        order.fittingDate.toDateString() === new Date().toDateString();
      if (isToday) return `Today at ${order.fittingTime}`;
      return `${order.fittingDate.toLocaleDateString()} at ${
        order.fittingTime
      }`;
    }
    return "Not scheduled";
  };

  const fittingType = fittingTypeConfig[order.fittingType];

  return (
    <Card className={`${getUrgencyClass()} transition-colors`}>
      <CardContent className='p-4 md:p-6'>
        <div className='flex flex-col md:flex-row gap-4'>
          {/* Fabric Image */}
          <div className='w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden bg-muted shrink-0'>
            {order.clothSample.imageUrl ? (
              <Image
                src={order.clothSample.imageUrl}
                alt={order.clothSample.fabricType}
                width={96}
                height={96}
                className='w-full h-full object-cover'
              />
            ) : (
              <div className='w-full h-full bg-linear-to-br from-orange-500/20 to-orange-500/10 flex items-center justify-center'>
                <Shirt className='w-8 h-8 text-orange-500/50' />
              </div>
            )}
          </div>

          {/* Order Details */}
          <div className='flex-1 min-w-0'>
            <div className='flex flex-col md:flex-row md:items-start justify-between gap-2'>
              <div className=''>
                <div className='flex flex-wrap items-center gap-2 mb-1'>
                  <p className='font-semibold text-foreground text-base md:text-lg'>
                    {order.clientName}
                  </p>
                </div>
                <div className='flex flex-wrap gap-2 items-center'>
                  <Badge variant='secondary'>
                    {order.clothSample.fabricType}
                  </Badge>{" "}
                  • <Badge variant='secondary'>{order.garmentType}</Badge> •{" "}
                  <Badge className={fittingType.color}>
                    {fittingType.label}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Contact & Collection Info */}
            <div className='flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-xs text-muted-foreground'>
              <span className='flex items-center gap-1'>
                <PhoneIcon className='w-3 h-3' />
                {order.clientPhone}
              </span>
              <span className='flex items-center gap-1'>
                <Calendar className='w-3 h-3' />
                Due:{" "}
                {collectionDate.toLocaleDateString("en-NG", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <span className='flex items-center gap-1'>
                <Target className='w-3 h-3' />
                {order.assignedTo || "Unassigned"}
              </span>
            </div>

            {/* Fitting Status */}
            <div className='mt-2'>
              <p className='text-xs font-medium'>
                Fitting: {getFittingStatus()}
                {order.fittingRoom && ` • Room: ${order.fittingRoom}`}
              </p>
            </div>

            {/* Previous Adjustments */}
            {order.previousAdjustments.length > 0 && (
              <div className='mt-3'>
                <div className='flex flex-wrap gap-1'>
                  {order.previousAdjustments.map((adj, index) => (
                    <Badge key={index} variant='outline' className='text-xs'>
                      {adj}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Adjustment Results */}
            {order.adjustmentsNeeded && order.adjustmentsNeeded.length > 0 && (
              <div className='mt-3'>
                <div className='flex flex-wrap gap-1'>
                  {order.adjustmentsNeeded.map((adj, index) => (
                    <Badge
                      key={index}
                      variant='destructive'
                      className='text-xs'>
                      {adj}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {order.notes && (
              <p className='text-xs text-muted-foreground mt-3 italic'>
                &quot;{order.notes}&quot;
              </p>
            )}

            {/* Assigned Info */}
            {order.assignedDate && (
              <p className='text-xs text-muted-foreground mt-2'>
                Assigned {formatDistanceToNow(order.assignedDate)} ago
              </p>
            )}

            {/* Action Buttons */}
            <div className='mt-4 flex flex-col md:flex-row items-center gap-2'>
              <Link
                href={`/dashboard/orders/${order.id}`}
                className='w-full md:w-auto md:flex-1'>
                <Button variant='outline' size='sm' className='w-full'>
                  View Details
                </Button>
              </Link>
              {order.status === "completed" && order.result === "approved" ? (
                <Button
                  size='sm'
                  onClick={onMarkComplete}
                  className='w-full md:w-auto md:flex-1 bg-purple-600 hover:bg-purple-700'>
                  Mark Ready
                  <ArrowRight className='w-4 h-4 ml-1' />
                </Button>
              ) : (
                <Button
                  size='sm'
                  onClick={onToggleExpand}
                  className='w-full md:w-auto md:flex-1 bg-orange-600 hover:bg-orange-700'>
                  Manage Fitting
                  <User className='w-4 h-4 ml-1' />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function FittingQueuePage() {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSpecialist, setFilterSpecialist] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  // Filter orders
  const filteredOrders = useMemo(() => {
    return mockFittingQueue.filter((order) => {
      const matchesStatus =
        filterStatus === "all" || order.status === filterStatus;
      const matchesSpecialist =
        filterSpecialist === "all" || order.assignedTo === filterSpecialist;
      const matchesSearch =
        order.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.garmentType.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesStatus && matchesSpecialist && matchesSearch;
    });
  }, [filterStatus, filterSpecialist, searchQuery]);



  // Calculate specialist approval rate
  const calculateSpecialistApprovalRate = (
    assignedFittings: FittingOrder[]
  ): number => {
    const completedWithResult = assignedFittings.filter(
      (o) => o.result !== undefined
    ).length;
    const approved = assignedFittings.filter(
      (o) => o.result === "approved"
    ).length;

    if (completedWithResult === 0) return 0;
    return Math.round((approved / completedWithResult) * 100);
  };

  // Handlers
  const handleMarkReadyForCollection = (orderId: string) => {
    console.log(`Marking order ${orderId} as ready for collection`);
  };

  const toggleExpandedOrder = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  // Check if date is today
  const isToday = (date: Date | null): boolean => {
    if (!date) return false;
    return date.toDateString() === new Date().toDateString();
  };

  // Fitting rooms
  const fittingRooms = ["Room A", "Room B", "Room C", "Room D"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className='space-y-6 lg:ml-16'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div>
          <h1 className='text-2xl md:text-3xl font-bold flex items-center gap-2'>
            <Shirt className='h-6 w-6 md:h-8 md:w-8 text-orange-500' />
            Fitting Queue
          </h1>
          <p className='text-sm md:text-base text-muted-foreground'>
            Schedule and manage garment fittings for perfect customer
            satisfaction
          </p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' className='gap-2'>
            <Calendar className='h-4 w-4' />
            Calendar View
          </Button>
          <Button className='bg-orange-600 hover:bg-orange-700 gap-2'>
            <FileText className='h-4 w-4' />
            Fitting Report
          </Button>
        </div>
      </div>

   

      {/* Filters and Search */}
      <div className='flex flex-col md:flex-row gap-3 md:gap-4'>
        <div className='flex-1 relative'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
          <Input
            placeholder='Search orders by name, garment type, or fitting room...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-10'
          />
        </div>
        <div className='w-full md:w-48'>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
              <Filter className='h-4 w-4 mr-2' />
              <SelectValue placeholder='Filter by status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Statuses</SelectItem>
              {Object.entries(statusConfig).map(([value, config]) => (
                <SelectItem key={value} value={value}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='w-full md:w-48'>
          <Select value={filterSpecialist} onValueChange={setFilterSpecialist}>
            <SelectTrigger>
              <Users className='h-4 w-4 mr-2' />
              <SelectValue placeholder='Filter by specialist' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Specialists</SelectItem>
              {fittingSpecialists.map((specialist) => (
                <SelectItem key={specialist.id} value={specialist.name}>
                  {specialist.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Content */}
      <div className='lg:grid lg:grid-cols-3 lg:gap-6 space-y-6 lg:space-y-0'>
        {/* Main Orders List */}
        <div className='lg:col-span-2'>
          <Card>
            <CardContent className='p-4 md:p-6'>
              <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6'>
                <div>
                  <h2 className='text-xl md:text-2xl font-semibold flex items-center gap-2'>
                    <Shirt className='h-5 w-5 text-orange-500' />
                    Fitting Queue
                  </h2>
                  <p className='text-sm text-muted-foreground'>
                    Schedule fittings and ensure perfect garment fit for every
                    client
                  </p>
                </div>
                <Badge
                  variant='outline'
                  className='border-primary/30 text-primary gap-1'>
                  <User className='h-3 w-3' />
                  {filteredOrders.length}{" "}
                  {filteredOrders.length === 1 ? "order" : "orders"} in queue
                </Badge>
              </div>

              {filteredOrders.length > 0 ? (
                <div className='space-y-4'>
                  {filteredOrders.map((order) => (
                    <FittingOrderCard
                      key={order.id}
                      order={order}
                      onMarkComplete={() =>
                        handleMarkReadyForCollection(order.id)
                      }
                      onToggleExpand={() => toggleExpandedOrder(order.id)}
                      expanded={expandedOrders.has(order.id)}
                    />
                  ))}
                </div>
              ) : (
                <Card className='border-border/50 bg-card/30'>
                  <CardContent className='py-12 text-center'>
                    <Shirt className='w-12 h-12 text-primary/30 mx-auto mb-4' />
                    <p className='text-muted-foreground'>
                      {searchQuery ||
                      filterStatus !== "all" ||
                      filterSpecialist !== "all"
                        ? "No orders match your filters."
                        : "All fittings are completed. Great work!"}
                    </p>
                    {(searchQuery ||
                      filterStatus !== "all" ||
                      filterSpecialist !== "all") && (
                      <Button
                        variant='outline'
                        size='sm'
                        className='mt-4'
                        onClick={() => {
                          setSearchQuery("");
                          setFilterStatus("all");
                          setFilterSpecialist("all");
                        }}>
                        Clear filters
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className='space-y-4 md:space-y-6'>
          {/* Today's Schedule */}
          <Card>
            <CardHeader className='p-4'>
              <CardTitle className='text-lg flex items-center gap-2'>
                <CalendarDays className='h-5 w-5' />
                Today&apo;s Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className='p-4'>
              <div className='space-y-3'>
                {mockFittingQueue
                  .filter(
                    (order) => order.fittingDate && isToday(order.fittingDate)
                  )
                  .sort((a, b) => {
                    if (!a.fittingTime || !b.fittingTime) return 0;
                    return a.fittingTime.localeCompare(b.fittingTime);
                  })
                  .map((order) => (
                    <div
                      key={order.id}
                      className='flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors'>
                      <div>
                        <p className='font-medium text-sm'>
                          {order.clientName}
                        </p>
                        <p className='text-xs text-muted-foreground'>
                          {order.fittingTime} • {order.fittingRoom} •{" "}
                          {order.garmentType}
                        </p>
                      </div>
                      <Badge className={statusConfig[order.status]?.color}>
                        {statusConfig[order.status]?.label}
                      </Badge>
                    </div>
                  ))}

                {mockFittingQueue.filter(
                  (order) => order.fittingDate && isToday(order.fittingDate)
                ).length === 0 && (
                  <p className='text-center text-muted-foreground py-4'>
                    No fittings scheduled for today
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Fitting Room Status */}
          <Card>
            <CardHeader className='p-4'>
              <CardTitle className='text-lg flex items-center gap-2'>
                <User className='h-5 w-5' />
                Fitting Room Status
              </CardTitle>
            </CardHeader>
            <CardContent className='p-4'>
              <div className='space-y-3'>
                {fittingRooms.map((room) => {
                  const currentFitting = mockFittingQueue.find(
                    (o) => o.fittingRoom === room && o.status === "in_progress"
                  );
                  const nextFitting = mockFittingQueue.find(
                    (o) => o.fittingRoom === room && o.status === "scheduled"
                  );

                  return (
                    <div
                      key={room}
                      className='p-3 border rounded-lg hover:bg-muted/50 transition-colors'>
                      <div className='flex justify-between items-center mb-2'>
                        <span className='font-medium'>{room}</span>
                        <Badge
                          variant={currentFitting ? "destructive" : "outline"}>
                          {currentFitting ? "Occupied" : "Available"}
                        </Badge>
                      </div>
                      {currentFitting && (
                        <p className='text-sm text-muted-foreground'>
                          Current: {currentFitting.clientName}
                        </p>
                      )}
                      {nextFitting && (
                        <p className='text-sm text-muted-foreground'>
                          Next: {nextFitting.fittingTime} -{" "}
                          {nextFitting.clientName}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Fitting Specialist Stats */}
          <Card>
            <CardHeader className='p-4'>
              <CardTitle className='text-lg flex items-center gap-2'>
                <Users className='h-5 w-5' />
                Specialist Availability
              </CardTitle>
            </CardHeader>
            <CardContent className='p-4'>
              <div className='space-y-4'>
                {fittingSpecialists.map((specialist) => {
                  const loadPercentage =
                    (specialist.currentLoad / specialist.maxLoad) * 100;
                  const assignedFittings = mockFittingQueue.filter(
                    (o) => o.assignedTo === specialist.name
                  );
                  const approvalRate =
                    calculateSpecialistApprovalRate(assignedFittings);

                  return (
                    <div key={specialist.id} className='space-y-2'>
                      <div className='flex justify-between items-center'>
                        <div>
                          <p className='font-medium text-sm'>
                            {specialist.name}
                          </p>
                          <p className='text-xs text-muted-foreground'>
                            {specialist.expertise.join(", ")} • {approvalRate}%
                            approval
                          </p>
                        </div>
                        <Badge
                          variant={
                            loadPercentage >= 90
                              ? "destructive"
                              : loadPercentage >= 70
                              ? "outline"
                              : "secondary"
                          }
                          className='text-xs'>
                          {specialist.currentLoad}/{specialist.maxLoad}
                        </Badge>
                      </div>
                      <Progress value={loadPercentage} className='h-2' />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className='p-4'>
              <CardTitle className='text-lg flex items-center gap-2'>
                <MoveRight className='h-5 w-5' />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <Button className='w-full justify-start' variant='outline'>
                <Calendar className='h-4 w-4 mr-2' />
                Schedule All Pending
              </Button>
              <Button className='w-full justify-start' variant='outline'>
                <MoveRight className='h-4 w-4 mr-2' />
                Mark All Approved as Ready
              </Button>
              <Button className='w-full justify-start' variant='outline'>
                <FileText className='h-4 w-4 mr-2' />
                Generate Fitting Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
