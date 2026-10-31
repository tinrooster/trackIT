# PowerShell script to start frontend and Tauri app

cd $PSScriptRoot

Write-Host "[trackIT] Starting frontend (Vite dev server) in background..."
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd refactored_trackit; pnpm dev'

Start-Sleep -Seconds 3
Write-Host "[trackIT] Starting Tauri desktop app..."
pnpm tauri dev 