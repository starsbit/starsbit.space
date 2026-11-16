# Production image for self-hosting (homelab k3s "shipyard"): the static site served by unprivileged nginx on :8080.
# Build: docker build -t starsbit-space .   Run: docker run -p 8080:8080 starsbit-space
FROM nginxinc/nginx-unprivileged:1.29-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html /usr/share/nginx/html/
COPY css /usr/share/nginx/html/css
COPY js /usr/share/nginx/html/js
COPY assets/paintings /usr/share/nginx/html/assets/paintings
COPY assets/sprites /usr/share/nginx/html/assets/sprites
COPY assets/*.svg assets/*.mp3 /usr/share/nginx/html/assets/
EXPOSE 8080
