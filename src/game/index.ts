import type { Level, ProfessionId } from '../types';
import { buildAssembler, type AssemblerTask } from './assembler';
import { buildGarden, type GardenerTask } from './gardener';
import { buildLabel, type LabelTask } from './label';
import { buildOperator, type OperatorTask } from './operator';
import { buildPicker, type PickerTask } from './picker';
import { mulberry32, pick } from './rng';

export type AnyTask = PickerTask | OperatorTask | LabelTask | GardenerTask | AssemblerTask;

export interface GenerateOptions {
  seed: number;
  avoid?: string;
  lockSeed?: boolean;
  category?: AssemblerTask['category'];
}

function build(kind: ProfessionId, level: Level, seed: number, category?: AssemblerTask['category']): AnyTask {
  if (kind === 'picker') return buildPicker(level, seed);
  if (kind === 'operator') return buildOperator(level, seed);
  if (kind === 'label') return buildLabel(level, seed);
  if (kind === 'gardener') return buildGarden(level, seed);
  return buildAssembler(level, seed, category);
}

export function generateTask(kind: ProfessionId, level: Level, options: GenerateOptions): AnyTask {
  if (options.lockSeed) return build(kind, level, options.seed, options.category);
  let seed = options.seed >>> 0;
  for (let i = 0; i < 12; i += 1) {
    const task = build(kind, level, seed, options.category);
    if (!options.avoid || task.signature !== options.avoid) return task;
    seed = (seed + 997) >>> 0;
  }
  return build(kind, level, options.seed, options.category);
}

export function randomCategory(seed: number): AssemblerTask['category'] {
  return pick(mulberry32(seed), ['furniture', 'constructor', 'electronics'] as const);
}
