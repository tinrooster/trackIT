# Getting Started

This guide will help you set up and run the Inventory Tracking System on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or later)
- [npm](https://www.npmjs.com/) (v7 or later) or [pnpm](https://pnpm.io/) (v7 or later)
- A modern web browser (Chrome, Firefox, Edge, or Safari)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/inventory-tracker.git
   cd inventory-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

## Building for Production

To create a production build:

```bash
npm run build
# or
pnpm build
```

The build artifacts will be stored in the `dist/` directory.

To preview the production build locally:

```bash
npm run preview
# or
pnpm preview
```

## Environment Setup

The application uses browser localStorage for data persistence. No additional environment setup is required for basic functionality.

## Initial Configuration

When you first start the application, you should:

1. Navigate to the **Settings** page
2. Add common categories, units, locations, suppliers, and projects that you'll use
3. Save your settings
4. Begin adding inventory items

## Data Persistence

All data is stored in your browser's localStorage. This means:

- Data persists between browser sessions
- Data is not shared between different browsers or devices
- Clearing browser data will erase your inventory data

For production use, consider implementing a backend server with a database for more robust data storage.

## Next Steps

Once you have the application running, proceed to the [User Guide](user-guide.md) to learn how to use the various features of the Inventory Tracking System.