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

### Feature Components

- **AddItemDialog/Form**: Components for adding new inventory items
- **BarcodeScanner**: Component for scanning barcodes using the device camera
- **DashboardSummaryCard**: Card component for dashboard metrics
- **InventoryAdjustment**: Component for adjusting item quantities
- **InventoryHistory**: Component for displaying history of inventory changes
- **InventoryTable**: Table component for displaying inventory items
- **ItemDetails**: Component for displaying detailed item information
- **LowStockItemsTable**: Component for displaying items below reorder level
- **Navigation**: Navigation bar component
- **QuickLookup**: Component for quickly finding items

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

## Form Validation

Form validation is implemented using Zod schemas:

```typescript
const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  quantity: z.coerce.number().min(0, { message: "Quantity cannot be negative." }),
  unit: z.string().min(1, { message: "Unit is required." }),
  // Additional fields with validation rules
});
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

## Security Considerations

- **Data Validation**: All user inputs are validated using Zod schemas
- **XSS Prevention**: React's built-in protections against XSS
- **CORS**: Not applicable for a client-only application
- **Authentication**: Not implemented in the current version

## Future Enhancements

- **Backend Integration**: Connect to a server for data persistence
- **User Authentication**: Add user accounts and permissions
- **Multi-device Sync**: Synchronize data across devices
- **Offline Support**: Implement PWA features for offline use
- **Advanced Reporting**: Add more sophisticated reporting capabilities
- **Barcode Generation**: Generate barcodes for items
- **Inventory Forecasting**: Predict future inventory needs