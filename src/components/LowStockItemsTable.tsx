import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { InventoryItem } from "@/types/inventory";
import { AlertTriangle, ExternalLink } from "lucide-react";

interface LowStockItemsTableProps {
  items: InventoryItem[];
}

export function LowStockItemsTable({ items }: LowStockItemsTableProps) {
  const navigate = useNavigate();

  const lowStockItems = items
    .filter(item => item.reorderLevel !== undefined && item.quantity < item.reorderLevel)
    .sort((a, b) => {
      // Calculate how far below reorder level each item is (as a percentage)
      const aPercentage = a.reorderLevel ? (a.quantity / a.reorderLevel) : 0;
      const bPercentage = b.reorderLevel ? (b.quantity / b.reorderLevel) : 0;

      // Sort by percentage (lowest first)
      return aPercentage - bPercentage;
    })
    .slice(0, 5); // Show only top 5 most critical items

  const handleViewItem = (itemId: string) => {
    navigate(`/inventory/${itemId}`);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">Current</TableHead>
          <TableHead className="text-right">Reorder</TableHead>
          <TableHead className="text-right">Status</TableHead>
          <TableHead className="w-[80px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lowStockItems.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-6">
              <div className="flex flex-col items-center justify-center text-muted-foreground">
                <AlertTriangle className="h-8 w-8 mb-2 text-muted-foreground/50" />
                <p>No items are currently below their reorder level.</p>
              </div>
            </TableCell>
          </TableRow>
        ) : (
          lowStockItems.map((item) => {
            // Calculate percentage of current quantity compared to reorder level
            const percentage = item.reorderLevel ? (item.quantity / item.reorderLevel) * 100 : 0;
            let statusColor = "text-red-600";

            if (percentage > 75) {
              statusColor = "text-amber-500";
            } else if (percentage > 50) {
              statusColor = "text-amber-600";
            } else if (percentage > 25) {
              statusColor = "text-orange-600";
            }

            return (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.category || "—"}</TableCell>
                <TableCell className="text-right">{item.quantity} {item.unit}</TableCell>
                <TableCell className="text-right">{item.reorderLevel} {item.unit}</TableCell>
                <TableCell className={`text-right ${statusColor}`}>
                  <div className="flex items-center justify-end">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    <span>{Math.round(percentage)}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleViewItem(item.id)}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}