/*
 * Data layer: fetch + parse the project CSVs and derive the values the page needs.
 * Pure functions are exported individually so they can be tested with node:test.
 *
 * Sources are the same raw-GitHub CSVs the previous version of the site used;
 * the backend pipeline that produces them is untouched.
 */

export const BASE = 'https://raw.githubusercontent.com/marcodallastella/prison_overcrowding/refs/heads/main/outputs/viz/';

export const SOURCES = {
  tasso: BASE + 'tasso_affollamento.csv',
  totals: BASE + 'institutes_totals.csv',
  institutes: BASE + 'institutes_most_recent.csv',
};

/* ── CSV parsing ─────────────────────────────────────────────── */

// RFC-4180-ish parser: quoted fields, escaped quotes ("") and embedded
// commas/newlines. The old site split on ',' which silently corrupted
// institutes_most_recent.csv (its link column contains commas).
export function parseCSV(text) {
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1); // strip BOM
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.length > 1 || row[0] !== '') rows.push(row);
  return rows;
}

// rows → array of objects keyed by (trimmed) header names.
export function toRecords(rows) {
  if (!rows.length) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const o = {};
    for (let i = 0; i < headers.length; i++) o[headers[i]] = r[i] !== undefined ? r[i].trim() : '';
    return o;
  });
}

export function toNum(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/* ── formatters (it-IT) ──────────────────────────────────────── */

// useGrouping 'always' forces the thousands separator on 4-digit numbers too
// (Italian CLDR would otherwise render 4929 without it). Older engines that
// predate the string values fall back to plain grouping.
const intFmt = (() => {
  try {
    return new Intl.NumberFormat('it-IT', { maximumFractionDigits: 0, useGrouping: 'always' });
  } catch {
    return new Intl.NumberFormat('it-IT', { maximumFractionDigits: 0, useGrouping: true });
  }
})();
const pctFmt = new Intl.NumberFormat('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function fmtInt(n) {
  return n === null || n === undefined ? '—' : intFmt.format(Math.round(n));
}

// 137.93 → "137,9%"
export function fmtPct(n) {
  return n === null || n === undefined ? '—' : pctFmt.format(n) + '%';
}

// signed, in percentage points: +4.2 → "+4,2"
export function fmtSigned(n) {
  if (n === null || n === undefined) return '—';
  const s = pctFmt.format(Math.abs(n));
  return (n >= 0 ? '+' : '−') + s;
}

// "2026-03-21" → "21 marzo 2026"
export function fmtDate(iso) {
  const d = parseISO(iso);
  if (!d) return '';
  return new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d);
}

export function parseISO(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return null;
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return Number.isNaN(date.getTime()) ? null : date;
}

/* ── derived series & facts ──────────────────────────────────── */

// Hero series: the real overcrowding index, daily, since the start of the
// daily monitoring (Oct 2024). The official bulletin-based index is not
// plotted: bulletins have been stale since January 2025.
export function buildHeroSeries(tassoRecords) {
  const real = [];
  for (const r of tassoRecords) {
    const date = parseISO(r['Date']);
    if (!date) continue;
    const re = toNum(r['tasso_affollamento_reale (interpolated)'] ?? r['tasso_affollamento_reale']);
    if (re !== null) real.push({ date, value: re });
  }
  real.sort((a, b) => a.date - b.date);
  return { real };
}

// Latest point of a {date,value} series.
export function latestPoint(series) {
  return series.length ? series[series.length - 1] : null;
}

// Value change vs the point closest to one year before the latest (≥ 300 days
// earlier, so a short series returns null rather than a misleading delta).
export function deltaOneYear(series) {
  const last = latestPoint(series);
  if (!last) return null;
  const target = last.date.getTime() - 365 * 86400e3;
  let best = null;
  for (const p of series) {
    if (!best || Math.abs(p.date.getTime() - target) < Math.abs(best.date.getTime() - target)) best = p;
  }
  if (!best || (last.date - best.date) < 300 * 86400e3) return null;
  return last.value - best.value;
}

// Highest point of a series (the "massimo storico" marker).
export function recordHigh(series) {
  let max = null;
  for (const p of series) if (!max || p.value >= max.value) max = p;
  return max;
}

// Latest totals row → the five key numbers + date.
export function latestTotals(records) {
  const last = records[records.length - 1];
  if (!last) return null;
  return {
    date: last['dati aggiornati al'],
    regolamentari: toNum(last['posti regolamentari']),
    nonDisponibili: toNum(last['posti non disponibili']),
    disponibili: toNum(last['posti disponibili']),
    detenuti: toNum(last['totale detenuti']),
    tasso: toNum(last['tasso di affollamento']),
  };
}

// Per-institute records with parsed fields the charts need.
export function parseInstitutes(records) {
  return records
    .map((r) => {
      const previsti = toNum(r['polizia penitenziaria - previsti']);
      const effettivi = toNum(r['polizia penitenziaria - effettivi']);
      return {
        id: r['id istituto'],
        nome: r['nome istituto'],
        tipo: r['tipo istituto'],
        tasso: toNum(r['tasso di affollamento']),
        regolamentari: toNum(r['posti regolamentari']),
        nonDisponibili: toNum(r['posti non disponibili']),
        disponibili: toNum(r['posti disponibili']),
        detenuti: toNum(r['totale detenuti']),
        aggiornato: r['dati aggiornati al'],
        lat: toNum(r['latitudine']),
        lon: toNum(r['longitude']),
        carenzaPolizia: previsti && effettivi !== null && previsti > 0
          ? ((previsti - effettivi) / previsti) * 100
          : null,
      };
    })
    .filter((r) => r.nome);
}

// "Situazione critica" facts.
export function criticalFacts(institutes) {
  let worst = null;
  let over150 = 0;
  for (const ist of institutes) {
    if (ist.tasso === null) continue;
    if (ist.tasso >= 150) over150++;
    if (!worst || ist.tasso > worst.tasso) worst = ist;
  }
  return { over150, worst };
}

/* ── fetching ────────────────────────────────────────────────── */

async function fetchText(url) {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

// One retry, then throw.
export async function fetchCSV(url) {
  let text;
  try {
    text = await fetchText(url);
  } catch {
    text = await fetchText(url);
  }
  return toRecords(parseCSV(text));
}

// Fetch all sources in parallel. Failures are per-source (null), so one bad
// fetch never blanks the whole page.
export async function loadAll() {
  const entries = await Promise.all(
    Object.entries(SOURCES).map(async ([key, url]) => {
      try {
        return [key, await fetchCSV(url)];
      } catch (err) {
        console.error(`Failed to load ${key}:`, err);
        return [key, null];
      }
    }),
  );
  return Object.fromEntries(entries);
}
