#!/usr/bin/env python3
"""Zamienia JPG z jednolitym zielonym (#00FF00) tłem albo ze „szachownicą” wpaloną w obraz na przezroczysty WebP.
  python3 tools/key-art.py wejscie.jpg wyjscie.webp [--mode auto|green|checker] [--max 512] [--crop]
Tło = piksele pasujące do koloru tła (zieleń albo neutralna jasna szachownica) POŁĄCZONE z krawędzią obrazu (flood fill),
więc kremowe futro, białe elementy wewnątrz postaci zostają. Brzeg jest lekko wygładzony; zielony rozlew usuwany (despill)."""
import argparse
import numpy as np
from PIL import Image, ImageFilter

def bg_mask(a, mode):
    r, g, b = [a[..., i].astype(int) for i in range(3)]
    if mode == 'green':
        return (g > 110) & (g - r > 50) & (g - b > 50)
    mx, mn = np.maximum(np.maximum(r, g), b), np.minimum(np.minimum(r, g), b)
    return (mn > 196) & (mx - mn < 14) & (abs(r - b) < 9)

def flood_from_edge(cand):
    h, w = cand.shape
    seed = np.zeros_like(cand); seed[0, :] = seed[-1, :] = seed[:, 0] = seed[:, -1] = True
    cur = seed & cand
    prev = -1
    while cur.sum() != prev:
        prev = cur.sum()
        im = Image.fromarray((cur * 255).astype('uint8')).filter(ImageFilter.MaxFilter(5))
        cur = (np.array(im) > 0) & cand
    return cur

def key(img, mode='auto'):
    a = np.array(img.convert('RGB'))
    if mode == 'auto':
        mode = 'green' if bg_mask(a, 'green')[:4].mean() > .5 else 'checker'
    cand = bg_mask(a, mode)
    if mode == 'checker':  # szachownica: domknij drobne dziury między polami
        cand = np.array(Image.fromarray((cand * 255).astype('uint8')).filter(ImageFilter.MaxFilter(3))) > 0
        cand &= bg_mask(a, 'checker') | True
    bg = flood_from_edge(cand)
    alpha = Image.fromarray(((~bg) * 255).astype('uint8')).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    out = np.dstack([a, np.array(alpha)])
    if mode == 'green':  # despill: ogranicz zieleń na brzegu
        o = out[..., :3].astype(int); lim = np.maximum(o[..., 0], o[..., 2]); out[..., 1] = np.minimum(o[..., 1], lim + 8)
    return Image.fromarray(out.astype('uint8'), 'RGBA'), mode

if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('src'); ap.add_argument('dst')
    ap.add_argument('--mode', default='auto'); ap.add_argument('--max', type=int, default=512); ap.add_argument('--crop', action='store_true')
    o = ap.parse_args()
    im, mode = key(Image.open(o.src), o.mode)
    if o.crop and im.getbbox(): im = im.crop(im.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox())
    im.thumbnail((o.max, o.max), Image.LANCZOS); im.save(o.dst, quality=86, method=6)
    print(o.dst, mode, im.size)
