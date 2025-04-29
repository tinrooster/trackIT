# TrackIT Inventory App

**Note:** The new refactored project is being scaffolded in a separate directory called `refactored_trackit` to ensure a clear separation from the legacy codebase. All new development and refactoring will occur in this directory, while the existing code remains unchanged for reference and migration purposes.

TrackIT is a modern, responsive inventory management system built with React, TypeScript, and Tailwind CSS. It provides a comprehensive solution for tracking inventory items, managing stock levels, and generating reports.

## Features

- 📊 Real-time inventory tracking
- 📱 Responsive design for desktop and mobile
- 🔍 Advanced search and filtering
- 📦 Barcode scanning support
- 📈 Inventory analytics and reporting
- 🔔 Low stock alerts
- 📤 Excel export functionality
- 📝 Template system for quick item creation
- 🔄 Batch operations for inventory management
- 🛡️ Error boundary for improved stability
- 👥 User management interface

### Location Management
- Hierarchical location structure with primary/secondary locations (e.g., "Engineering/LAB")
- Cabinet integration for specific locations
- Location types for better organization

### Cabinet System
- Cabinets are associated with specific locations
- Each cabinet has:
  - Unique ID and name
  - Location assignment
  - Security status (secure/non-secure)
  - Description
  - QR code for quick access
  - Optional category restrictions

### Batch Operations
- Multi-item selection for bulk updates
- Supports updating:
  - Categories (with subcategories)
  - Locations (with hierarchical paths)
  - Cabinets (location-specific)
  - Projects
  - Quantities
- Clear selection and batch deletion options

### Debugging & Logging
- Built-in logging system
- Logs stored in localStorage
- Downloadable debug logs for troubleshooting
- Tracks all major operations and state changes

## Data Structure

### Locations
```typescript
interface ItemWithSubcategories {
  id: string;
  name: string;
  description?: string;
  children?: ItemWithSubcategories[];
}
```

### Cabinets
```typescript
interface Cabinet {
  id: string;
  name: string;
  locationId: string;
  description?: string;
  qrCode?: string;
  isSecure: boolean;
  allowedCategories?: string[];
}
```

## Usage

### Location Selection
1. Primary locations are shown in the main dropdown
2. Full location paths are displayed (e.g., "Engineering/LAB")
3. When a location is selected, available cabinets are automatically loaded

### Cabinet Assignment
1. Cabinets only appear for locations that have them configured
2. Engineering has: E1, E2, CAB1, CAB2
3. TE Room has: TECAB1
4. Sutro has: S1

### Batch Operations
1. Select multiple items using checkboxes
2. Click "Batch Edit" to open the dialog
3. Choose which fields to update
4. Location selection will show available cabinets if any exist
5. Changes are applied to all selected items

## Development

### Adding New Locations
1. Use the settings page to add new locations
2. Optionally add subcategories/children
3. Configure cabinets if needed

### Adding New Cabinets
1. Associate with existing location using locationId
2. Provide unique ID and descriptive name
3. Set security status and any category restrictions

### Debugging
1. Logs are automatically collected
2. Access logs through the "Download Debug Logs" button in batch edit
3. Logs include operation details and state changes

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:5177](http://localhost:5177) in your browser

## Documentation

For detailed documentation, please refer to the [docs](./docs) directory:
- [Getting Started](./docs/getting-started.md)
- [User Guide](./docs/user-guide.md)
- [Technical Documentation](./docs/technical-documentation.md)
- [Development Status](./docs/development-status.md)
- [Troubleshooting](./docs/troubleshooting.md)

## Contributing

We welcome contributions! Please see our [Contribution Guidelines](./docs/development-status.md#contribution-guidelines) for details.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
