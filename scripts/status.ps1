# Usage (run from markaz-ui/):
#   .\scripts\status.ps1   Show whether the UI dev server is running

$port = 3000
$connection = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue

if ($connection) {
    $procId = $connection.OwningProcess
    $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
    Write-Host "RUNNING  — port $port | PID $procId | Process: $($proc.Name)"
} else {
    Write-Host "STOPPED  — nothing listening on port $port"
}
