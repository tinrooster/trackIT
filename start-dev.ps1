# PowerShell script to initialize SQL DB, start frontend, and start Tauri app

Write-Host "[trackIT] Initializing SQL database (prisma migrate)..."
cd $PSScriptRoot
pnpm prisma migrate dev

Write-Host "[trackIT] Starting frontend (Vite dev server) in background..."
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd refactored_trackit; pnpm dev'

Start-Sleep -Seconds 3
Write-Host "[trackIT] Starting Tauri desktop app..."
pnpm tauri dev 