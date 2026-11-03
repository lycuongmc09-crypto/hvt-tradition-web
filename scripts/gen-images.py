#!/usr/bin/env python3
"""Sinh các cỡ ảnh (thumb 480 / card 900 / full 1600) + banner 16:9 từ src/assets/img -> public/img.

Dùng:  python3 scripts/gen-images.py         (cần Pillow: pip install pillow)
Sau khi chạy, khai báo key mới trong src/assets/images.js (PUBLIC_IMG + IMAGE_ALT).
"""
from __future__ import annotations
import os, sys

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Thiếu Pillow — chạy: pip install pillow")

SRC = os.path.join('src', 'assets', 'img')
DST = os.path.join('public', 'img')
SIZES = {'thumb': 480, 'card': 900, 'full': 1600}
BANNER_FROM = ['a1.jpg', 'a4.jpg']          # ảnh ngang dùng làm banner 16:9


# Ánh xạ tên file Google Drive -> key chuẩn dùng trong src/assets/images.js
ALIASES = {'a3': 'a3'}


def slug(name: str) -> str:
    """Tên file -> key: bỏ phần mở rộng, lowercase. Nên đổi tên ảnh về a1..a7 trước khi chạy."""
    return os.path.splitext(name)[0].lower()


def main() -> None:
    os.makedirs(DST, exist_ok=True)
    generated = []
    for fn in sorted(os.listdir(SRC)):
        if fn.startswith('.') or not fn.lower().endswith(('.jpg', '.jpeg', '.png')):
            continue
        im = Image.open(os.path.join(SRC, fn))
        if im.mode not in ('RGB', 'L'):
            im.save(os.path.join(DST, f'{slug(fn)}.png'), optimize=True)
            generated.append(f'{slug(fn)}.png')
            continue
        im = im.convert('RGB')
        key = slug(fn)
        for label, cap in SIZES.items():
            out = ImageOps.contain(im, (cap, cap), Image.LANCZOS)
            name = f'{key}-{cap}.jpg' if label != 'card' else f'{key}-900.jpg'
            out.save(os.path.join(DST, name), 'JPEG', quality=78, optimize=True, progressive=True)
            generated.append(name)
    for fn in BANNER_FROM:
        path = os.path.join(SRC, fn)
        if not os.path.exists(path):
            continue
        im = Image.open(path).convert('RGB')
        crop = ImageOps.fit(im, (1600, 900), Image.LANCZOS, centering=(0.5, 0.42))
        name = f'banner-{os.path.splitext(fn)[0]}.jpg'
        crop.save(os.path.join(DST, name), 'JPEG', quality=80, optimize=True, progressive=True)
        generated.append(name)

    print(f'Tạo {len(generated)} file vào {DST}:')
    for g in generated:
        p = os.path.join(DST, g)
        print(f'  {g:24s} {os.path.getsize(p) / 1024:6.0f}KB')
    print('\nBước tiếp theo: thêm key vào PUBLIC_IMG / IMAGE_ALT trong src/assets/images.js')


if __name__ == '__main__':
    main()
