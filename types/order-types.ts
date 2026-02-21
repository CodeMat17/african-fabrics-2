// types/order-types.ts
import { Id } from "@/convex/_generated/dataModel";

export type Gender = "male" | "female";

export interface MaleMeasurements {
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
  neck?: string;
}

export interface FemaleMeasurements {
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

export interface FabricSample {
  fabricPhotoUrl?: string;
  fabricPhotoStorageId?: Id<"_storage">;
  fabricType: string;
}

export interface OrderInput {
  name: string;
  phone: string;
  email: string;
  garmentType: string;
  gender: Gender;
  expectedCollectionDate: number;
  fabricSample: FabricSample;
  maleMeasurements?: MaleMeasurements;
  femaleMeasurements?: FemaleMeasurements;
  specialInstructions?: string;
}

// This type matches exactly what the mutation expects
export interface CreateOrderMutationArgs {
  name: string;
  phone: string;
  email: string;
  garmentType: string;
  gender: Gender;
  expectedCollectionDate: number;
  fabricSample: {
    fabricPhotoUrl?: string;
    fabricPhotoStorageId?: Id<"_storage">;
    fabricType: string;
  };
  maleMeasurements?: MaleMeasurements;
  femaleMeasurements?: FemaleMeasurements;
  specialInstructions?: string;
}

export interface ParsedCSVRow {
  id: string;
  created_at: string;
  avatar: string;
  name: string;
  email: string;
  tel: string;
  fabric: string;
  style: string;
  status: string;
  tailoring: string;
  q_c: string;
  neck: string;
  o_bust: string;
  bust: string;
  u_bust: string;
  waist: string;
  hips: string;
  nk_heel: string;
  nk_abov_knee: string;
  a_length: string;
  s_seam: string;
  arm_hole: string;
  bicep: string;
  fore_arm: string;
  wrist: string;
  v_neck_cut: string;
  abv_knee_ankle: string;
  w_abv_knee: string;
  tailor: string;
  tailoring_assigned_on: string;
  tailoring_finish_on: string;
  beading: string;
  beader: string;
  m_on_paper: string;
  sketch: string;
  due_date: string;
  three_days_2_due_date: string;
  two_days_2_due_date: string;
  fitting_date: string;
  fitting_confirmed_by: string;
  fitting_done: string;
  ready: string;
  forehead: string;
  chest_at_ampits: string;
  chest_or_bust: string;
  thigh_at_crotch: string;
  mid_thigh: string;
  knee: string;
  below_knee: string;
  calf: string;
  ankle: string;
  elbow: string;
  forearm: string;
  torso_circum: string;
  pants_length: string;
  shoulders: string;
  top_length: string;
  sex: string;
  completed_on: string;
  delivered_on: string;
  one_day_2_due_date: string;
}

export interface UploadProgress {
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}

export interface UploadStats {
  succeeded: number;
  failed: number;
  total: number;
}
