import * as React from 'react';
import { format } from 'date-fns';
import { InventoryItem } from '@/types/inventory';
import { formatCurrency } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";
import { BarChart2, StickyNote } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function FormatCellValue({ item, column }: { item: InventoryItem; column: string }): React.ReactNode {
  if (column === 'lastUpdated') {
    const dateValue = item[column] instanceof Date ? item[column] : new Date(item[column]);
    return (
      <div className="flex flex-col">
        <span>{format(dateValue, 'MMM d, yyyy')}</span>
        {item.lastModifiedBy && (
          <span className="text-xs text-muted-foreground">
            by {item.lastModifiedBy}
          </span>
        )}
      </div>
    );
  }
  if (column === 'costPerUnit') {
    return formatCurrency(item[column] as number);
  }
  if (column === 'totalValue') {
    return formatCurrency(item.quantity * (item.costPerUnit || 0));
  }
  if (column === 'quantity') {
    return `${item[column]} ${item.unit || ''}`;
  }
  if (column === 'name') {
    return (
      <div className="flex items-center gap-2">
        <span>{item[column]?.toString() || '-'}</span>
        {item.reorderLevel !== undefined && item.quantity <= item.reorderLevel && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="destructive" className="flex items-center gap-1 px-2 py-0">
                  <BarChart2 className="h-3 w-3" />
                  <span className="text-xs">Low</span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Quantity below reorder level ({item.reorderLevel})</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {item.notes && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="flex items-center gap-1 px-2 py-0">
                  <StickyNote className="h-3 w-3" />
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[300px]">
                <p className="whitespace-pre-wrap break-words text-sm">{item.notes}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
  }
  const value = item[column as keyof typeof item];
  return value?.toString() || '-';
} 