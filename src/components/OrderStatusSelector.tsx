import React from 'react';
import { OrderStatus } from '@/types/inventory';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, CheckCircle, AlertTriangle, ShoppingCart } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';

interface OrderStatusSelectorProps {
  orderStatus?: OrderStatus;
  deliveryPercentage?: number;
  expectedDeliveryDate?: Date;
  onStatusChange: (status: OrderStatus) => void;
  onPercentageChange: (percentage: number) => void;
  onDateChange: (date: Date | undefined) => void;
}

export function OrderStatusSelector({
  orderStatus = 'delivered',
  deliveryPercentage = 100,
  expectedDeliveryDate,
  onStatusChange,
  onPercentageChange,
  onDateChange
}: OrderStatusSelectorProps) {
  
  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'partially_delivered':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'backordered':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'on_order':
        return <ShoppingCart className="h-4 w-4 text-blue-500" />;
      case 'not_ordered':
        return <Calendar className="h-4 w-4 text-gray-500" />;
    }
  };
  
  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case 'delivered':
        return 'Delivered';
      case 'partially_delivered':
        return 'Partially Delivered';
      case 'backordered':
        return 'Backordered';
      case 'on_order':
        return 'On Order';
      case 'not_ordered':
        return 'Not Ordered';
    }
  };
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      onDateChange(new Date(e.target.value));
    } else {
      onDateChange(undefined);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Order Status</Label>
        <Select 
          value={orderStatus} 
          onValueChange={(value: OrderStatus) => onStatusChange(value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select status">
              <div className="flex items-center">
                {getStatusIcon(orderStatus)}
                <span className="ml-2">{getStatusLabel(orderStatus)}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="delivered">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                Delivered
              </div>
            </SelectItem>
            <SelectItem value="partially_delivered">
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-amber-500 mr-2" />
                Partially Delivered
              </div>
            </SelectItem>
            <SelectItem value="backordered">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                Backordered
              </div>
            </SelectItem>
            <SelectItem value="on_order">
              <div className="flex items-center">
                <ShoppingCart className="h-4 w-4 text-blue-500 mr-2" />
                On Order
              </div>
            </SelectItem>
            <SelectItem value="not_ordered">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                Not Ordered
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {(orderStatus === 'partially_delivered' || orderStatus === 'on_order') && (
        <div className="space-y-2">
          <Label>Delivery Percentage: {deliveryPercentage}%</Label>
          <div className="flex items-center space-x-2">
            <Input 
              type="range" 
              min="0" 
              max="100" 
              value={deliveryPercentage} 
              onChange={(e) => onPercentageChange(parseInt(e.target.value))}
              className="w-full"
            />
            <span className="w-12 text-right">{deliveryPercentage}%</span>
          </div>
          <Progress value={deliveryPercentage} className="h-2" />
        </div>
      )}
      
      {(orderStatus === 'backordered' || orderStatus === 'on_order') && (
        <div className="space-y-2">
          <Label>Expected Delivery Date</Label>
          <Input 
            type="date" 
            value={expectedDeliveryDate ? format(expectedDeliveryDate, 'yyyy-MM-dd') : ''} 
            onChange={handleDateChange}
          />
        </div>
      )}
    </div>
  );
}