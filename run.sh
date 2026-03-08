#!/bin/bash
echo "============================================"
echo "  YouTube Video Downloader - Setup"
echo "============================================"
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python3 belum terinstall!"
    echo "Install: sudo apt install python3 python3-pip"
    exit 1
fi

# Check ffmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo "[INFO] Menginstall ffmpeg..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get install -y ffmpeg
    elif command -v brew &> /dev/null; then
        brew install ffmpeg
    else
        echo "[WARNING] Install ffmpeg manual: https://ffmpeg.org/download.html"
    fi
fi

# Install dependencies
echo "[1/2] Menginstall dependencies..."
pip3 install flask yt-dlp --quiet

# Run app
echo "[2/2] Menjalankan server..."
echo ""
echo "============================================"
echo "  Buka browser: http://localhost:5000"
echo "  Tekan Ctrl+C untuk berhenti"
echo "============================================"
echo ""
python3 app.py
