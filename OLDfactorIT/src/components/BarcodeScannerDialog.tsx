import { Dialog, DialogContent } from "./ui/dialog";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect, useRef } from "react";

export interface BarcodeScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (result: string) => void;
}

export function BarcodeScannerDialog({
  open,
  onOpenChange,
  onScan,
}: BarcodeScannerDialogProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (open && !scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      scannerRef.current.render(
        (decodedText: string) => {
          if (scannerRef.current) {
            scannerRef.current.clear();
            onScan(decodedText);
            onOpenChange(false);
          }
        },
        (error: Error) => {
          console.warn(`Code scan error = ${error}`);
        }
      );
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    };
  }, [open, onOpenChange, onScan]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <div id="reader" />
      </DialogContent>
    </Dialog>
  );
}