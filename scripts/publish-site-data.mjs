/**
 * Copies only the small, presentation-ready datasets into the static site.
 * The website reads these relative files first, so each GitHub Pages deploy is
 * internally consistent with its published data snapshot.
 */
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { parseCSV, toNum, toRecords } from '../docs/js/data.js';

const datasets = [
  'tasso_affollamento.csv',
  'institutes_totals.csv',
  'institutes_most_recent.csv',
];

await mkdir('docs/data', { recursive: true });
await Promise.all(datasets.map((name) => copyFile(`outputs/viz/${name}`, `docs/data/${name}`)));

// A daily history for every prison is needlessly large for a static homepage.
// Retain the last valid observation in each ISO week: this preserves the
// two-year trajectory while reducing 107k daily rows to roughly 15k points.
const instituteRows = toRecords(parseCSV(await readFile('outputs/clean/institutes.csv', 'utf8')));
const weekly = new Map();
for (const row of instituteRows) {
  const id = row['id istituto'];
  const name = row['nome istituto'];
  const date = row['dati aggiornati al'];
  const regular = toNum(row['posti regolamentari']);
  const unavailable = toNum(row['posti non disponibili']);
  const inmates = toNum(row['totale detenuti']);
  const available = regular === null || unavailable === null ? null : regular - unavailable;
  if (!id || !name || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !available || inmates === null) continue;
  const key = `${id}\u0000${isoWeek(date)}`;
  const point = { id, name, date, rate: (inmates / available) * 100 };
  if (!weekly.has(key) || weekly.get(key).date < date) weekly.set(key, point);
}
const history = [...weekly.values()].sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name, 'it'));
const escape = (value) => /[",\n]/.test(String(value)) ? `"${String(value).replaceAll('"', '""')}"` : value;
await writeFile(
  'docs/data/institutes_history.csv',
  `id,nome,data,tasso\n${history.map((p) => [p.id, p.name, p.date, p.rate.toFixed(4)].map(escape).join(',')).join('\n')}\n`,
);

function isoWeek(iso) {
  const date = new Date(`${iso}T00:00:00Z`);
  const mondayOffset = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - mondayOffset);
  return date.toISOString().slice(0, 10);
}
