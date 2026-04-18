@echo off
echo Starting Gestion Commerciale Servers...
echo.

echo Starting Backend Server...
cd /d "%~dp0backend"
start "Backend Server" cmd /c "npm start"

timeout /t 3 /nobreak > nul

echo Starting Frontend Server...
cd /d "%~dp0frontend\build"
start "Frontend Server" python -c "
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
"

echo.
echo Servers started successfully!
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3001
echo.
echo Press any key to close this window...
pause > nul