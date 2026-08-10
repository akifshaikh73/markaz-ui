# Usage (run from markaz-ui/):
#   .\scripts\stop.ps1   Stop the UI dev server (port 3000)

$port = 3000
$connection = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue

if ($connection) {
    $procId = $connection.OwningProcess
    $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
    Stop-Process -Id $procId -Force
    Write-Host "Stopped UI server on port $port (PID $procId, Process: $($proc.Name))"
} else {
    Write-Host "UI server is not running on port $port"
}
