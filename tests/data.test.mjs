import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import {
  parseCSV, toRecords, toNum, fmtInt, fmtPct, fmtSigned, fmtDate, parseISO,
  buildHeroSeries, latestPoint, deltaOneYear, recordHigh, latestTotals,
  parseInstitutes, criticalFacts,
} from '../docs/js/data.js';

const local = (p) => fileURLToPath(new URL(p, import.meta.url));

test('parseCSV: plain rows', () => {
  assert.deepEqual(parseCSV('a,b\n1,2\n'), [['a', 'b'], ['1', '2']]);
});

test('parseCSV: quoted field with commas and escaped quotes', () => {
  const rows = parseCSV('name,link\nAlba,"<a href=""x"">Vai, qui</a>"\n');
  assert.deepEqual(rows[1], ['Alba', '<a href="x">Vai, qui</a>']);
});

test('parseCSV: strips BOM, handles CRLF and missing trailing newline', () => {
  const rows = parseCSV('﻿a,b\r\n1,2');
  assert.deepEqual(rows, [['a', 'b'], ['1', '2']]);
});

test('toRecords keys by trimmed header', () => {
  const recs = toRecords(parseCSV('Date , v\n2024-10-05,1.5\n'));
  assert.equal(recs[0]['Date'], '2024-10-05');
  assert.equal(toNum(recs[0]['v']), 1.5);
});

test('toNum: dot and comma decimals, blanks', () => {
  assert.equal(toNum('132.1883'), 132.1883);
  assert.equal(toNum('132,1883'), 132.1883);
  assert.equal(toNum(''), null);
  assert.equal(toNum('n/a'), null);
});

test('formatters: it-IT output', () => {
  assert.equal(fmtInt(63925), '63.925');
  assert.equal(fmtInt(4929), '4.929');
  assert.equal(fmtPct(137.9388), '137,9%');
  assert.equal(fmtSigned(4.25), '+4,3');
  assert.equal(fmtSigned(-1.2), '−1,2');
  assert.equal(fmtDate('2026-03-21'), '21 marzo 2026');
  assert.equal(fmtInt(null), '—');
});

test('deltaOneYear: picks the point nearest 365 days back', () => {
  const mk = (iso, v) => ({ date: parseISO(iso), value: v });
  const series = [mk('2025-03-20', 133.0), mk('2025-07-08', 134.0), mk('2026-03-21', 137.9)];
  assert.ok(Math.abs(deltaOneYear(series) - 4.9) < 1e-9);
});

test('deltaOneYear: null on short series', () => {
  const mk = (iso, v) => ({ date: parseISO(iso), value: v });
  assert.equal(deltaOneYear([mk('2026-01-01', 1), mk('2026-03-01', 2)]), null);
});

test('recordHigh: latest of ties wins', () => {
  const mk = (iso, v) => ({ date: parseISO(iso), value: v });
  const rh = recordHigh([mk('2026-01-01', 5), mk('2026-02-01', 7), mk('2026-03-01', 7)]);
  assert.equal(rh.date.toISOString().slice(0, 10), '2026-03-01');
});

test('real CSVs: hero series, totals, institutes', async () => {
  const [tasso, totals, inst] = await Promise.all([
    readFile(local('../outputs/viz/tasso_affollamento.csv'), 'utf8'),
    readFile(local('../outputs/viz/institutes_totals.csv'), 'utf8'),
    readFile(local('../outputs/viz/institutes_most_recent.csv'), 'utf8'),
  ]);

  const hero = buildHeroSeries(toRecords(parseCSV(tasso)));
  assert.ok(hero.real.length > 300, 'daily real series present');
  assert.equal(hero.real[0].date.toISOString().slice(0, 10), '2024-10-05', 'starts with the daily monitoring');
  assert.ok(latestPoint(hero.real).value > 100);
  assert.ok(recordHigh(hero.real).value >= latestPoint(hero.real).value);
  assert.ok(deltaOneYear(hero.real) !== null, 'one-year delta available');

  const t = latestTotals(toRecords(parseCSV(totals)));
  assert.equal(t.date, '2026-03-21');
  assert.equal(t.detenuti, 63925);
  assert.equal(t.regolamentari - t.nonDisponibili, t.disponibili);

  const institutes = parseInstitutes(toRecords(parseCSV(inst)));
  assert.ok(institutes.length > 180, `expected ~190 institutes, got ${institutes.length}`);
  assert.ok(institutes.every((i) => i.lat === null || (i.lat > 35 && i.lat < 48)), 'latitudes in Italy');
  const genova = institutes.find((i) => i.nome === 'Genova Marassi');
  assert.equal(genova.tasso, 127.0);
  assert.ok(genova.carenzaPolizia > 0);

  const { over150, worst } = criticalFacts(institutes);
  assert.ok(over150 > 0 && worst.tasso >= 150);

});
