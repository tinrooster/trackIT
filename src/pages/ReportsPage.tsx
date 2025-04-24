import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { InventoryItem } from '@/types/inventory';
import { Download, FileDown, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { STORAGE_KEYS, getSettings } from '@/lib/storageService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ReportsPage() {
  const [items] = useLocalStorage<InventoryItem[]>('inventoryItems', []);
  const { toast } = useToast();

  const generateCSV = (data: any[], headers: string[], filename: string) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Report Generated",
      description: `${filename} has been downloaded.`,
    });
  };

  // Project Status Report
  const handleProjectStatusReport = () => {
    const projectStats = items.reduce((acc, item) => {
      const project = item.project || 'Unassigned';
      if (!acc[project]) {
        acc[project] = {
          totalItems: 0,
          pendingOrder: 0,
          backOrdered: 0,
          inStock: 0,
          needsReorder: 0,
          totalValue: 0
        };
      }
      acc[project].totalItems++;
      acc[project].totalValue += (item.costPerUnit || 0) * (item.quantity || 0);
      
      if (item.status === 'pending') acc[project].pendingOrder++;
      if (item.status === 'backorder') acc[project].backOrdered++;
      if ((item.quantity || 0) > 0) acc[project].inStock++;
      if ((item.quantity || 0) <= (item.minQuantity || 0)) acc[project].needsReorder++;
      
      return acc;
    }, {} as Record<string, any>);

    const reportData = Object.entries(projectStats).map(([project, stats]) => ({
      project,
      ...stats
    }));

    generateCSV(
      reportData,
      ['project', 'totalItems', 'pendingOrder', 'backOrdered', 'inStock', 'needsReorder', 'totalValue'],
      'project_status_report.csv'
    );
  };

  // Critical Items Report
  const handleCriticalItemsReport = () => {
    const criticalItems = items.filter(item => 
      (item.quantity || 0) <= (item.minQuantity || 0) ||
      item.status === 'backorder' ||
      ((item.quantity || 0) === 0 && item.status !== 'pending')
    ).map(item => ({
      ...item,
      criticalReason: (item.quantity || 0) <= (item.minQuantity || 0) ? 'Low Stock' :
                     item.status === 'backorder' ? 'Back Ordered' : 'Out of Stock',
      daysToReorder: item.expectedDeliveryDate ? 
        Math.ceil((new Date(item.expectedDeliveryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 
        'N/A'
    }));

    generateCSV(
      criticalItems,
      ['name', 'project', 'quantity', 'minQuantity', 'criticalReason', 'status', 'daysToReorder', 'location'],
      'critical_items_report.csv'
    );
  };

  // Production Planning Report
  const handleProductionPlanningReport = () => {
    const planningData = items.map(item => ({
      ...item,
      stockStatus: (item.quantity || 0) <= (item.minQuantity || 0) ? 'Reorder Required' :
                  (item.quantity || 0) === 0 ? 'Out of Stock' : 'In Stock',
      availableForProduction: Math.max(0, (item.quantity || 0) - (item.minQuantity || 0)),
      nextDelivery: item.expectedDeliveryDate ? new Date(item.expectedDeliveryDate).toLocaleDateString() : 'Not Scheduled'
    }));

    generateCSV(
      planningData,
      ['name', 'project', 'quantity', 'stockStatus', 'availableForProduction', 'nextDelivery', 'location', 'supplier'],
      'production_planning_report.csv'
    );
  };

  // Supplier Order Status Report
  const handleSupplierOrderReport = () => {
    const pendingOrders = items
      .filter(item => item.status === 'pending' || item.status === 'backorder')
      .map(item => ({
        ...item,
        orderStatus: item.status,
        expectedDelivery: item.expectedDeliveryDate ? 
          new Date(item.expectedDeliveryDate).toLocaleDateString() : 'Not Scheduled',
        daysOverdue: item.expectedDeliveryDate && new Date(item.expectedDeliveryDate) < new Date() ?
          Math.ceil((new Date().getTime() - new Date(item.expectedDeliveryDate).getTime()) / (1000 * 60 * 60 * 24)) :
          0
      }));

    generateCSV(
      pendingOrders,
      ['name', 'supplier', 'project', 'orderStatus', 'expectedDelivery', 'daysOverdue', 'quantity', 'costPerUnit'],
      'supplier_order_status_report.csv'
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Production Reports</h1>
      </div>

      <Tabs defaultValue="project">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="project">Project Status</TabsTrigger>
          <TabsTrigger value="critical">Critical Items</TabsTrigger>
          <TabsTrigger value="planning">Production Planning</TabsTrigger>
          <TabsTrigger value="orders">Order Status</TabsTrigger>
        </TabsList>

        <TabsContent value="project" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Status Overview</CardTitle>
              <CardDescription>Comprehensive status report for all projects</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                This report includes:
                <br />• Total items per project
                <br />• Items pending order/back-ordered
                <br />• Current stock levels
                <br />• Items needing reorder
                <br />• Total project value
              </p>
              <Button onClick={handleProjectStatusReport} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Generate Project Status Report
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="critical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Critical Items Report</CardTitle>
              <CardDescription>Items requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Identifies items that are:
                <br />• Below minimum quantity
                <br />• Back-ordered
                <br />• Out of stock
                <br />• Expected delivery dates
              </p>
              <Button onClick={handleCriticalItemsReport} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Generate Critical Items Report
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="planning" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Production Planning Report</CardTitle>
              <CardDescription>Stock availability for production</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Details include:
                <br />• Current stock status
                <br />• Available quantity for production
                <br />• Next scheduled deliveries
                <br />• Location and supplier information
              </p>
              <Button onClick={handleProductionPlanningReport} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Generate Production Planning Report
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Order Status</CardTitle>
              <CardDescription>Track pending and back-ordered items</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Report includes:
                <br />• Pending orders by supplier
                <br />• Back-ordered items
                <br />• Expected delivery dates
                <br />• Days overdue for late items
              </p>
              <Button onClick={handleSupplierOrderReport} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Generate Order Status Report
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}