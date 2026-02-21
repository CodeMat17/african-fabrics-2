"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  staff: Doc<"staff">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DeleteStaffDialog({
  staff,
  open,
  onOpenChange,
}: Props) {
  const deleteStaff = useMutation(api.staff.deleteStaff);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteStaff({ staffId: staff._id });
      onOpenChange(false);
      toast.success('Staff Deleted!')
    } catch (error) {
      console.log(error)
      toast.error('Failed to delete staff')
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-sm'>
        <DialogHeader>
          <DialogTitle>Delete Staff</DialogTitle>
        </DialogHeader>
        <p className='mt-2 text-sm text-muted-foreground'>
          Are you sure you want to delete <strong>{staff.name}</strong>? This
          action cannot be undone.
        </p>
        <DialogFooter className='mt-4 flex justify-end gap-2'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant='destructive'
            onClick={handleDelete}
            disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
