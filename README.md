# Kuya Driver AI (PWA)

Zero-dependency PWA. Service workers need http(s), so do not open index.html by double-click.

Run locally:  `cd` into this folder, then `python3 -m http.server 8080` and open http://localhost:8080
Deploy: upload to any HTTPS static host (Netlify, Cloudflare Pages, GitHub Pages).

Notes
- Icons and og-image are pre-rendered PNGs in icons/. The Icons tab can re-export them.
- screenshots/ are branded placeholders. Replace with real screenshots of the app for the install UI.
- .well-known/assetlinks.json is a Play Store (TWA) template: set your package name and signing key fingerprint.
- Set og:image to an absolute URL once you have your domain, since some crawlers ignore relative paths.

v3 notes
- Tabs: Maps & Biyahe, Car HUD, Calculators, Icons & Setup. The Builder was removed.
- All paths are relative (./) so the app works at https://USER.github.io/REPO/.
- Keep folder names lowercase: css, js, icons, images, screenshots. GitHub Pages is case-sensitive.
- After deploying, iPhones may need one extra reload (or closing the tab) to pick up the new service worker.
