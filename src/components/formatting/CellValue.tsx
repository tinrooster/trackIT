import * as React from 'react';
import { format } from 'date-fns';
import { InventoryItem } from '@/types/inventory';
import { formatCurrency } from '@/lib/utils';

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
  const value = item[column as keyof typeof item];
  return value?.toString() || '-';
} 