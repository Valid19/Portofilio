#!/usr/bin/env python3
"""
YouTube Video Downloader - Web App
===================================
Buka browser, paste link YouTube, klik Download. Selesai.

Jalankan:
    python3 app.py

Lalu buka: http://localhost:5000
"""

import os
import re
import json
import uuid
import threading
import subprocess
from flask import Flask, render_template, request, jsonify, send_file

app = Flask(__name__)

DOWNLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'downloads')
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

# Track download progress per session
download_tasks = {}


def sanitize_filename(name):
    return re.sub(r'[\\/*?:"<>|]', '_', name)


def run_download(task_id, url, fmt, quality):
    """Background download worker."""
    task = download_tasks[task_id]
    task['status'] = 'downloading'
    task['progress'] = '0%'

    # Unique subfolder to avoid conflicts
    task_dir = os.path.join(DOWNLOAD_DIR, task_id)
    os.makedirs(task_dir, exist_ok=True)

    output_template = os.path.join(task_dir, '%(title)s.%(ext)s')

    cmd = ['yt-dlp']

    # Format selection
    if fmt == 'webm':
        cmd += ['-f', 'bestvideo[ext=webm]+bestaudio[ext=webm]/best[ext=webm]/best']
        cmd += ['--merge-output-format', 'webm']
    elif fmt == 'mov':
        cmd += ['-f', 'bestvideo+bestaudio/best']
        cmd += ['--merge-output-format', 'mov']
    else:  # mp4
        cmd += ['-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best']
        cmd += ['--merge-output-format', 'mp4']

    # Quality
    if quality != 'best':
        # Override format with quality constraint
        if fmt == 'webm':
            cmd[cmd.index('-f') + 1] = f'bestvideo[height<={quality}][ext=webm]+bestaudio[ext=webm]/best[height<={quality}]'
        elif fmt == 'mov':
            cmd[cmd.index('-f') + 1] = f'bestvideo[height<={quality}]+bestaudio/best[height<={quality}]'
        else:
            cmd[cmd.index('-f') + 1] = f'bestvideo[height<={quality}][ext=mp4]+bestaudio[ext=m4a]/best[height<={quality}]'

    cmd += [
        '-o', output_template,
        '--no-playlist',
        '--newline',  # Progress on new lines for parsing
        '--embed-metadata',
        url
    ]

    try:
        process = subprocess.Popen(
            cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
            text=True, bufsize=1
        )

        for line in process.stdout:
            line = line.strip()
            # Parse progress
            if '[download]' in line and '%' in line:
                match = re.search(r'(\d+\.?\d*)%', line)
                if match:
                    task['progress'] = f"{float(match.group(1)):.1f}%"
            elif '[Merger]' in line or '[ExtractAudio]' in line:
                task['status'] = 'processing'
                task['progress'] = 'Memproses...'

        process.wait()

        if process.returncode == 0:
            # Find the downloaded file
            files = os.listdir(task_dir)
            if files:
                filepath = os.path.join(task_dir, files[0])
                size_mb = os.path.getsize(filepath) / (1024 * 1024)
                task['status'] = 'done'
                task['progress'] = '100%'
                task['filename'] = files[0]
                task['filepath'] = filepath
                task['size'] = f"{size_mb:.1f} MB"
            else:
                task['status'] = 'error'
                task['error'] = 'File tidak ditemukan setelah download'
        else:
            # Fallback: try simpler format
            fallback_cmd = [
                'yt-dlp', '-f', 'best',
                '--merge-output-format', fmt,
                '-o', output_template,
                '--no-playlist', '--newline',
                url
            ]
            fallback = subprocess.run(fallback_cmd, capture_output=True, text=True, timeout=600)
            if fallback.returncode == 0:
                files = os.listdir(task_dir)
                if files:
                    filepath = os.path.join(task_dir, files[0])
                    size_mb = os.path.getsize(filepath) / (1024 * 1024)
                    task['status'] = 'done'
                    task['progress'] = '100%'
                    task['filename'] = files[0]
                    task['filepath'] = filepath
                    task['size'] = f"{size_mb:.1f} MB"
                    return
            task['status'] = 'error'
            task['error'] = 'Download gagal. Cek URL atau coba format lain.'

    except Exception as e:
        task['status'] = 'error'
        task['error'] = str(e)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/download', methods=['POST'])
def start_download():
    data = request.json
    url = data.get('url', '').strip()
    fmt = data.get('format', 'mp4')
    quality = data.get('quality', 'best')

    if not url:
        return jsonify({'error': 'URL tidak boleh kosong'}), 400

    if 'youtube.com' not in url and 'youtu.be' not in url:
        return jsonify({'error': 'URL harus link YouTube'}), 400

    task_id = str(uuid.uuid4())[:8]
    download_tasks[task_id] = {
        'status': 'starting',
        'progress': '0%',
        'url': url,
        'format': fmt,
        'quality': quality,
    }

    thread = threading.Thread(target=run_download, args=(task_id, url, fmt, quality), daemon=True)
    thread.start()

    return jsonify({'task_id': task_id})


@app.route('/api/progress/<task_id>')
def get_progress(task_id):
    task = download_tasks.get(task_id)
    if not task:
        return jsonify({'error': 'Task tidak ditemukan'}), 404
    return jsonify(task)


@app.route('/api/file/<task_id>')
def download_file(task_id):
    task = download_tasks.get(task_id)
    if not task or task['status'] != 'done':
        return jsonify({'error': 'File belum siap'}), 404

    return send_file(
        task['filepath'],
        as_attachment=True,
        download_name=task['filename']
    )


if __name__ == '__main__':
    print("\n" + "=" * 50)
    print("  YouTube Video Downloader")
    print("  Buka browser: http://localhost:5000")
    print("=" * 50 + "\n")
    app.run(host='0.0.0.0', port=5000, debug=False)
