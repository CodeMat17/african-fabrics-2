"use client";

import { useState, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CalendarIcon, Loader2 } from "lucide-react";
import { FemaleMeasurements, MaleMeasurements } from "@/types/order-types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, startOfToday } from "date-fns";

type Order = Doc<"orders">;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
}

export default function UpdateOrderSheet({ open, onOpenChange, order }: Props) {
  const updateOrder = useMutation(api.orders.updateOrder);

  const [name, setName] = useState(order.name);
  const [phone, setPhone] = useState(order.phone);
  const [email, setEmail] = useState(order.email);
  const [garmentType, setGarmentType] = useState(order.garmentType);
  const [collectionDate, setCollectionDate] = useState<Date | undefined>(
    order.expectedCollectionDate
      ? new Date(order.expectedCollectionDate)
      : undefined,
  );
  const [specialInstructions, setSpecialInstructions] = useState(
    order.specialInstructions ?? "",
  );
  const [fabricType, setFabricType] = useState(
    order.fabricSample?.fabricType ?? "",
  );
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const isMale = order.gender === "male";
  const isCollected = order.collected;

  // Initialize measurements as strings
  const [maleMeasurements, setMaleMeasurements] = useState<MaleMeasurements>(
    () => ({
      forehead: order.maleMeasurements?.forehead ?? "",
      forearm: order.maleMeasurements?.forearm ?? "",
      wrist: order.maleMeasurements?.wrist ?? "",
      torsoCircum: order.maleMeasurements?.torsoCircum ?? "",
      pantsLength: order.maleMeasurements?.pantsLength ?? "",
      chest: order.maleMeasurements?.chest ?? "",
      chestAtAmpits: order.maleMeasurements?.chestAtAmpits ?? "",
      thighAtCrotch: order.maleMeasurements?.thighAtCrotch ?? "",
      midThigh: order.maleMeasurements?.midThigh ?? "",
      knee: order.maleMeasurements?.knee ?? "",
      belowKnee: order.maleMeasurements?.belowKnee ?? "",
      calf: order.maleMeasurements?.calf ?? "",
      ankle: order.maleMeasurements?.ankle ?? "",
      bicep: order.maleMeasurements?.bicep ?? "",
      elbow: order.maleMeasurements?.elbow ?? "",
      waist: order.maleMeasurements?.waist ?? "",
      hips: order.maleMeasurements?.hips ?? "",
      shoulders: order.maleMeasurements?.shoulders ?? "",
      sleeveLength: order.maleMeasurements?.sleeveLength ?? "",
      topLength: order.maleMeasurements?.topLength ?? "",
      trouserLength: order.maleMeasurements?.trouserLength ?? "",
      thigh: order.maleMeasurements?.thigh ?? "",
      neck: order.maleMeasurements?.neck ?? "",
    }),
  );

  const [femaleMeasurements, setFemaleMeasurements] =
    useState<FemaleMeasurements>(() => ({
      neck: order.femaleMeasurements?.neck ?? "",
      bust: order.femaleMeasurements?.bust ?? "",
      overBust: order.femaleMeasurements?.overBust ?? "",
      underBust: order.femaleMeasurements?.underBust ?? "",
      neckToHeel: order.femaleMeasurements?.neckToHeel ?? "",
      neckToAboveKnee: order.femaleMeasurements?.neckToAboveKnee ?? "",
      armLength: order.femaleMeasurements?.armLength ?? "",
      shoulderSeam: order.femaleMeasurements?.shoulderSeam ?? "",
      armHole: order.femaleMeasurements?.armHole ?? "",
      foreArm: order.femaleMeasurements?.foreArm ?? "",
      vNeckCut: order.femaleMeasurements?.vNeckCut ?? "",
      aboveKneeToAnkle: order.femaleMeasurements?.aboveKneeToAnkle ?? "",
      waistToAboveKnee: order.femaleMeasurements?.waistToAboveKnee ?? "",
      waist: order.femaleMeasurements?.waist ?? "",
      hips: order.femaleMeasurements?.hips ?? "",
      shoulders: order.femaleMeasurements?.shoulders ?? "",
      sleeveLength: order.femaleMeasurements?.sleeveLength ?? "",
      skirtLength: order.femaleMeasurements?.skirtLength ?? "",
      blouseLength: order.femaleMeasurements?.blouseLength ?? "",
    }));

  const measurementEntries = useMemo(() => {
    return isMale
      ? (Object.entries(maleMeasurements) as [keyof MaleMeasurements, string][])
      : (Object.entries(femaleMeasurements) as [
          keyof FemaleMeasurements,
          string,
        ][]);
  }, [isMale, maleMeasurements, femaleMeasurements]);

  const handleMeasurementChange = (
    key: keyof MaleMeasurements | keyof FemaleMeasurements,
    value: string,
  ) => {
    if (isMale) {
      setMaleMeasurements((prev) => ({ ...prev, [key]: value }));
    } else {
      setFemaleMeasurements((prev) => ({ ...prev, [key]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim() || !phone.trim() || !email.trim() || !garmentType.trim()) {
      toast.error("Required fields missing", {
        description: "Please fill in all required fields",
      });
      return;
    }

    if (!collectionDate || collectionDate < startOfToday()) {
      toast.error("Invalid collection date");
      return;
    }

    setLoading(true);
    try {
      await updateOrder({
        orderId: order._id,
        payload: {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          garmentType: garmentType.trim(),
          expectedCollectionDate: collectionDate.getTime(),
          specialInstructions: specialInstructions.trim() || undefined,
          fabricSample: fabricType.trim()
            ? { fabricType: fabricType.trim() }
            : undefined,
          maleMeasurements: isMale ? maleMeasurements : undefined,
          femaleMeasurements: !isMale ? femaleMeasurements : undefined,
        },
      });

      toast.success("Order Updated", {
        description: "The order has been successfully updated",
      });
      onOpenChange(false);
    } catch (error) {
      toast.error("Update Failed", { description: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full sm:max-w-xl overflow-y-auto'>
        <SheetHeader>
          <SheetTitle className='text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent'>
            Update Order
          </SheetTitle>
          <SheetDescription>Order #{order.orderNumber}</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className='space-y-4 px-4 pb-8'>
          {/* Basic Info */}
          <div className='space-y-2'>
            <Label className='text-sm text-muted-foreground'>
              Customer Name *
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className='space-y-2'>
            <Label className='text-sm text-muted-foreground'>Email *</Label>
            <Input
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className='space-y-2'>
            <Label className='text-sm text-muted-foreground'>Phone *</Label>
            <Input
              type='tel'
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className='grid sm:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label className='text-sm text-muted-foreground'>
                Garment Type *
              </Label>
              <Input
                value={garmentType}
                onChange={(e) => setGarmentType(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className='space-y-2'>
              <Label className='text-sm text-muted-foreground'>
                Collection Date *
              </Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type='button'
                    variant='outline'
                    disabled={loading}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !collectionDate && "text-muted-foreground",
                    )}>
                    <CalendarIcon className='mr-2 h-4 w-4' />
                    {collectionDate ? (
                      format(collectionDate, "PPP")
                    ) : (
                      <span>Select collection date</span>
                    )}
                  </Button>
                </PopoverTrigger>

                <PopoverContent className='w-auto p-0' align='start'>
                  <Calendar
                    mode='single'
                    selected={collectionDate}
                    onSelect={(date) => {
                      setCollectionDate(date);
                      if (date) setCalendarOpen(false);
                    }}
                    disabled={(date) => date < startOfToday()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Measurements */}
          <div className='border rounded-xl p-4 space-y-3'>
            <h3 className='text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
              Measurements ({isMale ? "Male" : "Female"})
            </h3>
            <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
              {measurementEntries.map(([key, value]) => (
                <div key={String(key)} className='space-y-1'>
                  <Label className='text-xs text-muted-foreground capitalize'>
                    {String(key).replace(/([A-Z])/g, " $1")}
                  </Label>
                  <Input
                    value={value}
                    onChange={(e) =>
                      handleMeasurementChange(key, e.target.value)
                    }
                    disabled={loading}
                    className='h-8 text-sm'
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Fabric */}
          <div className='space-y-2'>
            <Label className='text-sm text-muted-foreground'>Fabric Type</Label>
            <Input
              value={fabricType}
              onChange={(e) => setFabricType(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Instructions */}
          <div className='space-y-2'>
            <Label className='text-sm text-muted-foreground'>
              Special Instructions
            </Label>
            <Textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              rows={3}
              disabled={loading}
            />
          </div>

          {/* Actions */}
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
              type='submit'
              disabled={loading || isCollected}
              className='flex-1 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700'>
              {loading ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' /> Updating...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>

          {isCollected && (
            <p className='text-xs text-red-500'>
              This order has been collected and cannot be edited.
            </p>
          )}
        </form>
      </SheetContent>
    </Sheet>
  );
}
