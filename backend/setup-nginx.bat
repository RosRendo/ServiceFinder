@echo off
REM Service-Finder Local Nginx Production Testing Setup (Windows)

echo.
echo 🔐 Service-Finder Nginx Local Production Setup (Windows)
echo =========================================================
echo.

REM Create SSL certificates directory
if not exist ".\nginx\ssl" mkdir .\nginx\ssl

REM Check if OpenSSL is available
where openssl >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ OpenSSL not found. Install it or use:
    echo    choco install openssl
    echo    OR
    echo    Download from: https://www.openssl.org/
    exit /b 1
)

REM Generate Self-Signed Certificate
echo 📜 Generating self-signed SSL certificate...
openssl req -x509 -nodes -days 365 -newkey rsa:2048 ^
    -keyout .\nginx\ssl\server.key ^
    -out .\nginx\ssl\server.crt ^
    -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

echo.
echo ✅ SSL certificates generated in .\nginx\ssl\
echo.

REM Copy nginx.conf to current directory
if not exist ".\nginx.conf" (
    echo ⚠️  nginx.conf found in current directory
) else (
    echo 📝 nginx.conf is ready
)

echo.
echo 🚀 To start nginx:
echo    1. Extract nginx to a folder (e.g., C:\nginx)
echo    2. Copy your nginx.conf to that folder
echo    3. Copy .\nginx\ssl folder to C:\nginx\conf\
echo    4. Run Command Prompt as Administrator
echo    5. cd C:\nginx
echo    6. start nginx
echo.

echo 📊 Common nginx commands:
echo    - start nginx
echo    - nginx -s reload     (reload config)
echo    - nginx -s stop       (stop server)
echo    - tasklist /fi "imagename eq nginx.exe"  (check if running)
echo.

echo ✅ Setup complete!
