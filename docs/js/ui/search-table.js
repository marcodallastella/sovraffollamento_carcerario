// Searchable table of all institutes. Doubles as the accessible table view
// for the map, ranking and scatter. Search always spans all institutes.

import { fmtInt, fmtDate } from '../data.js';

const PAGE_SIZE = 10;

const normalize = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function initSearchTable({ table, search, count, previous, next, page }, institutes) {
  const rows = institutes.filter((i) => i.tasso !== null);
  const tbody = table.querySelector('tbody');
  let pageIndex = 0;
  let sort = { key: 'tasso', direction: -1 };

  const headers = [...table.querySelectorAll('button[data-sort]')].map((button) => button.closest('th'));
  table.querySelectorAll('button[data-sort]').forEach((button) => {
    button.addEventListener('click', () => {
      const key = button.dataset.sort;
      sort = { key, direction: sort.key === key ? -sort.direction : key === 'nome' ? 1 : -1 };
      pageIndex = 0;
      render();
    });
  });

  function render() {
    const q = normalize(search.value.trim());
    const filtered = rows
      .filter((r) => !q || normalize(`${r.nome} ${r.tipo || ''}`).includes(q))
      .sort(compareRows);
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    pageIndex = Math.min(pageIndex, totalPages - 1);
    const first = pageIndex * PAGE_SIZE;
    const visible = filtered.slice(first, first + PAGE_SIZE);

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
      if (r.fonte) {
        const source = document.createElement('a');
        source.className = 'official-link';
        source.href = r.fonte;
        source.target = '_blank';
        source.rel = 'noopener';
        source.textContent = 'Verifica sul sito del Ministero ↗';
        name.appendChild(source);
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

    count.textContent = filtered.length
      ? `${first + 1}–${first + visible.length} di ${filtered.length} istituti${q ? ' trovati' : ''}`
      : 'Nessun istituto trovato';
    page.textContent = `Pagina ${pageIndex + 1} di ${totalPages}`;
    previous.disabled = pageIndex === 0;
    next.disabled = pageIndex >= totalPages - 1;
    headers.forEach((header) => {
      const button = header.querySelector('button[data-sort]');
      header.setAttribute('aria-sort', button?.dataset.sort === sort.key ? (sort.direction === 1 ? 'ascending' : 'descending') : 'none');
    });
  }

  search.addEventListener('input', () => { pageIndex = 0; render(); });
  previous.addEventListener('click', () => { if (pageIndex > 0) { pageIndex--; render(); } });
  next.addEventListener('click', () => { pageIndex++; render(); });
  render();

  function compareRows(a, b) {
    const av = a[sort.key];
    const bv = b[sort.key];
    if (sort.key === 'nome') return sort.direction * String(av || '').localeCompare(String(bv || ''), 'it');
    if (av === null || av === undefined || av === '') return 1;
    if (bv === null || bv === undefined || bv === '') return -1;
    return sort.direction * (typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv), 'it'));
  }
}

function numCell(text) {
  const td = document.createElement('td');
  td.className = 'num';
  td.textContent = text;
  return td;
}
