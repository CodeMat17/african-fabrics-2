"use client";

import { Sidebar } from "@/components/dashboard/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { SignedIn, UserButton } from "@clerk/nextjs";
import { Menu, Scissors } from "lucide-react";
import * as React from "react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <div className='min-h-screen bg-background'>
      {/* Sticky Navbar */}
      <nav className='sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60'>
        <div className=' mx-auto px-4'>
          <div className='flex h-16 items-center justify-between'>
            {/* Left: Logo and Sidebar Toggle */}
            <div className='flex items-center gap-4'>
              {/* Mobile Sidebar Toggle */}
              <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant='ghost' size='icon' className='lg:hidden'>
                    <Menu className='h-5 w-5' />
                  </Button>
                </SheetTrigger>
                <SheetContent side='left' className='w-64 p-0'>
                  <div className='p-6 border-b'>
                    <div className='flex items-center gap-3'>
                      <div className='h-10 w-10 rounded-full bg-primary flex items-center justify-center'>
                        <Scissors className='h-6 w-6 text-white' />
                      </div>
                      <div>
                        <h2 className='text-lg font-bold'>AFD Guru</h2>
                        <p className='text-xs text-muted-foreground'>
                          Dashboard
                        </p>
                      </div>
                    </div>
                  </div>
                  <Sidebar
                    isMobile
                    onMobileLinkClick={() => setIsSidebarOpen(false)}
                  />
                </SheetContent>
              </Sheet>

              {/* Logo */}
              <div className='flex items-center gap-3'>
              
                <div>
                  <h1 className='text-lg md:text-xl font-bold tracking-tight'>
                    AFD Guru
                  </h1>
                  <p className='hidden md:block text-xs text-muted-foreground'>
                    Premium African Tailoring
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Theme Toggle and User Info */}
            <div className='flex items-center gap-4'>
              <ThemeToggle />
              <SignedIn>
                <UserButton />
              </SignedIn>



           
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className='flex'>
        {/* Desktop Sidebar */}
        <aside className='hidden lg:flex w-62 xl:w-64 border-r bg-background flex-col fixed left-0 top-0 h-screen pt-16'>
          <div className='flex-1 overflow-y-auto'>
            <Sidebar />
          </div>
        </aside>

        {/* Main Content Area */}
        <main className={cn("flex-1", "lg:ml-42", "min-h-[calc(100vh-4rem)]")}>
          <div className=' mx-auto p-4 lg:pl-8 xl:pl-10'>{children}</div>
        </main>
      </div>
    </div>
  );
}
