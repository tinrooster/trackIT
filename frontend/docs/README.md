# Inventory Tracking System Documentation

## Overview

The Inventory Tracking System is a web-based application designed to help organizations manage their inventory of supplies, equipment, and materials. It provides a comprehensive solution for tracking items, monitoring stock levels, and generating reports.

This application is specifically designed for maintenance and project supply tracking rather than retail inventory management. It focuses on helping organizations keep track of items needed for maintenance and upkeep, as well as tracking supplies ordered and used for various projects throughout the year.

## Table of Contents

1. [Getting Started](getting-started.md)
2. [User Guide](user-guide.md)
3. [Technical Documentation](technical-documentation.md)
4. [Development Status](development-status.md)
5. [Troubleshooting](troubleshooting.md)

## Key Features

- **Dashboard**: View summary metrics and low stock alerts at a glance
- **Inventory Management**: Add, edit, and delete inventory items
- **Barcode Scanning**: Quickly find items using barcode scanning
- **Stock Level Monitoring**: Set reorder levels and receive alerts for low stock
- **Project Tracking**: Associate inventory items with specific projects
- **History Tracking**: Keep a detailed history of all inventory changes
- **Reporting**: Generate and export various inventory reports
- **Settings Management**: Configure categories, units, locations, suppliers, and projects

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **State Management**: React Context API, React Query
- **Data Storage**: Local Storage (browser-based)
- **UI Components**: Custom components based on shadcn/ui design system
- **Form Handling**: React Hook Form with Zod validation
- **Barcode Scanning**: react-zxing and @zxing/library
- **Data Export**: XLSX for Excel exports
- **Notifications**: Sonner for toast notifications

## License

This project is licensed under the MIT License - see the LICENSE file for details.