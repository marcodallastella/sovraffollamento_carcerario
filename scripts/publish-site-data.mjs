/**
 * Copies only the small, presentation-ready datasets into the static site.
 * The website reads these relative files first, so each GitHub Pages deploy is
 * internally consistent with its published data snapshot.
 */
import { copyFile, mkdir } from 'node:fs/promises';

const datasets = [
  'tasso_affollamento.csv',
  'institutes_totals.csv',
  'institutes_most_recent.csv',
];

await mkdir('docs/data', { recursive: true });
await Promise.all(datasets.map((name) => copyFile(`outputs/viz/${name}`, `docs/data/${name}`)));
