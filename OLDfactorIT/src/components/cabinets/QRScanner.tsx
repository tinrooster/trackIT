import React from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';

interface QRScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [error, setError] = React.useState<string>('');
  
  React.useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { 
        fps: 10,
        qrbox: { width: 250, height: 250 }
      },
      false
    );

    scanner.render(
      (decodedText) => {
        scanner.clear();
        onScan(decodedText);
        onClose();
      },
      (errorMessage) => {
        setError(errorMessage?.toString() || 'Scanning error');
      }
    );

    return () => {
      scanner.clear();
    };
  }, [onScan, onClose]);

  return (
    <Card className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 z-10"
        onClick={onClose}
      >
        <X className="h-4 w-4" />
      </Button>
      <CardContent className="p-4">
        <div id="qr-reader" className="w-full max-w-sm mx-auto" />
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        <p className="text-sm text-gray-500 text-center mt-4">
          Position the QR code within the frame to scan
        </p>
      </CardContent>
    </Card>
  );
} 