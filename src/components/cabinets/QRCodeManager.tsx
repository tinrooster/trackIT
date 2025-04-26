import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from 'sonner';
import { Printer, Download, QrCode } from 'lucide-react';
import { ItemCheckInOut } from './ItemCheckInOut';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface QRCodeManagerProps {
  cabinetId: string;
  cabinetName: string;
  isSecure: boolean;
  description: string;
  notes?: string;
  locationId: string;
  requireCheckout: boolean;
  onCheckIn?: (itemId: string, quantity: number) => void;
  onCheckOut?: (itemId: string, quantity: number) => void;
}

export function QRCodeManager({ 
  cabinetId, 
  cabinetName, 
  isSecure,
  description,
  notes,
  locationId,
  requireCheckout,
  onCheckIn,
  onCheckOut
}: QRCodeManagerProps) {
  const qrValue = JSON.stringify({
    type: 'cabinet',
    id: cabinetId,
    name: cabinetName,
    isSecure
  });

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print QR Code - ${cabinetName}</title>
            <style>
              body { font-family: system-ui, sans-serif; text-align: center; padding: 20px; }
              .qr-container { margin: 20px auto; }
              .cabinet-info { margin: 20px 0; }
              @media print {
                @page { margin: 0; }
                body { margin: 1.6cm; }
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              ${document.getElementById('qr-code-' + cabinetId)?.innerHTML || ''}
            </div>
            <div class="cabinet-info">
              <h2>${cabinetName}</h2>
              <p>Cabinet ID: ${cabinetId}</p>
              ${isSecure ? '<p><strong>Secure Cabinet</strong></p>' : ''}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownload = () => {
    const svg = document.getElementById('qr-code-' + cabinetId)?.querySelector('svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `qr-${cabinetId}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{cabinetName}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <QrCode className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cabinet QR Code</DialogTitle>
                  <DialogDescription>Print or download QR code for {cabinetName}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div 
                    id={`qr-code-${cabinetId}`} 
                    className="flex justify-center p-4 bg-white rounded-lg border"
                  >
                    <QRCodeSVG
                      value={qrValue}
                      size={200}
                      level="H"
                      includeMargin={true}
                      className="w-full h-auto max-w-[200px]"
                    />
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={handlePrint} variant="outline" className="w-32">
                      <Printer className="w-4 h-4 mr-2" />
                      Print
                    </Button>
                    <Button onClick={handleDownload} variant="outline" className="w-32">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Location:</span>
              <span>{locationId}</span>
            </div>
            {isSecure && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Security:</span>
                <span className="text-yellow-600">Secure Cabinet</span>
              </div>
            )}
            {notes && (
              <div className="text-sm">
                <span className="text-muted-foreground">Notes:</span>
                <p className="mt-1">{notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {(isSecure || requireCheckout) && onCheckIn && onCheckOut && (
        <ItemCheckInOut
          cabinetId={cabinetId}
          cabinetName={cabinetName}
          isSecure={isSecure}
          onCheckIn={onCheckIn}
          onCheckOut={onCheckOut}
        />
      )}
    </div>
  );
} 