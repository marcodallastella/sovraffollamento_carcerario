// Static infographic: official capacity ≠ available capacity.
// Two horizontal bars on a shared scale: (1) capienza regolamentare with the
// unavailable slice knocked out, (2) detainees, whose excess over the real
// places is the burgundy overflow.

import { fmtInt } from '../data.js';
import { CSS, makeSvg, mountWidth } from './util.js';

export function renderInfographic(mount, totals) {
  mount.replaceChildren();
  const { regolamentari, nonDisponibili, disponibili, detenuti } = totals;
  if ([regolamentari, nonDisponibili, disponibili, detenuti].some((v) => v === null)) return;

  const w = Math.min(820, mountWidth(mount));
  const mobile = w < 560;
  const rowH = 34;
  const gapY = 78;
  const margin = { top: 26, right: 16, bottom: 10, left: 8 };
  // height follows the content: title offset + two rows + gap + the tallest
  // label block under row 2 (two stacked lines on mobile)
  const labelBlock = mobile ? 42 : 26;
  const height = margin.top + 16 + rowH + gapY + rowH + labelBlock + margin.bottom;

  const { svg, g, innerW } = makeSvg(mount, { width: w, height, margin });
  svg.attr('role', 'img').attr('aria-label',
    `La capienza regolamentare è di ${fmtInt(regolamentari)} posti, ma ${fmtInt(nonDisponibili)} non sono disponibili: i posti reali sono ${fmtInt(disponibili)}. Le persone detenute sono ${fmtInt(detenuti)}.`);

  const x = d3.scaleLinear().domain([0, Math.max(detenuti, regolamentari)]).range([0, innerW]);
  const r = 4;
  const labelSize = mobile ? '0.72rem' : '0.8rem';

  const rowLabel = (yPos, text) => {
    g.append('text').attr('x', 0).attr('y', yPos - 10)
      .style('fill', 'var(--ink-secondary)').style('font-size', labelSize).style('font-weight', 600)
      .text(text);
  };

  const segLabel = (xPos, yPos, text, { anchor = 'middle', strong = false, color = 'var(--ink-secondary)' } = {}) => {
    g.append('text').attr('x', xPos).attr('y', yPos)
      .attr('text-anchor', anchor)
      .style('fill', color).style('font-size', labelSize).style('font-weight', strong ? 650 : 450)
      .text(text);
  };

  /* Row 1: capienza regolamentare = disponibili + non disponibili */
  const y1 = 16;
  rowLabel(y1, 'Capienza regolamentare');
  // available places — neutral fill
  g.append('rect').attr('x', 0).attr('y', y1).attr('width', x(disponibili)).attr('height', rowH)
    .attr('rx', r).style('fill', 'var(--grid)');
  // unavailable — hatched knock-out, separated by a 2px surface gap
  const hatchId = 'hatch-nd';
  const defs = svg.append('defs');
  defs.append('pattern').attr('id', hatchId).attr('width', 6).attr('height', 6)
    .attr('patternUnits', 'userSpaceOnUse').attr('patternTransform', 'rotate(45)')
    .append('rect').attr('width', 2.5).attr('height', 6).style('fill', 'var(--ink-muted)');
  g.append('rect')
    .attr('x', x(disponibili) + 2).attr('y', y1)
    .attr('width', Math.max(0, x(regolamentari) - x(disponibili) - 2)).attr('height', rowH)
    .attr('rx', r).attr('fill', `url(#${hatchId})`).attr('opacity', 0.75);

  segLabel(x(disponibili / 2), y1 + rowH + 18, `${fmtInt(disponibili)} posti davvero disponibili`, { strong: true, color: 'var(--ink)' });
  segLabel(Math.min(x(disponibili + nonDisponibili / 2), innerW - 4), y1 + rowH + (mobile ? 34 : 18),
    `${fmtInt(nonDisponibili)} non disponibili`, { anchor: mobile ? 'end' : 'middle' });

  /* Row 2: detenuti, excess in burgundy */
  const y2 = y1 + rowH + gapY;
  rowLabel(y2, 'Persone detenute');
  g.append('rect').attr('x', 0).attr('y', y2).attr('width', x(disponibili)).attr('height', rowH)
    .attr('rx', r).style('fill', 'var(--context)').attr('opacity', 0.55);
  g.append('rect')
    .attr('x', x(disponibili) + 2).attr('y', y2)
    .attr('width', Math.max(0, x(detenuti) - x(disponibili) - 2)).attr('height', rowH)
    .attr('rx', r).style('fill', CSS.accent);

  segLabel(x(disponibili / 2), y2 + rowH + 18, `${fmtInt(detenuti)} persone in totale`, { color: 'var(--ink-secondary)' });
  segLabel(Math.min(x(disponibili + (detenuti - disponibili) / 2), innerW - 4), y2 + rowH + (mobile ? 34 : 18),
    `${fmtInt(detenuti - disponibili)} oltre i posti reali`, { strong: true, color: CSS.accent, anchor: mobile ? 'end' : 'middle' });

  // shared reference line where real capacity ends
  g.append('line')
    .attr('x1', x(disponibili) + 1).attr('x2', x(disponibili) + 1)
    .attr('y1', y1 - 4).attr('y2', y2 + rowH + 4)
    .style('stroke', 'var(--ink)').attr('stroke-width', 1).attr('opacity', 0.5);
}
