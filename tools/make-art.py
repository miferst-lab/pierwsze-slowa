#!/usr/bin/env python3
"""Tworzy zoptymalizowane webp z makiet Artysty (Grok): okrągłe portrety postaci i dwie grupy bez napisów.
Użycie: python3 tools/make-art.py /workspace/grok-art   (wynik: art/lesna/*.webp). Źródła nie trafiają do repozytorium."""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
SRC = Path(sys.argv[1] if len(sys.argv) > 1 else '/workspace/grok-art')
OUT = Path(__file__).resolve().parent.parent / 'art' / 'lesna'
OUT.mkdir(parents=True, exist_ok=True)
parade = Image.open(SRC / 'lesna-wyprawa_czat_zwierzatka-odkrywcy.jpg').convert('RGB')
cozy = Image.open(SRC / 'cieply-las_czat_przytulne-zwierzatka.jpg').convert('RGB')
P, C = 1168 / 1024, 1168 / 819   # współrzędne zapisane jak na podglądzie 1024 / 819 px
def portrait(name, im, box, s, size=200, scale_in=1.0):
    x0, y0, x1, y1 = [v * s for v in box]
    cx, cy, half = (x0 + x1) / 2, (y0 + y1) / 2, max(x1 - x0, y1 - y0) / 2 * scale_in
    c = im.crop((int(cx - half), int(cy - half), int(cx + half), int(cy + half))).resize((size, size), Image.LANCZOS).convert('RGBA')
    m = Image.new('L', (size * 4, size * 4), 0); ImageDraw.Draw(m).ellipse((4, 4, size * 4 - 5, size * 4 - 5), fill=255)
    c.putalpha(m.resize((size, size), Image.LANCZOS)); c.save(OUT / f'{name}.webp', quality=84, method=6)
portrait('lis', parade, (95, 70, 320, 295), P)
portrait('mis', parade, (300, 155, 480, 335), P, scale_in=0.97)
portrait('sowa', parade, (480, 195, 630, 350), P)
portrait('wiewiorka', parade, (665, 265, 800, 400), P)
portrait('zajac', parade, (775, 175, 945, 345), P, scale_in=0.97)
portrait('jez', cozy, (250, 185, 440, 375), C, scale_in=0.95)
# grupy bez napisów: kadr + zapis webp (tło kremowe jak w grze – brzegi wtapiamy maską w CSS)
parade.crop((0, 70, 1168, 784)).resize((960, 587), Image.LANCZOS).save(OUT / 'wyprawa.webp', quality=78, method=6)
cozy.crop((0, 60, 1168, 784)).resize((960, 595), Image.LANCZOS).save(OUT / 'ekipa.webp', quality=78, method=6)
for f in sorted(OUT.glob('*.webp')): print(f.name, f.stat().st_size)
