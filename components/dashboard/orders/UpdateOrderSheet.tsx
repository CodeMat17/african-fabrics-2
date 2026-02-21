"use client";

import { useState, useMemo, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  CalendarIcon,
  Loader2,
  Upload,
  X,
  User,
  Phone,
  Mail,
  Ruler,
  Package,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfToday } from "date-fns";
import Image from "next/image";
import imageCompression from "browser-image-compression";

type Order = Doc<"orders">;
type MaleMeasurements = NonNullable<Order["maleMeasurements"]>;
type FemaleMeasurements = NonNullable<Order["femaleMeasurements"]>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
}

// Field labels for better UX
const MALE_MEASUREMENT_LABELS: Record<keyof MaleMeasurements, string> = {
  forehead: "Forehead",
  forearm: "Forearm",
  wrist: "Wrist",
  torsoCircum: "Torso Circumference",
  pantsLength: "Pants Length",
  chest: "Chest",
  chestAtAmpits: "Chest at Armpits",
  thighAtCrotch: "Thigh at Crotch",
  midThigh: "Mid Thigh",
  knee: "Knee",
  belowKnee: "Below Knee",
  calf: "Calf",
  ankle: "Ankle",
  bicep: "Bicep",
  elbow: "Elbow",
  waist: "Waist",
  hips: "Hips",
  shoulders: "Shoulders",
  sleeveLength: "Sleeve Length",
  topLength: "Top Length",
  trouserLength: "Trouser Length",
  thigh: "Thigh",
  neck: "Neck",
};

const FEMALE_MEASUREMENT_LABELS: Record<keyof FemaleMeasurements, string> = {
  neck: "Neck",
  bust: "Bust",
  overBust: "Over Bust",
  underBust: "Under Bust",
  neckToHeel: "Neck to Heel",
  neckToAboveKnee: "Neck to Above Knee",
  armLength: "Arm Length",
  shoulderSeam: "Shoulder Seam",
  armHole: "Arm Hole",
  foreArm: "Forearm",
  vNeckCut: "V-Neck Cut",
  aboveKneeToAnkle: "Above Knee to Ankle",
  waistToAboveKnee: "Waist to Above Knee",
  waist: "Waist",
  hips: "Hips",
  shoulders: "Shoulders",
  sleeveLength: "Sleeve Length",
  armhole: "Armhole",
  skirtLength: "Skirt Length",
  blouseLength: "Blouse Length",
};

export default function UpdateOrderSheet({ open, onOpenChange, order }: Props) {
  const updateOrder = useMutation(api.orders.updateOrder);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState<string>(order.name);
  const [phone, setPhone] = useState<string>(order.phone);
  const [email, setEmail] = useState<string>(order.email);
  const [garmentType, setGarmentType] = useState<string>(order.garmentType);
  const [collectionDate, setCollectionDate] = useState<Date | undefined>(
    order.expectedCollectionDate
      ? new Date(order.expectedCollectionDate)
      : undefined,
  );
  const [specialInstructions, setSpecialInstructions] = useState<string>(
    order.specialInstructions ?? "",
  );
  const [fabricType, setFabricType] = useState<string>(
    order.fabricSample?.fabricType ?? "",
  );

  const [calendarOpen, setCalendarOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const [fabricPhoto, setFabricPhoto] = useState<File | null>(null);
  const [fabricPhotoPreview, setFabricPhotoPreview] = useState<string | null>(
    order.fabricSample?.fabricPhotoUrl ?? null,
  );
  const [fabricPhotoStorageId, setFabricPhotoStorageId] =
    useState<Id<"_storage"> | null>(
      order.fabricSample?.fabricPhotoStorageId ?? null,
    );

  const isMale = order.gender === "male";
  const isCollected = order.collected;

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
      armhole: order.femaleMeasurements?.armhole ?? "",
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

  const measurementLabels = isMale
    ? MALE_MEASUREMENT_LABELS
    : FEMALE_MEASUREMENT_LABELS;

  function handleMeasurementChange(
    key: keyof MaleMeasurements | keyof FemaleMeasurements,
    value: string,
  ) {
    if (isMale) {
      setMaleMeasurements((prev) => ({ ...prev, [key]: value }));
    } else {
      setFemaleMeasurements((prev) => ({ ...prev, [key]: value }));
    }
  }

  function handleFabricPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Invalid File", {
        description: "Please upload an image file",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File Too Large", { description: "Image must be under 5MB" });
      return;
    }

    setFabricPhoto(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setFabricPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveFabricPhoto() {
    setFabricPhoto(null);
    setFabricPhotoPreview(order.fabricSample?.fabricPhotoUrl ?? null);
    setFabricPhotoStorageId(order.fabricSample?.fabricPhotoStorageId ?? null);

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function compressImage(file: File): Promise<File> {
    return imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 2000,
      useWebWorker: true,
    });
  }

  async function uploadFabricPhoto(): Promise<Id<"_storage"> | null> {
    if (!fabricPhoto) return null;

    setUploading(true);
    setUploadProgress(0);

    try {
      const compressed = await compressImage(fabricPhoto);
      const uploadUrl = await generateUploadUrl();

      const xhr = new XMLHttpRequest();

      const storageId = await new Promise<Id<"_storage">>((resolve, reject) => {
        xhr.upload.onprogress = (event) => {
          if (!event.lengthComputable) return;
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        };

        xhr.onload = () => {
          if (xhr.status !== 200) {
            reject(new Error("Upload failed"));
            return;
          }

          const response = JSON.parse(xhr.responseText) as {
            storageId: Id<"_storage">;
          };
          resolve(response.storageId);
        };

        xhr.onerror = () => reject(new Error("Upload failed"));

        xhr.open("POST", uploadUrl);
        xhr.setRequestHeader("Content-Type", compressed.type);
        xhr.send(compressed);
      });

      return storageId;
    } catch (err) {
      toast.error("Upload Failed", { description: (err as Error).message });
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!name.trim() || !phone.trim() || !email.trim() || !garmentType.trim()) {
      toast.error("Validation Error", {
        description: "Please fill in all required fields",
      });
      return;
    }

    if (!collectionDate || collectionDate < startOfToday()) {
      toast.error("Invalid Date", {
        description: "Collection date must be today or in the future",
      });
      return;
    }

    setLoading(true);

    try {
      let newStorageId = fabricPhotoStorageId;

      if (fabricPhoto) {
        const id = await uploadFabricPhoto();
        if (id) newStorageId = id;
      }

      await updateOrder({
        orderId: order._id,
        payload: {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          garmentType: garmentType.trim(),
          expectedCollectionDate: collectionDate.getTime(),
          specialInstructions: specialInstructions.trim() || undefined,
          maleMeasurements: isMale ? maleMeasurements : undefined,
          femaleMeasurements: !isMale ? femaleMeasurements : undefined,
          fabricSample: {
            fabricType: fabricType.trim(),
            fabricPhotoStorageId: newStorageId ?? undefined,
            // fabricPhotoUrl: fabricPhotoPreview ?? undefined,
          },
        },
      });

      toast.success("Order Updated", {
        description: `Order #${order.orderNumber} has been updated`,
      });
      onOpenChange(false);
    } catch (err) {
      toast.error("Update Failed", { description: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full sm:max-w-2xl overflow-y-auto'>
        <SheetHeader>
          <SheetTitle className='text-2xl font-bold'>Update Order</SheetTitle>
          <SheetDescription className='flex items-center gap-2'>
            <span>Order #{order.orderNumber}</span>
            <Badge variant='outline' className='capitalize'>
              {order.gender}
            </Badge>
            {isCollected && (
              <Badge className='bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'>
                Collected
              </Badge>
            )}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className='space-y-6 mt-6 px-4'>
          {/* CUSTOMER INFORMATION */}
          <div className='space-y-4'>
            <div className='flex items-center gap-2'>
              <User className='w-5 h-5 text-cyan-500' />
              <h3 className='text-lg font-semibold'>Customer Information</h3>
            </div>

            <div className='grid grid-cols-1 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='name'>
                  Full Name <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='name'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder='John Doe'
                  disabled={loading || isCollected}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='email'>
                  Email Address <span className='text-red-500'>*</span>
                </Label>
                <div className='relative'>
                  <Mail className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
                  <Input
                    id='email'
                    type='email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder='john@example.com'
                    className='pl-10'
                    disabled={loading || isCollected}
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='phone'>
                  Phone Number <span className='text-red-500'>*</span>
                </Label>
                <div className='relative'>
                  <Phone className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
                  <Input
                    id='phone'
                    type='tel'
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder='+1234567890'
                    className='pl-10'
                    disabled={loading || isCollected}
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* ORDER DETAILS */}
          <div className='space-y-4'>
            <div className='flex items-center gap-2'>
              <Package className='w-5 h-5 text-purple-500' />
              <h3 className='text-lg font-semibold'>Order Details</h3>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='garmentType'>
                  Garment Type <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='garmentType'
                  value={garmentType}
                  onChange={(e) => setGarmentType(e.target.value)}
                  placeholder='e.g., Wedding Dress, Suit'
                  disabled={loading || isCollected}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='collectionDate'>
                  Collection Date <span className='text-red-500'>*</span>
                </Label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id='collectionDate'
                      variant='outline'
                      className='w-full justify-start'
                      disabled={loading || isCollected}>
                      <CalendarIcon className='mr-2 h-4 w-4' />
                      {collectionDate
                        ? format(collectionDate, "PPP")
                        : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='p-0' align='start'>
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

            <div className='space-y-2'>
              <Label htmlFor='fabricType'>Fabric Type</Label>
              <Input
                id='fabricType'
                value={fabricType}
                onChange={(e) => setFabricType(e.target.value)}
                placeholder='e.g., Silk, Cotton, Lace'
                disabled={loading || isCollected}
              />
            </div>
          </div>

          <Separator />

          {/* MEASUREMENTS */}
          <div className='space-y-4'>
            <div className='flex items-center gap-2'>
              <Ruler className='w-5 h-5 text-pink-500' />
              <h3 className='text-lg font-semibold'>
                Measurements ({isMale ? "Male" : "Female"})
              </h3>
              <Badge variant='secondary' className='text-xs'>
                {measurementEntries.length} fields
              </Badge>
            </div>

            <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
              {measurementEntries.map(([key, value]) => (
                <div key={String(key)} className='space-y-1.5'>
                  <Label htmlFor={String(key)} className='text-xs'>
                    {measurementLabels[key as keyof typeof measurementLabels]}
                  </Label>
                  <Input
                    id={String(key)}
                    value={value}
                    onChange={(e) =>
                      handleMeasurementChange(key, e.target.value)
                    }
                    placeholder='0'
                    className='h-9'
                    disabled={loading || isCollected}
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* FABRIC PHOTO */}
          <div className='space-y-4'>
            <div className='flex items-center gap-2'>
              <ImageIcon className='w-5 h-5 text-blue-500' />
              <h3 className='text-lg font-semibold'>Fabric Photo</h3>
            </div>

            {fabricPhotoPreview && (
              <div className='relative h-64 w-full rounded-lg overflow-hidden border'>
                <Image
                  src={fabricPhotoPreview}
                  alt='Fabric sample'
                  fill
                  className='object-cover'
                />
                {!isCollected && (
                  <Button
                    type='button'
                    variant='destructive'
                    size='icon'
                    className='absolute top-2 right-2'
                    onClick={handleRemoveFabricPhoto}
                    disabled={loading}>
                    <X className='h-4 w-4' />
                  </Button>
                )}
              </div>
            )}

            {uploading && (
              <div className='space-y-2'>
                <div className='flex justify-between text-sm'>
                  <span className='text-muted-foreground'>Uploading...</span>
                  <span className='font-medium'>{uploadProgress}%</span>
                </div>
                <div className='h-2 w-full bg-muted rounded-full overflow-hidden'>
                  <div
                    className='h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300'
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <Button
              type='button'
              variant='outline'
              className='w-full'
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || uploading || isCollected}>
              <Upload className='w-4 h-4 mr-2' />
              {fabricPhotoPreview ? "Change" : "Upload"} Fabric Photo
            </Button>

            <input
              ref={fileInputRef}
              type='file'
              accept='image/*'
              hidden
              onChange={handleFabricPhotoChange}
            />
          </div>

          <Separator />

          {/* SPECIAL INSTRUCTIONS */}
          <div className='space-y-4'>
            <div className='flex items-center gap-2'>
              <FileText className='w-5 h-5 text-green-500' />
              <h3 className='text-lg font-semibold'>Special Instructions</h3>
            </div>

            <Textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder='Any special requests or notes...'
              rows={4}
              disabled={loading || isCollected}
            />
          </div>

          {/* ACTION BUTTONS */}
          <div className='flex gap-3 pt-4 sticky bottom-0 bg-background py-4 border-t'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={loading || uploading}
              className='flex-1'>
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={loading || uploading || isCollected}
              className='flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700'>
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
        </form>
      </SheetContent>
    </Sheet>
  );
}
