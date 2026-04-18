# Start Gestion Commerciale Servers
Write-Host "Starting Gestion Commerciale Servers..." -ForegroundColor Green
Write-Host ""

# Start Backend Server
Write-Host "Starting Backend Server..." -ForegroundColor Yellow
$backendPath = Join-Path $PSScriptRoot "backend"
Set-Location $backendPath
Start-Process -FilePath "npm" -ArgumentList "start" -NoNewWindow

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start Frontend Server
Write-Host "Starting Frontend Server..." -ForegroundColor Yellow
$frontendPath = Join-Path $PSScriptRoot "frontend\build"
Set-Location $frontendPath

$frontendScript = @"
import http.server
import socketserver
import os

class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/api'):
            self.send_error(404, 'API not found - use backend server')
            return
        if not os.path.exists(self.translate_path(self.path)) or self.path.endswith('/'):
            self.path = '/index.html'
        return super().do_GET()

    def log_message(self, format, *args):
        pass

with socketserver.TCPServer(('127.0.0.1', 3001), SPAHandler) as httpd:
    print('SPA Server running on http://127.0.0.1:3001')
    httpd.serve_forever()
"@

$frontendScript | python

Write-Host ""
Write-Host "Servers started successfully!" -ForegroundColor Green
Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to exit"