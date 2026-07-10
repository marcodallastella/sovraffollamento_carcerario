// Searchable table of all institutes. Doubles as the accessible table view
// for the map, ranking and scatter. Search always spans all institutes.

import { fmtInt, fmtDate } from '../data.js';

const PAGE = 20;

const normalize = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function initSearchTable({ table, search, count, showAll }, institutes) {
  const rows = institutes
    .filter((i) => i.tasso !== null)
    .sort((a, b) => b.tasso - a.tasso);
  const tbody = table.querySelector('tbody');
  let expanded = false;

  function render() {
    const q = normalize(search.value.trim());
    const filtered = q ? rows.filter((r) => normalize(`${r.nome} ${r.tipo || ''}`).includes(q)) : rows;
    const visible = q || expanded ? filtered : filtered.slice(0, PAGE);

    tbody.replaceChildren();
    for (const r of visible) {
      const tr = document.createElement('tr');

      const name = document.createElement('td');
      const strong = document.createElement('div');
      strong.className = 'cell-name';
      strong.textContent = r.nome;
      name.appendChild(strong);
      if (r.tipo) {
        const type = document.createElement('div');
        type.className = 'cell-type';
        type.textContent = r.tipo;
        name.appendChild(type);
      }

      const det = numCell(fmtInt(r.detenuti));
      const posti = numCell(fmtInt(r.disponibili));
      const tasso = numCell(r.tasso === null ? '—' : `${Math.round(r.tasso)}%`);
      if (r.tasso >= 150) tasso.classList.add('hot');

      const agg = document.createElement('td');
      agg.textContent = r.aggiornato ? fmtDate(r.aggiornato) : '—';

      tr.append(name, det, posti, tasso, agg);
      tbody.appendChild(tr);
    }

    count.textContent = q
      ? `${filtered.length} istituti trovati`
      : `${visible.length} di ${rows.length} istituti`;
    showAll.hidden = Boolean(q) || expanded || rows.length <= PAGE;
  }

  search.addEventListener('input', render);
  showAll.addEventListener('click', () => { expanded = true; render(); });
  render();
}

function numCell(text) {
  const td = document.createElement('td');
  td.className = 'num';
  td.textContent = text;
  return td;
}
