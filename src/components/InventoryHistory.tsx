"use client";

import React, { useState } from 'react';
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUpDown, Search, FileDown } from "lucide-react";
import { exportToExcel } from "@/lib/exportUtils";
import { toast } from "sonner";

interface InventoryHistoryEntry {
  itemId: string;
  itemName: string;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  timestamp: Date | string;
}

interface InventoryHistoryProps {
  history: InventoryHistoryEntry[];
}

export function InventoryHistory({ history }: InventoryHistoryProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof InventoryHistoryEntry;
    direction: "asc" | "desc";
  } | null>({ key: "timestamp", direction: "desc" });

  const itemsPerPage = 10;

  // Process history data to ensure timestamps are Date objects
  const processedHistory = history.map(entry => ({
    ...entry,
    timestamp: entry.timestamp instanceof Date ? entry.timestamp : new Date(entry.timestamp)
  }));

  // Apply sorting
  const sortedHistory = [...processedHistory].sort((a, b) => {
    if (!sortConfig) return 0;

    const { key, direction } = sortConfig;

    if (key === "timestamp") {
      const aTime = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
      const bTime = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
      return direction === "asc" ? aTime.getTime() - bTime.getTime() : bTime.getTime() - aTime.getTime();
    }

    const aValue = a[key];
    const bValue = b[key];

    if (typeof aValue === "number" && typeof bValue === "number") {
      return direction === "asc" ? aValue - bValue : bValue - aValue;
    }

    const aString = String(aValue).toLowerCase();
    const bString = String(bValue).toLowerCase();

    return direction === "asc"
      ? aString.localeCompare(bString)
      : bString.localeCompare(aString);
  });

  // Apply filtering
  const filteredHistory = sortedHistory.filter(entry => {
    const searchTerm = filter.toLowerCase();
    return (
      entry.itemName.toLowerCase().includes(searchTerm) ||
      entry.reason.toLowerCase().includes(searchTerm)
    );
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedHistory = filteredHistory.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (key: keyof InventoryHistoryEntry) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleExport = () => {
    if (filteredHistory.length === 0) {
      toast.warning("No history entries to export");
      return;
    }

    const dataToExport = filteredHistory.map(entry => ({
      "Item Name": entry.itemName,
      "Previous Quantity": entry.previousQuantity,
      "New Quantity": entry.newQuantity,
      "Change": entry.newQuantity - entry.previousQuantity,
      "Reason": entry.reason,
      "Date/Time": format(
        entry.timestamp instanceof Date ? entry.timestamp : new Date(entry.timestamp),
        "yyyy-MM-dd HH:mm:ss"
      )
    }));

    exportToExcel(dataToExport, "Inventory_History_Export", "Inventory History");
    toast.success("History exported successfully");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Filter by item name or reason..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        <Button onClick={handleExport} variant="outline" size="sm">
          <FileDown className="mr-2 h-4 w-4" />
          Export History
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort("itemName")}
                className="p-0 h-auto text-left"
              >
                Item Name
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort("previousQuantity")}
                className="p-0 h-auto text-left"
              >
                Previous Qty
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort("newQuantity")}
                className="p-0 h-auto text-left"
              >
                New Qty
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>Change</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort("reason")}
                className="p-0 h-auto text-left"
              >
                Reason
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort("timestamp")}
                className="p-0 h-auto text-left"
              >
                Date/Time
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedHistory.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center h-24">
                No history entries found.
              </TableCell>
            </TableRow>
          ) : (
            paginatedHistory.map((entry, index) => {
              const change = entry.newQuantity - entry.previousQuantity;
              const changeColor = change > 0 ? "text-green-600" : change < 0 ? "text-red-600" : "";
              const changePrefix = change > 0 ? "+" : "";

              return (
                <TableRow key={`${entry.itemId}-${index}`}>
                  <TableCell className="font-medium">{entry.itemName}</TableCell>
                  <TableCell>{entry.previousQuantity}</TableCell>
                  <TableCell>{entry.newQuantity}</TableCell>
                  <TableCell className={changeColor}>
                    {changePrefix}{change}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={entry.reason}>
                    {entry.reason}
                  </TableCell>
                  <TableCell>
                    {format(
                      entry.timestamp instanceof Date ? entry.timestamp : new Date(entry.timestamp),
                      "PPp"
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              />
            </PaginationItem>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Show pages around current page
              let pageToShow;
              if (totalPages <= 5) {
                pageToShow = i + 1;
              } else if (currentPage <= 3) {
                pageToShow = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageToShow = totalPages - 4 + i;
              } else {
                pageToShow = currentPage - 2 + i;
              }

              return (
                <PaginationItem key={pageToShow}>
                  <PaginationLink
                    isActive={currentPage === pageToShow}
                    onClick={() => setCurrentPage(pageToShow)}
                  >
                    {pageToShow}
                  </PaginationLink>
                </PaginationItem>
              );
            })}

            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}