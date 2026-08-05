# VyomsTech PCB Designer

Browser-based PCB designer: write tscircuit (TSX) code on the left, see live PCB/schematic/3D preview on the right — no need to keep switching to VS Code.

## Run locally

```bash
npm install --legacy-peer-deps
npm run dev
```

Open the printed localhost URL. Edit the code in the left panel — the board rebuilds automatically (600ms debounce) and the right panel updates live.

## Deploy

```bash
npm run build
```

This outputs a static `dist/` folder — deploy it to Netlify, Vercel, or any static host (all rendering happens client-side in a web worker, no backend needed).

## Notes

- Entry file inside the app is virtual (`index.tsx`), not tied to disk — everything happens in-browser via `@tscircuit/eval` + `@tscircuit/runframe`.
- To load an existing multi-file tscircuit project, extend the `fsMap` object in `src/App.tsx` with more files and point `entrypoint` at the right one.
- `--legacy-peer-deps` is needed because `tscircuit` currently pins TypeScript ^5 while some tooling has moved to newer majors.
- **Saving boards**: multiple boards save to the browser's `localStorage` (no backend). Name a board in the topbar field, hit "Save", and it appears under "Boards". This is per-browser/per-device — clearing browser data removes them.
- **Downloading files**: the "Download" menu in the topbar exports the current board's source code (`.tsx`), the PCB layout as SVG, the schematic as SVG, or the raw Circuit JSON. The SVG/JSON options are enabled once a successful build has produced circuit data (hit "Run" first).
- **Gerbers**: the "Gerbers (.zip) — for manufacturing" option in the Download menu produces a real Gerber/Excellon zip (one `.gbr` file per layer plus drill files) using `circuit-json-to-gerber` — this is the file set fab houses like JLCPCB/PCBWay actually accept for ordering a physical board.
- **Audio test**: the "🔊 Audio test" button reads the first resistor/capacitor pair in the current code, computes the RC low-pass cutoff frequency, and lets you upload a real audio file to A/B compare the original vs. filtered sound (via the Web Audio API's `BiquadFilterNode`, using the same cutoff). You can also download the filtered result as a `.wav`. This only works for a simple single-stage RC low-pass — it doesn't simulate arbitrary circuit topologies.
