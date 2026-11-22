import { BLUEPRINTS, type AsmBlueprint, type AsmStep } from '../data';
import type { Level } from '../types';
import { ASM_RULES } from './rules';
import { int, mulberry32, pick, shuffle } from './rng';

export interface KitPiece {
  id: string;
  partId: string | null;
  name: string;
  shape: AsmStep['shape'];
  color: string;
  accent: string;
  decoy: boolean;
}

export interface AssemblerTask {
  kind: 'assembler';
  id: string;
  seed: number;
  level: Level;
  category: AsmBlueprint['id'];
  productName: string;
  finale: string;
  parts: AsmStep[];
  kit: KitPiece[];
  missingPartIds: string[];
  extraKitIds: string[];
  placeMode: 'all' | 'current' | 'none';
  instruction: 'highlight' | 'steps' | 'scheme';
  intro: string[];
  signature: string;
}

export function buildAssembler(level: Level, seed: number, category?: AsmBlueprint['id']): AssemblerTask {
  const rng = mulberry32(seed);
  const rules = ASM_RULES[level];
  const blueprint = category ? BLUEPRINTS.find((item) => item.id === category) ?? BLUEPRINTS[0] : pick(rng, BLUEPRINTS);
  const count = int(rng, rules.parts[0], rules.parts[1]);
  const parts = blueprint.steps.slice(0, count);
  const pieces: KitPiece[] = parts.map((part) => ({
    id: `kit-${part.id}`,
    partId: part.id,
    name: part.name,
    shape: part.shape,
    color: part.color,
    accent: part.accent,
    decoy: false,
  }));
  const missingPartIds: string[] = [];
  const extraKitIds: string[] = [];
  const host = pick(rng, parts);
  const decoy: KitPiece = {
    id: `decoy-${host.id}`,
    partId: null,
    name: host.decoyName,
    shape: host.shape,
    color: host.decoyColor,
    accent: host.accent,
    decoy: true,
  };

  if (level === 2 && seed % 2 === 0) {
    const gone = pick(rng, parts);
    missingPartIds.push(gone.id);
    const index = pieces.findIndex((piece) => piece.partId === gone.id);
    pieces.splice(index, 1);
  }
  if (level === 3) {
    if (seed % 2 === 0) {
      const gone = host;
      missingPartIds.push(gone.id);
      const index = pieces.findIndex((piece) => piece.partId === gone.id);
      pieces.splice(index, 1);
      pieces.push(decoy);
      extraKitIds.push(decoy.id);
    } else {
      pieces.push(decoy);
      extraKitIds.push(decoy.id);
    }
  }

  const placeMode = level === 1 ? 'all' : level === 2 ? 'current' : 'none';
  const instruction = level === 1 ? 'highlight' : level === 2 ? 'steps' : 'scheme';
  return {
    kind: 'assembler',
    id: `asm-${blueprint.id}-${seed}`,
    seed,
    level,
    category: blueprint.id,
    productName: blueprint.title,
    finale: blueprint.finale,
    parts,
    kit: shuffle(rng, pieces),
    missingPartIds,
    extraKitIds,
    placeMode,
    instruction,
    intro: ['Проверь комплект деталей.', `Собираем: ${blueprint.title}.`],
    signature: `${blueprint.id}:${parts.map((part) => part.id).join(',')}:${missingPartIds.join('.')}:${extraKitIds.join('.')}`,
  };
}

export function checkKit(task: AssemblerTask, markedMissing: string[], markedExtra: string[], claimedAllGood: boolean): boolean {
  const miss = [...task.missingPartIds].sort().join('|');
  const extra = [...task.extraKitIds].sort().join('|');
  const gotMiss = [...new Set(markedMissing)].sort().join('|');
  const gotExtra = [...new Set(markedExtra)].sort().join('|');
  if (!miss && !extra) return claimedAllGood && !gotMiss && !gotExtra;
  if (claimedAllGood) return false;
  return miss === gotMiss && extra === gotExtra;
}
