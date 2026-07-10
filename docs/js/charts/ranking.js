// Top-15 most overcrowded institutes: horizontal bars from 0 with a
// reference hairline at 100%. Single series → every bar wears the accent.

import { fmtInt, fmtPct } from '../data.js';
import { CSS, makeSvg, mountWidth, makeTooltip } from './util.js';

const TOP = 15;

export function renderRanking(mount, institutes) {
  mount.replaceChildren();
  const top = institutes
    .filter((i) => i.tasso !== null)
    .sort((a, b) => b.tasso - a.tasso)
    .slice(0, TOP);
  if (!top.length) return;

  const w = mountWidth(mount);
  const mobile = w < 560;
  const rowH = 30;
  const margin = { top: 8, right: 54, bottom: 26, left: mobile ? 118 : 170 };
  const height = margin.top + rowH * top.length + margin.bottom;

  const { svg, g, innerW, innerH } = makeSvg(mount, { width: w, height, margin });
  svg.attr('role', 'img').attr('aria-label',
    `I ${TOP} istituti più sovraffollati. Il più affollato è ${top[0].nome} con un indice del ${fmtPct(top[0].tasso)}. Tutti i valori sono nella tabella successiva.`);

  const x = d3.scaleLinear().domain([0, top[0].tasso]).range([0, innerW]);
  const y = d3.scaleBand().domain(top.map((d) => d.nome)).range([0, rowH * top.length]).padding(0.32);

  // names
  g.append('g').selectAll('text').data(top).join('text')
    .attr('x', -10).attr('y', (d) => y(d.nome) + y.bandwidth() / 2).attr('dy', '0.32em')
    .attr('text-anchor', 'end')
    .style('fill', 'var(--ink)').style('font-size', mobile ? '0.72rem' : '0.8rem').style('font-weight', 550)
    .text((d) => d.nome);

  // bars: rounded data-end, square baseline
  const bars = g.append('g').selectAll('path').data(top).join('path')
    .attr('d', (d) => roundedRight(0, y(d.nome), x(d.tasso), y.bandwidth(), 4))
    .style('fill', CSS.accent);

  // value at bar end
  g.append('g').selectAll('text').data(top).join('text')
    .attr('x', (d) => x(d.tasso) + 8)
    .attr('y', (d) => y(d.nome) + y.bandwidth() / 2).attr('dy', '0.32em')
    .style('fill', 'var(--ink)').style('font-size', '0.78rem').style('font-weight', 650)
    .style('font-variant-numeric', 'tabular-nums')
    .text((d) => `${Math.round(d.tasso)}%`);

  // 100% reference
  g.append('line')
    .attr('x1', x(100)).attr('x2', x(100)).attr('y1', -2).attr('y2', innerH + 4)
    .style('stroke', 'var(--ink-muted)').attr('stroke-width', 1);
  g.append('text')
    .attr('x', x(100)).attr('y', innerH + 20).attr('text-anchor', 'middle')
    .style('fill', 'var(--ink-muted)').style('font-size', '0.72rem')
    .text('100%');

  // per-bar tooltip
  const tooltip = makeTooltip(mount);
  bars
    .on('pointermove', function (ev, d) {
      d3.select(this).attr('opacity', 0.85);
      const k = svg.node().getBoundingClientRect().width / w;
      tooltip.show((margin.left + x(d.tasso)) * k, (margin.top + y(d.nome)) * k, d.nome, [
        { label: 'Indice reale', color: CSS.accent, value: fmtPct(d.tasso) },
        { label: 'Detenuti', color: 'transparent', value: fmtInt(d.detenuti) },
        { label: 'Posti effettivi', color: 'transparent', value: fmtInt(d.disponibili) },
      ]);
    })
    .on('pointerleave', function () {
      d3.select(this).attr('opacity', 1);
      tooltip.hide();
    });
}

function roundedRight(x0, y0, w, h, r) {
  const rr = Math.min(r, w, h / 2);
  return `M${x0},${y0} h${w - rr} a${rr},${rr} 0 0 1 ${rr},${rr} v${h - 2 * rr} a${rr},${rr} 0 0 1 ${-rr},${rr} h${-(w - rr)} Z`;
}
