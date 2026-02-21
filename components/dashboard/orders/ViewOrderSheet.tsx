"use client";

import { Doc } from "@/convex/_generated/dataModel";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import {
  Package,
  User,
  Phone,
  Mail,
  Calendar,
  FileText,
  Scissors,
  Ruler,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import Image from "next/image";

type Order = Doc<"orders">;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
}

export default function ViewOrderSheet({ open, onOpenChange, order }: Props) {
  const isMale = order.gender === "male";

  const measurements = isMale
    ? order.maleMeasurements
    : order.femaleMeasurements;

  const measurementEntries = measurements
    ? (Object.entries(measurements) as [string, string][])
    : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full sm:max-w-xl overflow-y-auto'>
        <SheetHeader>
          <SheetTitle className='text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent'>
            Order Details
          </SheetTitle>
          <SheetDescription>Order No: {order.orderNumber}</SheetDescription>
        </SheetHeader>

        <div className='space-y-4 px-4 pb-8'>
          {/* Status */}
          <div className='flex items-center justify-between'>
            <span className='text-sm text-muted-foreground'>Status</span>
            <Badge className='capitalize'>
              {order.workflowStage.replaceAll("_", " ")}
            </Badge>
          </div>

          <Separator />

          {/* Customer Info */}
          <div className='space-y-4'>
            <h3 className='text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
              Customer Information
            </h3>

            <div className='space-y-3'>
              <InfoRow
                icon={<User className='w-4 h-4 text-cyan-500' />}
                label='Name'
                value={order.name}
              />
              <InfoRow
                icon={<Mail className='w-4 h-4 text-cyan-500' />}
                label='Email'
                value={order.email}
              />
              <InfoRow
                icon={<Phone className='w-4 h-4 text-cyan-500' />}
                label='Phone'
                value={order.phone}
              />
            </div>
          </div>

          <Separator />

          {/* Order Info */}
          <div className='space-y-4'>
            <h3 className='text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
              Order Information
            </h3>

            <div className='space-y-3'>
              <InfoRow
                icon={<Package className='w-4 h-4 text-purple-500' />}
                label='Garment Type'
                value={order.garmentType}
              />

              <InfoRow
                icon={<Scissors className='w-4 h-4 text-purple-500' />}
                label='Fabric Type'
                value={order.fabricSample?.fabricType ?? "Not specified"}
              />

              <InfoRow
                icon={<Calendar className='w-4 h-4 text-purple-500' />}
                label='Expected Collection'
                value={format(new Date(order.expectedCollectionDate), "PPP")}
              />

              {order.specialInstructions && (
                <InfoRow
                  icon={<FileText className='w-4 h-4 text-purple-500' />}
                  label='Special Instructions'
                  value={order.specialInstructions}
                />
              )}
            </div>
          </div>

          {order.fabricSample.fabricPhotoUrl &&
            <div>
              <Label className="text-xs text-muted-foreground">Fabric</Label>
              <div className="relative aspect-video h-32 mt-1">
                <Image alt='' fill className="rounded-lg object-cover" src={order.fabricSample?.fabricPhotoUrl} />
              </div>
            </div>
          }

          {measurementEntries.length > 0 && (
            <>
              <Separator />

              {/* Measurements */}
              <div className='space-y-4'>
                <h3 className='text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
                  Measurements ({isMale ? "Male" : "Female"})
                </h3>

                <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
                  {measurementEntries.map(([key, value]) => (
                    <div
                      key={key}
                      className='border rounded-lg p-2 bg-muted/30'>
                      <div className='flex items-center gap-2 mb-1'>
                        <span className='text-xs text-muted-foreground capitalize'>
                          {key.replace(/([A-Z])/g, " $1")}
                        </span>
                      </div>
                      <p className='text-sm font-semibold'>{value || "—"}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Progress */}
          <div className='space-y-3'>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-muted-foreground'>Completion</span>
              <span className='font-bold text-cyan-400'>{order.progress}%</span>
            </div>

            <div className='w-full bg-muted rounded-full h-2'>
              <div
                className='bg-gradient-to-r from-cyan-400 to-purple-600 h-2 rounded-full transition-all'
                style={{ width: `${order.progress}%` }}
              />
            </div>
          </div>

          {/* Collection */}
          {order.collected && order.collectedAt && (
            <>
              <Separator />
              <div className='bg-green-500/10 border border-green-500/20 rounded-lg p-4'>
                <p className='text-sm font-semibold text-green-600 dark:text-green-400 mb-1'>
                  ✓ Collected
                </p>
                <p className='text-xs text-muted-foreground'>
                  {format(new Date(order.collectedAt), "PPP p")}
                </p>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ---------- Reusable Info Row ---------- */

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className='flex items-start gap-3'>
      <div className='mt-0.5 shrink-0'>{icon}</div>
      <div className='flex-1'>
        <p className='text-xs text-muted-foreground'>{label}</p>
        <p className='text-sm font-medium'>{value}</p>
      </div>
    </div>
  );
}
