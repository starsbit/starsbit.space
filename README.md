# starsbit.space

Four paintings of Hinamizawa that never dry. A canvas is brushed over, stroke by
stroke, with what the place looks like in the season and at the hour it is in
Berlin right now (day while the sun is up, night only for the four hours around solar midnight, dusk in between). The
time in Berlin is shown in the top right.

    python3 -m http.server        # then open http://localhost:8000

It is a static site (`index.html`, `css/`, `js/`, `assets/paintings/`) and needs
a web server: opened straight from disk, browsers refuse to let a canvas read
the pictures.

A click on the painting, or on the arrow at its right side (or the right arrow
key, space or enter), goes on to the next place; the arrow on the left side (or
the left arrow key) goes back to the one before. They go round in the order of
`js/scenes.js`: from the last on to the first, and from the first back to the last.
A link can name the place: `#furude-shrine` (`overlook`, `hojo-residence`, `hinamizawa-estate`, `furude-shrine`).

## Repainting the seasons

The season pictures are made from the summer photographs in `assets/source/`:

    pip install numpy scipy opencv-python pillow
    python3 tools/build_paintings.py

The roofs, the pond and the ground of each place are outlined by hand at the top
of that script; the colours of each season are mixed further down.

## Redrawing the falling leaves and blossoms

The pictures in `assets/sprites/` are drawn by `tools/sprites.html`. Open it in a
browser and click one to save it, or write them all at once with a headless
Chrome or Chromium (set `$CHROME` if it is not found):

    python3 tools/build_sprites.py

## Hosting

The site runs on the homelab k3s cluster "shipyard" (`Dockerfile` + `deploy/nginx.conf`, unprivileged nginx on
:8080, `/healthz`) and is published through a Cloudflare Tunnel. A push to `master` is deployed automatically
within a few minutes once the `docker-image` check has passed.

    docker build -t starsbit-space . && docker run -p 8080:8080 starsbit-space
