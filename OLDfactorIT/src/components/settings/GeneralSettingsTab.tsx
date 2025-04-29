import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Camera } from 'lucide-react';

interface GeneralSettingsTabProps {
  onOpenCameraSettings: () => void;
}

export function GeneralSettingsTab({ onOpenCameraSettings }: GeneralSettingsTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Camera Settings</CardTitle>
          <CardDescription>Configure camera settings for scanning QR codes</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onOpenCameraSettings} variant="outline">
            <Camera className="h-4 w-4 mr-2" />
            Configure Camera
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 