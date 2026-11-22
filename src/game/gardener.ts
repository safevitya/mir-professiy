import { PLANTS } from '../data';
import type { Level, Plant } from '../types';
import { GARDEN_RULES } from './rules';
import { int, mulberry32, pick, shuffle } from './rng';

export type Care = 'water' | 'weed' | 'prune';

export interface GardenerTask {
  kind: 'gardener';
  id: string;
  seed: number;
  level: Level;
  size: number;
  scheme: (string | null)[][];
  sun: boolean[][];
  wet: boolean[][];
  care: (Care | null)[][];
  careTypes: Care[];
  checkWet: boolean;
  icons: 'always' | 'request';
  splitAt: number | null;
  intro: string[];
  signature: string;
}

function grid<T>(size: number, fill: T): T[][] {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => fill));
}

function fits(plant: Plant, sun: boolean, wet: boolean, checkWet: boolean): boolean {
  if (plant.sun !== sun) return false;
  if (checkWet && plant.wet !== wet) return false;
  return true;
}

function conditionText(sun: boolean, wet: boolean, checkWet: boolean): string {
  const light = sun ? 'солнце' : 'тень';
  if (!checkWet) return light;
  return `${light}, ${wet ? 'влажная почва' : 'сухая почва'}`;
}

export function buildGarden(level: Level, seed: number): GardenerTask {
  const rng = mulberry32(seed);
  const rules = GARDEN_RULES[level];
  const size = rules.size;
  const plantCount = int(rng, rules.plants[0], rules.plants[1]);
  const checkWet = level > 1;
  const careTypes: Care[] = level === 1 ? ['water'] : level === 2 ? ['water', 'weed'] : ['water', 'weed', 'prune'];
  const sun = grid(size, true);
  const wet = grid(size, true);
  const splitAt = level === 3 ? Math.ceil(size / 2) : null;
  const leftSun = rng() < 0.5;
  const leftWet = rng() < 0.5;
  let rightSun = rng() < 0.5;
  let rightWet = rng() < 0.5;
  if (splitAt != null && rightSun === leftSun && rightWet === leftWet) rightSun = !leftSun;
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      const right = splitAt != null && c >= splitAt;
      sun[r][c] = right ? rightSun : leftSun;
      wet[r][c] = checkWet ? (right ? rightWet : leftWet) : true;
    }
  }
  const cells = shuffle(rng, Array.from({ length: size * size }, (_, index) => [Math.floor(index / size), index % size] as const)).slice(0, plantCount);
  const scheme = grid<string | null>(size, null);
  const care = grid<Care | null>(size, null);
  for (const [r, c] of cells) {
    const pool = PLANTS.filter((plant) => fits(plant, sun[r][c], wet[r][c], checkWet));
    scheme[r][c] = pick(rng, pool).id;
    care[r][c] = pick(rng, careTypes);
  }
  const intro = ['Посади растения по схеме.'];
  if (splitAt == null) intro.push(`Участок: ${conditionText(leftSun, leftWet, checkWet)}.`);
  else {
    intro.push(`Слева: ${conditionText(leftSun, leftWet, true)}.`);
    intro.push(`Справа: ${conditionText(rightSun, rightWet, true)}.`);
  }
  const signature = scheme.map((row) => row.map((cell) => cell ?? '-').join(',')).join('/');
  return {
    kind: 'gardener',
    id: `garden-${seed}`,
    seed,
    level,
    size,
    scheme,
    sun,
    wet,
    care,
    careTypes,
    checkWet,
    icons: level === 3 ? 'request' : 'always',
    splitAt,
    intro,
    signature,
  };
}

export function plantFits(task: GardenerTask, plant: Plant, row: number, col: number): boolean {
  return fits(plant, task.sun[row][col], task.wet[row][col], task.checkWet);
}

export function checkGarden(
  task: GardenerTask,
  gridState: (string | null)[][],
  cared: boolean[][],
): { ok: boolean; bad: { r: number; c: number; reason: 'plant' | 'care' }[]; careLeft: boolean } {
  const bad: { r: number; c: number; reason: 'plant' | 'care' }[] = [];
  let careLeft = false;
  for (let r = 0; r < task.size; r += 1) {
    for (let c = 0; c < task.size; c += 1) {
      if (gridState[r][c] !== task.scheme[r][c]) bad.push({ r, c, reason: 'plant' });
      else if (task.care[r][c] && !cared[r][c]) {
        bad.push({ r, c, reason: 'care' });
        careLeft = true;
      }
    }
  }
  if (bad.some((item) => item.reason === 'plant')) careLeft = false;
  return { ok: bad.length === 0, bad, careLeft };
}
