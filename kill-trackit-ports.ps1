# PowerShell script to kill processes using ports 5173-5178 and 5555

$killedPids = @{}
$ports = 5173..5178 + 5555
foreach ($port in $ports) {
    $connections = netstat -ano | Select-String ":$port "
    foreach ($conn in $connections) {
        if ($conn -match '\s+(\d+)$') {
            $procId = $matches[1]
            if (-not $killedPids.ContainsKey($procId)) {
                try {
                    $proc = Get-Process -Id $procId -ErrorAction Stop
                    Write-Host "Killing process $($proc.ProcessName) (PID $procId) on port $port"
                    Stop-Process -Id $procId -Force
                    $killedPids[$procId] = $true
                } catch {
                    Write-Host "Could not kill process with PID $procId (may already be closed)"
                }
            }
        }
    }
}
Write-Host "Done. All specified ports are now free." 