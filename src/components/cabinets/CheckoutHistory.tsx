import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from 'date-fns';
import { Badge } from "@/components/ui/badge";

interface CheckoutRecord {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  timestamp: string;
  userId: string;
  userName: string;
  type: 'check-in' | 'check-out';
}

interface CheckoutHistoryProps {
  cabinetId: string;
  records: CheckoutRecord[];
}

export function CheckoutHistory({ cabinetId, records }: CheckoutHistoryProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>When</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{record.itemName}</div>
                  <div className="text-sm text-muted-foreground">{record.itemId}</div>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{record.userName}</div>
                  <div className="text-sm text-muted-foreground">{record.userId}</div>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant={record.type === 'check-out' ? 'destructive' : 'default'}
                >
                  {record.type === 'check-out' ? 'Checked Out' : 'Checked In'}
                </Badge>
              </TableCell>
              <TableCell>{record.quantity}</TableCell>
              <TableCell>
                {formatDistanceToNow(new Date(record.timestamp), { addSuffix: true })}
              </TableCell>
            </TableRow>
          ))}
          {records.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No records found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
} 