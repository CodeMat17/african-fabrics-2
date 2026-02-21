// components/dashboard/staff/UpdateStaff.tsx - Update the interface
"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";

// Convex
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// UI Components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Icons
import { Loader2, Save } from "lucide-react";

// Types
type StaffRole =
  | "admin"
  | "tailor"
  | "beader"
  | "qc_officer"
  | "fitting_officer"
  | "consultant";

type AvailabilityStatus = "available" | "busy";

interface UpdateStaffProps {
  staff: {
    _id: Id<"staff">;
    email: string;
    name: string;
    role: StaffRole;
    phone: string;
    availabilityStatus: AvailabilityStatus;
    hireDate: number;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStaffUpdated: () => void;
}

export default function UpdateStaff({
  staff,
  open,
  onOpenChange,
  onStaffUpdated,
}: UpdateStaffProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: staff.name,
    email: staff.email,
    phone: staff.phone,
    role: staff.role,
    availabilityStatus: staff.availabilityStatus,
  });

  const updateStaff = useMutation(api.staff.updateStaff);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      await updateStaff({
        staffId: staff._id,
        ...formData,
      });

      toast.success("Staff member updated successfully");
      onStaffUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating staff:", error);
      toast.error("Failed to update staff member");
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleOptions: Array<{ value: StaffRole; label: string }> = [
    { value: "admin", label: "Admin Manager" },
    { value: "tailor", label: "Tailor" },
    { value: "beader", label: "Beader" },
    { value: "qc_officer", label: "QC Officer" },
    { value: "fitting_officer", label: "Fitting Officer" },
    { value: "consultant", label: "Consultant" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Update Staff Member</DialogTitle>
          <DialogDescription>Update details for {staff.name}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className='grid gap-4 py-4'>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='name' className='text-right'>
                Name
              </Label>
              <Input
                id='name'
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className='col-span-3'
                required
              />
            </div>

            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='email' className='text-right'>
                Email
              </Label>
              <Input
                id='email'
                type='email'
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className='col-span-3'
                required
              />
            </div>

            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='phone' className='text-right'>
                Phone
              </Label>
              <Input
                id='phone'
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className='col-span-3'
                required
              />
            </div>

            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='role' className='text-right'>
                Role
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  handleChange("role", value as StaffRole)
                }>
                <SelectTrigger className='col-span-3'>
                  <SelectValue placeholder='Select role' />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='status' className='text-right'>
                Status
              </Label>
              <Select
                value={formData.availabilityStatus}
                onValueChange={(value) =>
                  handleChange(
                    "availabilityStatus",
                    value as AvailabilityStatus
                  )
                }>
                <SelectTrigger className='col-span-3'>
                  <SelectValue placeholder='Select status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='available'>Available</SelectItem>
                  <SelectItem value='busy'>Busy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  Updating...
                </>
              ) : (
                <>
                  <Save className='h-4 w-4 mr-2' />
                  Update Staff
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
