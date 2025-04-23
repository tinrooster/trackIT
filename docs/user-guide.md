# User Guide

This guide provides detailed instructions on how to use the Inventory Tracking System.

## Navigation

The application has four main sections accessible from the navigation bar:

- **Dashboard**: Overview of inventory status and low stock alerts
- **Inventory**: Complete list of inventory items with search and filter capabilities
- **Reports**: Generate and export various inventory reports
- **Settings**: Configure categories, units, locations, suppliers, and projects

## Dashboard

The Dashboard provides a quick overview of your inventory status:

### Summary Cards
- **Total Items**: Number of unique items in inventory
- **Total Quantity**: Combined count of all inventory items
- **Categories**: Number of different item categories
- **Low Stock**: Number of items below their reorder level

### Low Stock Items
This section displays up to 5 items that are below their reorder level, sorted by criticality (lowest percentage of stock remaining).

### Quick Lookup
Use this feature to quickly find an item by:
- Typing a barcode or item name in the search box
- Clicking the "Scan" button to scan a barcode using your device's camera

## Inventory Management

### Viewing Inventory
The Inventory page displays all items in a sortable, filterable table:
- Click column headers to sort by that column
- Use the search box to filter items (e.g., "category:cables" or just "cable")
- Click the "Export Current View" button to export the filtered list to Excel

### Adding Items
To add a new inventory item:
1. Click the "Add Item" button
2. Fill in the required fields (Name, Quantity, Unit)
3. Add optional details (Description, Category, Location, etc.)
4. Click "Add Item" to save

### Viewing Item Details
Click the edit icon (pencil) on any inventory item to view its details page, which includes:
- Complete item information
- Adjustment controls for modifying quantity
- Edit and delete options

### Editing Items
From the item details page:
1. Click the edit icon (pencil) in the top right
2. Modify any fields as needed
3. Click "Save Changes"

### Deleting Items
From the item details page:
1. Click the delete icon (trash) in the top right
2. Confirm the deletion when prompted

### Adjusting Inventory
From the item details page:
1. Use the adjustment panel on the right
2. Select "Add", "Remove", or "Set Exact"
3. Enter the quantity to adjust
4. Provide a reason for the adjustment
5. Click the adjustment button to save

## Reports

The Reports page allows you to generate and export various inventory reports:

### Inventory Summary
Export a complete list of all inventory items with their current quantities and details.

### Low Stock Report
Export a list of items that are below their reorder levels.

### Project Usage
Export a report showing which supplies have been used for different projects.

### Inventory History
View and filter the complete history of inventory adjustments:
- Search by item name or adjustment reason
- Sort by any column
- Export the filtered history to Excel

## Settings

The Settings page allows you to configure various aspects of the system:

### Categories
Add and remove categories for classifying inventory items.

### Units
Add and remove units of measurement (e.g., pcs, kg, liters).

### Locations
Add and remove storage locations for inventory items.

### Suppliers
Add and remove suppliers for inventory items.

### Projects
Add and remove projects that use inventory items.

After making changes to any settings, click the "Save Settings" button to persist your changes.

## Barcode Scanning

The application supports barcode scanning using your device's camera:

1. Click the "Scan" button in the Quick Lookup section or when adding/editing items
2. Grant camera permission if prompted
3. Position the barcode within the scanning frame
4. The application will automatically detect and process the barcode

## Tips and Best Practices

- **Regular Backups**: Since data is stored in localStorage, consider exporting your inventory regularly
- **Consistent Naming**: Use consistent naming conventions for categories, locations, etc.
- **Set Reorder Levels**: Define appropriate reorder levels for critical items to receive low stock alerts
- **Document Adjustments**: Always provide clear reasons when adjusting inventory quantities
- **Project Tracking**: Assign items to specific projects to track usage by project