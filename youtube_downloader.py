#!/usr/bin/env python3
"""
YouTube Video Downloader
========================
Download YouTube videos in MP4, MOV, or WEBM format using yt-dlp.

Usage:
    python3 youtube_downloader.py <URL> [OPTIONS]

Examples:
    python3 youtube_downloader.py "https://www.youtube.com/watch?v=VIDEO_ID"
    python3 youtube_downloader.py "https://www.youtube.com/watch?v=VIDEO_ID" --format mp4
    python3 youtube_downloader.py "https://www.youtube.com/watch?v=VIDEO_ID" --format webm
    python3 youtube_downloader.py "https://www.youtube.com/watch?v=VIDEO_ID" --format mov
    python3 youtube_downloader.py "https://www.youtube.com/watch?v=VIDEO_ID" --quality 720
    python3 youtube_downloader.py "https://www.youtube.com/watch?v=VIDEO_ID" --list-formats
"""

import argparse
import os
import sys
import subprocess
import re


def sanitize_filename(name):
    """Remove characters that are not safe for filenames."""
    return re.sub(r'[\\/*?:"<>|]', '_', name)


def get_video_info(url):
    """Get video title and available formats."""
    try:
        result = subprocess.run(
            ['yt-dlp', '--print', 'title', '--no-download', url],
            capture_output=True, text=True, timeout=30
        )
        title = result.stdout.strip() if result.returncode == 0 else "video"
        return sanitize_filename(title)
    except Exception:
        return "video"


def list_formats(url):
    """List all available formats for the video."""
    subprocess.run(['yt-dlp', '-F', url])


def download_video(url, output_format='mp4', quality='best', output_dir='downloads'):
    """
    Download a YouTube video.

    Args:
        url: YouTube video URL
        output_format: Output format - mp4, mov, or webm
        quality: Video quality - best, 1080, 720, 480, 360
        output_dir: Directory to save the downloaded video
    """
    os.makedirs(output_dir, exist_ok=True)

    title = get_video_info(url)
    output_path = os.path.join(output_dir, f'{title}.%(ext)s')

    print(f"\n{'='*60}")
    print(f"  YouTube Video Downloader")
    print(f"{'='*60}")
    print(f"  URL     : {url}")
    print(f"  Format  : {output_format}")
    print(f"  Quality : {quality}")
    print(f"  Output  : {output_dir}/")
    print(f"{'='*60}\n")

    # Build yt-dlp command
    cmd = ['yt-dlp']

    if output_format == 'webm':
        # Download best webm directly
        if quality == 'best':
            cmd += ['-f', 'bestvideo[ext=webm]+bestaudio[ext=webm]/best[ext=webm]/best']
        else:
            cmd += ['-f', f'bestvideo[height<={quality}][ext=webm]+bestaudio[ext=webm]/best[height<={quality}]']
        cmd += ['--merge-output-format', 'webm']
    elif output_format == 'mov':
        # Download best quality then convert to MOV
        if quality == 'best':
            cmd += ['-f', 'bestvideo+bestaudio/best']
        else:
            cmd += ['-f', f'bestvideo[height<={quality}]+bestaudio/best[height<={quality}]']
        cmd += ['--merge-output-format', 'mov']
    else:
        # Default: MP4
        if quality == 'best':
            cmd += ['-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best']
        else:
            cmd += ['-f', f'bestvideo[height<={quality}][ext=mp4]+bestaudio[ext=m4a]/best[height<={quality}]']
        cmd += ['--merge-output-format', 'mp4']

    # Common options
    cmd += [
        '-o', output_path,
        '--no-playlist',         # Download single video only
        '--progress',            # Show progress bar
        '--console-title',       # Show progress in console title
        '--embed-thumbnail',     # Embed thumbnail if possible
        '--embed-metadata',      # Embed metadata
        url
    ]

    print(f"Downloading...\n")

    try:
        result = subprocess.run(cmd, timeout=600)

        if result.returncode == 0:
            # Find the downloaded file
            for f in os.listdir(output_dir):
                if f.startswith(title[:20]):
                    filepath = os.path.join(output_dir, f)
                    size_mb = os.path.getsize(filepath) / (1024 * 1024)
                    print(f"\n{'='*60}")
                    print(f"  Download complete!")
                    print(f"  File : {filepath}")
                    print(f"  Size : {size_mb:.1f} MB")
                    print(f"{'='*60}\n")
                    return filepath
        else:
            print("\nDownload failed. Trying fallback method...")
            return download_fallback(url, output_format, output_dir, output_path)

    except subprocess.TimeoutExpired:
        print("\nDownload timed out (10 min limit).")
        return None
    except KeyboardInterrupt:
        print("\nDownload cancelled.")
        return None


def download_fallback(url, output_format, output_dir, output_path):
    """Fallback download method with simpler format selection."""
    cmd = [
        'yt-dlp',
        '-f', 'best',
        '--merge-output-format', output_format,
        '-o', output_path,
        '--no-playlist',
        url
    ]

    try:
        result = subprocess.run(cmd, timeout=600)
        if result.returncode == 0:
            for f in os.listdir(output_dir):
                filepath = os.path.join(output_dir, f)
                size_mb = os.path.getsize(filepath) / (1024 * 1024)
                print(f"\n  Download complete! File: {filepath} ({size_mb:.1f} MB)\n")
                return filepath
    except Exception as e:
        print(f"\nFallback also failed: {e}")

    return None


def main():
    parser = argparse.ArgumentParser(
        description='Download YouTube videos in MP4, MOV, or WEBM format',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s "https://www.youtube.com/watch?v=VIDEO_ID"
  %(prog)s "https://www.youtube.com/watch?v=VIDEO_ID" --format mp4
  %(prog)s "https://www.youtube.com/watch?v=VIDEO_ID" --format webm --quality 720
  %(prog)s "https://www.youtube.com/watch?v=VIDEO_ID" --list-formats
        """
    )

    parser.add_argument('url', help='YouTube video URL')
    parser.add_argument(
        '-f', '--format',
        choices=['mp4', 'mov', 'webm'],
        default='mp4',
        help='Output video format (default: mp4)'
    )
    parser.add_argument(
        '-q', '--quality',
        default='best',
        help='Video quality: best, 1080, 720, 480, 360 (default: best)'
    )
    parser.add_argument(
        '-o', '--output-dir',
        default='downloads',
        help='Output directory (default: downloads)'
    )
    parser.add_argument(
        '-l', '--list-formats',
        action='store_true',
        help='List available formats and exit'
    )

    args = parser.parse_args()

    # Validate URL
    if 'youtube.com' not in args.url and 'youtu.be' not in args.url:
        print("Warning: URL doesn't look like a YouTube link. Proceeding anyway...")

    if args.list_formats:
        list_formats(args.url)
        return

    download_video(args.url, args.format, args.quality, args.output_dir)


if __name__ == '__main__':
    main()
