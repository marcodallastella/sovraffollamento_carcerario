// Hero chart: the real overcrowding index (emphasis, burgundy) with the
// official index as gray context. Range selection persists in ?periodo=.

import { fmtPct, fmtDate, parseISO, recordHigh } from '../data.js';
import { CSS, makeSvg, mountWidth, yGrid, fmtTick, timeCrosshair, reducedMotion } from './util.js';

const RANGES = { '30g': 30, '6m': 182, '1a': 365, tutto: null };
const DEFAULT_RANGE = '1a';

export function initHero({ mount, picker, series, annotations }) {
  let range = readRangeFromURL();
  let firstRender = true;
  let cleanup = null;

  const buttons = picker.querySelectorAll('button[data-range]');
  buttons.forEach((b) => {
    b.addEventListener('click', () => {
      if (b.dataset.range === range) return;
      range = b.dataset.range;
      writeRangeToURL(range);
      syncButtons();
      render();
    });
  });

  function syncButtons() {
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.range === range)));
  }

  function render() {
    if (cleanup) cleanup();
    mount.replaceChildren();
    cleanup = draw(mount, series, annotations, range, firstRender);
    firstRender = false;
  }

  syncButtons();
  render();

  let raf = null;
  const ro = new ResizeObserver(() => {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const w = Math.round(mountWidth(mount));
      if (w !== lastW) { lastW = w; render(); }
    });
  });
  let lastW = Math.round(mountWidth(mount));
  ro.observe(mount);
}

function readRangeFromURL() {
  const p = new URLSearchParams(location.search).get('periodo');
  return p && p in RANGES ? p : DEFAULT_RANGE;
}

function writeRangeToURL(range) {
  const url = new URL(location.href);
  if (range === DEFAULT_RANGE) url.searchParams.delete('periodo');
  else url.searchParams.set('periodo', range);
  history.replaceState(null, '', url);
}

function draw(mount, { real }, annotations, range, animate) {
  const w = mountWidth(mount);
  const mobile = w < 640;
  // Cap by viewport height so the chart lands above the fold on desktop.
  const height = Math.max(320, Math.min(mobile ? w * 0.95 : w * 0.46, window.innerHeight * 0.6, 540));
  const margin = { top: 24, right: mobile ? 12 : 20, bottom: 34, left: 46 };

  // Visible slice
  if (!real.length) return () => {};
  const end = real[real.length - 1].date;
  const days = RANGES[range];
  const start = days ? new Date(end.getTime() - days * 86400e3) : real[0].date;
  const inRange = (p) => p.date >= start && p.date <= end;
  const vReal = real.filter(inRange);

  const { svg, g, innerW, innerH } = makeSvg(mount, { width: w, height, margin });
  svg.attr('role', 'img').attr('aria-label', heroAria(vReal, start, end));

  const x = d3.scaleUtc().domain([start, end]).range([0, innerW]);

  const values = vReal.map((d) => d.value);
  let [lo, hi] = [Math.min(...values), Math.max(...values)];
  const pad = Math.max(1.5, (hi - lo) * 0.12);
  lo -= pad; hi += pad;
  if (lo < 104 && lo > 92) lo = Math.min(lo, 97); // when the domain skims 100%, include the reference line with some air
  const y = d3.scaleLinear().domain([lo, hi]).range([innerH, 0]).nice();

  yGrid(g, y, innerW, mobile ? 4 : 6, (d) => `${d}%`);

  // 100% reference (only when in view)
  if (100 >= y.domain()[0] && 100 <= y.domain()[1]) {
    g.append('line')
      .attr('x1', 0).attr('x2', innerW).attr('y1', y(100)).attr('y2', y(100))
      .style('stroke', 'var(--ink-muted)').attr('stroke-width', 1);
    g.append('text')
      .attr('x', innerW).attr('y', y(100) - 6).attr('text-anchor', 'end')
      .style('fill', 'var(--ink-muted)').style('font-size', '0.72rem')
      .text('100% — un posto per persona');
  }

  // X ticks
  const spanDays = (end - start) / 86400e3;
  const ticks = x.ticks(mobile ? 4 : Math.min(8, Math.ceil(spanDays / 30)));
  const ax = g.append('g').attr('class', 'axis');
  ax.selectAll('text').data(ticks).join('text')
    .attr('x', (d) => x(d)).attr('y', innerH + 24).attr('text-anchor', 'middle')
    .style('fill', 'var(--ink-muted)')
    .text((d) => fmtTick(d, spanDays));

  const line = d3.line().x((d) => x(d.date)).y((d) => y(d.value)).curve(d3.curveMonotoneX);

  // Gradient wash under the real line
  const gradId = `hero-grad-${Math.random().toString(36).slice(2, 8)}`;
  const grad = svg.append('defs').append('linearGradient')
    .attr('id', gradId).attr('gradientUnits', 'userSpaceOnUse')
    .attr('x1', 0).attr('y1', margin.top).attr('x2', 0).attr('y2', height - margin.bottom);
  grad.append('stop').attr('offset', '0%').style('stop-color', CSS.accent).attr('stop-opacity', 0.14);
  grad.append('stop').attr('offset', '100%').style('stop-color', CSS.accent).attr('stop-opacity', 0);

  const area = d3.area()
    .x((d) => x(d.date)).y0(innerH).y1((d) => y(d.value)).curve(d3.curveMonotoneX);
  const areaPath = g.append('path')
    .attr('d', area(vReal))
    .attr('fill', `url(#${gradId})`);

  const realPath = g.append('path')
    .attr('d', line(vReal))
    .attr('fill', 'none')
    .style('stroke', CSS.accent)
    .attr('stroke-width', 2.5)
    .attr('stroke-linejoin', 'round').attr('stroke-linecap', 'round');

  // Draw-in on first load only
  if (animate && !reducedMotion() && vReal.length) {
    const len = realPath.node().getTotalLength();
    areaPath.attr('opacity', 0);
    realPath
      .attr('stroke-dasharray', `${len} ${len}`)
      .attr('stroke-dashoffset', len)
      .transition().duration(800).ease(d3.easeCubicOut)
      .attr('stroke-dashoffset', 0)
      .on('end', () => {
        realPath.attr('stroke-dasharray', null);
        areaPath.transition().duration(400).attr('opacity', 1);
      });
  }

  // Endpoint: dot + value label. When the record-high marker sits close to
  // the endpoint, drop the value label below the line so they never overlap.
  const rh = recordHigh(real);
  const last = vReal[vReal.length - 1];
  if (last) {
    const rhClose = rh && +rh.date !== +last.date && rh.date >= start
      && Math.abs(x(rh.date) - x(last.date)) < 70 && Math.abs(y(rh.value) - y(last.value)) < 28;
    g.append('circle')
      .attr('cx', x(last.date)).attr('cy', y(last.value)).attr('r', 4.5)
      .style('fill', CSS.accent)
      .style('stroke', CSS.surface).attr('stroke-width', 2);
    g.append('text')
      .attr('x', x(last.date) - 8).attr('y', y(last.value) + (rhClose ? 22 : -12))
      .attr('text-anchor', 'end')
      .style('fill', 'var(--ink)').style('font-weight', 650).style('font-size', '0.85rem')
      .text(fmtPct(last.value));
  }

  // Record high of the real series. Near the right edge it would collide with
  // the endpoint value label, so anchor it left of the dot and lift it.
  if (rh && vReal.length && rh.date >= start && rh.date <= end) {
    const sameAsLast = last && +rh.date === +last.date;
    if (!sameAsLast) {
      g.append('circle')
        .attr('cx', x(rh.date)).attr('cy', y(rh.value)).attr('r', 3.5)
        .style('fill', CSS.accent).style('stroke', CSS.surface).attr('stroke-width', 2);
    }
    const nearEnd = innerW - x(rh.date) < 130;
    g.append('text')
      .attr('x', x(rh.date) - (nearEnd || sameAsLast ? 10 : 0))
      .attr('y', Math.max(10, y(rh.value) - (nearEnd ? 26 : 10)))
      .attr('text-anchor', nearEnd || sameAsLast ? 'end' : 'middle')
      .style('fill', 'var(--ink-muted)').style('font-size', '0.72rem')
      .text('massimo storico');
  }

  // Editorial annotations (from data/annotations.json)
  for (const a of annotations || []) {
    const date = parseISO(a.date);
    if (!date || date < start || date > end) continue;
    if (!vReal.length) continue;
    const j = d3.bisector((d) => d.date).center(vReal, date);
    const p = vReal[j];
    if (!p) continue;
    const ay = y(p.value);
    g.append('line')
      .attr('x1', x(date)).attr('x2', x(date))
      .attr('y1', ay - 8).attr('y2', Math.max(14, ay - 34))
      .style('stroke', 'var(--ink-muted)').attr('stroke-width', 1);
    g.append('circle')
      .attr('cx', x(date)).attr('cy', ay).attr('r', 3)
      .style('fill', CSS.surface).style('stroke', 'var(--ink-muted)').attr('stroke-width', 1.5);
    const anchor = x(date) > innerW * 0.75 ? 'end' : (x(date) < innerW * 0.25 ? 'start' : 'middle');
    g.append('text')
      .attr('x', x(date)).attr('y', Math.max(10, ay - 40))
      .attr('text-anchor', anchor)
      .style('fill', 'var(--ink-secondary)').style('font-size', '0.72rem')
      .text(a.label);
  }

  // Hover / keyboard layer
  const series = [{ name: 'Indice reale', color: CSS.accent, data: vReal, format: fmtPct }];
  const dates = vReal.map((p) => p.date);
  const cross = timeCrosshair({
    mount, svg, g, x, y, innerW, innerH, series, dates,
    marginLeft: margin.left, marginTop: margin.top,
  });

  // Keyboard exploration
  mount.tabIndex = 0;
  mount.setAttribute('role', 'application');
  mount.setAttribute('aria-label', 'Grafico interattivo. Usa le frecce sinistra e destra per esplorare i valori.');
  let ki = dates.length - 1;
  const onKey = (ev) => {
    if (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight' && ev.key !== 'Escape') return;
    ev.preventDefault();
    if (ev.key === 'Escape') { cross.clear(); return; }
    ki = Math.max(0, Math.min(dates.length - 1, ki + (ev.key === 'ArrowRight' ? 1 : -1)));
    cross.update(dates[ki]);
  };
  const onBlur = () => cross.clear();
  mount.addEventListener('keydown', onKey);
  mount.addEventListener('blur', onBlur);

  return () => {
    mount.removeEventListener('keydown', onKey);
    mount.removeEventListener('blur', onBlur);
  };
}

function heroAria(vReal, start, end) {
  const last = vReal[vReal.length - 1];
  if (!last) return 'Grafico dell’indice di sovraffollamento carcerario.';
  return `Grafico a linee dell'indice di sovraffollamento reale dal ${fmtDate(start.toISOString().slice(0, 10))} al ${fmtDate(end.toISOString().slice(0, 10))}: ${fmtPct(vReal[0].value)} all'inizio del periodo, ${fmtPct(last.value)} oggi. I valori sono consultabili nella tabella degli istituti.`;
}
