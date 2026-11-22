import { PRODUCTS } from '../data';
import type { Level } from '../types';
import { OPERATOR_RULES } from './rules';
import { int, mulberry32, pick, sample, shuffle, type Rng } from './rng';
import { norm } from './text';

export type OpField = 'product' | 'qty' | 'unit' | 'date' | 'price';

export interface OpLine {
  id: string;
  product: string;
  qty: number;
  unit: string;
  date?: string;
  price?: number;
}

export interface ColleagueRow {
  id: string;
  fromLineId: string | null;
  cells: Partial<Record<OpField, string>>;
}

export type OpMark =
  | { type: 'cell'; rowId: string; field: OpField }
  | { type: 'extra'; rowId: string }
  | { type: 'missing'; lineId: string };

export interface OperatorTask {
  kind: 'operator';
  id: string;
  seed: number;
  level: Level;
  fields: OpField[];
  lines: OpLine[];
  colleague: ColleagueRow[];
  errors: OpMark[];
  productChoices: string[];
  unitChoices: string[];
  intro: string[];
  signature: string;
}

const UNITS = ['шт', 'уп', 'кг', 'л'];

export function lineValue(line: OpLine, field: OpField): string {
  if (field === 'product') return line.product;
  if (field === 'qty') return String(line.qty);
  if (field === 'unit') return line.unit;
  if (field === 'date') return line.date ?? '';
  return line.price != null ? String(line.price) : '';
}

export function markKey(mark: OpMark): string {
  if (mark.type === 'cell') return `cell:${mark.rowId}:${mark.field}`;
  if (mark.type === 'extra') return `extra:${mark.rowId}`;
  return `missing:${mark.lineId}`;
}

export function deriveErrors(lines: OpLine[], fields: OpField[], colleague: ColleagueRow[]): OpMark[] {
  const marks: OpMark[] = [];
  const byLine = new Map(colleague.filter((row) => row.fromLineId).map((row) => [row.fromLineId as string, row]));
  for (const line of lines) {
    const row = byLine.get(line.id);
    if (!row) {
      marks.push({ type: 'missing', lineId: line.id });
      continue;
    }
    for (const field of fields) {
      if (norm(row.cells[field] ?? '') !== norm(lineValue(line, field))) {
        marks.push({ type: 'cell', rowId: row.id, field });
      }
    }
  }
  for (const row of colleague) {
    if (!row.fromLineId) marks.push({ type: 'extra', rowId: row.id });
  }
  return marks;
}

function dateOf(rng: Rng): string {
  return `${String(int(rng, 1, 28)).padStart(2, '0')}.${String(int(rng, 1, 12)).padStart(2, '0')}`;
}

function fieldsFor(level: Level, rng: Rng): OpField[] {
  if (level === 1) return ['product', 'qty'];
  if (level === 2) return ['product', 'qty', 'unit'];
  return ['product', 'qty', 'unit', rng() < 0.5 ? 'date' : 'price'];
}

function allowedKinds(level: Level): Array<'qty' | 'product' | 'unit' | 'missing' | 'extra'> {
  if (level === 1) return ['qty'];
  if (level === 2) return ['qty', 'product'];
  return ['qty', 'product', 'unit', 'missing', 'extra'];
}

function cloneRows(lines: OpLine[], fields: OpField[]): ColleagueRow[] {
  return lines.map((line) => ({
    id: `row-${line.id}`,
    fromLineId: line.id,
    cells: Object.fromEntries(fields.map((field) => [field, lineValue(line, field)])),
  }));
}

function mutate(level: Level, lines: OpLine[], fields: OpField[], names: string[], rng: Rng): ColleagueRow[] {
  const rules = OPERATOR_RULES[level];
  const count = int(rng, rules.errors[0], rules.errors[1]);
  const rows = cloneRows(lines, fields);
  const used = new Set<string>();
  const kinds = shuffle(rng, allowedKinds(level));
  let made = 0;
  let guard = 0;
  while (made < count && guard < 30) {
    guard += 1;
    const kind = kinds[made % kinds.length];
    if (kind === 'extra') {
      if (rows.some((row) => !row.fromLineId)) continue;
      const product = pick(rng, names.filter((name) => !lines.some((line) => line.product === name)));
      const extra: ColleagueRow = {
        id: `extra-${made}`,
        fromLineId: null,
        cells: {
          product,
          qty: String(int(rng, 1, 6)),
          unit: pick(rng, UNITS),
          date: dateOf(rng),
          price: String(int(rng, 2, 16) * 5),
        },
      };
      const at = int(rng, 0, rows.length);
      rows.splice(at, 0, extra);
      made += 1;
      continue;
    }
    const pool = rows.filter((row) => row.fromLineId && !used.has(row.id));
    if (!pool.length) break;
    const row = pick(rng, pool);
    if (kind === 'missing') {
      if (level < 3) continue;
      used.add(row.id);
      const index = rows.findIndex((item) => item.id === row.id);
      rows.splice(index, 1);
      made += 1;
      continue;
    }
    if (kind === 'qty') {
      const current = Number(row.cells.qty);
      let next = current;
      while (next === current) next = int(rng, 1, 8);
      row.cells.qty = String(next);
      used.add(row.id);
      made += 1;
      continue;
    }
    if (kind === 'product') {
      const options = names.filter((name) => name !== row.cells.product && !lines.some((line) => line.product === name));
      if (!options.length) continue;
      row.cells.product = pick(rng, options);
      used.add(row.id);
      made += 1;
      continue;
    }
    if (kind === 'unit' && fields.includes('unit')) {
      const options = UNITS.filter((unit) => unit !== row.cells.unit);
      row.cells.unit = pick(rng, options);
      used.add(row.id);
      made += 1;
    }
  }
  return rows;
}

function errorsFit(level: Level, errors: OpMark[]): boolean {
  const rules = OPERATOR_RULES[level];
  if (errors.length < rules.errors[0] || errors.length > rules.errors[1]) return false;
  if (level === 1) return errors.every((mark) => mark.type === 'cell' && mark.field === 'qty');
  if (level === 2) {
    return errors.every((mark) => mark.type === 'cell' && (mark.field === 'qty' || mark.field === 'product'));
  }
  return errors.every((mark) => mark.type === 'missing' || mark.type === 'extra' || (mark.type === 'cell' && ['qty', 'product', 'unit'].includes(mark.field)));
}

export function buildOperator(level: Level, seed: number): OperatorTask {
  let task: OperatorTask | null = null;
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const rng = mulberry32((seed + attempt * 17) >>> 0);
    const rules = OPERATOR_RULES[level];
    const rowCount = int(rng, rules.rows[0], rules.rows[1]);
    const names = PRODUCTS.map((item) => item.name);
    const chosen = sample(rng, names, rowCount);
    const fields = fieldsFor(level, rng);
    const lines: OpLine[] = chosen.map((product, index) => ({
      id: `l${index}`,
      product,
      qty: int(rng, 1, 6),
      unit: UNITS[index % UNITS.length],
      date: fields.includes('date') ? dateOf(rng) : undefined,
      price: fields.includes('price') ? int(rng, 2, 16) * 5 : undefined,
    }));
    const colleague = mutate(level, lines, fields, names, rng);
    const errors = deriveErrors(lines, fields, colleague);
    if (!errorsFit(level, errors)) continue;
    const productChoices = shuffle(rng, [...chosen, ...sample(rng, names.filter((name) => !chosen.includes(name)), 2)]);
    const usedUnits = [...new Set(lines.map((line) => line.unit))];
    const unitChoices = shuffle(rng, [...usedUnits, ...UNITS.filter((unit) => !usedUnits.includes(unit)).slice(0, 1)]);
    const intro = [
      'Перенеси данные в таблицу.',
      ...lines.map((line) => {
        const bits = fields.map((field) => lineValue(line, field));
        return `${bits.join(', ')}.`;
      }),
    ];
    task = {
      kind: 'operator',
      id: `operator-${seed}-${attempt}`,
      seed,
      level,
      fields,
      lines,
      colleague,
      errors,
      productChoices,
      unitChoices,
      intro,
      signature: `${lines.map((line) => fields.map((field) => lineValue(line, field)).join(',')).join(';')}|${errors.map(markKey).sort().join(',')}`,
    };
    break;
  }
  if (!task) throw new Error('Не удалось собрать задание оператора');
  return task;
}

export interface FillCell {
  [field: string]: string;
}

export function checkFill(task: OperatorTask, rows: Record<string, Partial<Record<OpField, string>>>): { ok: boolean; bad: { lineId: string; field: OpField }[] } {
  const bad: { lineId: string; field: OpField }[] = [];
  for (const line of task.lines) {
    const got = rows[line.id] ?? {};
    for (const field of task.fields) {
      if (norm(got[field] ?? '') !== norm(lineValue(line, field))) bad.push({ lineId: line.id, field });
    }
  }
  return { ok: bad.length === 0, bad };
}

export function checkMarks(task: OperatorTask, marks: OpMark[]): { ok: boolean; missed: number; extra: number } {
  const unique = [...new Set(marks.map(markKey))];
  const expected = task.errors.map(markKey);
  const missed = expected.filter((key) => !unique.includes(key)).length;
  const extra = unique.filter((key) => !expected.includes(key)).length;
  return { ok: missed === 0 && extra === 0 && unique.length === expected.length, missed, extra };
}
