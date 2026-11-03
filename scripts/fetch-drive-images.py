#!/usr/bin/env python3
"""Tải ảnh từ THƯ MỤC Google Drive công khai về src/assets/img/ (rồi chạy gen-images.py).

Dùng:  python3 scripts/fetch-drive-images.py <folder-id-or-link>
Ví dụ: python3 scripts/fetch-drive-images.py https://drive.google.com/drive/folders/1zEf42...
Yêu cầu: folder bật quyền "Bất kỳ ai có liên kết — Xem".
"""
from __future__ import annotations
import os, re, subprocess, sys

DEST = os.path.join('src', 'assets', 'img')


def folder_id(arg: str) -> str:
    m = re.search(r'/folders/([A-Za-z0-9_-]+)', arg)
    return m.group(1) if m else arg.strip()


def main(arg: str) -> None:
    fid = folder_id(arg)
    url = f'https://drive.google.com/embeddedfolderview?id={fid}#grid'
    html = subprocess.run(['curl', '-sL', '--max-time', '40', url],
                          capture_output=True, text=True).stdout
    entries = re.findall(r'id="entry-([A-Za-z0-9_-]+)"[^>]*>.*?flip-entry-title">([^<]+)</div>',
                         html, re.S)
    if not entries:
        sys.exit('Không đọc được file nào — kiểm tra link/quyền chia sẻ của thư mục.')

    os.makedirs(DEST, exist_ok=True)
    seen, ok = set(), 0
    for file_id, name in entries:
        name = name.strip().lower()
        if file_id in seen or not name.endswith(('.jpg', '.jpeg', '.png', '.webp')):
            continue
        seen.add(file_id)
        out = os.path.join(DEST, name)
        if os.path.exists(out) and os.path.getsize(out) > 5000:
            print(f'skip  {name}')
            ok += 1
            continue
        for cand in (f"https://drive.usercontent.google.com/download?id={file_id}&export=download",
                     f'https://lh3.googleusercontent.com/d/{file_id}=w1600'):
            r = subprocess.run(['curl', '-sL', '--fail', '--max-time', '90', '-o', out, cand])
            if r.returncode == 0 and os.path.exists(out) and os.path.getsize(out) > 5000:
                print(f'OK    {name}  ({os.path.getsize(out) / 1024:.0f}KB)')
                ok += 1
                break
        else:
            print(f'FAIL  {name}')
    print(f'\nĐã tải {ok}/{len(seen)} ảnh vào {DEST}. Tiếp theo: python3 scripts/gen-images.py')


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    main(sys.argv[1])
