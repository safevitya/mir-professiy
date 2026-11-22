export type ProfessionId = 'picker' | 'operator' | 'label' | 'gardener' | 'assembler';
export type Level = 1 | 2 | 3;
export type FontSize = 'md' | 'lg' | 'xl';
export type ShapeId =
  | 'carton'
  | 'bottle'
  | 'jar'
  | 'box'
  | 'bag'
  | 'loaf'
  | 'cookie'
  | 'apple'
  | 'pear'
  | 'cup'
  | 'leaf'
  | 'flower'
  | 'cactus'
  | 'wheel'
  | 'bulb'
  | 'plank'
  | 'leg'
  | 'screw'
  | 'spring'
  | 'car'
  | 'cabin'
  | 'glass'
  | 'button'
  | 'reflector'
  | 'barcode'
  | 'drop'
  | 'sun'
  | 'pot';

export type Gender = 'm' | 'f' | 'n';

export interface Settings {
  fontSize: FontSize;
  speech: boolean;
  speechRate: number;
  speechVolume: number;
  sfxVolume: number;
  music: boolean;
  contrast: boolean;
  reducedMotion: boolean;
  muted: boolean;
  voiceURI?: string;
}

export interface LevelProgress {
  completed: boolean;
  bestStars: number;
  attempts: number;
  hints: number;
  checks: number;
}

export type ProgressMap = Record<ProfessionId, Record<Level, LevelProgress>>;

export interface Artwork {
  id: string;
  title: string;
  image: string;
  createdAt: string;
}

export interface Profile {
  id: string;
  name: string;
  avatar: string;
  pinHash: string | null;
  createdAt: string;
  settings: Settings;
  progress: ProgressMap;
  stickers: string[];
  artworks: Artwork[];
  lastTasks: Record<string, string>;
  greeted: boolean;
}

export interface Product {
  id: string;
  name: string;
  group: string;
  shape: ShapeId;
  color: string;
  accent: string;
  gender: Gender;
  forms: [string, string, string];
}

export interface Plant {
  id: string;
  name: string;
  sun: boolean;
  wet: boolean;
  shape: ShapeId;
  color: string;
  accent: string;
}

export interface StickerDef {
  id: string;
  profession: ProfessionId;
  need: number;
  name: string;
}

export type CheckStatus = 'error' | 'next' | 'done';

export interface CheckResult {
  status: CheckStatus;
  message: string;
  speech: string;
  finale?: string;
  makeArtwork?: () => Promise<string | null>;
}

export interface GameApi {
  check: () => Promise<CheckResult> | CheckResult;
  hint: () => { speech: string };
  isDirty: () => boolean;
}
