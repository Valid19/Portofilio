"""
YouTube Video Downloader - One Click Launcher
==============================================
Double-click file ini untuk langsung membuka YouTube Downloader di browser.
Tidak perlu buka terminal/command prompt.

File .pyw = Python tanpa jendela terminal (Windows)
"""

import subprocess
import sys
import os
import time
import webbrowser
import threading
import socket

# Get script directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(BASE_DIR)

PORT = 5000
URL = f"http://localhost:{PORT}"


def is_port_available(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) != 0


def install_dependencies():
    """Auto-install semua yang dibutuhkan."""
    try:
        import flask
        import yt_dlp
    except ImportError:
        subprocess.check_call(
            [sys.executable, '-m', 'pip', 'install', 'flask', 'yt-dlp', '--quiet'],
            creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0)
        )


def open_browser():
    """Buka browser setelah server siap."""
    # Tunggu server ready
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
    # Install dependencies otomatis
    install_dependencies()

    # Cek apakah port sudah dipakai (mungkin sudah jalan)
    if not is_port_available(PORT):
        webbrowser.open(URL)
        return

    # Buka browser di background thread
    threading.Thread(target=open_browser, daemon=True).start()

    # Jalankan Flask server
    # Import app setelah dependencies terinstall
    sys.path.insert(0, BASE_DIR)
    from app import app
    app.run(host='0.0.0.0', port=PORT, debug=False)


if __name__ == '__main__':
    main()
