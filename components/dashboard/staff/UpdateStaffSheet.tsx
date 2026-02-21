"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type StaffRole = "tailor" | "beader" | "fitter" | "qc";

interface Props {
  staff: Doc<"staff">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UpdateStaffSheet({ staff, open, onOpenChange }: Props) {
  const updateStaff = useMutation(api.staff.updateStaff);

  const [name, setName] = useState(staff.name);
  const [phone, setPhone] = useState(staff.phone);
  const [role, setRole] = useState<StaffRole>(staff.role as StaffRole);
  const [loading, setLoading] = useState(false);

  // Reset form when staff changes or sheet opens
  useEffect(() => {
    if (open) {
      setName(staff.name);
      setPhone(staff.phone);
      setRole(staff.role as StaffRole);
    }
  }, [staff, open]);

  const hasChanges =
    name !== staff.name || phone !== staff.phone || role !== staff.role;

  const handleUpdate = async () => {
    if (!hasChanges) {
      onOpenChange(false);
      return;
    }

    if (!name.trim() || !phone.trim()) {
      toast.error("Validation Error", {
        description: "Name and phone are required",
      });
      return;
    }

    setLoading(true);
    try {
      const updates: {
        staffId: Id<"staff">;
        name?: string;
        phone?: string;
        role?: StaffRole;
      } = { staffId: staff._id };

      if (name !== staff.name) updates.name = name.trim();
      if (phone !== staff.phone) updates.phone = phone.trim();
      if (role !== staff.role) updates.role = role;

      await updateStaff(updates);

      toast.success("Staff Updated", {
        description: `${name} has been successfully updated`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating staff:", error);
      toast.error("Update Failed", {
        description:
          (error as Error).message || "Failed to update staff member",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setName(staff.name);
    setPhone(staff.phone);
    setRole(staff.role as StaffRole);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full sm:max-w-md overflow-y-auto'>
        <SheetHeader>
          <SheetTitle className='text-2xl font-bold'>Update Staff</SheetTitle>
          <SheetDescription>Update staff member information</SheetDescription>
        </SheetHeader>

        <div className='space-y-6 mt-6 px-4'>
          {/* Name */}
          <div className='space-y-2'>
            <Label htmlFor='name'>
              Name <span className='text-red-500'>*</span>
            </Label>
            <Input
              id='name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Staff Name'
              disabled={loading}
            />
          </div>

          {/* Phone */}
          <div className='space-y-2'>
            <Label htmlFor='phone'>
              Phone Number <span className='text-red-500'>*</span>
            </Label>
            <Input
              id='phone'
              type='tel'
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder='+1234567890'
              disabled={loading}
            />
          </div>

          {/* Role */}
          <div className='space-y-2'>
            <Label htmlFor='role'>
              Role <span className='text-red-500'>*</span>
            </Label>
            <Select
              value={role}
              onValueChange={(value) => setRole(value as StaffRole)}
              disabled={loading}>
              <SelectTrigger id='role'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='tailor'>✂️ Tailor</SelectItem>
                <SelectItem value='beader'>💎 Beader</SelectItem>
                <SelectItem value='fitter'>📏 Fitter</SelectItem>
                <SelectItem value='qc'>✓ Quality Control</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className='flex gap-3 pt-4'>
            <Button
              type='button'
              variant='outline'
              onClick={handleCancel}
              disabled={loading}
              className='flex-1'>
              Cancel
            </Button>
            <Button
              type='button'
              onClick={handleUpdate}
              disabled={loading || !hasChanges}
              className='flex-1'>
              {loading ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Updating...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
