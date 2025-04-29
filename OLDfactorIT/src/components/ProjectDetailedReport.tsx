import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, cn } from '@/lib/utils' // Import cn
import { AlertTriangle, CheckCircle, Clock, ShoppingCart, Calendar } from 'lucide-react'
import { OrderStatus } from '@/types/inventory'
import { format } from 'date-fns'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip" // Import Tooltip

interface ProjectDetailedReportProps {
  projectName: string
  reportData: Record<string, any>
}

export function ProjectDetailedReport({ projectName, reportData }: ProjectDetailedReportProps) {
  // Calculate total project cost
  const totalProjectCost = Object.values(reportData).reduce((total: number, supplierItems: any) => {
    return total + Object.values(supplierItems).reduce((supplierTotal: number, item: any) => {
      return supplierTotal + (item.totalCost || 0)
    }, 0)
  }, 0)
  
  // Generate color for supplier sections
  const getSupplierColor = (index: number) => {
    const colors = [
      'border-blue-300', 'border-green-300', 'border-purple-300', 
      'border-amber-300', 'border-rose-300', 'border-cyan-300', 
      'border-indigo-300', 'border-emerald-300'
    ]
    return colors[index % colors.length]
  }
  
  // Check if there's any data to display
  const hasData = Object.keys(reportData).length > 0
  
  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="h-3.5 w-3.5 text-green-500" />;
      case 'partially_delivered': return <Clock className="h-3.5 w-3.5 text-amber-500" />;
      case 'backordered': return <AlertTriangle className="h-3.5 w-3.5 text-red-500" />;
      case 'on_order': return <ShoppingCart className="h-3.5 w-3.5 text-blue-500" />;
      case 'not_ordered': return <Calendar className="h-3.5 w-3.5 text-gray-500" />;
    }
  };
  
  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case 'delivered': return 'Delivered';
      case 'partially_delivered': return 'Partial';
      case 'backordered': return 'Backordered';
      case 'on_order': return 'On Order';
      case 'not_ordered': return 'Not Ordered';
    }
  };
  
  return (
    <TooltipProvider> {/* Added TooltipProvider */}
      <div className="space-y-4"> {/* Reduced spacing */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1"> {/* Reduced gap */}
          <h2 className="text-md font-semibold">{projectName}</h2> {/* Smaller heading */}
          {totalProjectCost > 0 && (
            <div className="text-md font-bold"> {/* Smaller font */}
              Total Cost: {formatCurrency(totalProjectCost)}
            </div>
          )}
        </div>
        
        {!hasData ? (
          <div className="text-center py-6 text-muted-foreground text-sm"> {/* Smaller text */}
            No items found for this project. Add items to the inventory and assign them to this project.
          </div>
        ) : (
          <div className="space-y-4"> {/* Reduced spacing */}
            {Object.entries(reportData).map(([supplier, items], index) => (
              <Card key={supplier} className={cn("border-l-4", getSupplierColor(index))}>
                <CardHeader className="py-2 px-3"> {/* Reduced padding */}
                  <CardTitle className="text-md">{supplier}</CardTitle> {/* Smaller title */}
                </CardHeader>
                <CardContent className="p-0"> {/* Remove padding for table */}
                  <Table className="text-xs"> {/* Smaller base text size */}
                    <TableHeader>
                      <TableRow>
                        <TableHead className="h-8 px-2">Item</TableHead> {/* Reduced padding/height */}
                        <TableHead className="h-8 px-2 text-right">Qty</TableHead>
                        <TableHead className="h-8 px-2 text-right">Cost/Unit</TableHead>
                        <TableHead className="h-8 px-2 text-right">Total Cost</TableHead>
                        <TableHead className="h-8 px-2 text-right w-[120px]">Status</TableHead> {/* Fixed width */}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(items as Record<string, any>).map(([itemKey, data]: [string, any]) => {
                        const orderStatus = data.items[0]?.orderStatus || 'delivered';
                        const deliveryPercentage = data.items[0]?.deliveryPercentage || 100;
                        const expectedDeliveryDate = data.items[0]?.expectedDeliveryDate;
                        
                        return (
                          <TableRow key={itemKey} className="h-9"> {/* Reduced height */}
                            <TableCell className="py-1 px-2 font-medium max-w-[150px] truncate"> {/* Reduced padding, truncate */}
                              <Tooltip>
                                <TooltipTrigger asChild><span>{data.name}</span></TooltipTrigger>
                                <TooltipContent><p>{data.name}</p></TooltipContent>
                              </Tooltip>
                            </TableCell>
                            <TableCell className="py-1 px-2 text-right">{data.quantity} {data.unit}</TableCell>
                            <TableCell className="py-1 px-2 text-right">
                              {data.costPerUnit !== undefined ? formatCurrency(data.costPerUnit) : 'N/A'}
                            </TableCell>
                            <TableCell className="py-1 px-2 text-right">
                              {data.totalCost > 0 ? formatCurrency(data.totalCost) : 'N/A'}
                            </TableCell>
                            <TableCell className="py-1 px-2">
                              <div className="flex flex-col items-end gap-0.5"> {/* Reduced gap */}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1 cursor-default">
                                      {getStatusIcon(orderStatus)}
                                      <span className="text-xs">{getStatusLabel(orderStatus)}</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{getStatusLabel(orderStatus)}</p>
                                    {(orderStatus === 'backordered' || orderStatus === 'on_order') && expectedDeliveryDate && (
                                      <p>ETA: {format(new Date(expectedDeliveryDate), 'PP')}</p>
                                    )}
                                  </TooltipContent>
                                </Tooltip>
                                {(orderStatus === 'partially_delivered' || orderStatus === 'on_order') && (
                                  <div className="w-16"> {/* Reduced width */}
                                    <Progress value={deliveryPercentage} className="h-1.5" /> {/* Smaller height */}
                                    <div className="text-[10px] text-right mt-0.5">{deliveryPercentage}%</div> {/* Even smaller text */}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}