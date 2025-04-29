import { type FC } from 'react';
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
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface OrderStatusSelectorProps {
  value: OrderStatus;
  onValueChange: (value: OrderStatus) => void;
  deliveryPercentage?: number;
  onDeliveryPercentageChange?: (value: number) => void;
}

const orderStatusDisplayNames: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'Pending',
  [OrderStatus.IN_PROGRESS]: 'In Progress',
  [OrderStatus.COMPLETED]: 'Completed',
  [OrderStatus.CANCELLED]: 'Cancelled',
  [OrderStatus.BACK_ORDERED]: 'Back Ordered'
};

const orderStatusColors: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'bg-slate-400',
  [OrderStatus.IN_PROGRESS]: 'bg-blue-500',
  [OrderStatus.COMPLETED]: 'bg-green-500',
  [OrderStatus.CANCELLED]: 'bg-red-500',
  [OrderStatus.BACK_ORDERED]: 'bg-orange-500'
};

export const OrderStatusSelector: FC<OrderStatusSelectorProps> = ({ 
  value, 
  onValueChange,
  deliveryPercentage = 0,
  onDeliveryPercentageChange
}) => {
  return (
    <div className="space-y-4">
      <Select 
        value={value} 
        onValueChange={(val) => onValueChange(val as OrderStatus)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select order status">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-3 h-3 rounded-full",
                orderStatusColors[value]
              )} />
              {orderStatusDisplayNames[value]}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.values(OrderStatus).map((status) => (
            <SelectItem key={status} value={status}>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  orderStatusColors[status]
                )} />
                {orderStatusDisplayNames[status]}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {value === OrderStatus.IN_PROGRESS && onDeliveryPercentageChange && (
        <div className="space-y-2">
          <div className="relative">
            <Slider
              value={[deliveryPercentage]}
              min={0}
              max={100}
              step={25}
              onValueChange={(vals: number[]) => onDeliveryPercentageChange(vals[0])}
              progressColor={
                deliveryPercentage === 0 ? "bg-slate-400" :
                deliveryPercentage <= 25 ? "bg-orange-500" :
                deliveryPercentage <= 50 ? "bg-blue-500" :
                deliveryPercentage <= 75 ? "bg-yellow-500" :
                "bg-green-500"
              }
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>
      )}
    </div>
  );
};