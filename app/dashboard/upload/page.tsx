"use client";

import { useState } from "react";
import Papa from "papaparse";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

type CsvRow = Record<string, string>;

interface CleanOrder {
  name: string;
  phone: string;
  email: string;
  garmentType: string;
  gender: "male" | "female";
  expectedCollectionDate: number;
  specialInstructions?: string;
  maleMeasurements?: Record<string, string>;
  femaleMeasurements?: Record<string, string>;
}

export default function UploadPage() {
  const createOrder = useMutation(api.orders.createOrder);

  const [rows, setRows] = useState<CleanOrder[]>([]);
  const [loading, setLoading] = useState(false);

  const normalize = (v: string | undefined) => v?.trim() || "";

  const cleanRow = (row: CsvRow): CleanOrder => {
    const gender = row.gender?.toLowerCase() === "female" ? "female" : "male";

    const femaleMeasurements = {
      overBust: normalize(row.o_bust),
      underBust: normalize(row.u_bust),
      neckToHeel: normalize(row.nk_heel),
      neckToAboveKnee: normalize(row.nk_above),
      armLength: normalize(row.a_length),
      shoulderSeam: normalize(row.s_seam),
      armHole: normalize(row.arm_hole),
      foreArm: normalize(row.fore_arm),
      vNeckCut: normalize(row.v_neck_cut),
      aboveKneeToAnkle: normalize(row.abv_knee),
      waistToAboveKnee: normalize(row.w_abov_knee),
      waist: normalize(row.waist),
      hips: normalize(row.hips),
      bust: normalize(row.chest_or_bust),
    };

    const maleMeasurements = {
      forearm: normalize(row.fore_arm),
      torsoCircum: normalize(row.torso_circum),
      pantsLength: normalize(row.pant_length),
      chest: normalize(row.chest_or_bust),
      chestAtAmpits: normalize(row.chest_at_armpits),
      thighAtCrotch: normalize(row.thigh_at_crotch),
      midThigh: normalize(row.mid_thigh),
      belowKnee: normalize(row.below_knee),
      waist: normalize(row.waist),
      hips: normalize(row.hips),
      shoulders: normalize(row.shoulders),
    };

    return {
      name: normalize(row.name),
      phone: normalize(row.tel),
      email: normalize(row.email),
      garmentType: normalize(row.style),
      gender,
      expectedCollectionDate: Date.now(),
      maleMeasurements: gender === "male" ? maleMeasurements : undefined,
      femaleMeasurements: gender === "female" ? femaleMeasurements : undefined,
    
    };
  };

  const handleFile = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const cleaned = results.data.map((r) => cleanRow(r as CsvRow));
        setRows(cleaned);
      },
    });
  };

  const handleUpload = async () => {
    setLoading(true);

    for (const row of rows) {
      await createOrder({
        ...row,
        fabricSample: {
          fabricType: "Imported",
        },
      });
    }

    setLoading(false);
    setRows([]);
  };

  return (
    <div className='p-6 space-y-6 max-w-6xl mx-auto lg:ml-16'>
      <h1 className='text-2xl font-bold'>CSV Order Upload</h1>

      <Input
        type='file'
        accept='.csv'
        onChange={(e) => e.target.files && handleFile(e.target.files[0])}
      />

      {rows.length > 0 && (
        <>
          <Card>
            <CardContent className='overflow-x-auto'>
              <table className='min-w-full text-xs'>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Garment</th>
                    <th>Gender</th>
                    <th>Fabric Type</th>
                    <th>Special Instructions</th>
                    <th>Measurements</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className='border-t align-top'>
                      <td>{r.name}</td>
                      <td>{r.phone}</td>
                      <td>{r.email}</td>
                      <td>{r.garmentType}</td>
                      <td>{r.gender}</td>
                      <td>{r.specialInstructions ?? "-"}</td>

                      <td className='max-w-xs'>
                        <div className='space-y-1'>
                          {r.gender === "male" &&
                            r.maleMeasurements &&
                            Object.entries(r.maleMeasurements).map(([k, v]) => (
                              <div key={k}>
                                <span className='font-medium'>{k}:</span> {v}
                              </div>
                            ))}

                          {r.gender === "female" &&
                            r.femaleMeasurements &&
                            Object.entries(r.femaleMeasurements).map(
                              ([k, v]) => (
                                <div key={k}>
                                  <span className='font-medium'>{k}:</span> {v}
                                </div>
                              )
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Button onClick={handleUpload} disabled={loading} className='w-full'>
            {loading ? "Uploading..." : `Confirm Upload (${rows.length})`}
          </Button>
        </>
      )}
    </div>
  );
}
