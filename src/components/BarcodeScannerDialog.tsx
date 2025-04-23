import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Keyboard } from 'lucide-react'; 
import { ManualBarcodeInput } from './ManualBarcodeInput';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SimpleBarcodeScanner } from './SimpleBarcodeScanner';

interface BarcodeScannerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onScanResult: (result: string) => void;
}

export function BarcodeScannerDialog({ isOpen, onClose, onScanResult }: BarcodeScannerDialogProps) {
  const [activeTab, setActiveTab] = useState<string>("camera");
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const handleManualBarcode = (barcode: string) => {
    onScanResult(barcode);
    onClose();
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Scan Barcode</DialogTitle>
          <DialogDescription>
            Use your camera or a Bluetooth barcode scanner to scan a barcode.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="camera">Camera</TabsTrigger>
            <TabsTrigger value="manual">Bluetooth Scanner</TabsTrigger>
          </TabsList>
          
          <TabsContent value="camera">
            <div className="flex flex-col items-center justify-center p-4 border rounded-md bg-muted">
              <Button 
                onClick={() => setIsScannerOpen(true)}
                className="w-full"
              >
                Open Camera Scanner
              </Button>
              <p className="mt-2 text-sm text-muted-foreground">
                Position barcode in viewfinder when scanner opens
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="manual">
            <div className="p-4 border rounded-md bg-muted/20">
              <div className="flex items-center mb-4">
                <Keyboard className="h-5 w-5 mr-2 text-primary" />
                <h3 className="font-medium">Bluetooth Barcode Scanner</h3>
              </div>
              
              <ManualBarcodeInput 
                onBarcodeDetected={handleManualBarcode}
                isActive={activeTab === "manual" && isOpen}
                placeholder="Scan a barcode or type and press Enter..."
              />
              
              <p className="mt-2 text-sm text-muted-foreground">
                Make sure your Bluetooth scanner is connected and paired
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>

      <SimpleBarcodeScanner 
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={onScanResult}
      />
    </Dialog>
  );
}