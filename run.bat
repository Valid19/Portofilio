@echo off
echo ============================================
echo   YouTube Video Downloader - Setup
echo ============================================
echo.

:: Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python belum terinstall!
    echo Download di: https://www.python.org/downloads/
    echo Centang "Add Python to PATH" saat install!
    pause
    exit /b
)

:: Check ffmpeg
ffmpeg -version >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Menginstall ffmpeg via pip...
    pip install imageio-ffmpeg
)

:: Install dependencies
echo [1/2] Menginstall dependencies...
pip install flask yt-dlp --quiet

:: Run app
echo [2/2] Menjalankan server...
echo.
echo ============================================
echo   Buka browser: http://localhost:5000
echo   Tekan Ctrl+C untuk berhenti
echo ============================================
echo.
python app.py

pause
