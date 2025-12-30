# FindAllEasy — Frontend

Production-ready Vite + React single-page app for FindAllEasy.

## Quick start

```bash
npm ci
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Static hosting (Cloudflare Pages / Netlify)

- `public/_redirects` enables SPA routing (e.g. `/privacy`, `/about`).
- `public/_headers` sets basic security headers.
- Make sure `API_BASE` in `src/utils/api.js` points to your backend (e.g. `https://api.findalleasy.com`).

## Reviewer checklist

This repo includes:
- About / How it works / Contact pages
- Privacy policy / Cookie policy / Affiliate disclosure
- PWA manifest + icons
- OpenGraph/Twitter meta + structured data (JSON-LD)

