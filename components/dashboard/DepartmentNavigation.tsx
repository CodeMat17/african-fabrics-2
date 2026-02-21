// components/dashboard/DepartmentNavigation.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Scissors,
  Tag,
  CheckSquare,
  Ruler,
  Users,
  ShoppingBag,
} from "lucide-react";

const departments = [
  {
    name: "Orders",
    path: "/dashboard/orders",
    icon: ShoppingBag,
    color: "text-blue-600",
    bgColor: "bg-blue-500",
  },
  {
    name: "Tailoring",
    path: "/dashboard/tailoring",
    icon: Scissors,
    color: "text-blue-600",
    bgColor: "bg-blue-500",
  },
  {
    name: "Beading",
    path: "/dashboard/beading",
    icon: Tag,
    color: "text-purple-600",
    bgColor: "bg-purple-500",
  },
  {
    name: "Quality Control",
    path: "/dashboard/quality-control",
    icon: CheckSquare,
    color: "text-orange-600",
    bgColor: "bg-orange-500",
  },
  {
    name: "Fitting",
    path: "/dashboard/fitting",
    icon: Ruler,
    color: "text-green-600",
    bgColor: "bg-green-500",
  },
  {
    name: "Staff",
    path: "/dashboard/staff",
    icon: Users,
    color: "text-teal-600",
    bgColor: "bg-teal-500",
  },
];

export default function DepartmentNavigation() {
  const pathname = usePathname();

  return (
    <nav className='sticky top-4 z-10'>
      <div className='rounded-lg border bg-card p-2 shadow-sm'>
        <div className='flex flex-wrap gap-1'>
          {departments.map((dept) => {
            const Icon = dept.icon;
            const isActive = pathname === dept.path;

            return (
              <motion.div
                key={dept.path}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}>
                <Link
                  href={dept.path}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}>
                  <div
                    className={cn(
                      "h-6 w-6 rounded flex items-center justify-center",
                      isActive ? "bg-white/20" : dept.bgColor
                    )}>
                    <Icon
                      className={cn(
                        "h-3 w-3",
                        isActive ? "text-white" : "text-white"
                      )}
                    />
                  </div>
                  <span className='hidden sm:inline'>{dept.name}</span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
