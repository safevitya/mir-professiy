import { emptyProgress, defaultSettings } from './progress';
import type { Level, ProfessionId, Profile, ProgressMap, Settings } from './types';

/** Профили и прогресс хранятся на этом устройстве, пока нет сервера. */
const KEY = 'mir-professiy-v1';

export interface SaveFile {
  version: 1;
  profiles: Profile[];
  guest: Settings;
  activeId: string | null;
}

const PROFESSIONS: ProfessionId[] = ['picker', 'operator', 'label', 'gardener', 'assembler'];
const LEVELS: Level[] = [1, 2, 3];

function tidyProgress(progress: Partial<ProgressMap> | undefined): ProgressMap {
  const base = emptyProgress();
  for (const id of PROFESSIONS) {
    for (const level of LEVELS) {
      base[id][level] = { ...base[id][level], ...progress?.[id]?.[level] };
    }
  }
  return base;
}

function tidyProfile(profile: Profile): Profile {
  return {
    ...profile,
    pinHash: profile.pinHash ?? null,
    settings: { ...defaultSettings(), ...profile.settings },
    progress: tidyProgress(profile.progress),
    stickers: profile.stickers ?? [],
    artworks: profile.artworks ?? [],
    lastTasks: profile.lastTasks ?? {},
    greeted: Boolean(profile.greeted),
  };
}

function emptyFile(): SaveFile {
  return { version: 1, profiles: [], guest: defaultSettings(), activeId: null };
}

export function loadFile(): SaveFile {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyFile();
    const parsed = JSON.parse(raw) as SaveFile;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.profiles)) return emptyFile();
    const profiles = parsed.profiles.map(tidyProfile);
    const activeId = profiles.some((item) => item.id === parsed.activeId) ? parsed.activeId : null;
    return { version: 1, profiles, guest: { ...defaultSettings(), ...parsed.guest }, activeId };
  } catch {
    return emptyFile();
  }
}

export function saveFile(file: SaveFile): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(file));
    return true;
  } catch {
    return false;
  }
}

export async function hashPin(profileId: string, pin: string): Promise<string> {
  const data = new TextEncoder().encode(`${profileId}:${pin}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(buf)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
