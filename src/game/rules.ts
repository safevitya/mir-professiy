import type { Level } from '../types';

export const PICKER_RULES: Record<Level, { positions: [number, number]; qty: [number, number]; shelf: [number, number]; cap: number }> = {
  1: { positions: [2, 2], qty: [1, 3], shelf: [6, 8], cap: 6 },
  2: { positions: [3, 5], qty: [1, 5], shelf: [10, 14], cap: 15 },
  3: { positions: [4, 7], qty: [1, 6], shelf: [16, 20], cap: 25 },
};

export const OPERATOR_RULES: Record<Level, { rows: [number, number]; errors: [number, number] }> = {
  1: { rows: [2, 3], errors: [1, 1] },
  2: { rows: [4, 5], errors: [1, 2] },
  3: { rows: [6, 8], errors: [2, 3] },
};

export const LABEL_RULES: Record<Level, { blocks: [number, number]; options: [number, number] }> = {
  1: { blocks: [3, 3], options: [2, 3] },
  2: { blocks: [4, 5], options: [3, 4] },
  3: { blocks: [6, 6], options: [4, 5] },
};

export const GARDEN_RULES: Record<Level, { size: number; plants: [number, number] }> = {
  1: { size: 3, plants: [3, 4] },
  2: { size: 4, plants: [5, 7] },
  3: { size: 5, plants: [8, 10] },
};

export const ASM_RULES: Record<Level, { parts: [number, number] }> = {
  1: { parts: [3, 4] },
  2: { parts: [5, 7] },
  3: { parts: [8, 10] },
};
