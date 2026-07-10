# Editorial redesign — sovraffollamentocarcerario.it

**Date:** 2026-07-09
**Status:** approved by Marco Dalla Stella (design presented and accepted in session)

> **Amendments (post-implementation, requested by the author):** the hero chart
> plots only the real index since the start of daily monitoring (Oct 2024) — the
> official bulletin index was dropped because bulletins have been stale since
> Jan 2025; the "Detenuti e capienza dal 2019" chart was removed for the same
> reason; map dots are sized by prison population.
**Scope:** frontend only. The backend — scrapers, notebooks, GitHub Actions workflows, output CSVs — is untouched.

## 1. Goal

Transform the site from a dashboard into a modern editorial data project, in the spirit of FT graphics, Reuters Graphics and Our World in Data. The one thing a visitor must take away: **prison overcrowding in Italy is worsening**, told by a large historical line chart of the *real* overcrowding index that dominates the homepage.

Design principles: modern, editorial, elegant, minimal, highly readable, responsive, accessible, fast, no flashy effects, serious and trustworthy.

## 2. Decisions made (with the user)

| Decision | Choice |
|---|---|
| Tech stack | Static HTML/CSS/ES-modules + vendored D3. **No build step** — GitHub Pages keeps serving `docs/` directly; CI untouched. |
| Charts | **All rebuilt natively** (D3/SVG). All Datawrapper iframes removed. |
| Language | Italian only. |
| Hero data | Real index (bold, burgundy) + official index (thin gray context). "Tutto" range extends to 2019 via the official monthly series. |
| Visual direction | **Editorial white**: pure white page, Inter for everything, hairline rules, burgundy only for data. |
| Stretch goals in scope | Dark mode; prison search. **Out of scope:** PNG download, sticky navigation. |
| Dropped content | The standalone "Mancanza di Servizi" Datawrapper table (data remains reachable via CSV downloads). Everything else on the current page survives in some form. |

## 3. Page structure (top to bottom)

1. **Masthead** — slim, *not* sticky: project name, dark-mode toggle. Hairline rule below.
2. **Hero**
   - Kicker label (e.g. "Monitoraggio quotidiano · Ministero della Giustizia").
   - Headline: *"Le carceri italiane sono sempre più affollate."* (working copy; final copy is the author's call).
   - One-line dek explaining the project, plus "Aggiornato al {date}".
   - Current real index as a large figure (e.g. **139,1%**) with signed delta vs one year ago ("▲ +x,x punti rispetto a un anno fa").
   - **The hero line chart**, ~60vh on desktop (min ~340px, max ~560px), full content width.
   - Range selector: `30 giorni / 6 mesi / 1 anno / Tutto`. Default **1 anno**. State persisted in URL as `?periodo=30g|6m|1a|tutto` via `history.replaceState` (shareable).
3. **Key numbers** — 5 stat tiles: totale detenuti · capienza regolamentare · posti non disponibili · posti effettivamente disponibili · tasso di affollamento reale (with delta). Count-up animation on first scroll into view.
4. **Editorial explanation** — short prose on why the real index matters: official capacity ≠ available capacity. Includes:
   - **Capacity infographic** (static SVG): capienza regolamentare drawn as a bar with the "posti non disponibili" slice visually subtracted; the detainee total overflows the remaining available places. Direct labels on every element; numbers auto-filled from data.
   - Auto-filled editorial facts (currently the "Situazione critica" callout): number of institutes at ≥150% and the worst institute with its rate.
5. **Below the fold — one clean card per chart**, each with kicker, title, dek, chart, source line:
   - Geographic map
   - Prison ranking + **searchable table of all institutes**
   - Staffing scatter
   - Capacity/population chart (2019 → today)
6. **Methodology** — the current collapsible "Informazioni" text becomes inline editorial prose (no accordion).
7. **Data downloads** — same two CSV links as today, restyled.
8. **Footer** — credits, GitHub, contact, buy-me-a-coffee.

## 4. Architecture

```
docs/
  index.html                 semantic structure + all copy
  css/main.css               design tokens (light+dark), layout, components
  js/main.js                 entry: fetch data → render sections → wire UI
  js/data.js                 CSV fetch + parser + it-IT formatters + derived values
  js/charts/hero.js          hero line chart
  js/charts/map.js           Italy map with prison dots
  js/charts/ranking.js       top-15 bars
  js/charts/staffing.js      scatter
  js/charts/capacity.js      2019→today lines
  js/charts/infographic.js   capacity infographic
  js/ui/theme.js             dark-mode (prefers-color-scheme + toggle + localStorage)
  js/ui/countup.js           number count-up (IntersectionObserver, run-once)
  js/ui/reveal.js            scroll-reveal (IntersectionObserver)
  js/ui/search-table.js      institute search + table render
  vendor/d3.v7.min.js        vendored D3 (no CDN)
  vendor/topojson-client.min.js
  data/italy-regions.topo.json   map backdrop (vendored once; regions ~quantized, small)
  data/annotations.json      editable timeline annotations
  fonts/inter-*.woff2        self-hosted Inter (latin subset, font-display: swap)
```

- Plain ES modules (`<script type="module">`); D3 and topojson-client load as classic scripts before it (globals `d3`, `topojson`).
- `docs/script.js` (dead code — not referenced by index.html) is deleted. `docs/CNAME` and `docs/prison.png` (used for OG image) are kept. The existing Google Analytics gtag snippet is kept as-is.
- All work happens on a branch; one reviewable change replaces the frontend. Live site unaffected until merge.

## 5. Data layer

Sources (unchanged, same URLs the live site fetches today, from
`https://raw.githubusercontent.com/marcodallastella/prison_overcrowding/refs/heads/main/outputs/viz/`):

| File | Used for |
|---|---|
| `tasso_affollamento.csv` | Hero chart: `tasso_affollamento_reale` (daily, from 2024-10) + `tasso_affollamento_ufficiale (interpolated)` (monthly, from 2019). |
| `institutes_totals.csv` | Stat tiles, infographic, hero latest value/delta, updated date. |
| `institutes_most_recent.csv` | Map dots, ranking, searchable table, staffing scatter, "situazione critica" facts. |
| `bulletines_totals.csv` | Capacity chart (2019 → today, monthly). |

(The `sovraffollamento_carcerario` repo serves identical files — the repo was renamed and both URLs update daily; verified 2026-07-09.)

Rules:

- **Proper CSV parser** handling quoted fields containing commas — `institutes_most_recent.csv` has them (e.g. the `scheda istituto` column); the current `split(',')` approach is a latent bug and must not be carried over. Small hand-written parser (quotes, escaped quotes, BOM strip); no external library.
- Numbers use `.` decimal in the CSVs; render with `Intl.NumberFormat('it-IT')`. Dates render via `Intl.DateTimeFormat('it-IT', {day:'numeric', month:'long', year:'numeric'})`.
- Derived values computed in `data.js`: latest real rate + date; delta vs closest data point ≥ 1 year earlier; institutes ≥150% count; worst institute; staff-shortage % per institute (`(previsti − effettivi) / previsti`).
- All four fetches run in parallel (`Promise.all` per-section, not all-or-nothing); one retry on failure.

**Error handling:** if a source fails after retry, only the sections depending on it show a quiet inline notice ("Dati momentaneamente non disponibili — riprova più tardi") with a retry button; the rest of the page renders normally. No broken numbers, no `NaN`, no layout collapse. Stat tiles show "—" placeholders until data arrives.

## 6. Charts

Chart method follows the dataviz skill: form first, color by job, palette machine-validated, thin marks, hairline solid grid, crosshair+tooltip layer, legend for ≥2 series, table view available, dark mode separately selected.

### 6.1 Hero line chart (the centerpiece)

- **Form:** emphasis line chart — the real index is the story, the official index is context.
- Real index: burgundy, **2.5px** round join/cap, with a subtle gradient wash under the line (accent at ~10% opacity fading to 0 at the baseline of the y-domain). End-dot (r≥4, 2px surface ring) with a direct label of the latest value.
- Official index: thin (1.5px) warm-gray context line.
- Legend (2 series → required): short line-keys above the chart ("— indice reale · — indice ufficiale").
- **Reference hairline at 100%** labeled "capienza" (solid, per anti-patterns: never dashed).
- Y-axis: clean ticks (e.g. 100 / 110 / 120 / 130 / 140), no axis stroke, hairline horizontal grid only. Y-domain fits the visible range with padding — never forced to zero (it's an index around 100). X-axis: Italian date ticks adapted to range.
- **Ranges:** 30g / 6m / 1a / tutto. "Tutto" spans 2019→today: official series full-length, real series overlaid from 2024-10. Range switch animates the scales smoothly (~300ms) — no redraw flash.
- **Annotations:** from `docs/data/annotations.json` (`[{date, label, series?}]`) rendered as a small marker + short label with leader line. Seeded with: launch of daily monitoring (2024-10-05). The **record high** of the real series is auto-detected and marked ("massimo storico") when it's the latest point or within the visible range.
- **Interaction:** vertical crosshair snapping to nearest date; single tooltip lists both series (values lead, labels follow, line-keys not boxes); works with touch; keyboard: chart is focusable, ←/→ move the focused date, tooltip mirrors hover. Tooltip DOM uses `textContent` only.
- **Animation:** on first load, line draws in once via stroke-dashoffset (~800ms ease-out), then the area wash fades in. Skipped entirely under `prefers-reduced-motion`.

### 6.2 Geographic map

- Italy regions from vendored TopoJSON as a flat light-gray backdrop (no borders competing with data); `d3.geoConicConformal` fitted to the card, ~190 dots at institute coordinates.
- **Color = polarity around 100%** (diverging, binned): `<100%` muted slate · `100–120%` light burgundy step · `120–150%` mid burgundy · `≥150%` dark burgundy. The neutral midpoint sits at the 100% boundary; the burgundy arm is a one-hue lightness ramp. Legend with binned swatches + labels. Dots: fixed radius (~4.5px desktop), 2px surface ring.
- Hover/focus: nearest-point lookup (≥24px effective hit target), tooltip with name, detainees, available places, rate.
- The searchable table (6.3) is the map's accessible table view.

### 6.3 Ranking + searchable table

- **Top-15 horizontal bars** by real overcrowding rate: bar length from 0 with a hairline reference at 100%; all bars slot-1 burgundy (nominal categories — no value ramp); ≤24px thick, 4px rounded data-end; value label at bar end; institute name left-aligned in text ink.
- **Search + full table** (all ~190 institutes): columns *Istituto · Tipo · Detenuti · Posti effettivi · Indice · Aggiornato al*. Search input filters by name (accent-insensitive) and always searches **all** institutes, regardless of expansion state; default sort by index desc; `tabular-nums` on numeric columns. With an empty query, the table renders the top 20 rows + a "Mostra tutti" expander to keep the DOM light.
- This table is the accessibility table-view twin for map, ranking and scatter.

### 6.4 Staffing scatter

- x = real overcrowding rate, y = staff shortage % (from previsti/effettivi in `institutes_most_recent.csv`, matching the current Datawrapper chart's logic: critical = >120% and >20%).
- All dots muted gray; dots in the critical quadrant burgundy with direct labels (few institutes; leader lines if collisions). Threshold hairlines at x=120%, y=20% with small edge labels.
- Nearest-point (Voronoi-style) hover with ≥24px targets; values also present in the table view.

### 6.5 Capacity chart (2019 → today)

- Monthly `bulletines_totals.csv`: detainees (burgundy 2px) vs capienza regolamentare (gray 2px), with the **gap between the curves washed in burgundy ~10% opacity** where detainees exceed capacity. Legend + end labels. Same crosshair/tooltip pattern as the hero.

### 6.6 Capacity infographic (static)

- One SVG, no interaction: capienza regolamentare bar (light neutral) with the "non disponibili" segment visually knocked out (2px surface gap, darker neutral), and the detainee figure drawn against the remaining "posti effettivamente disponibili" — the overflow segment in burgundy. Every segment directly labeled with name + value. Reads at a glance: *51.000 posti sulla carta, ~46.000 reali, ~63.000 detenuti.*

## 7. Design system

### Typography

- **Inter only**, self-hosted woff2 (latin subset), weights via variable font or 400/500/650 statics, `font-display: swap`, system-ui fallback stack.
- Display headline: `clamp(2.5rem, 6vw, 4.25rem)`, weight ~650, letter-spacing −0.02em, line-height 1.05.
- Hero figure: ≥64px, proportional figures (no `tabular-nums` on display numbers).
- Body: 1.0625rem/1.7, measure ~65ch. Kickers/labels: 0.75rem uppercase, +0.08em letter-spacing, secondary ink.
- `font-variant-numeric: tabular-nums` only in table columns and axis ticks.

### Color

All values defined once as CSS custom properties on `:root` / `[data-theme="dark"]`.

Targets (final hexes locked by the validator, § 9):

| Role | Light | Dark |
|---|---|---|
| Page / chart surface | `#ffffff` | `#141414` (near-black, slightly warm) |
| Primary ink | `#1a1a1a` | `#f2f0ed` |
| Secondary ink | `~#55524e` | `~#b5b2ac` |
| Muted (axis/labels) | `~#8a8781` | `~#8a8781` |
| Gridline hairline | `~#e8e6e1` | `~#2b2b29` |
| **Accent (data): burgundy** | `~#8b1e2e` | lighter burgundy step chosen for the dark surface (not a flip) |
| Context series gray | `~#9a968f` | `~#7a7772` |
| Diverging cool pole (map) | muted slate `~#5a7d9a` | dark-mode step |

Color rules: burgundy appears **only** on data and data-adjacent emphasis (chart marks, deltas, the critical facts) — never on general UI chrome. Text never wears series color; identity comes from a colored mark beside text.

### Motion (all gated behind `prefers-reduced-motion: no-preference`)

- Scroll-reveal: opacity 0→1 + translateY(8px→0), ~500ms, once per element.
- Stat count-up: ~900ms ease-out, once, triggered at first visibility.
- Hero line draw-in on load; range changes animate scales ~300ms.
- Card hover: 1px lift + soft shadow, 150ms.
- No parallax, no looping animation (the current pulsing dot goes away).

### Layout

- Content column ~720px for prose; charts/cards break out to ~1040px; hero chart up to ~1100px.
- Mobile-first CSS; tiles stack (2-up ≥480px, 5-up ≥1024px); hero chart stays the focal point at ~55vh with simplified x-ticks; table becomes horizontally scrollable inside its card; map height adapts.
- Cards: white surface, 1px hairline border, ~16px radius, generous padding; section rhythm via consistent vertical spacing scale (8px base).

## 8. Accessibility

- Semantic landmarks (`header/main/section/footer`), one `h1`, logical heading order, skip-link, `lang="it"`.
- Each chart: `role="img"` + `aria-label` with a one-sentence data summary (auto-filled with the latest values), plus reachable table view (§6.3) — tooltips enhance, never gate.
- Keyboard: every interactive element focusable with visible `:focus-visible` styles; hero chart keyboard-explorable (§6.1); range selector = real `<button>`s with `aria-pressed`.
- Contrast: AA for all text in both modes; ≥3:1 for chart marks vs surface (validator-checked).
- `prefers-reduced-motion` honored everywhere; `prefers-color-scheme` respected with manual override.

## 9. Palette validation (hard requirement, not taste)

Run the dataviz skill's validator before shipping, both modes:

```
node <skill>/scripts/validate_palette.js "<accent>,<context-gray>,<slate>" --mode light --surface "#ffffff"
node <skill>/scripts/validate_palette.js "<dark steps>" --mode dark --surface "#141414"
```

- Map bins (diverging) checked with `--pairs all` (any two dots can be neighbors).
- Fix FAILs by snapping lightness (keep hue) and re-run; WARNs only acceptable with the secondary encoding the skill prescribes (direct labels / table view — both present).
- WCAG text-contrast check (4.5:1) for burgundy wherever it colors text-like elements (deltas).

## 10. Performance

- Removing 5–6 Datawrapper iframes is the dominant win (each is a full page load today).
- Budget: ≤ ~150KB gzipped JS total (D3 ~90KB of it), one CSS file, 1–3 font files subset to latin, TopoJSON ≤ ~120KB raw (quantized).
- `<link rel="preload">` for the hero CSV + font; module scripts deferred by default; below-fold charts render lazily on approach (IntersectionObserver); no layout shift (chart containers have reserved aspect-ratio boxes).
- OG/social meta tags + meta description added (currently missing); existing `prison.png` as OG image.

## 11. Out of scope

- Any change to notebooks, workflows, scrapers, or output CSVs.
- PNG chart download; sticky navigation (explicitly deselected).
- English localization.
- The standalone services table (dropped; data stays in the downloadable CSVs).
- Server-side anything — the site remains fully static.

## 12. Verification checklist (manual — repo has no test framework and none is added)

1. Palette validator passes (or documented WARN + mitigation) in both modes.
2. Local server (`python3 -m http.server` in `docs/`): all sections render with live data; numbers match the CSVs' last rows.
3. Responsive pass at 375 / 768 / 1280 px (Playwright screenshots).
4. Dark-mode pass (toggle + `prefers-color-scheme`), same three widths.
5. Reduced-motion pass: no animation fires.
6. Keyboard-only walkthrough: masthead → range buttons → hero chart exploration → search → links.
7. Error-state pass: block raw.githubusercontent.com, confirm quiet per-section notices and intact layout.
8. URL state: `?periodo=` round-trips (load with param → correct range active; switch range → URL updates).
9. Lighthouse: performance ≥ 90 mobile, accessibility ≥ 95.
