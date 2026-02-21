"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AlertTriangle, Loader2 } from "lucide-react";

interface Props {
  staff: Doc<"staff">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DeleteStaffSheet({ staff, open, onOpenChange }: Props) {
  const deleteStaff = useMutation(api.staff.deleteStaff);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteStaff({ staffId: staff._id });

      toast.success("Staff Member Deactivated", {
        description: `${staff.name} has been successfully deactivated`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting staff:", error);
      toast.error("Delete Failed", {
        description:
          (error as Error).message ||
          "Failed to delete staff member. They may have active assignments.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full sm:max-w-md overflow-y-auto'>
        <SheetHeader>
          <SheetTitle className='text-2xl font-bold text-red-600 dark:text-red-400'>
            Delete Staff Member
          </SheetTitle>
          <SheetDescription>This action cannot be undone</SheetDescription>
        </SheetHeader>

        <div className='space-y-6 mt-6 px-4'>
          {/* Warning Icon */}
          <div className='flex justify-center'>
            <div className='w-16 h-16 rounded-full bg-red-100 dark:bg-red-950 border-2 border-red-200 dark:border-red-900 flex items-center justify-center'>
              <AlertTriangle className='w-8 h-8 text-red-600 dark:text-red-400' />
            </div>
          </div>

          {/* Warning Message */}
          <div className='bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-lg p-4'>
            <p className='text-sm text-center text-red-900 dark:text-red-100'>
              This will <strong>deactivate</strong> the staff member. They will
              no longer appear in active lists, but historical data will be
              preserved.
            </p>
          </div>

          {/* Staff Details */}
          <div className='space-y-1 bg-muted/50 border rounded-lg p-4'>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Name:</span>
              <span className='font-semibold'>{staff.name}</span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Phone:</span>
              <span className='font-semibold'>{staff.phone}</span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Role:</span>
              <span className='font-semibold capitalize'>{staff.role}</span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Email:</span>
           
            </div>
          </div>

          {/* Confirmation Message */}
          <div className='text-center space-y-2'>
            <p className='text-sm font-semibold text-red-600 dark:text-red-400'>
              Are you sure you want to deactivate this staff member?
            </p>
            <p className='text-xs text-muted-foreground'>
              They must not have any active assignments to proceed.
            </p>
          </div>

          {/* Action Buttons */}
          <div className='flex gap-3 pt-4'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className='flex-1'>
              Cancel
            </Button>
            <Button
              type='button'
              onClick={handleDelete}
              disabled={loading}
              className='flex-1 bg-red-600 hover:bg-red-700 text-white'>
              {loading ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Deleting...
                </>
              ) : (
                "Delete Staff"
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
