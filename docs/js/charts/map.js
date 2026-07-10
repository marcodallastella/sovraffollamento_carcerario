// Italy map: one dot per institute, colored by overcrowding bin (diverging
// around 100%: slate below, burgundy lightness ramp above).

import { fmtInt, fmtPct } from '../data.js';
import { CSS, makeTooltip, mountWidth } from './util.js';

const BINS = [
  { test: (t) => t < 100, color: 'var(--slate)', label: 'Sotto il 100%' },
  { test: (t) => t < 120, color: 'var(--ramp-1)', label: '100–120%' },
  { test: (t) => t < 150, color: 'var(--ramp-2)', label: '120–150%' },
  { test: () => true, color: 'var(--ramp-3)', label: '150% e oltre' },
];

const binOf = (t) => BINS.find((b) => b.test(t));

export async function renderMap(mount, legendEl, institutes) {
  const topo = await fetch('data/italy-regions.topo.json').then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });
  const objName = Object.keys(topo.objects)[0];
  const regions = topojson.feature(topo, topo.objects[objName]);

  mount.replaceChildren();
  const w = Math.min(760, mountWidth(mount));
  const height = w * 1.12;
  const svg = d3.select(mount).append('svg')
    .attr('viewBox', `0 0 ${w} ${height}`)
    .attr('role', 'img');

  const projection = d3.geoConicConformal()
    .rotate([-12.5, 0])
    .fitExtent([[10, 10], [w - 10, height - 10]], regions);
  const path = d3.geoPath(projection);

  svg.append('g').selectAll('path')
    .data(regions.features)
    .join('path')
    .attr('d', path)
    .style('fill', 'var(--grid)')
    .style('stroke', 'var(--surface-raised)')
    .attr('stroke-width', 0.8);

  const pts = institutes.filter((i) => i.lat !== null && i.lon !== null && i.tasso !== null);
  svg.attr('aria-label',
    `Mappa degli istituti penitenziari italiani: ${pts.length} istituti, colorati per indice di sovraffollamento; l'area di ogni punto è proporzionale alle persone detenute. I valori per istituto sono nella tabella successiva.`);

  // Dot area ∝ detainees; big prisons render first so small ones stay hoverable.
  const rScale = d3.scaleSqrt()
    .domain([0, d3.max(pts, (d) => d.detenuti) || 1])
    .range([0, w < 560 ? 10 : 13]);
  const rOf = (d) => Math.max(2, rScale(d.detenuti || 0));
  pts.sort((a, b) => (b.detenuti || 0) - (a.detenuti || 0));

  const dots = svg.append('g').selectAll('circle')
    .data(pts)
    .join('circle')
    .attr('cx', (d) => projection([d.lon, d.lat])[0])
    .attr('cy', (d) => projection([d.lon, d.lat])[1])
    .attr('r', rOf)
    .style('fill', (d) => binOf(d.tasso).color)
    .attr('fill-opacity', 0.9)
    .style('stroke', CSS.surface)
    .attr('stroke-width', 1.25);

  // Legend (color bins + size note)
  legendEl.replaceChildren();
  for (const b of BINS) {
    const key = document.createElement('span');
    key.className = 'key';
    const sw = document.createElement('span');
    sw.className = 'swatch-dot';
    sw.style.background = b.color;
    const txt = document.createElement('span');
    txt.textContent = b.label;
    key.append(sw, txt);
    legendEl.appendChild(key);
  }
  const sizeNote = document.createElement('span');
  sizeNote.className = 'key';
  sizeNote.textContent = 'Dimensione del punto = persone detenute';
  legendEl.appendChild(sizeNote);

  // Nearest-point hover (a dot is a pinpoint — use a Delaunay lookup instead)
  const tooltip = makeTooltip(mount);
  const delaunay = d3.Delaunay.from(
    pts,
    (d) => projection([d.lon, d.lat])[0],
    (d) => projection([d.lon, d.lat])[1],
  );

  let hi = null;
  svg.on('pointermove', (ev) => {
    const [mx, my] = d3.pointer(ev);
    const i = delaunay.find(mx, my);
    const d = pts[i];
    const [px, py] = projection([d.lon, d.lat]);
    if (Math.hypot(px - mx, py - my) > Math.max(26, rOf(d) + 10)) { clear(); return; }
    if (hi !== null && hi !== i) clear();
    hi = i;
    dots.filter((_, j) => j === i).attr('r', rOf(d) + 1.5).attr('stroke-width', 2);
    const k = svg.node().getBoundingClientRect().width / w;
    tooltip.show(px * k, py * k, d.nome, [
      { label: 'Indice reale', color: binOf(d.tasso).color, value: fmtPct(d.tasso) },
      { label: 'Detenuti', color: 'transparent', value: fmtInt(d.detenuti) },
      { label: 'Posti effettivi', color: 'transparent', value: fmtInt(d.disponibili) },
    ]);
  }).on('pointerleave', clear);

  function clear() {
    tooltip.hide();
    dots.attr('r', rOf).attr('stroke-width', 1.25);
    hi = null;
  }
}
