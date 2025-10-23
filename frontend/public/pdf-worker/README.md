# PDF.js Worker

This directory contains the PDF.js worker file required for offline PDF viewing.

## How it works

The `pdf.worker.min.js` file is automatically copied from `node_modules/pdfjs-dist/build/` during:
- `npm install` (via postinstall script)
- `npm run build` (via copy-pdf-worker script)

## Manual copy

If the worker file is missing, you can manually copy it:

```bash
npm run copy-pdf-worker
```

Or directly:

```bash
cp node_modules/pdfjs-dist/build/pdf.worker.min.js public/pdf-worker/pdf.worker.min.js
```

## Why this approach?

This ensures the PDF viewer works completely offline without requiring CDN access. The worker file is served from the same domain as the application.
