param(
    [ValidateSet('local', 'remote')]
    [string]$api = 'local'
)

if ($api -eq 'remote') {
    $env:REACT_APP_API_URL = 'https://visitation-api.onrender.com'
    Write-Host "Starting UI pointing to remote API: $env:REACT_APP_API_URL"
} else {
    $env:REACT_APP_API_URL = 'http://localhost:3000'
    Write-Host "Starting UI pointing to local API: $env:REACT_APP_API_URL"
}

npm start
