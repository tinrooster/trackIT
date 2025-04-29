"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarcodeScannerDialog } from "@/components/BarcodeScannerDialog";
import { Search, Loader2, ScanLine } from "lucide-react";
import { InventoryItem } from "@/types/inventory";
import { toast } from "sonner";
import { ManualBarcodeInput } from './ManualBarcodeInput';

interface QuickLookupProps {
  items: InventoryItem[];
  onItemFound: (item: InventoryItem) => void;
}

export function QuickLookup({ items, onItemFound }: QuickLookupProps) {
  const [searchValue, setSearchValue] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);

  const handleSearch = () => {
    if (!searchValue.trim()) {
      toast.warning("Please enter a barcode or search term");
      return;
    }

    setIsSearching(true);
    
    // Simulate a slight delay for better UX
    setTimeout(() => {
      const lowerCaseSearch = searchValue.toLowerCase();
      const foundItem = items.find(
        item => 
          (item.barcode && item.barcode === searchValue) || // Exact barcode match first
          item.name.toLowerCase().includes(lowerCaseSearch) // Then name contains
      );
      
      setIsSearching(false);
      
      if (foundItem) {
        onItemFound(foundItem);
        toast.success(`Found: ${foundItem.name}`);
      } else {
        toast.error("No matching item found");
      }
    }, 300); // Keep delay for manual search
  };

  // This function is called by the BarcodeScannerDialog or ManualBarcodeInput
  const handleScanResult = (barcodeValue: string) => {
    setSearchValue(barcodeValue); // Update the input field
    
    // Automatically search after scan (no delay needed here)
    const foundItem = items.find(item => item.barcode === barcodeValue);
    
    if (foundItem) {
      onItemFound(foundItem);
      toast.success(`Found: ${foundItem.name}`);
    } else {
      toast.error(`No item found with barcode: ${barcodeValue}`);
    }
  };

  const toggleManualMode = () => {
    setIsManualMode(!isManualMode);
    if (!isManualMode) {
      toast.info("Bluetooth scanner mode activated. Scan a barcode to search.");
    }
  };

  return (
    <>
      <div className="flex flex-col space-y-4 p-4 border rounded-lg bg-card">
        <h3 className="text-lg font-medium">Quick Lookup</h3>
        
        {isManualMode ? (
          <div className="space-y-2">
            <ManualBarcodeInput 
              onBarcodeDetected={handleScanResult}
              placeholder="Waiting for barcode scan..."
            />
            <p className="text-xs text-muted-foreground">
              Bluetooth scanner mode active. Scan a barcode or type and press Enter.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleManualMode} 
              className="w-full"
            >
              Switch to Manual Search
            </Button>
          </div>
        ) : (
          <>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Enter barcode or item name"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pr-10" // Make space for the search icon button
                />
                {/* Search button inside the input */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                  onClick={handleSearch}
                  disabled={isSearching}
                  title="Search"
                >
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
              
              {/* Button to open the scanner dialog */}
              <Button 
                type="button" 
                variant="outline" 
                size="icon" 
                onClick={() => setIsScannerOpen(true)} 
                title="Scan Barcode"
              >
                <ScanLine className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Search by barcode or item name to quickly find inventory items.
              </p>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleManualMode}
                className="text-xs"
              >
                Use Bluetooth Scanner
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Barcode Scanner Dialog (same as in forms) */}
      <BarcodeScannerDialog
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanResult={handleScanResult}
      />
    </>
  );
}