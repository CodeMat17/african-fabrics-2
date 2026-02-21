// app/admin/upload/page.tsx
"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import { parseCSVDateToTimestamp } from "@/utils/date-utils";
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

import type {
  CreateOrderMutationArgs,
  FemaleMeasurements,
  MaleMeasurements,
  ParsedCSVRow,
  UploadProgress,
} from "@/types/order-types";
import Papa from "papaparse";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedCSVRow[]>([]);
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
    Papa.parse<ParsedCSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setParsedData(results.data);
        setUploadProgress((prev) => ({
          ...prev,
          total: results.data.length,
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

  const transformRowToOrder = useCallback(
    (row: ParsedCSVRow): CreateOrderMutationArgs => {
      const gender = row.sex?.toLowerCase() === "men" ? "male" : "female";

      // Fix: Use the proper date parsing function
      const expectedCollectionDate = parseCSVDateToTimestamp(row.due_date);

      // Log for debugging (remove in production)
      console.log({
        originalDate: row.due_date,
        parsedTimestamp: expectedCollectionDate,
        formattedDate: new Date(expectedCollectionDate).toISOString(),
      });

      const baseOrder: CreateOrderMutationArgs = {
        name: row.name?.trim() || "Unknown",
        phone: row.tel?.trim() || "",
        email: row.email?.trim() || "",
        garmentType: row.style?.trim() || "",
        gender,
        expectedCollectionDate,
        fabricSample: {
          fabricPhotoUrl: row.fabric?.trim() || undefined,
          fabricType: row.style?.trim() || "",
        },
      };

      if (gender === "male") {
        const maleMeasurements: MaleMeasurements = {
          forehead: row.forehead || undefined,
          forearm: row.forearm || undefined,
          wrist: row.wrist || undefined,
          torsoCircum: row.torso_circum || undefined,
          pantsLength: row.pants_length || undefined,
          chest: row.chest_or_bust || undefined,
          chestAtAmpits: row.chest_at_ampits || undefined,
          thighAtCrotch: row.thigh_at_crotch || undefined,
          midThigh: row.mid_thigh || undefined,
          knee: row.knee || undefined,
          belowKnee: row.below_knee || undefined,
          calf: row.calf || undefined,
          ankle: row.ankle || undefined,
          bicep: row.bicep || undefined,
          elbow: row.elbow || undefined,
          waist: row.waist || undefined,
          hips: row.hips || undefined,
          shoulders: row.shoulders || undefined,
          sleeveLength: row.s_seam || undefined,
          neck: row.neck || undefined,
        };

        // Filter out undefined values
        const filteredMeasurements = Object.fromEntries(
          Object.entries(maleMeasurements).filter(
            ([_, value]) => value !== undefined,
          ),
        ) as MaleMeasurements;

        baseOrder.maleMeasurements = filteredMeasurements;
      } else {
        const femaleMeasurements: FemaleMeasurements = {
          neck: row.neck || undefined,
          bust: row.bust || undefined,
          overBust: row.o_bust || undefined,
          underBust: row.u_bust || undefined,
          neckToHeel: row.nk_heel || undefined,
          neckToAboveKnee: row.nk_abov_knee || undefined,
          armLength: row.a_length || undefined,
          shoulderSeam: row.s_seam || undefined,
          armHole: row.arm_hole || undefined,
          foreArm: row.fore_arm || undefined,
          vNeckCut: row.v_neck_cut || undefined,
          aboveKneeToAnkle: row.abv_knee_ankle || undefined,
          waistToAboveKnee: row.w_abv_knee || undefined,
          waist: row.waist || undefined,
          hips: row.hips || undefined,
          shoulders: row.shoulders || undefined,
          sleeveLength: row.s_seam || undefined,
          armhole: row.arm_hole || undefined,
          skirtLength: row.top_length || undefined,
          blouseLength: row.top_length || undefined,
        };

        // Filter out undefined values
        const filteredMeasurements = Object.fromEntries(
          Object.entries(femaleMeasurements).filter(
            ([_, value]) => value !== undefined,
          ),
        ) as FemaleMeasurements;

        baseOrder.femaleMeasurements = filteredMeasurements;
      }

      return baseOrder;
    },
    [],
  );

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
    const sampleData: Partial<ParsedCSVRow>[] = [
      {
        name: "John Doe",
        tel: "+1234567890",
        email: "john@example.com",
        style: "Senator suit",
        sex: "Men",
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        fabric: "https://example.com/fabric.jpg",
      },
      {
        name: "Jane Smith",
        tel: "+1234567891",
        email: "jane@example.com",
        style: "Lace dress",
        sex: "Women",
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        fabric: "https://example.com/fabric2.jpg",
      },
    ];

    const csv = Papa.unparse(sampleData);
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
                            <th className='p-2 text-left'>Due Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedData.slice(0, 10).map((row, index) => (
                            <tr key={index} className='border-t'>
                              <td className='p-2'>{row.name}</td>
                              <td className='p-2'>{row.tel}</td>
                              <td className='p-2'>{row.email}</td>
                              <td className='p-2'>{row.style}</td>
                              <td className='p-2'>
                                <Badge
                                  variant={
                                    row.sex === "Men" ? "default" : "secondary"
                                  }>
                                  {row.sex}
                                </Badge>
                              </td>
                              <td className='p-2'>{row.due_date}</td>
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
                        {JSON.stringify(parsedData.slice(0, 3), null, 2)}
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
                      <Alert className='bg-green-50 border-green-200'>
                        <CheckCircle2 className='h-4 w-4 text-green-600' />
                        <AlertDescription className='text-green-600'>
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
