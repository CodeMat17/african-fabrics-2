"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Loader2,
  Upload,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import Papa from "papaparse";

// Type for the CSV structure from the uploaded file
interface CSVRow {
  name: string;
  phone: string;
  email: string;
  garmentType: string;
  gender: string;
  expectedCollectionDate: string;
  fabricPhotoUrl?: string;
  fabricType: string;
  specialInstructions?: string;

  // Male measurements (prefixed with maleMeasurements_)
  maleMeasurements_forehead?: string;
  maleMeasurements_forearm?: string;
  maleMeasurements_wrist?: string;
  maleMeasurements_torsoCircum?: string;
  maleMeasurements_pantsLength?: string;
  maleMeasurements_chest?: string;
  maleMeasurements_chestAtAmpits?: string;
  maleMeasurements_thighAtCrotch?: string;
  maleMeasurements_midThigh?: string;
  maleMeasurements_knee?: string;
  maleMeasurements_belowKnee?: string;
  maleMeasurements_calf?: string;
  maleMeasurements_ankle?: string;
  maleMeasurements_bicep?: string;
  maleMeasurements_elbow?: string;
  maleMeasurements_waist?: string;
  maleMeasurements_hips?: string;
  maleMeasurements_shoulders?: string;
  maleMeasurements_sleeveLength?: string;
  maleMeasurements_topLength?: string;
  maleMeasurements_trouserLength?: string;
  maleMeasurements_thigh?: string;
  maleMeasurements_neck?: string;

  // Female measurements (prefixed with femaleMeasurements_)
  femaleMeasurements_neck?: string;
  femaleMeasurements_bust?: string;
  femaleMeasurements_overBust?: string;
  femaleMeasurements_underBust?: string;
  femaleMeasurements_neckToHeel?: string;
  femaleMeasurements_neckToAboveKnee?: string;
  femaleMeasurements_armLength?: string;
  femaleMeasurements_shoulderSeam?: string;
  femaleMeasurements_armHole?: string;
  femaleMeasurements_foreArm?: string;
  femaleMeasurements_vNeckCut?: string;
  femaleMeasurements_aboveKneeToAnkle?: string;
  femaleMeasurements_waistToAboveKnee?: string;
  femaleMeasurements_waist?: string;
  femaleMeasurements_hips?: string;
  femaleMeasurements_shoulders?: string;
  femaleMeasurements_sleeveLength?: string;
  femaleMeasurements_armhole?: string;
  femaleMeasurements_skirtLength?: string;
  femaleMeasurements_blouseLength?: string;
}

// Type-safe measurement objects
interface MaleMeasurements {
  forehead?: string;
  forearm?: string;
  wrist?: string;
  torsoCircum?: string;
  pantsLength?: string;
  chest?: string;
  chestAtAmpits?: string;
  thighAtCrotch?: string;
  midThigh?: string;
  knee?: string;
  belowKnee?: string;
  calf?: string;
  ankle?: string;
  bicep?: string;
  elbow?: string;
  waist?: string;
  hips?: string;
  shoulders?: string;
  sleeveLength?: string;
  topLength?: string;
  trouserLength?: string;
  thigh?: string;
  neck?: string;
}

interface FemaleMeasurements {
  neck?: string;
  bust?: string;
  overBust?: string;
  underBust?: string;
  neckToHeel?: string;
  neckToAboveKnee?: string;
  armLength?: string;
  shoulderSeam?: string;
  armHole?: string;
  foreArm?: string;
  vNeckCut?: string;
  aboveKneeToAnkle?: string;
  waistToAboveKnee?: string;
  waist?: string;
  hips?: string;
  shoulders?: string;
  sleeveLength?: string;
  armhole?: string;
  skirtLength?: string;
  blouseLength?: string;
}

// Type-safe order data structure
interface OrderData {
  name: string;
  phone: string;
  email: string;
  garmentType: string;
  gender: "male" | "female";
  expectedCollectionDate: number;
  fabricSample: {
    fabricType: string;
    fabricPhotoUrl?: string;
  };
  specialInstructions?: string;
  maleMeasurements?: MaleMeasurements;
  femaleMeasurements?: FemaleMeasurements;
}

interface UploadProgress {
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  errors: { row: number; error: string }[];
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<CSVRow[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    total: 0,
    processed: 0,
    succeeded: 0,
    failed: 0,
    errors: [],
  });
  const [isUploading, setIsUploading] = useState(false);
  const [previewMode, setPreviewMode] = useState<"table" | "json">("table");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createOrder = useMutation(api.orders.createOrder);

  const parseCSV = useCallback((file: File) => {
    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        // Filter out rows with empty names
        const validData = results.data.filter((row) => row.name?.trim());
        setParsedData(validData);
        setUploadProgress((prev) => ({
          ...prev,
          total: validData.length,
        }));
      },
      error: (error: Error) => {
        console.error("Error parsing CSV:", error);
      },
    });
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        setFile(selectedFile);
        parseCSV(selectedFile);
      }
    },
    [parseCSV],
  );

  // Helper to parse Excel date format (e.g., "1.73975E+12" → timestamp)
  const parseExcelDate = (dateStr: string | undefined): number => {
    if (!dateStr) {
      // Default to 7 days from now
      return Date.now() + 7 * 24 * 60 * 60 * 1000;
    }

    // Handle scientific notation (Excel exports)
    if (dateStr.includes("E")) {
      const timestamp = parseFloat(dateStr);
      // If it's in milliseconds range, use it directly
      if (timestamp > 1000000000000) {
        return timestamp;
      }
      // If it's in seconds, convert to milliseconds
      return timestamp * 1000;
    }

    // Handle ISO date strings
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.getTime();
    }

    // Fallback: 7 days from now
    return Date.now() + 7 * 24 * 60 * 60 * 1000;
  };

  // Helper to clean and validate measurement values
  const cleanMeasurement = (value: string | undefined): string | undefined => {
    if (!value || value.trim() === "" || value === "0") {
      return undefined;
    }
    return value.trim();
  };

  const transformRowToOrder = useCallback((row: CSVRow): OrderData => {
    const gender: "male" | "female" =
      row.gender?.toLowerCase() === "male" ? "male" : "female";

    const orderData: OrderData = {
      name: row.name?.trim() || "Unknown",
      phone: row.phone?.trim() || "",
      email: row.email?.trim() || "",
      garmentType: row.garmentType?.trim() || "",
      gender,
      expectedCollectionDate: parseExcelDate(row.expectedCollectionDate),
      fabricSample: {
        fabricType: row.fabricType?.trim() || row.garmentType?.trim() || "",
        fabricPhotoUrl: row.fabricPhotoUrl?.trim() || undefined,
      },
      specialInstructions: row.specialInstructions?.trim() || undefined,
    };

    // Extract male measurements
    if (gender === "male") {
      const maleMeasurements: MaleMeasurements = {};

      const maleFields: (keyof MaleMeasurements)[] = [
        "forehead",
        "forearm",
        "wrist",
        "torsoCircum",
        "pantsLength",
        "chest",
        "chestAtAmpits",
        "thighAtCrotch",
        "midThigh",
        "knee",
        "belowKnee",
        "calf",
        "ankle",
        "bicep",
        "elbow",
        "waist",
        "hips",
        "shoulders",
        "sleeveLength",
        "topLength",
        "trouserLength",
        "thigh",
        "neck",
      ];

      for (const field of maleFields) {
        const csvKey = `maleMeasurements_${field}` as keyof CSVRow;
        const value = cleanMeasurement(row[csvKey] as string | undefined);
        if (value) {
          maleMeasurements[field] = value;
        }
      }

      if (Object.keys(maleMeasurements).length > 0) {
        orderData.maleMeasurements = maleMeasurements;
      }
    }

    // Extract female measurements
    if (gender === "female") {
      const femaleMeasurements: FemaleMeasurements = {};

      const femaleFields: (keyof FemaleMeasurements)[] = [
        "neck",
        "bust",
        "overBust",
        "underBust",
        "neckToHeel",
        "neckToAboveKnee",
        "armLength",
        "shoulderSeam",
        "armHole",
        "foreArm",
        "vNeckCut",
        "aboveKneeToAnkle",
        "waistToAboveKnee",
        "waist",
        "hips",
        "shoulders",
        "sleeveLength",
        "armhole",
        "skirtLength",
        "blouseLength",
      ];

      for (const field of femaleFields) {
        const csvKey = `femaleMeasurements_${field}` as keyof CSVRow;
        const value = cleanMeasurement(row[csvKey] as string | undefined);
        if (value) {
          femaleMeasurements[field] = value;
        }
      }

      if (Object.keys(femaleMeasurements).length > 0) {
        orderData.femaleMeasurements = femaleMeasurements;
      }
    }

    return orderData;
  }, []);

  const uploadOrders = useCallback(async () => {
    if (!parsedData.length) return;

    setIsUploading(true);
    setUploadProgress({
      total: parsedData.length,
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [],
    });

    for (let i = 0; i < parsedData.length; i++) {
      try {
        const row = parsedData[i];
        const orderData = transformRowToOrder(row);

        await createOrder(orderData);

        setUploadProgress((prev) => ({
          ...prev,
          processed: i + 1,
          succeeded: prev.succeeded + 1,
        }));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error(`Error uploading row ${i + 2}:`, errorMessage);

        setUploadProgress((prev) => ({
          ...prev,
          processed: i + 1,
          failed: prev.failed + 1,
          errors: [
            ...prev.errors,
            {
              row: i + 2,
              error: errorMessage,
            },
          ],
        }));
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    setIsUploading(false);
  }, [parsedData, createOrder, transformRowToOrder]);

  const resetUpload = useCallback(() => {
    setFile(null);
    setParsedData([]);
    setUploadProgress({
      total: 0,
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [],
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const downloadSampleCSV = useCallback(() => {
    // Create sample CSV matching the schema
    const headers = [
      "name",
      "phone",
      "email",
      "garmentType",
      "gender",
      "expectedCollectionDate",
      "fabricPhotoUrl",
      "fabricType",
      "specialInstructions",
      // Male measurements
      "maleMeasurements_chest",
      "maleMeasurements_waist",
      "maleMeasurements_hips",
      "maleMeasurements_shoulders",
      "maleMeasurements_sleeveLength",
      "maleMeasurements_neck",
      // Female measurements
      "femaleMeasurements_bust",
      "femaleMeasurements_waist",
      "femaleMeasurements_hips",
      "femaleMeasurements_shoulders",
      "femaleMeasurements_sleeveLength",
      "femaleMeasurements_neck",
    ];

    const sampleData = [
      {
        name: "John Doe",
        phone: "+1234567890",
        email: "john@example.com",
        garmentType: "Senator suit",
        gender: "male",
        expectedCollectionDate: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).getTime(),
        fabricType: "Ankara",
        maleMeasurements_chest: "42",
        maleMeasurements_waist: "36",
        maleMeasurements_hips: "40",
      },
      {
        name: "Jane Smith",
        phone: "+1234567891",
        email: "jane@example.com",
        garmentType: "Lace dress",
        gender: "female",
        expectedCollectionDate: new Date(
          Date.now() + 14 * 24 * 60 * 60 * 1000,
        ).getTime(),
        fabricType: "Lace",
        femaleMeasurements_bust: "38",
        femaleMeasurements_waist: "32",
        femaleMeasurements_hips: "42",
      },
    ];

    const csv = Papa.unparse(sampleData, { columns: headers });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample-orders.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  }, []);

  const getProgressValue = useCallback((): number => {
    if (uploadProgress.total === 0) return 0;
    return (uploadProgress.processed / uploadProgress.total) * 100;
  }, [uploadProgress.processed, uploadProgress.total]);

  const isUploadComplete =
    uploadProgress.succeeded === uploadProgress.total &&
    uploadProgress.total > 0;

  return (
    <div className='container mx-auto py-8 px-4 max-w-7xl'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}>
        <div className='flex justify-between items-center mb-8'>
          <div>
            <h1 className='text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent'>
              Upload Orders
            </h1>
            <p className='text-muted-foreground mt-2'>
              Upload CSV file to create multiple orders at once
            </p>
          </div>
          <Button variant='outline' onClick={downloadSampleCSV}>
            <Download className='mr-2 h-4 w-4' />
            Sample CSV
          </Button>
        </div>

        <Card className='p-6 mb-8'>
          <div className='border-2 border-dashed rounded-lg p-8 text-center'>
            <input
              ref={fileInputRef}
              type='file'
              accept='.csv'
              onChange={handleFileChange}
              className='hidden'
              id='csv-upload'
            />
            <label
              htmlFor='csv-upload'
              className='cursor-pointer flex flex-col items-center gap-4'>
              <div className='p-4 bg-primary/10 rounded-full'>
                <Upload className='h-8 w-8 text-primary' />
              </div>
              <div>
                <p className='text-lg font-semibold'>
                  {file ? file.name : "Click to upload CSV"}
                </p>
                <p className='text-sm text-muted-foreground'>
                  {file
                    ? `${(file.size / 1024).toFixed(2)} KB`
                    : "or drag and drop"}
                </p>
              </div>
            </label>
          </div>
        </Card>

        {parsedData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}>
            <Card className='p-6 mb-8'>
              <div className='flex justify-between items-center mb-4'>
                <h2 className='text-2xl font-semibold'>
                  Preview Data ({parsedData.length} records)
                </h2>
                <div className='flex gap-2'>
                  <Tabs
                    value={previewMode}
                    onValueChange={(v) =>
                      setPreviewMode(v as "table" | "json")
                    }>
                    <TabsList>
                      <TabsTrigger value='table'>Table</TabsTrigger>
                      <TabsTrigger value='json'>JSON</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>

              <AnimatePresence mode='wait'>
                {previewMode === "table" ? (
                  <motion.div
                    key='table'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}>
                    <ScrollArea className='h-96 rounded-md border'>
                      <table className='w-full text-sm'>
                        <thead className='bg-muted sticky top-0'>
                          <tr>
                            <th className='p-2 text-left'>Name</th>
                            <th className='p-2 text-left'>Phone</th>
                            <th className='p-2 text-left'>Email</th>
                            <th className='p-2 text-left'>Garment</th>
                            <th className='p-2 text-left'>Gender</th>
                            <th className='p-2 text-left'>Collection Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedData.slice(0, 10).map((row, index) => (
                            <tr key={index} className='border-t'>
                              <td className='p-2'>{row.name}</td>
                              <td className='p-2'>{row.phone}</td>
                              <td className='p-2'>{row.email}</td>
                              <td className='p-2'>{row.garmentType}</td>
                              <td className='p-2'>
                                <Badge
                                  variant={
                                    row.gender === "male"
                                      ? "default"
                                      : "secondary"
                                  }>
                                  {row.gender}
                                </Badge>
                              </td>
                              <td className='p-2'>
                                {new Date(
                                  parseExcelDate(row.expectedCollectionDate),
                                ).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {parsedData.length > 10 && (
                        <div className='p-2 text-center text-muted-foreground border-t'>
                          ... and {parsedData.length - 10} more records
                        </div>
                      )}
                    </ScrollArea>
                  </motion.div>
                ) : (
                  <motion.div
                    key='json'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}>
                    <ScrollArea className='h-96 rounded-md border'>
                      <pre className='p-4 text-sm'>
                        {JSON.stringify(
                          parsedData.slice(0, 3).map(transformRowToOrder),
                          null,
                          2,
                        )}
                        {parsedData.length > 3 && "\n\n... and more records"}
                      </pre>
                    </ScrollArea>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className='flex justify-end gap-4 mt-4'>
                <Button variant='outline' onClick={resetUpload}>
                  Clear
                </Button>
                <Button
                  onClick={uploadOrders}
                  disabled={isUploading || isUploadComplete}>
                  {isUploading ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Uploading...
                    </>
                  ) : isUploadComplete ? (
                    <>
                      <CheckCircle2 className='mr-2 h-4 w-4' />
                      Completed
                    </>
                  ) : (
                    <>
                      <Upload className='mr-2 h-4 w-4' />
                      Upload Orders
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {(uploadProgress.processed > 0 ||
              uploadProgress.errors.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}>
                <Card className='p-6'>
                  <h2 className='text-2xl font-semibold mb-4'>
                    Upload Progress
                  </h2>

                  <div className='space-y-4'>
                    <div className='flex justify-between text-sm'>
                      <span>Progress</span>
                      <span>
                        {uploadProgress.processed} / {uploadProgress.total}
                      </span>
                    </div>
                    <Progress value={getProgressValue()} className='h-2' />

                    <div className='grid grid-cols-3 gap-4 py-4'>
                      <div className='text-center'>
                        <div className='text-2xl font-bold text-green-600'>
                          {uploadProgress.succeeded}
                        </div>
                        <div className='text-sm text-muted-foreground'>
                          Succeeded
                        </div>
                      </div>
                      <div className='text-center'>
                        <div className='text-2xl font-bold text-red-600'>
                          {uploadProgress.failed}
                        </div>
                        <div className='text-sm text-muted-foreground'>
                          Failed
                        </div>
                      </div>
                      <div className='text-center'>
                        <div className='text-2xl font-bold'>
                          {uploadProgress.total}
                        </div>
                        <div className='text-sm text-muted-foreground'>
                          Total
                        </div>
                      </div>
                    </div>

                    {uploadProgress.errors.length > 0 && (
                      <Alert variant='destructive'>
                        <AlertCircle className='h-4 w-4' />
                        <AlertDescription>
                          <div className='font-medium mb-2'>Errors:</div>
                          <ScrollArea className='h-32'>
                            <ul className='space-y-1'>
                              {uploadProgress.errors.map((error, index) => (
                                <li key={index} className='text-sm'>
                                  Row {error.row}: {error.error}
                                </li>
                              ))}
                            </ul>
                          </ScrollArea>
                        </AlertDescription>
                      </Alert>
                    )}

                    {isUploadComplete && (
                      <Alert className='bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-900'>
                        <CheckCircle2 className='h-4 w-4 text-green-600 dark:text-green-400' />
                        <AlertDescription className='text-green-600 dark:text-green-400'>
                          All orders uploaded successfully!
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </Card>
              </motion.div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
