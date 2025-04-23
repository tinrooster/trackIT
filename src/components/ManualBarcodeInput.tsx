import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Keyboard } from "lucide-react";
import { toast } from "sonner";

interface ManualBarcodeInputProps {
  onBarcodeDetected: (barcode: string) => void;
  isActive?: boolean;
  placeholder?: string;
}

export function ManualBarcodeInput({ 
  onBarcodeDetected, 
  isActive = true,
  placeholder = "Waiting for barcode scan..."
}: ManualBarcodeInputProps) {
  const [barcode, setBarcode] = useState<string>("");
  const [isListening, setIsListening] = useState<boolean>(isActive);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<number | null>(null);

  // Setup barcode scanner listener
  useEffect(() => {
    if (!isListening) return;
    
    // Focus the input field to capture keystrokes
    if (inputRef.current) {
      inputRef.current.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture if the user is typing in another input
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement) {
        if (e.target !== inputRef.current) {
          return;
        }
      }

      // Most barcode scanners send an Enter key after the barcode
      if (e.key === 'Enter') {
        if (barcode.length > 0) {
          console.log("Barcode detected:", barcode);
          onBarcodeDetected(barcode);
          setBarcode("");
          e.preventDefault();
        }
      } else if (e.key.length === 1) { // Only add printable characters
        setBarcode(prev => prev + e.key);
        
        // Reset the barcode after a timeout (barcode scanners are fast)
        if (timeoutRef.current) {
          window.clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = window.setTimeout(() => {
          setBarcode("");
        }, 500); // Reset after 500ms of inactivity
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [isListening, barcode, onBarcodeDetected]);

  // Update listening state when isActive changes
  useEffect(() => {
    setIsListening(isActive);
  }, [isActive]);

  const toggleListening = () => {
    const newState = !isListening;
    setIsListening(newState);
    
    if (newState) {
      toast.success("Barcode scanner input activated");
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } else {
      toast.info("Barcode scanner input deactivated");
    }
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        value={barcode}
        onChange={(e) => setBarcode(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && barcode.length > 0) {
            onBarcodeDetected(barcode);
            setBarcode("");
            e.preventDefault();
          }
        }}
        placeholder={placeholder}
        className={`pr-10 ${isListening ? 'border-primary' : 'border-muted'}`}
        autoComplete="off"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
        onClick={toggleListening}
        title={isListening ? "Deactivate barcode scanner" : "Activate barcode scanner"}
      >
        <Keyboard className={`h-4 w-4 ${isListening ? 'text-primary' : 'text-muted-foreground'}`} />
      </Button>
    </div>
  );
}