// Staffing scatter: overcrowding (x) vs police staff shortage (y).
// Emphasis form: all institutes gray; the critical quadrant (>120% and >20%)
// wears the accent and is direct-labeled.

import { fmtInt, fmtPct } from '../data.js';
import { CSS, makeSvg, mountWidth, yGrid, makeTooltip } from './util.js';

const X_THRESH = 120;
const Y_THRESH = 20;

export function renderStaffing(mount, institutes) {
  mount.replaceChildren();
  // The story is staff shortage: heavily overstaffed outliers (carenza < −25%)
  // would stretch the axis and are left to the table view.
  const pts = institutes.filter((i) => i.tasso !== null && i.carenzaPolizia !== null && i.carenzaPolizia >= -25);
  if (!pts.length) return;
  const critical = pts.filter((d) => d.tasso > X_THRESH && d.carenzaPolizia > Y_THRESH);

  const w = mountWidth(mount);
  const mobile = w < 560;
  const height = Math.max(340, Math.min(480, w * 0.62));
  const margin = { top: 16, right: 20, bottom: 46, left: 46 };

  const { svg, g, innerW, innerH } = makeSvg(mount, { width: w, height, margin });
  svg.attr('role', 'img').attr('aria-label',
    `Grafico a dispersione: sovraffollamento e carenza di polizia penitenziaria per ${pts.length} istituti. ${critical.length} istituti superano sia il ${X_THRESH}% di affollamento sia il ${Y_THRESH}% di carenza di personale. Valori nella tabella degli istituti.`);

  const x = d3.scaleLinear()
    .domain([Math.max(0, d3.min(pts, (d) => d.tasso) - 8), d3.max(pts, (d) => d.tasso) * 1.04])
    .range([0, innerW]);
  const y = d3.scaleLinear()
    .domain([Math.min(-5, d3.min(pts, (d) => d.carenzaPolizia) - 2), d3.max(pts, (d) => d.carenzaPolizia) * 1.15])
    .range([innerH, 0]);

  yGrid(g, y, innerW, mobile ? 4 : 5, (d) => `${d}%`);

  const xt = g.append('g');
  xt.selectAll('text').data(x.ticks(mobile ? 4 : 6)).join('text')
    .attr('x', (d) => x(d)).attr('y', innerH + 22).attr('text-anchor', 'middle')
    .style('fill', 'var(--ink-muted)').style('font-size', '0.75rem')
    .style('font-variant-numeric', 'tabular-nums')
    .text((d) => `${d}%`);

  // axis titles
  g.append('text')
    .attr('x', innerW).attr('y', innerH + 40).attr('text-anchor', 'end')
    .style('fill', 'var(--ink-secondary)').style('font-size', '0.75rem').style('font-weight', 600)
    .text('Sovraffollamento reale →');
  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', 0).attr('y', -32).attr('text-anchor', 'end')
    .style('fill', 'var(--ink-secondary)').style('font-size', '0.75rem').style('font-weight', 600)
    .text('Carenza di personale →');

  // thresholds
  g.append('line').attr('x1', x(X_THRESH)).attr('x2', x(X_THRESH)).attr('y1', 0).attr('y2', innerH)
    .style('stroke', 'var(--ink-muted)').attr('stroke-width', 1).attr('opacity', 0.7);
  g.append('line').attr('x1', 0).attr('x2', innerW).attr('y1', y(Y_THRESH)).attr('y2', y(Y_THRESH))
    .style('stroke', 'var(--ink-muted)').attr('stroke-width', 1).attr('opacity', 0.7);
  g.append('text').attr('x', x(X_THRESH) + 5).attr('y', 12)
    .style('fill', 'var(--ink-muted)').style('font-size', '0.7rem').text(`${X_THRESH}%`);
  g.append('text').attr('x', innerW - 4).attr('y', y(Y_THRESH) - 6).attr('text-anchor', 'end')
    .style('fill', 'var(--ink-muted)').style('font-size', '0.7rem').text(`carenza ${Y_THRESH}%`);

  const isCritical = (d) => d.tasso > X_THRESH && d.carenzaPolizia > Y_THRESH;
  const dotR = mobile ? 4 : 5;
  const dots = g.append('g').selectAll('circle').data(pts).join('circle')
    .attr('cx', (d) => x(d.tasso)).attr('cy', (d) => y(d.carenzaPolizia))
    .attr('r', (d) => (isCritical(d) ? dotR + 1 : dotR))
    .style('fill', (d) => (isCritical(d) ? CSS.accent : CSS.context))
    .attr('opacity', (d) => (isCritical(d) ? 1 : 0.55))
    .style('stroke', CSS.surface).attr('stroke-width', 1.5);

  // Direct labels: only the most extreme critical institutes, greedily placed
  // so labels never collide (the rest stay reachable via hover and the table).
  if (!mobile) {
    const placed = [];
    const candidates = [...critical].sort((a, b) => (b.tasso + b.carenzaPolizia) - (a.tasso + a.carenzaPolizia));
    for (const d of candidates) {
      if (placed.length >= 6) break;
      const px = x(d.tasso);
      const py = y(d.carenzaPolizia);
      if (placed.some((p) => Math.abs(p.px - px) < 110 && Math.abs(p.py - py) < 22)) continue;
      placed.push({ d, px, py });
    }
    g.append('g').selectAll('text').data(placed).join('text')
      .attr('x', (p) => Math.min(p.px, innerW - 6)).attr('y', (p) => Math.max(10, p.py - 11))
      .attr('text-anchor', (p) => (p.px > innerW - 90 ? 'end' : 'middle'))
      .style('fill', 'var(--ink)').style('font-size', '0.72rem').style('font-weight', 600)
      .text((p) => p.d.nome);
  }

  // nearest-point hover
  const tooltip = makeTooltip(mount);
  const delaunay = d3.Delaunay.from(pts, (d) => x(d.tasso), (d) => y(d.carenzaPolizia));
  svg.on('pointermove', (ev) => {
    const [mx, my] = d3.pointer(ev, g.node());
    const i = delaunay.find(mx, my);
    const d = pts[i];
    if (Math.hypot(x(d.tasso) - mx, y(d.carenzaPolizia) - my) > 26) { clear(); return; }
    dots.attr('opacity', (p) => (p === d ? 1 : isCritical(p) ? 0.9 : 0.35));
    const k = svg.node().getBoundingClientRect().width / w;
    tooltip.show((margin.left + x(d.tasso)) * k, (margin.top + y(d.carenzaPolizia)) * k, d.nome, [
      { label: 'Sovraffollamento', color: isCritical(d) ? CSS.accent : CSS.context, value: fmtPct(d.tasso) },
      { label: 'Carenza personale', color: 'transparent', value: fmtPct(d.carenzaPolizia) },
      { label: 'Detenuti', color: 'transparent', value: fmtInt(d.detenuti) },
    ]);
  }).on('pointerleave', clear);

  function clear() {
    tooltip.hide();
    dots.attr('opacity', (d) => (isCritical(d) ? 1 : 0.55));
  }
}
