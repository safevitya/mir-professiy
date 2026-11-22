import { LABEL_THEMES, type LabelChoice } from '../data';
import type { Level } from '../types';
import { LABEL_RULES } from './rules';
import { int, mulberry32, pick, sample, shuffle } from './rng';

export type LabelField = 'name' | 'image' | 'weight' | 'expiry' | 'composition' | 'maker' | 'storage' | 'barcode';

export const LABEL_FIELDS: LabelField[] = ['name', 'image', 'weight', 'expiry', 'composition', 'maker', 'storage', 'barcode'];

export const FIELD_TITLE: Record<LabelField, string> = {
  name: 'Название',
  image: 'Картинка',
  weight: 'Вес',
  expiry: 'Срок годности',
  composition: 'Состав',
  maker: 'Кто сделал',
  storage: 'Хранение',
  barcode: 'Штрихкод',
};

export interface LabelOption {
  id: string;
  text: string;
  shape?: LabelChoice['shape'];
  color?: string;
  accent?: string;
  similar?: boolean;
}

export interface LabelZone {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const LABEL_VIEW = { w: 300, h: 400 };

export const ZONES: Record<LabelField, LabelZone> = {
  name: { x: 24, y: 24, w: 252, h: 56 },
  image: { x: 24, y: 92, w: 120, h: 124 },
  weight: { x: 156, y: 92, w: 120, h: 58 },
  expiry: { x: 156, y: 158, w: 120, h: 58 },
  composition: { x: 24, y: 228, w: 252, h: 52 },
  maker: { x: 24, y: 290, w: 120, h: 48 },
  storage: { x: 156, y: 290, w: 120, h: 48 },
  barcode: { x: 24, y: 348, w: 252, h: 40 },
};

export interface LabelTask {
  kind: 'label';
  id: string;
  seed: number;
  level: Level;
  template: 'rect' | 'jar' | 'bag' | 'box' | 'bottle';
  required: LabelField[];
  options: Record<LabelField, LabelOption[]>;
  correct: Partial<Record<LabelField, string>>;
  zoneMode: 'labeled' | 'highlight' | 'plain';
  intro: string[];
  signature: string;
}

function requiredFields(level: Level, seed: number): LabelField[] {
  if (level === 1) return ['name', 'image', 'weight'];
  if (level === 3) return ['name', 'image', 'weight', 'expiry', 'storage', 'barcode'];
  const extraPool: LabelField[] = ['expiry', 'composition', 'maker', 'storage'];
  const rng = mulberry32(seed ^ 0x51);
  const extra = sample(rng, extraPool, seed % 2 === 0 ? 2 : 1);
  return ['name', 'image', 'weight', ...extra];
}

function toOption(field: LabelField, choice: LabelChoice, index: number): LabelOption {
  return {
    id: `${field}-${index}-${choice.text}`,
    text: choice.text,
    shape: choice.shape,
    color: choice.color,
    accent: choice.accent,
    similar: choice.similar,
  };
}

export function buildLabel(level: Level, seed: number): LabelTask {
  const rng = mulberry32(seed);
  const rules = LABEL_RULES[level];
  const theme = pick(rng, LABEL_THEMES);
  const required = requiredFields(level, seed);
  const optionCount = int(rng, rules.options[0], rules.options[1]);
  const options = {} as Record<LabelField, LabelOption[]>;
  const correct: Partial<Record<LabelField, string>> = {};
  for (const field of LABEL_FIELDS) {
    const pack = theme.fields[field];
    const nearShuffled = shuffle(rng, pack.near);
    const farShuffled = shuffle(rng, pack.far);
    const pool = level === 3 ? [...nearShuffled, ...farShuffled] : [...farShuffled, ...nearShuffled];
    const unique: LabelChoice[] = [];
    const seen = new Set<string>([pack.correct.text]);
    for (const choice of pool) {
      if (seen.has(choice.text)) continue;
      seen.add(choice.text);
      unique.push(choice);
      if (unique.length === optionCount - 1) break;
    }
    const list = [pack.correct, ...unique].map((choice, index) => toOption(field, choice, index));
    options[field] = shuffle(rng, list);
    const right = options[field].find((item) => item.text === pack.correct.text);
    if (!right) throw new Error('Нет верного блока этикетки');
    correct[field] = right.id;
  }
  const template = level === 1 ? 'rect' : level === 2 ? pick(rng, ['jar', 'bag'] as const) : pick(rng, ['box', 'bottle'] as const);
  const zoneMode = level === 1 ? 'labeled' : level === 2 ? 'highlight' : 'plain';
  const intro = ['Собери этикетку.', ...required.map((field) => `${FIELD_TITLE[field]}: ${options[field].find((item) => item.id === correct[field])?.text}.`)];
  return {
    kind: 'label',
    id: `label-${seed}`,
    seed,
    level,
    template,
    required,
    options,
    correct,
    zoneMode,
    intro,
    signature: `${theme.id}:${required.join(',')}:${required.map((field) => correct[field]).join('|')}`,
  };
}

export function checkLabel(
  task: LabelTask,
  placed: Partial<Record<LabelField, string>>,
  covered: LabelField[],
): { ok: boolean; empty: LabelField[]; wrong: LabelField[]; blocked: LabelField[] } {
  const empty: LabelField[] = [];
  const wrong: LabelField[] = [];
  for (const field of task.required) {
    const value = placed[field];
    if (!value) empty.push(field);
    else if (value !== task.correct[field]) wrong.push(field);
  }
  const blocked = covered.filter((field) => task.required.includes(field));
  return { ok: empty.length === 0 && wrong.length === 0 && blocked.length === 0, empty, wrong, blocked };
}
