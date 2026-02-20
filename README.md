# brochure-hub

Static Hyundai brochure assistant with a Cloudflare Pages Function proxy for Gemini generation.

## Local testing

### UI-only (no AI generation)

You can serve static files locally for UI checks:

```bash
python -m http.server 8000
```

Then open:

- `http://localhost:8000/app/`

> Note: AI generation will **not** work in this mode because `/api/generate` requires Cloudflare Functions.

### Full app with Functions (AI works)

From the repo root, run:

```bash
npx wrangler pages dev .
```

Then open the local URL Wrangler prints and navigate to `/app/`.

Set environment variable `GEMINI_API_KEY` in Wrangler/Cloudflare before using generation.

## Cloudflare Pages deploy

1. Create/connect this repository to a Cloudflare Pages project.
2. Ensure Functions are enabled (`functions/` directory is present).
3. Add environment variable in Pages settings:
   - `GEMINI_API_KEY` = your Gemini API key
4. Deploy and open `/app/`.

## Hosting note

GitHub Pages can host the static UI, but AI generation works only when `/api/generate` is served by Cloudflare Pages Functions.

## API route

- `POST /api/generate`
  - Request JSON: `{ "prompt": "...", "model": "optional" }`
  - Response JSON: `{ "text": "...", "modelUsed": "..." }`
