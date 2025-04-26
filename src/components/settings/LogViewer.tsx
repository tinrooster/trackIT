import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';

interface LogEntry {
  timestamp: string;
  action: string;
  details: Record<string, any>;
  status: 'success' | 'error';
}

interface LogViewerProps {
  logs: LogEntry[];
}

export function LogViewer({ logs }: LogViewerProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Timestamp</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Details</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log, index) => (
            <TableRow key={`${log.timestamp}-${index}`}>
              <TableCell>
                {format(new Date(log.timestamp), 'PPpp')}
              </TableCell>
              <TableCell>
                <span className="font-medium">{log.action}</span>
              </TableCell>
              <TableCell>
                <pre className="text-sm whitespace-pre-wrap">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              </TableCell>
              <TableCell>
                <Badge
                  variant={log.status === 'success' ? 'default' : 'destructive'}
                >
                  {log.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
          {logs.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                No logs found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
} 