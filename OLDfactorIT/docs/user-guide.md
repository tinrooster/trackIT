# User Guide

This guide provides detailed instructions on how to use the Inventory Tracking System.

## Navigation

The application has five main sections accessible from the navigation bar:

- **Dashboard**: Overview of inventory status and low stock alerts
- **Inventory**: Complete list of inventory items with search and filter capabilities
- **Templates**: Manage item templates for quick creation
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
- Use the "Batch Operations" button to perform actions on multiple items

### Adding Items
To add a new inventory item:
1. Click the "Add Item" button
2. Choose between creating from scratch or using a template
3. Fill in the required fields (Name, Quantity, Unit)
4. Add optional details (Description, Category, Location, etc.)
5. Click "Add Item" to save

### Using Templates
To create items from templates:
1. Click the "Add Item" button
2. Select "Use Template" from the dropdown
3. Choose a template from the list
4. Modify any fields as needed
5. Click "Add Item" to save

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

### Batch Operations
To perform actions on multiple items:
1. Click the "Batch Operations" button in the inventory view
2. Select the items you want to modify
3. Choose the operation (e.g., adjust quantity, change category)
4. Enter the required information
5. Click "Apply" to execute the operation on all selected items

## Template Management

The Templates page allows you to create and manage item templates:

### Creating Templates
1. Click the "New Template" button
2. Fill in the template details:
   - Name and description
   - Default category, unit, and location
   - Default reorder level
   - Default supplier and project
   - Any other default values
3. Click "Save Template"

### Using Templates
1. When adding a new item, select "Use Template"
2. Choose a template from the list
3. The form will be pre-filled with the template's default values
4. Modify any values as needed
5. Click "Add Item" to create the new item

### Managing Templates
- Edit templates by clicking the edit icon
- Delete templates by clicking the delete icon
- View template details by clicking on a template name
- Export templates to share with other users

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
- **Template Usage**: Create templates for frequently added items to save time
- **Batch Operations**: Use batch operations for efficient management of multiple items