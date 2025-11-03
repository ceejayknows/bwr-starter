# start-dev.ps1
Write-Host "🚀 Starting backend (npm run dev) and Stripe listener..." -ForegroundColor Green

# Start backend in a new PowerShell window
Start-Process powershell -ArgumentList "cd `"$PSScriptRoot`"; npm run dev" -NoNewWindow

# Wait a moment to avoid race condition
Start-Sleep -Seconds 2

# Start Stripe listener in another PowerShell window
Start-Process powershell -ArgumentList "cd `"$PSScriptRoot`"; stripe listen --forward-to localhost:4000/webhooks/stripe" -NoNewWindow
