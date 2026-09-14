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

export async function renderMap(mount, legendEl, institutes, controls = {}) {
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

  const mapLayer = svg.append('g');
  mapLayer.append('g').selectAll('path')
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
  const laidOut = layoutCoincidentPoints(pts, projection, rOf)
    .sort((a, b) => (b.detenuti || 0) - (a.detenuti || 0));

  // A handful of institutions share exactly the same Ministry coordinates.
  // Fan these points out around their common location, with a connector to
  // preserve the geographic meaning while keeping every institution usable.
  mapLayer.append('g').attr('class', 'coincident-connectors').selectAll('line')
    .data(laidOut.filter((d) => d.coincidentCount > 1))
    .join('line')
    .attr('x1', (d) => d.originX).attr('y1', (d) => d.originY)
    .attr('x2', (d) => d.mapX).attr('y2', (d) => d.mapY)
    .style('stroke', 'var(--ink-muted)').attr('stroke-width', 0.8).attr('opacity', 0.75);

  const dots = mapLayer.append('g').selectAll('circle')
    .data(laidOut)
    .join('circle')
    .attr('cx', (d) => d.mapX)
    .attr('cy', (d) => d.mapY)
    .attr('r', rOf)
    .style('fill', (d) => binOf(d.tasso).color)
    .attr('fill-opacity', 0.9)
    .style('stroke', CSS.surface)
    .attr('stroke-width', 1.25)
    .attr('tabindex', 0)
    .attr('aria-label', (d) => `${d.nome}: indice reale ${fmtPct(d.tasso)}, ${fmtInt(d.detenuti)} detenuti.`);

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
  if (laidOut.some((d) => d.coincidentCount > 1)) {
    const overlapNote = document.createElement('span');
    overlapNote.className = 'key';
    overlapNote.textContent = 'Punti collegati = istituti con la stessa coordinata';
    legendEl.appendChild(overlapNote);
  }

  // Nearest-point hover also works for fanned-out coincident locations.
  const tooltip = makeTooltip(mount);
  const delaunay = d3.Delaunay.from(
    laidOut,
    (d) => d.mapX,
    (d) => d.mapY,
  );

  let hi = null;
  const zoom = d3.zoom()
    .scaleExtent([1, 8])
    .extent([[0, 0], [w, height]])
    .translateExtent([[0, 0], [w, height]])
    // Buttons and pinch gestures always work; requiring Ctrl for a mouse
    // wheel preserves ordinary page scrolling.
    .filter((event) => event.type !== 'wheel' || event.ctrlKey)
    .on('zoom', (event) => {
      mapLayer.attr('transform', event.transform);
      clear();
    });
  svg.call(zoom);
  controls.zoomIn?.addEventListener('click', () => svg.transition().duration(180).call(zoom.scaleBy, 1.6));
  controls.zoomOut?.addEventListener('click', () => svg.transition().duration(180).call(zoom.scaleBy, 1 / 1.6));
  controls.reset?.addEventListener('click', () => svg.transition().duration(180).call(zoom.transform, d3.zoomIdentity));

  svg.on('pointermove', (ev) => {
    const [screenX, screenY] = d3.pointer(ev);
    const [mx, my] = d3.zoomTransform(svg.node()).invert([screenX, screenY]);
    const i = delaunay.find(mx, my);
    const d = laidOut[i];
    if (Math.hypot(d.mapX - mx, d.mapY - my) > Math.max(26, rOf(d) + 10)) { clear(); return; }
    show(d, i);
  }).on('pointerleave', clear);

  dots.on('focus', (_, d) => show(d, laidOut.indexOf(d))).on('blur', clear);

  function show(d, i) {
    if (hi !== null && hi !== i) clear();
    hi = i;
    dots.filter((_, j) => j === i).attr('r', rOf(d) + 1.5).attr('stroke-width', 2);
    const k = svg.node().getBoundingClientRect().width / w;
    const [px, py] = d3.zoomTransform(svg.node()).apply([d.mapX, d.mapY]);
    const rows = [
      { label: 'Indice reale', color: binOf(d.tasso).color, value: fmtPct(d.tasso) },
      { label: 'Detenuti', color: 'transparent', value: fmtInt(d.detenuti) },
      { label: 'Posti effettivi', color: 'transparent', value: fmtInt(d.disponibili) },
    ];
    if (d.coincidentCount > 1) rows.push({ label: 'Stessa coordinata', color: 'transparent', value: `${d.coincidentCount} istituti` });
    tooltip.show(px * k, py * k, d.nome, rows);
  }

  function clear() {
    tooltip.hide();
    dots.attr('r', rOf).attr('stroke-width', 1.25);
    hi = null;
  }
}

function layoutCoincidentPoints(points, projection, rOf) {
  const groups = d3.group(points, (d) => `${d.lat},${d.lon}`);
  return Array.from(groups.values()).flatMap((group) => {
    const [originX, originY] = projection([group[0].lon, group[0].lat]);
    if (group.length === 1) return [{ ...group[0], originX, originY, mapX: originX, mapY: originY, coincidentCount: 1 }];
    const ordered = [...group].sort((a, b) => a.nome.localeCompare(b.nome, 'it'));
    const largestDot = d3.max(ordered, rOf) || 2;
    // Adjacent circles need at least one diameter of space. This formula
    // keeps all dots distinct even for the four-institution Rebibbia group.
    const spread = largestDot / Math.sin(Math.PI / ordered.length) + 6;
    return ordered.map((d, i) => {
      const angle = -Math.PI / 2 + (2 * Math.PI * i) / ordered.length;
      return {
        ...d,
        originX, originY,
        mapX: originX + Math.cos(angle) * spread,
        mapY: originY + Math.sin(angle) * spread,
        coincidentCount: ordered.length,
      };
    });
  });
}
