'use client'

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldX } from "lucide-react";

export default function NotAllowedPage() {
  return (
    <div className='flex min-h-screen items-center justify-center px-6'>
      <div className='w-full max-w-md text-center space-y-6'>
        <div className='flex justify-center'>
          <ShieldX className='h-14 w-14 text-red-500' />
        </div>

        <h1 className='text-3xl font-bold tracking-tight'>
          Access Not Allowed
        </h1>

        <p className='text-muted-foreground text-sm'>
          You do not have permission to access this page.
        </p>

        <Link href='/' className='block'>
          <Button className='w-full'>Go Back Home</Button>
        </Link>
      </div>
    </div>
  );
}
