# Autobot Archive: G1 Transformers fan site (v1)

This is a plain HTML/CSS/JS site with no build step. To preview it, open `index.html` or run `python3 -m http.server` in this folder.

## Dropping in the artwork
Put the original PNGs in `assets/originals/` (or point the script at the attachment folder), then run:

    pip install pillow
    python3 tools/process_assets.py [SOURCE_DIR]

The script keeps the originals untouched in `assets/originals/` and writes web-ready files to `assets/img/`:

| file | source |
|---|---|
| optimus-full.webp / .png | Optimus full body with rifle (art: vectormz.deviantart.com) |
| optimus-closeup.webp / .png | Optimus marker art with fist raised (art: Dalaympic) |
| bumblebee-full.webp / .png | Bumblebee with hands on hips |
| bumblebee-tire.webp / .png | Bumblebee with tire on shoulder |
| bg-hex.webp / .jpg | navy-to-red hex grid (hero background) |
| bg-pattern.webp / .jpg | red TRANSFORMERS repeat pattern (footer strip) |
| autobot-insignia.webp / .png | Autobot insignia (header and footer) |
| transformers-wordmark.webp / .png | chrome TRANSFORMERS logo (hero) |

The script cuts the white backgrounds out of the cut-outs with an edge-connected flood fill. White highlights inside the figures are kept. The page picks each image up automatically. Until an image is there, the page shows a styled "art slot" placeholder. The hero falls back to a CSS chrome wordmark, and the insignia falls back to an inline SVG.

## Screenshots
    python3 tools/shoot.py   # expects the site served on :8787; needs playwright and Chrome
