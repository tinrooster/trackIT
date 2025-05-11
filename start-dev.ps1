# PowerShell script to initialize SQL DB, start frontend, and start Tauri app in one terminal with better logging

Write-Host "[trackIT] Initializing SQL database (prisma migrate)..."
cd $PSScriptRoot
pnpm prisma migrate dev

if ($LASTEXITCODE -ne 0) {
    Write-Host "[trackIT] Prisma migration failed!" -ForegroundColor Red
    exit 1
}

Write-Host "[trackIT] Starting frontend (Vite dev server) in background..."
Start-Job -ScriptBlock { cd $using:frontendPath; pnpm dev }

Start-Sleep -Seconds 3
Write-Host "[trackIT] Starting Tauri desktop app in background..."
Start-Job -ScriptBlock { cd $using:PSScriptRoot; pnpm tauri dev }

Write-Host "[trackIT] All services started. Use 'Get-Job' to check running jobs. Use 'Receive-Job -Id <id>' to view logs."

# Test section: check if ports 5173 and 1420 (default Tauri) are listening
Start-Sleep -Seconds 5
$vitePort = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
$tauriPort = Get-NetTCPConnection -LocalPort 1420 -State Listen -ErrorAction SilentlyContinue
if ($vitePort) {
    Write-Host "[trackIT] Vite dev server is running on port 5173." -ForegroundColor Green
} else {
    Write-Host "[trackIT] Vite dev server is NOT running on port 5173." -ForegroundColor Red
}
if ($tauriPort) {
    Write-Host "[trackIT] Tauri app is running (port 1420)." -ForegroundColor Green
} else {
    Write-Host "[trackIT] Tauri app is NOT running (port 1420)." -ForegroundColor Red
} 