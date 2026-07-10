// Entry point: load data, fill the page, render charts.
// Every section fails independently — one broken source never blanks the page.

import {
  loadAll, buildHeroSeries, latestPoint, deltaOneYear, latestTotals,
  parseInstitutes, criticalFacts,
  fmtInt, fmtPct, fmtSigned, fmtDate,
} from './data.js';
import { initTheme } from './ui/theme.js';
import { initReveal } from './ui/reveal.js';
import { countUp } from './ui/countup.js';
import { initSearchTable } from './ui/search-table.js';
import { initHero } from './charts/hero.js';
import { renderInfographic } from './charts/infographic.js';
import { renderMap } from './charts/map.js';
import { renderRanking } from './charts/ranking.js';
import { renderStaffing } from './charts/staffing.js';

initTheme();
initReveal();

const $ = (id) => document.getElementById(id);

function showError(el, message = 'Dati momentaneamente non disponibili.') {
  const box = document.createElement('div');
  box.className = 'data-error';
  const txt = document.createElement('span');
  txt.textContent = message;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = 'Riprova';
  btn.addEventListener('click', () => location.reload());
  box.append(txt, btn);
  el.replaceChildren(box);
}

function section(fn, mountEl) {
  try {
    fn();
  } catch (err) {
    console.error(err);
    if (mountEl) showError(mountEl);
  }
}

const data = await loadAll();
const annotations = await fetch('data/annotations.json').then((r) => (r.ok ? r.json() : [])).catch(() => []);

/* ── hero ── */
section(() => {
  if (!data.tasso) throw new Error('tasso mancante');
  const series = buildHeroSeries(data.tasso);
  const last = latestPoint(series.real);
  const delta = deltaOneYear(series.real);

  if (last) {
    $('hero-updated').textContent = fmtDate(last.date.toISOString().slice(0, 10));
    countUp($('hero-value'), last.value, (v) => fmtPct(v));
  }
  if (delta !== null) {
    const el = $('hero-delta');
    el.classList.toggle('is-down', delta < 0);
    const strong = document.createElement('strong');
    strong.textContent = `${delta >= 0 ? '▲' : '▼'} ${fmtSigned(delta)} punti`;
    el.replaceChildren(strong, document.createTextNode(' rispetto a un anno fa'));
  }

  initHero({ mount: $('hero-chart'), picker: $('range-picker'), series, annotations });
}, $('hero-chart'));

/* ── stat tiles ── */
section(() => {
  if (!data.totals) throw new Error('totali mancanti');
  const t = latestTotals(data.totals);
  countUp($('stat-detenuti'), t.detenuti, fmtInt);
  countUp($('stat-regolamentari'), t.regolamentari, fmtInt);
  countUp($('stat-non-disponibili'), t.nonDisponibili, fmtInt);
  countUp($('stat-disponibili'), t.disponibili, fmtInt);
  countUp($('stat-tasso'), t.tasso, (v) => fmtPct(v));
  $('stat-tasso-note').textContent = `al ${fmtDate(t.date)}`;

  renderInfographic($('infographic'), t);
}, $('infographic'));

/* ── critical facts + institute charts ── */
if (!data.institutes) {
  [$('ranking-chart'), $('map-chart'), $('staffing-chart')].forEach((el) => showError(el));
}
section(() => {
  if (!data.institutes) throw new Error('istituti mancanti');
  const institutes = parseInstitutes(data.institutes);
  const { over150, worst } = criticalFacts(institutes);

  const p1 = $('fact-over150');
  p1.replaceChildren();
  p1.append('In ');
  p1.appendChild(strongOf(`${over150} istituti`));
  p1.append(' il sovraffollamento reale è pari o superiore al ');
  p1.appendChild(strongOf('150%'));
  p1.append(': almeno tre persone ogni due posti.');

  if (worst) {
    const p2 = $('fact-worst');
    p2.replaceChildren();
    p2.append('Il caso più grave è ');
    p2.appendChild(strongOf(worst.nome));
    p2.append(', dove l’indice raggiunge il ');
    p2.appendChild(strongOf(fmtPct(worst.tasso)));
    p2.append('.');
  }

  section(() => renderRanking($('ranking-chart'), institutes), $('ranking-chart'));
  section(() => initSearchTable({
    table: $('institutes-table'),
    search: $('table-search'),
    count: $('table-count'),
    showAll: $('show-all'),
  }, institutes), null);
  section(() => renderStaffing($('staffing-chart'), institutes), $('staffing-chart'));
  renderMap($('map-chart'), $('map-legend'), institutes)
    .catch((err) => { console.error(err); showError($('map-chart')); });
}, $('ranking-chart'));

function strongOf(text) {
  const s = document.createElement('strong');
  s.textContent = text;
  return s;
}
