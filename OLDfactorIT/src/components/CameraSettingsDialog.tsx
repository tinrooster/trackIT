import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { Camera, Save } from 'lucide-react';

interface CameraSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const CAMERA_DEVICE_ID_KEY = 'selectedCameraDeviceId';

export function CameraSettingsDialog({ isOpen, onClose }: CameraSettingsDialogProps) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [initialDeviceId, setInitialDeviceId] = useState<string>('');

  // Load available video devices and saved setting
  useEffect(() => {
    const getDevices = async () => {
      try {
        // Request permission implicitly by enumerating devices
        await navigator.mediaDevices.getUserMedia({ video: true }); 
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter(device => device.kind === 'videoinput');
        setDevices(videoDevices);

        const savedDeviceId = localStorage.getItem(CAMERA_DEVICE_ID_KEY) || '';
        setSelectedDeviceId(savedDeviceId);
        setInitialDeviceId(savedDeviceId); // Store initial value for comparison

        if (videoDevices.length > 0 && !savedDeviceId) {
          // Default to the first camera if none is saved
          setSelectedDeviceId(videoDevices[0].deviceId);
        }
      } catch (err) {
        console.error("Error accessing media devices:", err);
        toast.error("Could not access cameras. Please check permissions.");
        setDevices([]); // Clear devices if permission denied
      }
    };

    if (isOpen) {
      getDevices();
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem(CAMERA_DEVICE_ID_KEY, selectedDeviceId);
    toast.success("Camera setting saved.");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Camera Settings</DialogTitle>
          <DialogDescription>
            Select the camera device to use for barcode scanning.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="camera-select">Select Camera</Label>
            {devices.length > 0 ? (
              <Select
                value={selectedDeviceId}
                onValueChange={setSelectedDeviceId}
              >
                <SelectTrigger id="camera-select">
                  <SelectValue placeholder="Select a camera" />
                </SelectTrigger>
                <SelectContent>
                  {devices.map((device) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${devices.indexOf(device) + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">
                No cameras found or permission denied. Please ensure your browser has camera access.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={devices.length === 0 || selectedDeviceId === initialDeviceId}>
             <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}