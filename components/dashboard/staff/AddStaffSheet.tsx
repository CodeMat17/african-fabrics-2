"use client";

import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { useState } from "react";

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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";

type StaffRole = "tailor" | "beader" | "fitter" | "qc";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function AddStaffSheet({ open, onOpenChange }: Props) {
  const createStaff = useMutation(api.staff.createStaff);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<StaffRole>("tailor");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) {
      toast.error("All fields are required");
      return;
    }

    try {
      setLoading(true);

      await createStaff({
        name: name.trim(),
        phone: phone.trim(),
        role,
      });

      toast.success("Staff member added successfully");

      // Reset form
      setName("");
      setPhone("");
      setRole("tailor");
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add staff member";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setName("");
    setPhone("");
    setRole("tailor");
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full sm:max-w-lg overflow-y-auto px-4'>
        <SheetHeader>
          <SheetTitle className='text-2xl font-semibold'>
            Add Staff Member
          </SheetTitle>
          <SheetDescription>Create a new staff member profile</SheetDescription>
        </SheetHeader>

        <div className='space-y-6 mt-6'>
          {/* Name */}
          <div className='space-y-2'>
            <Label htmlFor='name' className='text-muted-foreground text-sm'>
              Full Name <span className='text-red-400'>*</span>
            </Label>
            <Input
              id='name'
              placeholder='John Doe'
              value={name}
              onChange={(e) => setName(e.target.value)}
              className=' focus:border-cyan-500'
              disabled={loading}
            />
          </div>

          {/* Phone */}
          <div className='space-y-2'>
            <Label htmlFor='phone' className='text-muted-foreground text-sm'>
              Phone Number <span className='text-red-400'>*</span>
            </Label>
            <Input
              id='phone'
              type='tel'
              placeholder='+234 123 456 7890'
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className=' focus:border-cyan-500 '
              disabled={loading}
            />
          </div>

          {/* Role */}
          <div className='space-y-2'>
            <Label htmlFor='role' className='text-muted-foreground text-sm'>
              Role <span className='text-red-400'>*</span>
            </Label>
            <Select
              value={role}
              onValueChange={(value: StaffRole) => setRole(value)}
              disabled={loading}>
              <SelectTrigger
                id='role'
                className=' focus:border-cyan-500 '>
                <SelectValue placeholder='Select role' />
              </SelectTrigger>
              <SelectContent className=''>
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
              variant='outline'
              onClick={handleCancel}
              disabled={loading}
              className='flex-1 hover:bg-slate-800'>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className='flex-1 hover:to-purple-700'>
              {loading ? (
                <>
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2' />
                  Adding...
                </>
              ) : (
                "Add Staff"
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
