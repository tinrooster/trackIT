# Technical Documentation

This document provides technical details about the Inventory Tracking System's architecture, components, and implementation.

## Architecture Overview

The application follows a modern React architecture with the following key characteristics:

- **Component-Based Structure**: UI is composed of reusable components
- **Client-Side Routing**: Uses React Router for navigation
- **Local State Management**: Uses React's useState and useEffect hooks
- **Form Handling**: Uses React Hook Form with Zod validation
- **Data Persistence**: Uses browser localStorage
- **UI Design System**: Custom components based on shadcn/ui design principles
- **Error Handling**: Global error boundary for application stability
- **Template System**: Reusable item templates for quick creation

## Directory Structure

```
src/
├── components/       # Reusable UI components
│   ├── ui/           # Base UI components (buttons, inputs, etc.)
│   └── ...           # Feature-specific components
├── lib/              # Utility functions and services
├── pages/            # Page components for each route
├── types/            # TypeScript type definitions
├── App.tsx           # Main application component with routing
└── main.tsx          # Application entry point
```

## Key Components

### UI Components

- **Button**: Customizable button component with various styles
- **Card**: Container component for structured content
- **Dialog**: Modal dialog for forms and confirmations
- **Form**: Form components with validation support
- **Input/Textarea**: Text input components
- **Table**: Data table with sorting and filtering
- **Toast**: Notification system for user feedback
- **ErrorBoundary**: Global error handling component

### Feature Components

- **AddItemDialog/Form**: Components for adding new inventory items
- **BarcodeScanner**: Component for scanning barcodes using the device camera
- **BatchOperations**: Component for performing bulk actions on inventory items
- **DashboardSummaryCard**: Card component for dashboard metrics
- **ErrorBoundary**: Component for catching and handling runtime errors
- **InventoryAdjustment**: Component for adjusting item quantities
- **InventoryHistory**: Component for displaying history of inventory changes
- **InventoryTable**: Table component for displaying inventory items
- **ItemDetails**: Component for displaying detailed item information
- **LowStockItemsTable**: Component for displaying items below reorder level
- **Navigation**: Navigation bar component
- **QuickLookup**: Component for quickly finding items
- **TemplateForm**: Component for creating and managing item templates
- **UsersTab**: Component for user management interface

## Data Model

### InventoryItem

```typescript
interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  category?: string;
  location?: string;
  reorderLevel?: number;
  barcode?: string;
  notes?: string;
  supplier?: string;
  supplierWebsite?: string;
  project?: string;
  lastUpdated: Date;
  lastModifiedBy?: string;
}
```

### InventoryTemplate

```typescript
interface InventoryTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  unit: string;
  defaultLocation?: string;
  defaultReorderLevel?: number;
  defaultNotes?: string;
  defaultSupplier?: string;
  defaultProject?: string;
  createdBy: string;
  lastUpdated: Date;
}
```

### InventoryHistoryEntry

```typescript
interface InventoryHistoryEntry {
  itemId: string;
  itemName: string;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  timestamp: Date;
  modifiedBy?: string;
}
```

## Storage Service

The `storageService.ts` module provides functions for interacting with localStorage:

- **getInventoryItems**: Retrieves all inventory items
- **saveInventoryItems**: Saves all inventory items
- **addInventoryItem**: Adds a new inventory item
- **updateInventoryItem**: Updates an existing inventory item
- **deleteInventoryItem**: Deletes an inventory item
- **adjustInventoryQuantity**: Adjusts the quantity of an item
- **getInventoryHistory**: Retrieves the history of inventory changes
- **addHistoryEntry**: Adds a new history entry
- **getSettings**: Retrieves settings (categories, units, etc.)
- **saveSettings**: Saves settings
- **getTemplates**: Retrieves all item templates
- **saveTemplates**: Saves all item templates
- **addTemplate**: Adds a new template
- **updateTemplate**: Updates an existing template
- **deleteTemplate**: Deletes a template

## Form Validation

Form validation is implemented using Zod schemas:

```typescript
const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  quantity: z.coerce.number().min(0, { message: "Quantity cannot be negative." }),
  unit: z.string().min(1, { message: "Unit is required." }),
  // Additional fields with validation rules
});

const templateSchema = z.object({
  name: z.string().min(2, { message: "Template name must be at least 2 characters." }),
  unit: z.string().min(1, { message: "Unit is required." }),
  // Additional template-specific fields
});
```

## Error Boundary

The application implements a global error boundary to catch and handle runtime errors:

```typescript
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to error reporting service
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

## Barcode Scanning

Barcode scanning is implemented using the react-zxing library, which provides a React wrapper around the ZXing barcode scanning library:

```typescript
const { ref } = useZxing({
  onDecodeResult(result) {
    const barcodeValue = result.getText();
    onScan(barcodeValue);
  },
  onError(error) {
    // Error handling
  },
});
```

## Data Export

Data export to Excel is implemented using the XLSX library:

```typescript
export function exportToExcel(data: any[], filename: string, sheetName: string = 'Sheet1') {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
```

## Routing

Routing is implemented using React Router:

```typescript
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="/dashboard" element={<DashboardPage />} />
    <Route path="/inventory" element={<InventoryPage />} />
    <Route path="/inventory/:id" element={<ItemDetailsPage />} />
    <Route path="/templates" element={<TemplatesPage />} />
    <Route path="/reports" element={<ReportsPage />} />
    <Route path="/settings" element={<SettingsPage />} />
  </Routes>
</BrowserRouter>
```

## Styling

The application uses Tailwind CSS for styling, with a custom theme defined in `tailwind.config.js`. The theme includes:

- Custom colors based on CSS variables
- Custom border radius values
- Custom animations
- Typography plugin for rich text styling

## Performance Considerations

- **Memoization**: Uses React.useMemo for expensive calculations
- **Pagination**: Implements pagination for large data sets
- **Filtering**: Implements client-side filtering for quick searches
- **Lazy Loading**: Could be implemented for larger applications
- **Batch Operations**: Optimized for handling multiple items simultaneously

## Security Considerations

- **Data Validation**: All user inputs are validated using Zod schemas
- **XSS Prevention**: React's built-in protections against XSS
- **CORS**: Not applicable for a client-only application
- **Authentication**: Not implemented in the current version
- **Error Handling**: Global error boundary for application stability

## Future Enhancements

- **Backend Integration**: Connect to a server for data persistence
- **User Authentication**: Add user accounts and permissions
- **Multi-device Sync**: Synchronize data across devices
- **Offline Support**: Implement PWA features for offline use
- **Advanced Reporting**: Add more sophisticated reporting capabilities
- **Barcode Generation**: Generate barcodes for items
- **Inventory Forecasting**: Predict future inventory needs
- **Template Versioning**: Track changes to templates over time
- **Batch Operation Templates**: Create reusable batch operation templates

# UI Components

## Progress Slider
The progress slider is used in the order status tracking to show delivery percentage. It features a color-changing progress bar that updates based on the completion percentage.

### Implementation
The slider is built using Radix UI's slider primitive with custom styling and color progression:

```tsx
// src/components/ui/slider.tsx
const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
    progressColor?: string;
  }
>(({ className, progressColor, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-slate-200">
      <SliderPrimitive.Range 
        className={cn(
          "absolute h-full",
          progressColor || "bg-blue-500"
        )}
      />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
))
```

### Usage
```tsx
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
```

### Color Progression
The slider's fill color changes based on the completion percentage:
- 0%: Gray (`bg-slate-400`)
- 1-25%: Orange (`bg-orange-500`)
- 26-50%: Blue (`bg-blue-500`)
- 51-75%: Yellow (`bg-yellow-500`)
- 76-100%: Green (`bg-green-500`)

### Key Features
1. Progressive color fill based on percentage
2. 25% step increments
3. Dynamic color updates
4. Accessible using Radix UI primitives
5. Only visible in "In Progress" status

### Dependencies
- @radix-ui/react-slider
- tailwindcss
- clsx/class-variance-authority

### Version History

#### v1.2.0 (Current)
- Implemented progressive color fill
- Added `progressColor` prop
- Fixed color application
- Added 25% step increments

#### v1.1.0
- Added multi-segment color display

#### v1.0.0
- Initial implementation with fixed blue color

### Troubleshooting
If colors aren't displaying:
1. Check `progressColor` prop is being passed
2. Verify tailwind classes are configured
3. Ensure @radix-ui/react-slider is installed