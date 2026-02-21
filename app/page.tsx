"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export default function Home() {

  return (
    <div className='relative min-h-screen overflow-hidden'>
      {/* Background Pattern */}
      <div className='absolute inset-0 z-0'>
        <div
          className='absolute inset-0 opacity-20'
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%2355C694' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")`,
            backgroundSize: "300px",
          }}
        />
        {/* Color Overlays */}
        <div className='absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-purple-500/10' />
        <div className='absolute inset-0 bg-linear-to-tr from-yellow-500/5 via-transparent to-green-500/5' />
      </div>

      {/* Content */}
      <div className='relative z-10 min-h-screen flex flex-col items-center justify-center p-6'>
        <div className="absolute top-6 right-6 flex items-center gap-4">
            <ThemeToggle className='' />
           <SignedIn>
              <UserButton />
            </SignedIn>
        </div>
      

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className='text-center space-y-6'>
        

           {/* Main Content */}
      <div className='relative z-10 flex flex-col items-center justify-center h-full text-white text-center px-4'>
        {/* Logo Section */}
        <div className='flex flex-col items-center justify-center relative'>
          <div className='relative w-[290px] h-[290px] sm:w-[330px] sm:h-[330px] animate-spin-slower'>
            <Image
              alt='Logo'
              src='/logo/logo_name.webp'
              fill
              priority
              className='object-contain'
            />
          </div>

          {/* Centered Logo Tag Image */}
          <div className='absolute inset-0 flex justify-center items-center'>
            <div className='relative w-[160px] sm:w-[190px] aspect-video bg-white/20 rounded-3xl'>
              <Image
                alt='Logo Tag'
                src='/logo.jpg'
                fill
                priority
                className='object-cover rounded-xl'
              />
            </div>
          </div>
        </div>
      </div>

          {/* Sign In Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}>
            {/* <Button
              onClick={() => router.push("/dashboard")}
              size='lg'
              className=' bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 group'>
              <span className='flex items-center gap-2'>
                Sign In
                <motion.span
                  animate={{ x: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}>
                  →
                </motion.span>
              
              </span>
            </Button> */}


            <SignedOut>
              <Button asChild>
                <Link href='/sign-in'>
                   Sign In
                </Link>
               
              </Button>
            
            </SignedOut>
              <SignedIn>
                 <Button asChild>
                <Link href='/dashboard'>
                   Dashboard
                </Link>
               
              </Button>
                </SignedIn>
          </motion.div>

       
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className='absolute bottom-6 text-center text-sm text-muted-foreground'>
          <p>© 2026 African Fabrics. All rights reserved.</p>       
        </motion.footer>
      </div>
    </div>
  );
}
