"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  PlusCircle,
  ListOrdered,
  Users,
  LogOut,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SignedIn, useAuth, UserButton } from "@clerk/nextjs";

interface SidebarProps {
  isMobile?: boolean;
  onMobileLinkClick?: () => void;
}

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "New Order", href: "/dashboard/new-order", icon: PlusCircle },
  { name: "All Orders", href: "/dashboard/orders", icon: ListOrdered },
  {
    name: "Workflow",
    href: "/dashboard/workflow",
    icon: Workflow,
  },


 
  { name: "Staff", href: "/dashboard/staff", icon: Users },
];

export function Sidebar({ isMobile = false, onMobileLinkClick }: SidebarProps) {

     const { sessionClaims } = useAuth();
     const role = sessionClaims?.metadata?.role;


  const pathname = usePathname();

  const renderNavLinks = () => (
    <div className='space-y-1'>
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link key={item.name} href={item.href}>
            <Button
              variant={isActive ? "default" : "ghost"}
              className={cn(
                "w-full justify-start group transition-all duration-200 relative",
                isMobile ? "justify-start" : "lg:justify-start",
                !isMobile && "sm:px-2 lg:px-4",
                "h-10"
              )}
              onClick={onMobileLinkClick}>
              <Icon
                className={cn(
                  "h-4 w-4",
                  isActive
                    ? "text-primary-foreground"
                    : "text-muted-foreground group-hover:text-primary"
                )}
              />
              <span
                className={cn(
                  "ml-3 transition-all text-sm",
                  !isMobile && "hidden lg:inline-flex"
                )}>
                {item.name}
              </span>
              {isActive && (
                <motion.div
                  layoutId='sidebar-active'
                  className='absolute right-2 h-5 w-1 rounded-full bg-primary-foreground'
                />
              )}
            </Button>
          </Link>
        );
      })}

      {/* Sign Out */}
    
      <div className="mt-6 ml-3 flex items-center gap-3">
        <SignedIn >
        <UserButton />
        </SignedIn>
        <p className="text-sm">{role}</p>
      </div>
    </div>
  );

  return (
    <div className={cn("h-full", isMobile ? "p-4" : "p-4")}>
      {renderNavLinks()}
    </div>
  );
}
