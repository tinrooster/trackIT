"use client";

import React, { useState } from 'react';
import { useZxing } from 'react-zxing';
import { Button } from "@/components/ui/button";
import { Scan, X } from "lucide-react";
import { toast } from "sonner";

interface BarcodeScannerProps {
  onScan: (barcodeValue: string) => void;
  buttonLabel?: string;
  buttonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export function BarcodeScanner({
  onScan,
  buttonLabel = "Scan Barcode",
  buttonVariant = "outline"
}: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);

  const { ref } = useZxing({
    onDecodeResult(result) {
      const barcodeValue = result.getText();
      console.log('Barcode scanned:', barcodeValue);
      onScan(barcodeValue);
      setIsScanning(false);
      toast.success(`Barcode scanned: ${barcodeValue}`);
    },
    onError(error) {
      console.error('Scan error:', error);
      // Only show errors that aren't the common "not found" errors
      if (!error.message.includes('NotFoundException')) {
        toast.error(`Scan error: ${error.message}`);
      }
    },
  });

  const startScanning = () => {
    setIsScanning(true);
  };

  const stopScanning = () => {
    setIsScanning(false);
  };

  return (
    <div className="relative">
      <Button
        variant={buttonVariant}
        onClick={startScanning}
        className="flex items-center"
      >
        <Scan className="mr-2 h-4 w-4" />
        {buttonLabel}
      </Button>

      {isScanning && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Scan Barcode</h3>
              <Button variant="ghost" size="icon" onClick={stopScanning}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="relative aspect-video bg-muted rounded-md overflow-hidden">
              <video ref={ref} className="w-full h-full object-cover" />
              <div className="absolute inset-0 border-2 border-primary/50 pointer-events-none">
                <div className="absolute top-1/2 left-0 right-0 border-t-2 border-primary/70"></div>
                <div className="absolute left-1/2 top-0 bottom-0 border-l-2 border-primary/70"></div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Position the barcode within the frame. Make sure you have good lighting.
            </p>

            <Button variant="outline" onClick={stopScanning} className="w-full">
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}