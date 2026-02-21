"use client";

import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AlertTriangle, Loader2 } from "lucide-react";

type Order = Doc<"orders">;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
}

export default function DeleteOrderSheet({ open, onOpenChange, order }: Props) {
  const deleteOrder = useMutation(api.orders.deleteOrder);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteOrder({ orderId: order._id });
      toast.success("Order Deleted", {
        description: `Order #${order.orderNumber} has been permanently deleted`,
      });
      onOpenChange(false);
    } catch (error) {
      toast.error("Delete Failed", {
        description: (error as Error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full sm:max-w-md overflow-y-auto'>
        <SheetHeader>
          <SheetTitle className='text-2xl font-bold text-red-600 dark:text-red-400'>
            Delete Order
          </SheetTitle>
          <SheetDescription>This action cannot be undone</SheetDescription>
        </SheetHeader>

        <div className='space-y-4 px-4 pb-8'>
          {/* Warning Icon */}
          <div className='flex justify-center'>
            <div className='w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500/20 flex items-center justify-center'>
              <AlertTriangle className='w-5 h-5 text-red-500' />
            </div>
          </div>

          {/* Warning Message */}
          <div className='bg-red-500/10 border border-red-500/20 rounded-lg p-4'>
            <p className='text-sm text-center'>
              You are about to permanently delete this order. This will remove
              all order data including customer information, measurements, and
              workflow history.
            </p>
          </div>

          {/* Order Details */}
          <div className='space-y-2 bg-blend-multiply border rounded-lg p-4'>
            <div className='flex justify-between text-xs'>
              <span className='text-muted-foreground'>Order Number:</span>
              <span className='font-mono font-semibold'>
                {order.orderNumber}
              </span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Customer:</span>
              <span className='font-semibold'>{order.name}</span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Garment:</span>
              <span className='font-semibold'>{order.garmentType}</span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Status:</span>
              <span className='font-semibold capitalize'>
                {order.workflowStage.replace("_", " ")}
              </span>
            </div>
          </div>

          {/* Confirmation Text */}
          <div className='text-center space-y-2'>
            <p className='text-sm font-semibold text-red-600 dark:text-red-400'>
              Are you sure you want to delete this order?
            </p>
            <p className='text-xs text-muted-foreground'>
              This action is permanent and cannot be undone.
            </p>
          </div>

          {/* Action Buttons */}
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
              type='button'
              onClick={handleDelete}
              disabled={loading}
              className='flex-1 bg-red-600 hover:bg-red-700 text-white'>
              {loading ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Deleting...
                </>
              ) : (
                "Delete Order"
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
