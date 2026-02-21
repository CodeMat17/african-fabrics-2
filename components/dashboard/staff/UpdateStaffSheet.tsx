"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type StaffRole = Doc<"staff">["role"];
type Availability = Doc<"staff">["availability"];

interface Props {
  staff: Doc<"staff"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UpdateStaffSheet({ staff, open, onOpenChange }: Props) {
  const updateStaff = useMutation(api.staff.updateStaff);

  // Form state starts empty and is populated on render
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<StaffRole | null>(null);
  const [availability, setAvailability] = useState<Availability | null>(null);

  if (!staff) return null;

  // Always derive effective values from state or props
  const effectiveName = name || staff.name;
  const effectivePhone = phone || staff.phone;
  const effectiveRole = role ?? staff.role;
  const effectiveAvailability = availability ?? staff.availability;

  const isAssignedToWorkflow =
    !!staff.assignedStaff &&
    Object.values(staff.assignedStaff).some((id) => id === staff._id);

  const hasChanges =
    effectiveName !== staff.name ||
    effectivePhone !== staff.phone ||
    effectiveRole !== staff.role ||
    effectiveAvailability !== staff.availability;

  const handleUpdate = async () => {
    if (!hasChanges) return;

    try {
      const patch: {
        staffId: Id<"staff">;
        name?: string;
        phone?: string;
        role?: StaffRole;
        availability?: Availability;
      } = { staffId: staff._id };

      if (effectiveName !== staff.name) patch.name = effectiveName;
      if (effectivePhone !== staff.phone) patch.phone = effectivePhone;
      if (effectiveRole !== staff.role && !isAssignedToWorkflow)
        patch.role = effectiveRole;
      if (effectiveAvailability !== staff.availability)
        patch.availability = effectiveAvailability;

      await updateStaff(patch);

      // Reset local state after save
      setName("");
      setPhone("");
      setRole(null);
      setAvailability(null);
      onOpenChange(false);

      toast.success("Staff data updated successfully");
    } catch (error) {
      console.error("Error updating staff:", error);
      toast.error("Failed to update staff");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='w-full sm:max-w-md'>
        <SheetHeader>
          <SheetTitle>Update Staff</SheetTitle>
        </SheetHeader>

        <div className='mt-6 space-y-6 px-6'>
          <Input
            value={effectiveName}
            onChange={(e) => setName(e.target.value)}
            placeholder='Staff Name'
          />
          <Input
            value={effectivePhone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder='Phone Number'
          />

          <div className='space-y-2'>
            <p className='text-sm font-medium'>Role</p>
            <Select
              value={effectiveRole}
              onValueChange={(value) => setRole(value as StaffRole)}
              disabled={isAssignedToWorkflow}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='tailor'>Tailor</SelectItem>
                <SelectItem value='beader'>Beader</SelectItem>
                <SelectItem value='fitter'>Fitter</SelectItem>
                <SelectItem value='qc'>QC</SelectItem>
                <SelectItem value='admin'>Admin</SelectItem>
              </SelectContent>
            </Select>
            {isAssignedToWorkflow && (
              <p className='text-xs text-muted-foreground'>
                Role cannot be changed while assigned to an active workflow.
              </p>
            )}
          </div>

          <div className='space-y-2'>
            <p className='text-sm font-medium'>Availability</p>
            <Select
              value={effectiveAvailability}
              onValueChange={(value) => setAvailability(value as Availability)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='available'>Available</SelectItem>
                <SelectItem value='busy'>Busy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <SheetFooter className='mt-8'>
          <Button onClick={handleUpdate} disabled={!hasChanges}>
            Save Changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
