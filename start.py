#!/usr/bin/env python3
"""
YouTube Video Downloader - One Click Launcher
==============================================
Jalankan file ini untuk langsung membuka YouTube Downloader di browser.

Windows : Double-click start.pyw (tanpa terminal)
          atau double-click start.py
Mac/Linux: Double-click start.py atau ./start.py
"""

import subprocess
import sys
import os
import time
import webbrowser
import threading
import socket

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(BASE_DIR)

PORT = 5000
URL = f"http://localhost:{PORT}"


def is_port_available(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) != 0


def install_dependencies():
    """Auto-install semua yang dibutuhkan."""
    missing = []
    try:
        import flask
    except ImportError:
        missing.append('flask')
    try:
        import yt_dlp
    except ImportError:
        missing.append('yt-dlp')

    if missing:
        print(f"Menginstall: {', '.join(missing)}...")
        subprocess.check_call(
            [sys.executable, '-m', 'pip', 'install'] + missing + ['--quiet']
        )
        print("Install selesai!")


def check_ffmpeg():
    """Cek dan kasih tau kalau ffmpeg belum ada."""
    try:
        subprocess.run(['ffmpeg', '-version'], capture_output=True, timeout=5)
    except (FileNotFoundError, subprocess.TimeoutExpired):
        print("\n[!] ffmpeg belum terinstall.")
        print("    Download: https://ffmpeg.org/download.html")
        print("    Video tetap bisa didownload, tapi beberapa format mungkin tidak tersedia.\n")


def open_browser():
    """Buka browser setelah server siap."""
    for _ in range(30):
        time.sleep(0.5)
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                if s.connect_ex(('localhost', PORT)) == 0:
                    webbrowser.open(URL)
                    return
        except Exception:
            pass


def main():
    print("=" * 50)
    print("  YouTube Video Downloader")
    print("=" * 50)
    print()

    install_dependencies()
    check_ffmpeg()

    if not is_port_available(PORT):
        print(f"Server sudah jalan! Membuka browser...")
        webbrowser.open(URL)
        return

    print(f"Membuka browser di {URL} ...")
    print("Tekan Ctrl+C untuk berhenti.\n")

    threading.Thread(target=open_browser, daemon=True).start()

    sys.path.insert(0, BASE_DIR)
    from app import app
    app.run(host='0.0.0.0', port=PORT, debug=False)


if __name__ == '__main__':
    main()
