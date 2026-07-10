// Shared chart helpers. Colors are read from CSS custom properties via
// var() in inline styles, so charts adapt to theme changes without re-render.

import { fmtDate, fmtPct } from '../data.js';

export const CSS = {
  accent: 'var(--accent)',
  context: 'var(--context)',
  grid: 'var(--grid)',
  muted: 'var(--ink-muted)',
  ink: 'var(--ink)',
  surface: 'var(--surface-raised)',
};

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// Responsive SVG with margin convention. Returns {svg, g, width, height, innerW, innerH}.
export function makeSvg(mount, { width, height, margin }) {
  const svg = d3.select(mount).append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
  return {
    svg, g, width, height,
    innerW: width - margin.left - margin.right,
    innerH: height - margin.top - margin.bottom,
  };
}

// Mount width in CSS pixels (for choosing an aspect ratio / tick count).
export function mountWidth(mount, fallback = 720) {
  const w = mount.getBoundingClientRect().width;
  return w > 0 ? w : fallback;
}

// Hairline horizontal gridlines + y tick labels (no axis stroke).
export function yGrid(g, scale, innerW, ticks, format) {
  const grid = g.append('g').attr('class', 'axis');
  const t = grid.selectAll('g').data(scale.ticks(ticks)).join('g')
    .attr('transform', (d) => `translate(0,${scale(d)})`);
  t.append('line').attr('x1', 0).attr('x2', innerW)
    .style('stroke', CSS.grid).attr('stroke-width', 1);
  t.append('text').attr('x', -8).attr('dy', '0.32em').attr('text-anchor', 'end')
    .style('fill', 'var(--ink-muted)')
    .text(format);
  return grid;
}

// X axis: labels only, no domain line.
export function xAxis(g, scale, innerH, ticks, format) {
  const ax = g.append('g').attr('class', 'axis').attr('transform', `translate(0,${innerH})`);
  ax.selectAll('text').data(ticks).join('text')
    .attr('x', (d) => scale(d)).attr('y', 20).attr('text-anchor', 'middle')
    .style('fill', 'var(--ink-muted)')
    .text(format);
  return ax;
}

// Short Italian month labels for time ticks.
const MONTHS_IT = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
export function fmtTick(date, spanDays) {
  const m = MONTHS_IT[date.getUTCMonth()];
  if (spanDays > 700) return String(date.getUTCFullYear());
  if (spanDays > 90) return `${m} ${String(date.getUTCFullYear()).slice(2)}`;
  return `${date.getUTCDate()} ${m}`;
}

// Singleton-per-mount tooltip. Rows are built with textContent (untrusted data).
export function makeTooltip(mount) {
  const el = document.createElement('div');
  el.className = 'chart-tooltip';
  el.setAttribute('role', 'status');
  mount.appendChild(el);

  function show(px, py, title, rows) {
    el.replaceChildren();
    const t = document.createElement('div');
    t.className = 'tt-date';
    t.textContent = title;
    el.appendChild(t);
    for (const r of rows) {
      const row = document.createElement('div');
      row.className = 'tt-row';
      const key = document.createElement('span');
      key.className = 'key-line';
      key.style.borderColor = r.color;
      const lbl = document.createElement('span');
      lbl.className = 'lbl';
      lbl.textContent = r.label;
      const val = document.createElement('span');
      val.className = 'val';
      val.textContent = r.value;
      row.append(key, lbl, val);
      el.appendChild(row);
    }
    el.classList.add('is-visible');
    const mw = mount.getBoundingClientRect().width;
    const tw = el.offsetWidth;
    const left = px + 14 + tw > mw ? Math.max(0, px - tw - 14) : px + 14;
    el.style.left = `${left}px`;
    el.style.top = `${Math.max(0, py - el.offsetHeight - 12)}px`;
  }

  function hide() { el.classList.remove('is-visible'); }
  return { show, hide, el };
}

// Crosshair + nearest-date readout for time-series charts.
// series: [{name, color, data: [{date, value}], format}] — all listed in one tooltip.
export function timeCrosshair({ mount, svg, g, x, y, innerW, innerH, series, dates, marginLeft, marginTop }) {
  const tooltip = makeTooltip(mount);
  const hair = g.append('line')
    .attr('y1', 0).attr('y2', innerH)
    .style('stroke', 'var(--ink-muted)').attr('stroke-width', 1)
    .attr('opacity', 0);
  const dots = series.map((s) => g.append('circle')
    .attr('r', 4.5)
    .style('fill', s.color)
    .style('stroke', CSS.surface).attr('stroke-width', 2)
    .attr('opacity', 0));

  const allDates = dates || series[0].data.map((d) => d.date);
  const bisect = d3.bisector((d) => d).center;

  function update(dateAt) {
    const i = bisect(allDates, dateAt);
    const date = allDates[Math.max(0, Math.min(i, allDates.length - 1))];
    if (!date) return;
    const px = x(date);
    hair.attr('x1', px).attr('x2', px).attr('opacity', 1);
    const rows = [];
    series.forEach((s, si) => {
      const j = d3.bisector((d) => d.date).center(s.data, date);
      const p = s.data[j];
      if (p && Math.abs(p.date - date) < 40 * 86400e3) {
        dots[si].attr('cx', x(p.date)).attr('cy', y(p.value)).attr('opacity', 1);
        rows.push({ label: s.name, color: s.color, value: s.format(p.value) });
      } else {
        dots[si].attr('opacity', 0);
      }
    });
    const svgRect = svg.node().getBoundingClientRect();
    const k = svgRect.width / svg.node().viewBox.baseVal.width;
    tooltip.show((marginLeft + px) * k, (marginTop + 10) * k, fmtDate(date.toISOString().slice(0, 10)), rows);
    return date;
  }

  function clear() {
    hair.attr('opacity', 0);
    dots.forEach((d) => d.attr('opacity', 0));
    tooltip.hide();
  }

  const overlay = g.append('rect')
    .attr('width', innerW).attr('height', innerH)
    .attr('fill', 'transparent')
    .style('touch-action', 'pan-y');

  overlay
    .on('pointermove', (ev) => {
      const [mx] = d3.pointer(ev);
      update(x.invert(mx));
    })
    .on('pointerleave', clear);

  return { update, clear, overlay };
}

export { fmtPct };
