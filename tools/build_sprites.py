#!/usr/bin/env python3
"""Draw the falling leaves and blossoms into assets/sprites/.

The pictures are drawn by tools/sprites.html; this runs that page in a headless
Chrome or Chromium and saves what it drew.  Name the browser with $CHROME if it
is not found on its own.
"""
import base64, html, json, os, re, shutil, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAGE = ROOT / 'tools' / 'sprites.html'
OUT = ROOT / 'assets' / 'sprites'

def browser():
    names = [os.environ.get('CHROME'), 'google-chrome', 'chromium', 'chromium-browser', 'chrome-headless-shell',
             '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
             '/Applications/Chromium.app/Contents/MacOS/Chromium',
             '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser']
    for n in names:
        if n and (shutil.which(n) or Path(n).is_file()):
            return shutil.which(n) or n
    for p in sorted((Path.home() / 'Library/Caches/ms-playwright').glob('chromium_headless_shell-*/*/chrome-headless-shell')):
        return str(p)
    sys.exit('no Chrome or Chromium found; set $CHROME')

dom = subprocess.run([browser(), '--headless', '--disable-gpu', '--dump-dom', PAGE.as_uri()],
                     capture_output=True, text=True, check=True).stdout
found = json.loads(html.unescape(re.search(r'<pre id="out">(.*?)</pre>', dom, re.S).group(1)))
OUT.mkdir(parents=True, exist_ok=True)
for name, url in found.items():
    (OUT / f'{name}.png').write_bytes(base64.b64decode(url.split(',', 1)[1]))
    print('wrote', (OUT / f'{name}.png').relative_to(ROOT))
