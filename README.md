# cairn-dashboard

The React frontend for [cairn](https://github.com/jisundr/cairn)'s local usage/tracker/swarms dashboard. Served as static files by the parent repo's `scripts/usage_dashboard.py` (stdlib Python, no dependencies at runtime) — this repo only needs Node/npm at build time, never to run the dashboard itself.

## Development

```bash
npm install
npm run dev      # Vite dev server, proxies /api/* to the Python backend on :4756
npm run test      # Vitest
```

Start the Python backend separately first (`/cairn-dashboard` in the parent repo, or `python3 scripts/usage_dashboard.py` directly) so `npm run dev`'s proxy has something to talk to.

## Shipping a change

`dist/` is committed directly to this repo — there is no build step at `/cairn-dashboard` launch time. After any change:

```bash
npm run build
git add dist/
git commit -m "..."
git push
```

Then, in the parent `cairn` repo: `git add dashboard && git commit -m "chore: bump dashboard submodule pointer"` so the parent repo picks up the new build.
