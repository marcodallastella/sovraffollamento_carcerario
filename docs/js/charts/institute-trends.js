// Institute trajectories: a quiet overview of every prison, with a compact
// selector that brings a handful of individual histories into focus.

import { fmtDate, fmtPct } from '../data.js';
import { CSS, makeSvg, makeTooltip, mountWidth, yGrid, fmtTick } from './util.js';

const MAX_SELECTED = 5;
const COLORS = ['var(--accent)', 'var(--slate)', 'var(--trend-3)', 'var(--trend-4)', 'var(--trend-5)'];

export function initInstituteTrends(mount, controls, series) {
  const byName = new Map(series.map((s) => [s.name, s]));
  const byId = new Map(series.map((s) => [s.id, s]));
  let selectedIds = [...series]
    .sort((a, b) => latest(b).value - latest(a).value)
    .slice(0, 3)
    .map((s) => s.id);
  let showContext = true;
  let lastWidth = 0;

  for (const s of [...series].sort((a, b) => a.name.localeCompare(b.name, 'it'))) {
    const option = document.createElement('option');
    option.value = s.name;
    controls.options.appendChild(option);
  }

  function addSelection() {
    const s = byName.get(controls.input.value.trim());
    if (!s || selectedIds.includes(s.id) || selectedIds.length >= MAX_SELECTED) return;
    selectedIds = [...selectedIds, s.id];
    controls.input.value = '';
    draw();
  }

  controls.add.addEventListener('click', addSelection);
  controls.input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') { event.preventDefault(); addSelection(); }
  });
  controls.context.addEventListener('click', () => {
    showContext = !showContext;
    controls.context.setAttribute('aria-pressed', String(showContext));
    controls.context.textContent = showContext ? 'Nascondi tutte le traiettorie' : 'Mostra tutte le traiettorie';
    draw();
  });

  const observer = new ResizeObserver(() => {
    const width = Math.round(mountWidth(mount));
    if (width !== lastWidth) draw();
  });
  observer.observe(mount);
  draw();

  function draw() {
    lastWidth = Math.round(mountWidth(mount));
    const selected = selectedIds.map((id) => byId.get(id)).filter(Boolean);
    renderSelection(controls.selected, selected, (id) => {
      selectedIds = selectedIds.filter((current) => current !== id);
      draw();
    });
    renderChart(mount, series, selected, showContext);
  }
}

function renderSelection(mount, selected, remove) {
  mount.replaceChildren();
  if (!selected.length) {
    mount.textContent = 'Scegli un istituto per metterne in evidenza la traiettoria.';
    return;
  }
  selected.forEach((s, i) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'trend-chip';
    chip.style.setProperty('--chip-color', COLORS[i]);
    chip.textContent = s.name;
    chip.setAttribute('aria-label', `Rimuovi ${s.name} dal confronto`);
    chip.addEventListener('click', () => remove(s.id));
    mount.appendChild(chip);
  });
}

function renderChart(mount, all, selected, showContext) {
  mount.replaceChildren();
  const w = mountWidth(mount);
  const mobile = w < 640;
  const height = Math.max(360, Math.min(mobile ? w * 0.9 : w * 0.52, 520));
  const margin = { top: 24, right: mobile ? 14 : 26, bottom: 38, left: 48 };
  const { svg, g, innerW, innerH } = makeSvg(mount, { width: w, height, margin });
  const focused = selected.length ? selected : all;
  const allPoints = focused.flatMap((s) => s.points);
  const start = d3.min(all.flatMap((s) => s.points), (p) => p.date);
  const end = d3.max(all.flatMap((s) => s.points), (p) => p.date);
  const minValue = d3.min(allPoints, (p) => p.value) ?? 80;
  const maxValue = d3.max(allPoints, (p) => p.value) ?? 120;
  const yMin = Math.min(95, minValue - Math.max(5, (maxValue - minValue) * 0.08));
  const yMax = Math.max(105, maxValue + Math.max(5, (maxValue - minValue) * 0.08));
  const x = d3.scaleUtc().domain([start, end]).range([0, innerW]);
  const y = d3.scaleLinear().domain([yMin, yMax]).range([innerH, 0]).nice();
  const line = d3.line().x((p) => x(p.date)).y((p) => y(p.value)).curve(d3.curveMonotoneX);

  svg.attr('role', 'img').attr('aria-label', selected.length
    ? `Confronto nel tempo del sovraffollamento reale di ${selected.map((s) => s.name).join(', ')}. La soglia del 100% indica la capienza effettiva.`
    : `Andamento del sovraffollamento reale negli istituti penitenziari italiani. La soglia del 100% indica la capienza effettiva.`);
  yGrid(g, y, innerW, mobile ? 4 : 6, (d) => `${d}%`);

  if (100 >= y.domain()[0] && 100 <= y.domain()[1]) {
    g.append('line').attr('x1', 0).attr('x2', innerW).attr('y1', y(100)).attr('y2', y(100))
      .style('stroke', 'var(--ink-muted)').attr('stroke-width', 1.2);
    g.append('text').attr('x', innerW).attr('y', y(100) - 6).attr('text-anchor', 'end')
      .style('fill', 'var(--ink-muted)').style('font-size', '0.72rem').text('100% — un posto per persona');
  }

  const ticks = x.ticks(mobile ? 4 : 7);
  g.append('g').attr('class', 'axis').selectAll('text').data(ticks).join('text')
    .attr('x', x).attr('y', innerH + 24).attr('text-anchor', 'middle')
    .text((d) => fmtTick(d, (end - start) / 86400e3));

  const clipId = `trends-clip-${Math.random().toString(36).slice(2, 8)}`;
  svg.append('defs').append('clipPath').attr('id', clipId).append('rect').attr('width', innerW).attr('height', innerH);
  const plot = g.append('g').attr('clip-path', `url(#${clipId})`);
  const selectedIds = new Set(selected.map((s) => s.id));
  if (showContext) {
    plot.append('g').selectAll('path').data(all.filter((s) => !selectedIds.has(s.id))).join('path')
      .attr('d', (s) => line(s.points)).attr('fill', 'none')
      .style('stroke', CSS.context).attr('stroke-width', 0.85).attr('opacity', 0.16);
  }
  plot.append('g').selectAll('path').data(selected).join('path')
    .attr('d', (s) => line(s.points)).attr('fill', 'none')
    .style('stroke', (_, i) => COLORS[i]).attr('stroke-width', 2.5)
    .attr('stroke-linejoin', 'round').attr('stroke-linecap', 'round');

  const tooltip = makeTooltip(mount);
  const dates = [...new Set(selected.flatMap((s) => s.points.map((p) => +p.date)))].sort((a, b) => a - b).map((ms) => new Date(ms));
  if (!dates.length) return;
  const bisect = d3.bisector((d) => d).center;
  const hair = g.append('line').attr('y1', 0).attr('y2', innerH).style('stroke', 'var(--ink-muted)').attr('opacity', 0);
  const overlay = g.append('rect').attr('width', innerW).attr('height', innerH).attr('fill', 'transparent').style('touch-action', 'pan-y');
  overlay.on('pointermove', (event) => {
    const [mx] = d3.pointer(event);
    const date = dates[bisect(dates, x.invert(mx))];
    if (!date) return;
    hair.attr('x1', x(date)).attr('x2', x(date)).attr('opacity', 1);
    const rows = selected.map((s, i) => {
      const point = s.points[d3.bisector((p) => p.date).center(s.points, date)];
      return { label: s.name, color: COLORS[i], value: point ? fmtPct(point.value) : '—' };
    });
    const k = svg.node().getBoundingClientRect().width / w;
    tooltip.show((margin.left + x(date)) * k, margin.top * k, fmtDate(date.toISOString().slice(0, 10)), rows);
  }).on('pointerleave', () => { hair.attr('opacity', 0); tooltip.hide(); });
}

function latest(series) {
  return series.points[series.points.length - 1];
}
