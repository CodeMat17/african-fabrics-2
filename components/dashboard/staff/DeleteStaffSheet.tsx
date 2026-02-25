"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AlertTriangle, Loader2, Trash2, Archive } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Staff = Doc<"staff">;

interface Props {
  staff: Staff;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DeleteStaffSheet({ staff, open, onOpenChange }: Props) {
  const [deleteType, setDeleteType] = useState<"soft" | "hard">("soft");
  const [loading, setLoading] = useState(false);

  const deleteStaff = useMutation(api.staff.deleteStaff);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const result = await deleteStaff({
        staffId: staff._id,
        forceDelete: deleteType === "hard",
      });

      // ✅ FIX: Close sheet IMMEDIATELY before showing toast
      onOpenChange(false);

      if (result.deletionType === "soft") {
        toast.success("Staff Deactivated", {
          description: result.message,
        });
      } else {
        toast.success("Staff Deleted", {
          description: result.message,
        });
      }

      onOpenChange(false);
    } catch (error) {
      toast.error("Delete Failed", {
        description: (error as Error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='sm:max-w-[500px]'>
        <SheetHeader>
          <SheetTitle className='flex items-center gap-2 text-red-600 dark:text-red-400'>
            <AlertTriangle className='w-5 h-5' />
            Delete Staff Member
          </SheetTitle>
          <SheetDescription>
            Choose how to remove this staff member from the system
          </SheetDescription>
        </SheetHeader>

        <div className='space-y-3 px-4 pb-6 overflow-y-scroll'>
          {/* Staff Info */}
          <div className='p-3 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950'>
            <div className='flex items-start justify-between gap-3'>
              <div>
                <h3 className='font-semibold text-lg'>{staff.name}</h3>
                <p className='text-sm text-muted-foreground'>{staff.phone}</p>
                <Badge className='mt-2 capitalize'>{staff.role}</Badge>
              </div>
            </div>
          </div>

          {/* Deletion Options */}
          <Tabs
            value={deleteType}
            onValueChange={(v) => setDeleteType(v as "soft" | "hard")}
            className='w-full'>
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='soft' className='gap-2'>
                <Archive className='w-4 h-4' />
                Deactivate
              </TabsTrigger>
              <TabsTrigger value='hard' className='gap-2'>
                <Trash2 className='w-4 h-4' />
                Delete
              </TabsTrigger>
            </TabsList>

            <TabsContent value='soft' className='space-y-4'>
              <Alert className='border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950'>
                <Archive className='w-4 h-4 text-orange-600 dark:text-orange-400' />
                <AlertDescription className='text-orange-900 dark:text-orange-100'>
                  <strong>Recommended:</strong> Deactivate keeps all historical
                  data intact.
                </AlertDescription>
              </Alert>

              <div className='space-y-3 text-xs'>
                <h4 className='font-semibold'>What happens:</h4>
                <ul className='space-y-2 list-disc list-inside text-muted-foreground'>
                  <li>Staff is marked as inactive</li>
                  <li>Cannot be assigned to new orders</li>
                  <li>All historical data is preserved</li>
                  <li>Past orders show correct staff information</li>
                  <li>Can be reactivated later</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value='hard' className='space-y-4'>
              <Alert
                variant='destructive'
                className='border-red-200 dark:border-red-900'>
                <AlertTriangle className='w-4 h-4' />
                <AlertDescription>
                  <strong>Warning:</strong> This action cannot be undone!
                </AlertDescription>
              </Alert>

              <div className='space-y-3 text-sm'>
                <h4 className='font-semibold'>What happens:</h4>
                <ul className='space-y-2 list-disc list-inside text-muted-foreground'>
                  <li>Staff is permanently deleted</li>
                  <li>All assignment records are removed</li>
                  <li>
                    Stage history still shows their name (but link is broken)
                  </li>
                  <li className='text-red-600 dark:text-red-400 font-medium'>
                    Cannot be recovered
                  </li>
                </ul>
              </div>

              <Alert className='border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950'>
                <AlertDescription className='text-blue-900 dark:text-blue-100 text-xs'>
                  <strong>Note:</strong> Hard delete only works if staff has no
                  historical assignments. If they do, they will be deactivated
                  instead.
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className='flex gap-3 pt-4 border-t'>
            <Button
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className='flex-1'>
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={loading}
              variant='destructive'
              className='flex-1'>
              {loading ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Processing...
                </>
              ) : deleteType === "soft" ? (
                <>
                  <Archive className='w-4 h-4 mr-2' />
                  Deactivate
                </>
              ) : (
                <>
                  <Trash2 className='w-4 h-4 mr-2' />
                  Delete
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
