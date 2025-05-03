# Database Setup & Schema Documentation

## Overview
This project uses **Prisma ORM** with a **MySQL** backend for all persistent data. All schema definitions are in `prisma/schema.prisma` at the project root.

---

## Models
The following models are currently defined:
- **User**: id, name, email, role, active, createdAt, updatedAt, transactions, maintenanceLogs, assignedAssets
- **Asset**: id, name, type, serialNumber, barcode, status, purchaseDate, warrantyExpiration, lastMaintenance, nextMaintenance, notes, createdAt, updatedAt, location, assignedTo, project, transactions, maintenanceLogs
- **Location**: id, name, type, description, createdAt, updatedAt, parentLocation, childLocations, assets, consumables
- **Transaction**: id, type, dueDate, notes, createdAt, asset, user
- **MaintenanceLog**: id, description, cost, date, nextMaintenanceDate, createdAt, asset, performedBy
- **Consumable**: id, name, quantity, reorderLevel, createdAt, updatedAt, location
- **Project**: id, name, description, status, startDate, endDate, createdAt, updatedAt, assets

See the full schema in `prisma/schema.prisma` for field details and relations.

---

## Initial Setup
1. **Install MySQL** and create a database (e.g., `trackit_db`).
2. **Set your connection string** in `.env` at the project root:
   ```
   DATABASE_URL="mysql://root:password@localhost:3306/trackit_db"
   ```
3. **Install dependencies:**
   ```
   pnpm install
   ```
4. **Apply migrations:**
   ```
   pnpm prisma migrate dev --name init
   ```
5. **(Optional) Seed data:**
   ```
   pnpm prisma db seed
   ```

---

## Reconnecting or Rebuilding the Database
If you need to reestablish or reconnect the database (e.g., after a fresh clone or DB reset):

1. **Ensure MySQL is running** and the database exists.
2. **Check `.env`** for the correct `DATABASE_URL`.
3. **Run migrations from the project root:**
   ```
   pnpm prisma migrate dev
   ```
4. **(Optional) Open Prisma Studio to inspect data:**
   ```
   pnpm prisma studio
   ```
5. **Start the Tauri app:**
   ```
   cd refactored_trackit
   pnpm tauri dev
   ```

---

## Troubleshooting
- **No tables in MySQL?**
  - Make sure you are running migrations from the project root, not a subdirectory.
  - Ensure `prisma/schema.prisma` uses `provider = "mysql"` and the correct models.
- **App not connecting?**
  - Check `.env` and restart the backend.
- **Schema changes not reflected?**
  - Run `pnpm prisma migrate dev` again after editing the schema.

---

## Notes
- All migrations and Prisma commands must be run from the project root (`/trackIT`).
- The Tauri app and frontend are run from `/trackIT/refactored_trackit`.
- For advanced DB management, use MySQL Workbench or `pnpm prisma studio`. 