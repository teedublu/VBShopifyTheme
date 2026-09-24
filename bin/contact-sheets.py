#!/usr/bin/env python3
"""Tile downloaded images into numbered contact sheets for bulk description."""
import os, sys, json, math
from PIL import Image, ImageDraw, ImageFont

SRC = sys.argv[1] if len(sys.argv) > 1 else 'working/alt-review'
OUT = sys.argv[2] if len(sys.argv) > 2 else 'working/alt-sheets'
COLS, ROWS, CELL, LABEL = 3, 2, 460, 34
os.makedirs(OUT, exist_ok=True)
for f in os.listdir(OUT):
    if f.endswith('.jpg'): os.remove(os.path.join(OUT, f))

files = sorted(f for f in os.listdir(SRC) if not f.startswith('.'))
try: font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 15)
except Exception: font = ImageFont.load_default()

per = COLS * ROWS
index = {}
for s in range(math.ceil(len(files) / per)):
    batch = files[s*per:(s+1)*per]
    sheet = Image.new('RGB', (COLS*CELL, ROWS*(CELL+LABEL)), 'white')
    d = ImageDraw.Draw(sheet)
    for n, fn in enumerate(batch):
        cx, cy = (n % COLS)*CELL, (n // COLS)*(CELL+LABEL)
        tag = "%d.%d" % (s+1, n+1)
        try:
            im = Image.open(os.path.join(SRC, fn)); im.thumbnail((CELL-12, CELL-12))
            if im.mode in ('RGBA','LA','P'):
                bg = Image.new('RGB', im.size, (245,245,245))
                bg.paste(im.convert('RGBA'), mask=im.convert('RGBA').split()[-1]); im = bg
            sheet.paste(im, (cx + (CELL-im.width)//2, cy + (CELL-im.height)//2))
        except Exception as e:
            d.text((cx+10, cy+10), "FAILED %s" % e, fill='red', font=font)
        d.rectangle([cx, cy, cx+CELL-1, cy+CELL+LABEL-1], outline=(200,200,200))
        d.text((cx+8, cy+CELL+8), "%s  %s" % (tag, fn[:46]), fill=(20,20,20), font=font)
        index[tag] = fn
    sheet.save(os.path.join(OUT, 'sheet-%02d.jpg' % (s+1)), quality=82)

json.dump(index, open(os.path.join(OUT, 'index.json'), 'w'), indent=1)
print("%d images -> %d sheets in %s" % (len(files), math.ceil(len(files)/per), OUT))
