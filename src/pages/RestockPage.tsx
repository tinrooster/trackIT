import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { InventoryItem } from "@/types/inventory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";

export default function RestockPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const itemId = searchParams.get("id");

  const [item, setItem] = useState<InventoryItem | null>(null);
  const [orderedInHand, setOrderedInHand] = useState<number>(0);
  const [orderedBackorderUntil, setOrderedBackorderUntil] = useState("");
  const [exceptionOrderTracking, setExceptionOrderTracking] = useState("");

  useEffect(() => {
    if (!itemId) return;
    const savedItems = localStorage.getItem("inventory-items");
    if (savedItems) {
      const items: InventoryItem[] = JSON.parse(savedItems);
      const found = items.find(i => i.id === itemId) || null;
      if (found) {
        setItem(found);
        setOrderedInHand(found.orderedInHand || 0);
        setOrderedBackorderUntil(found.orderedBackorderUntil || "");
        setExceptionOrderTracking(found.exceptionOrderTracking || "");
      } else {
        toast.error("Item not found");
        navigate("/inventory");
      }
    }
  }, [itemId, navigate]);

  const handleSave = () => {
    if (!item) return;
    const savedItems = localStorage.getItem("inventory-items");
    if (savedItems) {
      const items: InventoryItem[] = JSON.parse(savedItems);
      const updatedItems = items.map(i =>
        i.id === item.id
          ? {
              ...i,
              orderedInHand,
              orderedBackorderUntil,
              exceptionOrderTracking,
              lastUpdated: new Date()
            }
          : i
      );
      localStorage.setItem("inventory-items", JSON.stringify(updatedItems));
      toast.success("Reorder details updated");
      navigate("/inventory");
    }
  };

  if (!item) return <div className="p-4">Loading item...</div>;

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Restock / Reorder Item</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <strong>Item:</strong> {item.name}
          </div>
          <div>
            <strong>Current Quantity:</strong> {item.quantity}
          </div>
          <div>
            <strong>Reorder Level:</strong> {item.reorderLevel ?? "-"}
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium">Ordered (In Hand)</label>
              <Input
                type="number"
                value={orderedInHand}
                onChange={(e) => setOrderedInHand(Number(e.target.value))}
                placeholder="Quantity received"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Ordered (Backorder Until)</label>
              <Input
                type="date"
                value={orderedBackorderUntil}
                onChange={(e) => setOrderedBackorderUntil(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Exception Order Tracking / Ref</label>
              <Input
                type="text"
                value={exceptionOrderTracking}
                onChange={(e) => setExceptionOrderTracking(e.target.value)}
                placeholder="Enter tracking/ref number"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => navigate("/inventory")}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Reorder Details</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}