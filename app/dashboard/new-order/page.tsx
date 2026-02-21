"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  Loader2,
  Ruler,
  Upload,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import React, { ChangeEvent, useState } from "react";
import { toast } from "sonner";

interface MaleMeasurements {
  forehead: string;
  forearm: string;
  wrist: string;
  torsoCircum: string;
  pantsLength: string;
  chest: string;
  chestAtAmpits: string;
  thigh: string;
  thighAtCrotch: string;
  midThigh: string;
  knee: string;
  belowKnee: string;
  calf: string;
  ankle: string;
  bicep: string;
  elbow: string;
  waist: string;
  hips: string;
  shoulders: string;
  sleeveLength: string;
  topLength: string;
  trouserLength: string;
  neck: string;
}

interface FemaleMeasurements {
  neck: string;
  bust: string;
  overBust: string;
  underBust: string;
  neckToHeel: string;
  neckToAboveKnee: string;
  armLength: string;
  shoulderSeam: string;
  armHole: string;
  foreArm: string;
  vNeckCut: string;
  aboveKneeToAnkle: string;
  waistToAboveKnee: string;
  waist: string;
  hips: string;
  shoulders: string;
  sleeveLength: string;
  armhole: string;
  skirtLength: string;
  blouseLength: string;
}

interface FormData {
  name: string;
  phone: string;
  email: string;
  garmentType: string;
  gender: "male" | "female" | "";
  collectionDate: Date | undefined;
  maleMeasurements: MaleMeasurements;
  femaleMeasurements: FemaleMeasurements;
  fabricPhoto: File | null;
  fabricPhotoPreview: string | null;
  fabricPhotoStorageId?: Id<"_storage">;
  fabricType: string;
  specialInstructions: string;
}

interface ValidationErrors {
  [key: string]: string;
}

// Function to compress image (resize and reduce quality)
const compressImage = async (
  file: File,
  maxWidth = 1024,
  quality = 0.7,
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (e) => {
      const img = new window.Image();
      img.src = e.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        // Calculate new dimensions
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw and compress image
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to compress image"));
              return;
            }

            const compressedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          "image/jpeg",
          quality,
        );
      };

      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };
  });
};

const TailorForm: React.FC = () => {
  const createOrder = useMutation(api.orders.createOrder);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    phone: "",
    email: "",
    garmentType: "",
    gender: "",
    collectionDate: undefined,
    maleMeasurements: {
      forehead: "",
      forearm: "",
      wrist: "",
      torsoCircum: "",
      pantsLength: "",
      chest: "",
      chestAtAmpits: "",
      thigh: "",
      thighAtCrotch: "",
      midThigh: "",
      knee: "",
      belowKnee: "",
      calf: "",
      ankle: "",
      bicep: "",
      elbow: "",
      waist: "",
      hips: "",
      shoulders: "",
      sleeveLength: "",
      topLength: "",
      trouserLength: "",
      neck: "",
    },
    femaleMeasurements: {
      neck: "",
      bust: "",
      overBust: "",
      underBust: "",
      neckToHeel: "",
      neckToAboveKnee: "",
      armLength: "",
      shoulderSeam: "",
      armHole: "",
      foreArm: "",
      vNeckCut: "",
      aboveKneeToAnkle: "",
      waistToAboveKnee: "",
      waist: "",
      hips: "",
      shoulders: "",
      sleeveLength: "",
      armhole: "",
      skirtLength: "",
      blouseLength: "",
    },
    fabricPhoto: null,
    fabricPhotoPreview: null,
    fabricType: "",
    specialInstructions: "",
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
    const [calendarOpen, setCalendarOpen] = useState(false);


  const updateFormData = <K extends keyof FormData>(
    field: K,
    value: FormData[K],
  ): void => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const updateMeasurement = (
    gender: "male" | "female",
    field: keyof MaleMeasurements | keyof FemaleMeasurements,
    value: string,
  ): void => {
    const measurementKey =
      gender === "male" ? "maleMeasurements" : "femaleMeasurements";
    setFormData((prev) => ({
      ...prev,
      [measurementKey]: {
        ...prev[measurementKey],
        [field]: value,
      },
    }));
  };

  const handleFileUpload = async (
    e: ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file type", {
        description: "Please upload an image file (PNG, JPG, etc.)",
      });
      return;
    }

    // Validate file size (2MB limit after compression)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large", {
        description: "Please upload an image smaller than 10MB",
      });
      return;
    }

    setIsCompressing(true);

    try {
      // Compress the image
      const compressedFile = await compressImage(file, 1024, 0.7);

      console.log("Original size:", (file.size / 1024 / 1024).toFixed(2), "MB");
      console.log(
        "Compressed size:",
        (compressedFile.size / 1024 / 1024).toFixed(2),
        "MB",
      );

      if (compressedFile.size > 2 * 1024 * 1024) {
        // If still too large, compress more aggressively
        const moreCompressedFile = await compressImage(file, 800, 0.6);
        updateFormData("fabricPhoto", moreCompressedFile);
      } else {
        updateFormData("fabricPhoto", compressedFile);
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        updateFormData("fabricPhotoPreview", reader.result as string);
        setIsCompressing(false);
      };
      reader.readAsDataURL(compressedFile);

      toast.success("Image compressed successfully", {
        description: "Photo optimized for upload",
      });
    } catch (error) {
      console.error("Compression error:", error);
      toast.error("Compression failed", {
        description: "Uploading original image",
      });

      // Fallback to original file
      updateFormData("fabricPhoto", file);
      const reader = new FileReader();
      reader.onloadend = () => {
        updateFormData("fabricPhotoPreview", reader.result as string);
        setIsCompressing(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = (): void => {
    updateFormData("fabricPhoto", null);
    updateFormData("fabricPhotoPreview", null);
  };

  const validateStep = (step: number): boolean => {
    const newErrors: ValidationErrors = {};

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = "Name is required";
      if (!formData.phone.trim()) newErrors.phone = "Phone is required";
      if (!formData.email.trim()) {
        newErrors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Invalid email format";
      }
      if (!formData.garmentType.trim())
        newErrors.garmentType = "Garment type is required";
      if (!formData.gender) newErrors.gender = "Gender is required";
      if (!formData.collectionDate)
        newErrors.collectionDate = "Collection date is required";
    }

    if (step === 2) {
      if (!formData.gender) {
        newErrors.gender = "Gender must be selected first";
      } else {
        const measurements =
          formData.gender === "male"
            ? formData.maleMeasurements
            : formData.femaleMeasurements;
        let hasEmptyMeasurement = false;

        Object.entries(measurements).forEach(([key, value]) => {
          if (!value.trim()) {
            newErrors[key] = "Required";
            hasEmptyMeasurement = true;
          }
        });

        if (hasEmptyMeasurement) {
          toast.error("Missing measurements", {
            description: "Please fill in all measurement fields",
          });
        }
      }
    }

    if (step === 3) {
      if (!formData.fabricType.trim())
        newErrors.fabricType = "Fabric type is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = (): void => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    } else {
      toast.error("Validation Error", {
        description: "Please fill in all required fields correctly",
      });
    }
  };

  const prevStep = (): void => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (): Promise<void> => {
    setIsSubmitting(true);

    try {
      // Validate final step
      if (!validateStep(currentStep)) {
        setIsSubmitting(false);
        return;
      }

      // Ensure gender is set
      if (
        !formData.gender ||
        (formData.gender !== "male" && formData.gender !== "female")
      ) {
        toast.error("Invalid gender", {
          description: "Please select a valid gender",
        });
        setIsSubmitting(false);
        return;
      }

      // Ensure collection date is set
      if (!formData.collectionDate) {
        toast.error("Collection date required", {
          description: "Please select a collection date",
        });
        setIsSubmitting(false);
        return;
      }

      let fabricPhotoStorageId: Id<"_storage"> | null = null;

      // Upload fabric photo if exists
      if (formData.fabricPhoto) {
        try {
          const uploadUrl = await generateUploadUrl();

          const result = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": formData.fabricPhoto.type },
            body: formData.fabricPhoto,
          });

          if (!result.ok) {
            throw new Error("Failed to upload fabric photo");
          }

          const json = await result.json();
          fabricPhotoStorageId = json.storageId as Id<"_storage">;
        } catch (uploadError) {
          console.error("Upload error:", uploadError);
          toast.error("Upload Failed", {
            description:
              "Failed to upload fabric photo. Continuing without photo.",
          });
        }
      }

      // Create a dummy storage ID for orders without photos
      if (!fabricPhotoStorageId) {
        // We need to provide a valid storage ID even for no photos
        // Create a minimal placeholder image
        const canvas = document.createElement("canvas");
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, 1, 1);
        }

        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, "image/jpeg", 0.1);
        });

        if (blob) {
          const placeholderFile = new File([blob], "placeholder.jpg", {
            type: "image/jpeg",
          });
          try {
            const uploadUrl = await generateUploadUrl();
            const result = await fetch(uploadUrl, {
              method: "POST",
              headers: { "Content-Type": placeholderFile.type },
              body: placeholderFile,
            });

            if (result.ok) {
              const json = await result.json();
              fabricPhotoStorageId = json.storageId as Id<"_storage">;
            }
          } catch (error) {
            console.error("Failed to create placeholder:", error);
          }
        }
      }

      // Ensure we have a storage ID
      if (!fabricPhotoStorageId) {
        throw new Error("Failed to process fabric photo. Please try again.");
      }

      // Prepare order data based on gender
      const baseOrderData = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim().toLowerCase(),
        garmentType: formData.garmentType.trim(),
        gender: formData.gender,
        expectedCollectionDate: formData.collectionDate.getTime(),
        fabricSample: {
          fabricType: formData.fabricType.trim(),
          fabricPhotoStorageId: fabricPhotoStorageId!,
          ...(formData.fabricPhotoPreview
            ? { fabricPhotoUrl: formData.fabricPhotoPreview }
            : {}),
        },
        ...(formData.specialInstructions
          ? { specialInstructions: formData.specialInstructions.trim() }
          : {}),
      };

      // Add appropriate measurements based on gender
      const orderData =
        formData.gender === "male"
          ? {
              ...baseOrderData,
              maleMeasurements: formData.maleMeasurements,
            }
          : {
              ...baseOrderData,
              femaleMeasurements: formData.femaleMeasurements,
            };

      // Create order in Convex
      const result = await createOrder(orderData);

      toast.success("Order Created Successfully! 🎉", {
        description: `Order Number: ${result.orderNumber}`,
      });

      // Reset form
      setFormData({
        name: "",
        phone: "",
        email: "",
        garmentType: "",
        gender: "",
        collectionDate: undefined,
        maleMeasurements: {
          forehead: "",
          forearm: "",
          wrist: "",
          torsoCircum: "",
          pantsLength: "",
          chest: "",
          chestAtAmpits: "",
          thigh: "",
          thighAtCrotch: "",
          midThigh: "",
          knee: "",
          belowKnee: "",
          calf: "",
          ankle: "",
          bicep: "",
          elbow: "",
          waist: "",
          hips: "",
          shoulders: "",
          sleeveLength: "",
          topLength: "",
          trouserLength: "",
          neck: "",
        },
        femaleMeasurements: {
          neck: "",
          bust: "",
          overBust: "",
          underBust: "",
          neckToHeel: "",
          neckToAboveKnee: "",
          armLength: "",
          shoulderSeam: "",
          armHole: "",
          foreArm: "",
          vNeckCut: "",
          aboveKneeToAnkle: "",
          waistToAboveKnee: "",
          waist: "",
          hips: "",
          shoulders: "",
          sleeveLength: "",
          armhole: "",
          skirtLength: "",
          blouseLength: "",
        },
        fabricPhoto: null,
        fabricPhotoPreview: null,
        fabricType: "",
        specialInstructions: "",
      });

      setCurrentStep(1);
      setErrors({});
    } catch (error) {
      console.error("Error creating order:", error);

      toast.error("Order Creation Failed", {
        description:
          error instanceof Error
            ? error.message
            : "Failed to create order. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  const fabricTypes: string[] = [
    "Cotton",
    "Silk",
    "Linen",
    "Wool",
    "Polyester",
    "Denim",
    "Chiffon",
    "Lace",
    "Ankara",
  ];

  // Get the appropriate measurements based on gender
  const getCurrentMeasurements = (): MaleMeasurements | FemaleMeasurements => {
    if (formData.gender === "male") {
      return formData.maleMeasurements;
    } else if (formData.gender === "female") {
      return formData.femaleMeasurements;
    }
    return {} as MaleMeasurements;
  };

  return (
    <div className='min-h-screen pt-4 pb-8'>
      <div className='max-w-2xl mx-auto'>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-8'>
          <div>
            <h1 className='text-3xl font-bold'>Tailor Order Form</h1>
            <p className='text-muted-foreground'>
              Let&apos;s create a perfect garment
            </p>
          </div>
        </motion.div>

        {/* Progress Bar */}
        <div className='mb-8'>
          <div className='flex items-center justify-between mb-3'>
            {[1, 2, 3, 4].map((step) => (
              <React.Fragment key={step}>
                <div className='flex flex-col items-center'>
                  <motion.div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      currentStep >= step
                        ? "bg-primary text-primary-foreground shadow-lg"
                        : "bg-background text-muted-foreground border-2 border-border"
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}>
                    {currentStep > step ? <Check size={20} /> : step}
                  </motion.div>
                  <span className='text-xs mt-2 text-muted-foreground hidden sm:block'>
                    {step === 1 && "Info"}
                    {step === 2 && "Measure"}
                    {step === 3 && "Fabric"}
                    {step === 4 && "Review"}
                  </span>
                </div>
                {step < 4 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded transition-all ${
                      currentStep > step ? "bg-primary" : "bg-border"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <motion.div
          className='rounded-2xl shadow-xl overflow-hidden border'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}>
          <div className='p-6 md:p-8'>
            <AnimatePresence mode='wait'>
              {/* Step 1: Client Info */}
              {currentStep === 1 && (
                <motion.div
                  key='step1'
                  variants={pageVariants}
                  initial='initial'
                  animate='animate'
                  exit='exit'
                  transition={{ duration: 0.3 }}>
                  <div className='flex items-center gap-3 mb-6'>
                    <div className='w-12 h-12 rounded-xl flex items-center justify-center border'>
                      <User className='text-primary' size={24} />
                    </div>
                    <h2 className='text-2xl font-bold'>Client Information</h2>
                  </div>

                  <div className='space-y-5'>
                    <div className='space-y-2'>
                      <Label htmlFor='name'>Full Name *</Label>
                      <Input
                        id='name'
                        type='text'
                        value={formData.name}
                        onChange={(e) => updateFormData("name", e.target.value)}
                        placeholder='Enter full name'
                        className={errors.name ? "border-red-300" : ""}
                      />
                      {errors.name && (
                        <p className='text-red-500 text-sm'>{errors.name}</p>
                      )}
                    </div>

                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                      <div className='space-y-2'>
                        <Label htmlFor='phone'>Phone Number *</Label>
                        <Input
                          id='phone'
                          type='tel'
                          value={formData.phone}
                          onChange={(e) =>
                            updateFormData("phone", e.target.value)
                          }
                          placeholder='+234 xxx xxxx xxx'
                          className={errors.phone ? "border-red-300" : ""}
                        />
                        {errors.phone && (
                          <p className='text-red-500 text-sm'>{errors.phone}</p>
                        )}
                      </div>

                      <div className='space-y-2'>
                        <Label htmlFor='email'>Email *</Label>
                        <Input
                          id='email'
                          type='email'
                          value={formData.email}
                          onChange={(e) =>
                            updateFormData("email", e.target.value)
                          }
                          placeholder='email@example.com'
                          className={errors.email ? "border-red-300" : ""}
                        />
                        {errors.email && (
                          <p className='text-red-500 text-sm'>{errors.email}</p>
                        )}
                      </div>
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='garmentType'>Garment Type *</Label>
                      <Input
                        id='garmentType'
                        type='text'
                        value={formData.garmentType}
                        onChange={(e) =>
                          updateFormData("garmentType", e.target.value)
                        }
                        placeholder='e.g., Agbada, Kaftan, Suit'
                        className={errors.garmentType ? "border-red-300" : ""}
                      />
                      {errors.garmentType && (
                        <p className='text-red-500 text-sm'>
                          {errors.garmentType}
                        </p>
                      )}
                    </div>

                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                      <div className='space-y-3'>
                        <Label>Gender *</Label>
                        <RadioGroup
                          value={formData.gender}
                          onValueChange={(value) =>
                            updateFormData("gender", value as "male" | "female")
                          }>
                          <div className='grid grid-cols-2 gap-4 border p-2.5 rounded-lg'>
                            <div>
                              <Label
                                htmlFor='male'
                                className='flex items-center justify-center space-x-1 rounded-xl cursor-pointer transition-all'>
                                <RadioGroupItem value='male' id='male' />
                                <span className='font-medium'>Male</span>
                              </Label>
                            </div>
                            <div>
                              <Label
                                htmlFor='female'
                                className='flex items-center justify-center space-x-1 rounded-xl cursor-pointer transition-all'>
                                <RadioGroupItem value='female' id='female' />
                                <span className='font-medium'>Female</span>
                              </Label>
                            </div>
                          </div>
                        </RadioGroup>
                        {errors.gender && (
                          <p className='text-red-500 text-sm'>
                            {errors.gender}
                          </p>
                        )}
                      </div>

                      <div className='space-y-2'>
                        <Label>Collection Date *</Label>
                        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant='outline'
                              className={`w-full justify-start text-left font-normal ${
                                !formData.collectionDate &&
                                "text-muted-foreground"
                              } ${errors.collectionDate ? "border-red-300" : ""}`}>
                              <CalendarIcon className='mr-2 h-4 w-4' />
                              {formData.collectionDate
                                ? format(formData.collectionDate, "PPP")
                                : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className='w-auto p-0' align='start'>
                            <Calendar
                              mode='single'
                              selected={formData.collectionDate}
                              onSelect={(date) =>
                              {
                                updateFormData("collectionDate", date)
                                if (date) setCalendarOpen(false)
                              }}
                              initialFocus
                              disabled={(date) =>
                                date < new Date(new Date().setHours(0, 0, 0, 0))
                              }
                            />
                          </PopoverContent>
                        </Popover>
                        {errors.collectionDate && (
                          <p className='text-red-500 text-sm'>
                            {errors.collectionDate}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Measurements */}
              {currentStep === 2 && (
                <motion.div
                  key='step2'
                  variants={pageVariants}
                  initial='initial'
                  animate='animate'
                  exit='exit'
                  transition={{ duration: 0.3 }}>
                  <div className='flex items-center gap-3 mb-6'>
                    <div className='w-12 h-12 rounded-xl flex items-center justify-center border'>
                      <Ruler className='text-primary' size={24} />
                    </div>
                    <h2 className='text-2xl font-bold'>
                      {formData.gender === "male" ? "Male" : "Female"}{" "}
                      Measurements
                    </h2>
                  </div>

                  {!formData.gender ? (
                    <div className='text-center py-8'>
                      <p className='text-muted-foreground mb-4'>
                        Please select gender in Step 1 to view measurements
                      </p>
                      <Button
                        onClick={() => setCurrentStep(1)}
                        variant='outline'>
                        Go Back to Step 1
                      </Button>
                    </div>
                  ) : formData.gender === "male" ? (
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                      {(
                        Object.keys(formData.maleMeasurements) as Array<
                          keyof MaleMeasurements
                        >
                      ).map((key) => (
                        <div key={key} className='space-y-2'>
                          <Label htmlFor={key} className='capitalize'>
                            {key.replace(/([A-Z])/g, " $1").trim()} *
                          </Label>
                          <Input
                            id={key}
                            value={formData.maleMeasurements[key]}
                            onChange={(e) =>
                              updateMeasurement("male", key, e.target.value)
                            }
                            className={errors[key] ? "border-red-300" : ""}
                          />
                          {errors[key] && (
                            <p className='text-red-500 text-sm'>
                              {errors[key]}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                      {(
                        Object.keys(formData.femaleMeasurements) as Array<
                          keyof FemaleMeasurements
                        >
                      ).map((key) => (
                        <div key={key} className='space-y-2'>
                          <Label htmlFor={key} className='capitalize'>
                            {key.replace(/([A-Z])/g, " $1").trim()} *
                          </Label>
                          <Input
                            id={key}
                            value={formData.femaleMeasurements[key]}
                            onChange={(e) =>
                              updateMeasurement("female", key, e.target.value)
                            }
                            className={errors[key] ? "border-red-300" : ""}
                          />
                          {errors[key] && (
                            <p className='text-red-500 text-sm'>
                              {errors[key]}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 3: Fabric Details */}
              {currentStep === 3 && (
                <motion.div
                  key='step3'
                  variants={pageVariants}
                  initial='initial'
                  animate='animate'
                  exit='exit'
                  transition={{ duration: 0.3 }}>
                  <div className='flex items-center gap-3 mb-6'>
                    <div className='w-12 h-12 rounded-xl flex items-center justify-center border'>
                      <ImageIcon className='text-primary' size={24} />
                    </div>
                    <h2 className='text-2xl font-bold'>Fabric Details</h2>
                  </div>

                  <div className='space-y-6'>
                    <div className='space-y-3'>
                      <Label>Fabric Photo (Optional)</Label>
                      {!formData.fabricPhotoPreview ? (
                        <label className='block'>
                          <input
                            type='file'
                            accept='image/*'
                            onChange={handleFileUpload}
                            className='hidden'
                            disabled={isCompressing}
                          />
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                              isCompressing
                                ? "opacity-50 cursor-not-allowed"
                                : "cursor-pointer hover:border-primary"
                            }`}>
                            {isCompressing ? (
                              <>
                                <Loader2
                                  className='mx-auto mb-3 text-primary animate-spin'
                                  size={40}
                                />
                                <p className='font-medium mb-1'>
                                  Compressing image...
                                </p>
                                <p className='text-sm text-muted-foreground'>
                                  Please wait
                                </p>
                              </>
                            ) : (
                              <>
                                <Upload
                                  className='mx-auto mb-3 text-muted-foreground'
                                  size={40}
                                />
                                <p className='font-medium mb-1'>
                                  Click to upload fabric photo
                                </p>
                                <p className='text-sm text-muted-foreground'>
                                  PNG, JPG up to 10MB (auto-compressed)
                                </p>
                              </>
                            )}
                          </motion.div>
                        </label>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className='relative rounded-xl overflow-hidden border-2'>
                          <div className='relative w-full h-64'>
                            <Image
                              src={formData.fabricPhotoPreview}
                              alt='Fabric preview'
                              fill
                              className='object-cover'
                              sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
                              priority
                            />
                          </div>
                          <div className='absolute top-3 right-3 flex gap-2'>
                            <label>
                              <input
                                type='file'
                                accept='image/*'
                                onChange={handleFileUpload}
                                className='hidden'
                                disabled={isCompressing}
                              />
                              <Button
                                type='button'
                                size='icon'
                                variant='secondary'
                                className='h-9 w-9'
                                disabled={isCompressing}>
                                <Upload size={18} />
                              </Button>
                            </label>
                            <Button
                              type='button'
                              size='icon'
                              variant='secondary'
                              className='h-9 w-9 hover:bg-red-50'
                              onClick={removePhoto}
                              disabled={isCompressing}>
                              <X size={18} className='text-red-600' />
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='fabricType'>Fabric Type *</Label>
                      <Select
                        value={formData.fabricType}
                        onValueChange={(value) =>
                          updateFormData("fabricType", value)
                        }>
                        <SelectTrigger
                          className={errors.fabricType ? "border-red-300" : ""}>
                          <SelectValue placeholder='Select fabric type' />
                        </SelectTrigger>
                        <SelectContent>
                          {fabricTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.fabricType && (
                        <p className='text-red-500 text-sm'>
                          {errors.fabricType}
                        </p>
                      )}
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='specialInstructions'>
                        Special Instructions (Optional)
                      </Label>
                      <Textarea
                        id='specialInstructions'
                        value={formData.specialInstructions}
                        onChange={(e) =>
                          updateFormData("specialInstructions", e.target.value)
                        }
                        placeholder='Any special requirements or notes...'
                        rows={3}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Review */}
              {currentStep === 4 && (
                <motion.div
                  key='step4'
                  variants={pageVariants}
                  initial='initial'
                  animate='animate'
                  exit='exit'
                  transition={{ duration: 0.3 }}>
                  <div className='flex items-center gap-3 mb-6'>
                    <div className='w-12 h-12 rounded-xl flex items-center justify-center border bg-green-50'>
                      <FileText className='text-green-600' size={24} />
                    </div>
                    <h2 className='text-2xl font-bold'>Review & Confirm</h2>
                  </div>

                  <div className='space-y-6'>
                    {/* Client Info */}
                    <div className='bg-muted rounded-xl p-5'>
                      <h3 className='font-semibold mb-3 flex items-center gap-2'>
                        <User size={18} className='text-primary' />
                        Client Information
                      </h3>
                      <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm'>
                        <div>
                          <span className='text-muted-foreground'>Name:</span>{" "}
                          <span className='font-medium'>{formData.name}</span>
                        </div>
                        <div>
                          <span className='text-muted-foreground'>Phone:</span>{" "}
                          <span className='font-medium'>{formData.phone}</span>
                        </div>
                        <div>
                          <span className='text-muted-foreground'>Email:</span>{" "}
                          <span className='font-medium'>{formData.email}</span>
                        </div>
                        <div>
                          <span className='text-muted-foreground'>
                            Garment:
                          </span>{" "}
                          <span className='font-medium'>
                            {formData.garmentType}
                          </span>
                        </div>
                        <div>
                          <span className='text-muted-foreground'>Gender:</span>{" "}
                          <span className='font-medium capitalize'>
                            {formData.gender}
                          </span>
                        </div>
                        <div>
                          <span className='text-muted-foreground'>
                            Collection:
                          </span>{" "}
                          <span className='font-medium'>
                            {formData.collectionDate
                              ? format(formData.collectionDate, "PPP")
                              : "Not set"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Measurements */}
                    <div className='bg-muted rounded-xl p-5'>
                      <h3 className='font-semibold mb-3 flex items-center gap-2'>
                        <Ruler size={18} className='text-primary' />
                        Measurements
                      </h3>
                      <div className='grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm'>
                        {formData.gender &&
                          Object.entries(getCurrentMeasurements()).map(
                            ([key, value]) => (
                              <div key={key}>
                                <span className='text-muted-foreground capitalize block'>
                                  {key.replace(/([A-Z])/g, " $1").trim()}:
                                </span>
                                <span className='font-medium'>
                                  {value}&quot;
                                </span>
                              </div>
                            ),
                          )}
                      </div>
                    </div>

                    {/* Fabric Details */}
                    <div className='bg-muted rounded-xl p-5'>
                      <h3 className='font-semibold mb-3 flex items-center gap-2'>
                        <ImageIcon size={18} className='text-primary' />
                        Fabric Details
                      </h3>
                      {formData.fabricPhotoPreview && (
                        <div className='relative w-full h-48 rounded-lg overflow-hidden mb-3'>
                          <Image
                            src={formData.fabricPhotoPreview}
                            alt='Fabric'
                            fill
                            className='object-cover'
                            sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
                          />
                        </div>
                      )}
                      <div className='text-sm mb-3'>
                        <div>
                          <span className='text-muted-foreground'>Type:</span>{" "}
                          <span className='font-medium'>
                            {formData.fabricType}
                          </span>
                        </div>
                      </div>
                      {formData.specialInstructions && (
                        <div>
                          <span className='text-muted-foreground text-sm'>
                            Special Instructions:
                          </span>
                          <p className='font-medium text-sm mt-1'>
                            {formData.specialInstructions}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className='px-6 py-4 md:px-8 flex justify-between items-center border-t'>
            {currentStep > 1 ? (
              <Button
                variant='ghost'
                onClick={prevStep}
                className='gap-2'
                disabled={isSubmitting || isCompressing}>
                <ChevronLeft size={20} />
                Back
              </Button>
            ) : (
              <div />
            )}

            {currentStep < 4 ? (
              <Button
                onClick={nextStep}
                className='gap-2'
                disabled={isCompressing}>
                Next
                <ChevronRight size={20} />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                className='gap-2'
                disabled={isSubmitting || isCompressing}>
                {isSubmitting ? (
                  <>
                    <Loader2 size={20} className='animate-spin' />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Check size={20} />
                    Submit Order
                  </>
                )}
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TailorForm;
