import { STICKERS } from './data';
import type { Level, LevelProgress, ProfessionId, Profile, ProgressMap, Settings } from './types';

export function defaultSettings(): Settings {
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  return {
    fontSize: 'md',
    speech: true,
    speechRate: 0.92,
    speechVolume: 1,
    sfxVolume: 0.45,
    music: false,
    contrast: false,
    reducedMotion: Boolean(reduce),
    muted: false,
  };
}

function levelProgress(): LevelProgress {
  return { completed: false, bestStars: 0, attempts: 0, hints: 0, checks: 0 };
}

function block(): Record<Level, LevelProgress> {
  return { 1: levelProgress(), 2: levelProgress(), 3: levelProgress() };
}

export function emptyProgress(): ProgressMap {
  return {
    picker: block(),
    operator: block(),
    label: block(),
    gardener: block(),
    assembler: block(),
  };
}

export function totalStars(profile: Profile, profession: ProfessionId): number {
  const levels = profile.progress[profession];
  return levels[1].bestStars + levels[2].bestStars + levels[3].bestStars;
}

export function starsForFails(failedChecks: number): number {
  if (failedChecks <= 0) return 3;
  if (failedChecks === 1) return 2;
  return 1;
}

export function applyWin(
  profile: Profile,
  win: { profession: ProfessionId; level: Level; stars: number; hints: number; checks: number },
): { profile: Profile; newStickers: string[] } {
  const next: Profile = structuredClone(profile);
  const slot = next.progress[win.profession][win.level];
  slot.completed = true;
  slot.bestStars = Math.max(slot.bestStars, win.stars);
  slot.attempts += 1;
  slot.hints += win.hints;
  slot.checks += win.checks;
  const sum = totalStars(next, win.profession);
  const fresh: string[] = [];
  for (const sticker of STICKERS.filter((item) => item.profession === win.profession)) {
    if (sum >= sticker.need && !next.stickers.includes(sticker.id)) {
      next.stickers.push(sticker.id);
      fresh.push(sticker.id);
    }
  }
  return { profile: next, newStickers: fresh };
}
