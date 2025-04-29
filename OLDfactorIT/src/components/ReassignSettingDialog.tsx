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
import { AlertTriangle } from 'lucide-react';
import { InventoryItem } from '@/types/inventory';
import { cn } from '@/lib/utils'; // Import the cn function

type SettingsKey = 'CATEGORIES' | 'UNITS' | 'LOCATIONS' | 'SUPPLIERS' | 'PROJECTS';
type ItemField = 'category' | 'unit' | 'location' | 'supplier' | 'project';

interface ReassignSettingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  settingType: SettingsKey;
  valueToRemove: string;
  existingOptions: string[];
  items: InventoryItem[]; // Pass all items to count affected ones
  onConfirm: (action: 'remove' | 'reassign', reassignTo?: string) => void;
}

export function ReassignSettingDialog({
  isOpen,
  onClose,
  settingType,
  valueToRemove,
  existingOptions,
  items,
  onConfirm,
}: ReassignSettingDialogProps) {
  const [reassignTarget, setReassignTarget] = useState<string>('');
  const [action, setAction] = useState<'remove' | 'reassign'>('remove');

  const itemFieldMap: Record<SettingsKey, ItemField> = {
    CATEGORIES: 'category',
    UNITS: 'unit',
    LOCATIONS: 'location',
    SUPPLIERS: 'supplier',
    PROJECTS: 'project',
  };

  const itemField = itemFieldMap[settingType];
  const affectedItemsCount = items.filter(item => item[itemField] === valueToRemove).length;
  const availableOptions = existingOptions.filter(opt => opt !== valueToRemove);

  useEffect(() => {
    // Reset state when dialog opens or value changes
    if (isOpen) {
      setAction('remove');
      setReassignTarget('');
    }
  }, [isOpen, valueToRemove]);

  const handleConfirm = () => {
    if (action === 'reassign' && !reassignTarget) {
      // Optionally add validation feedback
      return;
    }
    onConfirm(action, action === 'reassign' ? reassignTarget : undefined);
    onClose();
  };

  const settingTypeName = settingType.toLowerCase().slice(0, -1); // e.g., "category"

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Remove "{valueToRemove}"?</DialogTitle>
          <DialogDescription>
            This {settingTypeName} is used by{' '}
            <span className="font-bold">{affectedItemsCount}</span> inventory item(s).
            Choose how to handle these items.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="remove-label"
              name="reassign-action"
              value="remove"
              checked={action === 'remove'}
              onChange={() => setAction('remove')}
            />
            <Label htmlFor="remove-label" className="cursor-pointer">
              Remove {settingTypeName} label from affected items
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="reassign-label"
              name="reassign-action"
              value="reassign"
              checked={action === 'reassign'}
              onChange={() => setAction('reassign')}
              disabled={availableOptions.length === 0}
            />
            <Label
              htmlFor="reassign-label"
              className={cn("cursor-pointer", availableOptions.length === 0 && "text-muted-foreground")} // cn was used here
            >
              Reassign affected items to:
            </Label>
          </div>

          {action === 'reassign' && (
            <div className="pl-6">
              {availableOptions.length > 0 ? (
                <Select value={reassignTarget} onValueChange={setReassignTarget}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Select new ${settingTypeName}...`} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                 <p className="text-sm text-muted-foreground italic">No other {settingTypeName}s available to reassign to.</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-between">
           <p className="text-xs text-muted-foreground flex items-center gap-1">
             <AlertTriangle className="h-3 w-3"/> This action cannot be undone.
           </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={action === 'reassign' && !reassignTarget && availableOptions.length > 0}>
              Confirm
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}