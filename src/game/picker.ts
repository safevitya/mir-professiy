import { PRODUCTS, productById } from '../data';
import type { Level, Product } from '../types';
import { PICKER_RULES } from './rules';
import { int, mulberry32, pick, sample, shuffle, type Rng } from './rng';
import { capitalize, qtyPhrase } from './text';

export interface PickerLine {
  productId: string;
  qty: number;
}

export interface PickerTask {
  kind: 'picker';
  id: string;
  seed: number;
  level: Level;
  lines: PickerLine[];
  shelf: string[];
  pictures: 'always' | 'optional';
  words: boolean;
  intro: string[];
  signature: string;
}

export type PickerStatus = 'ok' | 'miss' | 'extra';

export interface PickerDetail {
  productId: string;
  status: PickerStatus;
}

function hasFreeSibling(products: Product[]): Product | null {
  const ids = new Set(products.map((item) => item.id));
  return PRODUCTS.find((item) => !ids.has(item.id) && products.some((chosen) => chosen.group === item.group)) ?? null;
}

function withSimilar(products: Product[], rng: Rng): { products: Product[]; similar: Product | null } {
  const ready = hasFreeSibling(products);
  if (ready) return { products, similar: ready };
  const removable = products.find((item) => PRODUCTS.filter((other) => other.group === item.group).length >= 2);
  if (!removable) return { products, similar: null };
  const ids = new Set(products.map((item) => item.id));
  const replacement = PRODUCTS.find((item) => !ids.has(item.id) && item.group !== removable.group);
  if (!replacement) return { products, similar: null };
  const next = products.map((item) => (item.id === removable.id ? replacement : item));
  return { products: next, similar: removable };
}

export function buildPicker(level: Level, seed: number): PickerTask {
  const rng = mulberry32(seed);
  const rules = PICKER_RULES[level];
  const count = int(rng, rules.positions[0], rules.positions[1]);
  let products = sample(rng, PRODUCTS, count);
  const wantSimilar = level === 3 || (level === 2 && seed % 3 === 0);
  let similar: Product | null = null;
  if (wantSimilar) {
    const fixed = withSimilar(products, rng);
    products = fixed.products;
    similar = fixed.similar;
  }

  let budget = rules.cap;
  const lines: PickerLine[] = products.map((product, index) => {
    const slotsAfter = count - index - 1;
    const max = Math.min(rules.qty[1], budget - slotsAfter);
    const qty = int(rng, 1, Math.max(1, max));
    budget -= qty;
    return { productId: product.id, qty };
  });

  const orderIds = new Set(lines.map((line) => line.productId));
  const groups = new Set(products.map((item) => item.group));
  const target = int(rng, rules.shelf[0], rules.shelf[1]);
  const shelf = [...orderIds];
  if (similar && !shelf.includes(similar.id)) shelf.push(similar.id);

  const otherPool = PRODUCTS.filter((item) => !orderIds.has(item.id) && !groups.has(item.group));
  const anyPool = PRODUCTS.filter((item) => !shelf.includes(item.id));
  const source = level === 1 || (level === 2 && !wantSimilar) ? otherPool : anyPool;
  for (const item of shuffle(rng, source)) {
    if (shelf.length >= target) break;
    if (!shelf.includes(item.id)) shelf.push(item.id);
  }
  for (const item of shuffle(rng, PRODUCTS)) {
    if (shelf.length >= target) break;
    if (!shelf.includes(item.id)) shelf.push(item.id);
  }

  const intro = [
    'Собери заказ.',
    ...lines.map((line) => {
      const product = productById(line.productId);
      return `${capitalize(qtyPhrase(line.qty, product.gender, product.forms))}.`;
    }),
  ];
  const signature = lines
    .map((line) => `${line.productId}*${line.qty}`)
    .sort()
    .join('|');

  return {
    kind: 'picker',
    id: `picker-${seed}`,
    seed,
    level,
    lines,
    shelf: shuffle(rng, shelf),
    pictures: level === 3 ? 'optional' : 'always',
    words: level >= 2,
    intro,
    signature,
  };
}

export function checkPicker(task: PickerTask, basket: Record<string, number>): { ok: boolean; details: PickerDetail[] } {
  const details: PickerDetail[] = [];
  let ok = true;
  for (const line of task.lines) {
    const have = basket[line.productId] ?? 0;
    const status: PickerStatus = have === line.qty ? 'ok' : have < line.qty ? 'miss' : 'extra';
    if (status !== 'ok') ok = false;
    details.push({ productId: line.productId, status });
  }
  for (const [productId, qty] of Object.entries(basket)) {
    if (qty > 0 && !task.lines.some((line) => line.productId === productId)) {
      ok = false;
      details.push({ productId, status: 'extra' });
    }
  }
  return { ok, details };
}

export function pickerSimilarIds(task: PickerTask): string[] {
  const lines = task.lines.map((line) => productById(line.productId));
  return task.shelf.filter((id) => {
    if (task.lines.some((line) => line.productId === id)) return false;
    const item = productById(id);
    return lines.some((line) => line.group === item.group);
  });
}
