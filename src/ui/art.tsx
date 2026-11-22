import type { ReactNode } from 'react';
import type { ShapeId } from '../types';

type Pattern = 'plain' | 'dots' | 'stripe' | 'band';

export function patternOf(id: string): Pattern {
  let n = 0;
  for (const ch of id) n += ch.charCodeAt(0);
  return (['plain', 'dots', 'stripe', 'band'] as const)[n % 4];
}

function PatternMarks({ pattern, accent }: { pattern: Pattern; accent: string }) {
  if (pattern === 'dots') {
    return (
      <g fill={accent}>
        <circle cx="24" cy="28" r="2" />
        <circle cx="32" cy="28" r="2" />
        <circle cx="40" cy="28" r="2" />
        <circle cx="28" cy="36" r="2" />
        <circle cx="36" cy="36" r="2" />
      </g>
    );
  }
  if (pattern === 'stripe') {
    return <path d="M18 18 H46 M18 26 H46 M18 34 H46" stroke={accent} strokeWidth="2" />;
  }
  if (pattern === 'band') {
    return <rect x="16" y="30" width="32" height="6" rx="2" fill={accent} />;
  }
  return null;
}

const ITEM_EMOJI: Record<string, string> = {
  // Продукты
  milk: '🥛',
  kefir: '🫗',
  ryazhenka: '🍶',
  yogurt: '🧁',
  cheese: '🧀',
  butter: '🧈',
  buckwheat: '🌰',
  rice: '🍚',
  oats: '🥣',
  millet: '🌾',
  pasta: '🍝',
  bread: '🍞',
  buns: '🥐',
  cookies: '🍪',
  apples: '🍎',
  pears: '🍐',
  juice: '🧃',
  water: '💧',
  tea: '🍵',
  sugar: '🧂',
  eggs: '🥚',
  tomato: '🍅',
  cucumber: '🥒',
  chocolate: '🍫',
  jam: '🍓',
  // Растения
  tulip: '🌷',
  rose: '🌹',
  basil: '🌿',
  peony: '🌸',
  sunflower: '🌻',
  cactus: '🌵',
  lavender: '🪻',
  daisy: '🌼',
  succulent: '🪴',
  fern: '🌴',
  hosta: '🍃',
  moss: '🟢',
  ivy: '☘️',
  violet: '🌺',
  mint: '🌱',
  sansevieria: '🎋',
  chlorophytum: '🌾',
  zamioculcas: '🌳',
  // Детали сборщика
  seat: '🪑',
  'leg-f': '🪵',
  'leg-b': '🥖',
  'leg-l': '🥢',
  'leg-r': '🦯',
  bar: '📏',
  'screw-l': '🔩',
  'screw-r': '⚙️',
  'pad-l': '🟫',
  'pad-r': '🟧',
  'decoy-seat': '🛡️',
  'decoy-leg-f': '🦴',
  'decoy-leg-b': '🪥',
  'decoy-leg-l': '🌿',
  'decoy-leg-r': '✏️',
  'decoy-bar': '📐',
  'decoy-screw-l': '📌',
  'decoy-screw-r': '🔘',
  'decoy-pad-l': '🧼',
  'decoy-pad-r': '🎲',
  body: '🔦',
  spring: '〰️',
  battery: '🔋',
  bulb: '💡',
  reflector: '🪩',
  glass: '🔍',
  btn: '🔴',
  wire: '🔌',
  seal: '⭕',
  cap: '🧢',
  'decoy-body': '🧪',
  'decoy-spring': '🧶',
  'decoy-battery': '🪫',
  'decoy-bulb': '🟡',
  'decoy-reflector': '💿',
  'decoy-glass': '🧊',
  'decoy-btn': '🧿',
  'decoy-wire': '🧵',
  'decoy-seal': '🍩',
  'decoy-cap': '🍾',
  chassis: '🚗',
  cabin: '🪟',
  'wheel-fl': '🛞',
  'wheel-bl': '⚫',
  'wheel-fr': '💿',
  'wheel-br': '🔘',
  'wheel-steer': '☸️',
  'lamp-l': '💡',
  'lamp-r': '🔆',
  spoiler: '🏁',
  'decoy-chassis': '📦',
  'decoy-cabin': '🖼️',
  'decoy-wheel-fl': '🛴',
  'decoy-wheel-bl': '📀',
  'decoy-wheel-fr': '⚪',
  'decoy-wheel-br': '🪙',
  'decoy-wheel-steer': '💍',
  'decoy-lamp-l': '🔦',
  'decoy-lamp-r': '🕯️',
  'decoy-spoiler': '📏',
  // Наклейки и награды
  'picker-1': '📦',
  'picker-2': '🛒',
  'picker-3': '⭐',
  'operator-1': '📄',
  'operator-2': '🔍',
  'operator-3': '✅',
  'label-1': '🏷️',
  'label-2': '🖌️',
  'label-3': '🎨',
  'gardener-1': '🌸',
  'gardener-2': '🚿',
  'gardener-3': '☀️',
  'assembler-1': '🔩',
  'assembler-2': '💡',
  'assembler-3': '🚗',
  'decor-star': '⭐',
  'decor-heart': '❤️',
  'decor-flower': '🌺',
  'decor-smile': '😊',
};

const SHAPE_EMOJI: Record<ShapeId, string> = {
  carton: '🥛',
  bottle: '🍶',
  jar: '🫙',
  box: '📦',
  bag: '🛍️',
  loaf: '🍞',
  cookie: '🍪',
  apple: '🍎',
  pear: '🍐',
  cup: '🍵',
  leaf: '🌿',
  flower: '🌸',
  cactus: '🌵',
  wheel: '🛞',
  bulb: '💡',
  plank: '🪵',
  leg: '🪵',
  screw: '🔩',
  spring: '〰️',
  car: '🚗',
  cabin: '🏠',
  glass: '🔍',
  button: '🔴',
  reflector: '🔦',
  barcode: '🏷️',
  drop: '💧',
  sun: '☀️',
  pot: '🪴',
};

export function resolveEmoji(id?: string, shape?: ShapeId): string {
  return (id && ITEM_EMOJI[id]) || (shape && SHAPE_EMOJI[shape]) || '📦';
}

export function Shape({
  id,
  shape,
  color,
  accent,
  title,
}: {
  id?: string;
  shape: ShapeId;
  color: string;
  accent: string;
  pattern?: Pattern;
  title?: string;
}) {
  const emoji = resolveEmoji(id, shape);
  return (
    <span
      className="shape emoji-shape"
      style={{ background: color, borderColor: accent }}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <span className="emoji-glyph">{emoji}</span>
    </span>
  );
}

function shapeBody(shape: ShapeId, color: string, accent: string): ReactNode {
  const stroke = { fill: color, stroke: accent, strokeWidth: 3 };
  switch (shape) {
    case 'carton':
      return <path d="M16 14 H48 L44 54 H20 Z" {...stroke} />;
    case 'bottle':
      return <path d="M28 8 H36 V18 L44 28 V54 H20 V28 L28 18 Z" {...stroke} />;
    case 'jar':
      return (
        <g>
          <rect x="22" y="8" width="20" height="8" rx="2" fill={accent} />
          <rect x="16" y="16" width="32" height="36" rx="8" {...stroke} />
        </g>
      );
    case 'box':
      return <rect x="12" y="16" width="40" height="32" rx="4" {...stroke} />;
    case 'bag':
      return <path d="M18 20 H46 L50 54 H14 Z" {...stroke} />;
    case 'loaf':
      return <ellipse cx="32" cy="34" rx="22" ry="14" {...stroke} />;
    case 'cookie':
      return <circle cx="32" cy="32" r="18" {...stroke} />;
    case 'apple':
      return (
        <g>
          <circle cx="32" cy="36" r="16" {...stroke} />
          <path d="M32 20 C36 14 42 16 40 22" fill="none" stroke={accent} strokeWidth="3" />
        </g>
      );
    case 'pear':
      return <ellipse cx="32" cy="38" rx="14" ry="18" {...stroke} />;
    case 'cup':
      return <path d="M16 18 H44 L40 50 H20 Z" {...stroke} />;
    case 'leaf':
      return <ellipse cx="32" cy="34" rx="12" ry="20" transform="rotate(-25 32 34)" {...stroke} />;
    case 'flower':
      return (
        <g>
          <circle cx="32" cy="22" r="8" fill={color} stroke={accent} strokeWidth="3" />
          <circle cx="20" cy="36" r="8" fill={color} stroke={accent} strokeWidth="3" />
          <circle cx="44" cy="36" r="8" fill={color} stroke={accent} strokeWidth="3" />
          <circle cx="32" cy="32" r="5" fill={accent} />
        </g>
      );
    case 'cactus':
      return (
        <g>
          <rect x="26" y="14" width="12" height="36" rx="6" {...stroke} />
          <rect x="14" y="26" width="12" height="8" rx="4" {...stroke} />
          <rect x="38" y="22" width="12" height="8" rx="4" {...stroke} />
        </g>
      );
    case 'wheel':
      return (
        <g>
          <circle cx="32" cy="32" r="18" {...stroke} />
          <circle cx="32" cy="32" r="6" fill={accent} />
        </g>
      );
    case 'bulb':
      return (
        <g>
          <circle cx="32" cy="26" r="14" {...stroke} />
          <rect x="24" y="40" width="16" height="10" rx="2" fill={accent} />
        </g>
      );
    case 'plank':
      return <rect x="8" y="24" width="48" height="16" rx="3" {...stroke} />;
    case 'leg':
      return <rect x="26" y="6" width="12" height="52" rx="4" {...stroke} />;
    case 'screw':
      return (
        <g>
          <circle cx="32" cy="14" r="8" {...stroke} />
          <rect x="29" y="22" width="6" height="30" fill={accent} />
        </g>
      );
    case 'spring':
      return <path d="M20 10 H44 L20 22 H44 L20 34 H44 L20 46 H44 L20 58" fill="none" stroke={accent} strokeWidth="4" />;
    case 'car':
      return <path d="M8 36 H56 V48 H8 Z M16 36 L22 22 H42 L48 36" {...stroke} />;
    case 'cabin':
      return <path d="M14 46 V28 L32 14 L50 28 V46 Z" {...stroke} />;
    case 'glass':
      return <circle cx="32" cy="32" r="16" fill="#e3f2fd" stroke={accent} strokeWidth="3" />;
    case 'button':
      return <circle cx="32" cy="32" r="14" {...stroke} />;
    case 'reflector':
      return <path d="M16 44 L32 12 L48 44 Z" {...stroke} />;
    case 'barcode':
      return (
        <g fill={accent}>
          <rect x="12" y="16" width="3" height="32" />
          <rect x="18" y="16" width="6" height="32" />
          <rect x="28" y="16" width="2" height="32" />
          <rect x="34" y="16" width="5" height="32" />
          <rect x="42" y="16" width="3" height="32" />
          <rect x="48" y="16" width="4" height="32" />
        </g>
      );
    case 'drop':
      return <path d="M32 8 C44 24 50 32 50 40 A18 18 0 1 1 14 40 C14 32 20 24 32 8 Z" {...stroke} />;
    case 'sun':
      return (
        <g>
          <circle cx="32" cy="32" r="12" {...stroke} />
          <path d="M32 8 V16 M32 48 V56 M8 32 H16 M48 32 H56 M14 14 L20 20 M44 44 L50 50 M50 14 L44 20 M20 44 L14 50" stroke={accent} strokeWidth="3" />
        </g>
      );
    case 'pot':
      return <path d="M18 24 H46 L42 54 H22 Z" {...stroke} />;
    default:
      return <circle cx="32" cy="32" r="16" {...stroke} />;
  }
}

const FACES: Record<string, ReactNode> = {
  fox: (
    <g>
      <circle cx="40" cy="40" r="28" fill="#f4a261" />
      <path d="M16 20 L28 34 L14 36 Z M64 20 L52 34 L66 36 Z" fill="#f4a261" stroke="#9c4a1a" strokeWidth="2" />
      <ellipse cx="40" cy="46" rx="10" ry="7" fill="#fff6e8" />
    </g>
  ),
  bear: (
    <g>
      <circle cx="22" cy="24" r="10" fill="#8d6e63" />
      <circle cx="58" cy="24" r="10" fill="#8d6e63" />
      <circle cx="40" cy="42" r="26" fill="#a1887f" />
      <ellipse cx="40" cy="48" rx="10" ry="7" fill="#efebe9" />
    </g>
  ),
  cat: (
    <g>
      <circle cx="40" cy="42" r="26" fill="#90a4ae" />
      <path d="M18 28 L28 36 L16 42 Z M62 28 L52 36 L64 42 Z" fill="#90a4ae" />
    </g>
  ),
  owl: (
    <g>
      <ellipse cx="40" cy="42" rx="24" ry="26" fill="#6d597a" />
      <circle cx="30" cy="40" r="8" fill="#fff8e8" />
      <circle cx="50" cy="40" r="8" fill="#fff8e8" />
      <circle cx="30" cy="40" r="3" fill="#1d2b27" />
      <circle cx="50" cy="40" r="3" fill="#1d2b27" />
    </g>
  ),
  frog: (
    <g>
      <circle cx="40" cy="46" r="24" fill="#7dba6a" />
      <circle cx="26" cy="28" r="10" fill="#7dba6a" />
      <circle cx="54" cy="28" r="10" fill="#7dba6a" />
      <circle cx="26" cy="28" r="4" fill="#1d2b27" />
      <circle cx="54" cy="28" r="4" fill="#1d2b27" />
    </g>
  ),
  panda: (
    <g>
      <circle cx="40" cy="42" r="26" fill="#f7f7f7" stroke="#222" strokeWidth="3" />
      <circle cx="22" cy="24" r="8" fill="#222" />
      <circle cx="58" cy="24" r="8" fill="#222" />
      <ellipse cx="28" cy="42" rx="7" ry="8" fill="#222" />
      <ellipse cx="52" cy="42" rx="7" ry="8" fill="#222" />
    </g>
  ),
  rabbit: (
    <g>
      <ellipse cx="28" cy="20" rx="7" ry="16" fill="#f8d7e8" />
      <ellipse cx="52" cy="20" rx="7" ry="16" fill="#f8d7e8" />
      <circle cx="40" cy="46" r="24" fill="#f8d7e8" />
    </g>
  ),
  lion: (
    <g>
      <circle cx="40" cy="42" r="30" fill="#e6b325" />
      <circle cx="40" cy="44" r="18" fill="#f6e0b5" />
    </g>
  ),
};

export function Avatar({ id, name }: { id: string; name?: string }) {
  return (
    <svg viewBox="0 0 80 80" className="avatar" role="img" aria-label={name ? `Аватар ${name}` : 'Аватар'}>
      <circle cx="40" cy="40" r="38" fill="#fff8e8" />
      {FACES[id] ?? FACES.fox}
      <circle cx="32" cy="42" r="2.4" fill="#1d2b27" />
      <circle cx="48" cy="42" r="2.4" fill="#1d2b27" />
      <path d="M34 52 Q40 58 46 52" fill="none" stroke="#1d2b27" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Mascot({ mood = 'calm' }: { mood?: 'calm' | 'happy' | 'think' }) {
  return (
    <svg viewBox="0 0 80 80" className={`mascot mascot-${mood}`} aria-hidden>
      <circle cx="40" cy="44" r="26" fill="#f4a261" />
      <path d="M16 24 L30 36 L14 40 Z M64 24 L50 36 L66 40 Z" fill="#f4a261" stroke="#9c4a1a" strokeWidth="2" />
      <ellipse cx="40" cy="50" rx="12" ry="8" fill="#fff6e8" />
      <circle cx="30" cy="44" r="3" fill="#1d2b27" />
      <circle cx="50" cy="44" r="3" fill="#1d2b27" />
      <path d="M34 56 Q40 62 46 56" fill="none" stroke="#9c4a1a" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const STICKER_SHAPE: Record<string, ShapeId> = {
  'picker-1': 'box',
  'picker-2': 'carton',
  'picker-3': 'sun',
  'operator-1': 'box',
  'operator-2': 'glass',
  'operator-3': 'button',
  'label-1': 'barcode',
  'label-2': 'drop',
  'label-3': 'flower',
  'gardener-1': 'flower',
  'gardener-2': 'drop',
  'gardener-3': 'sun',
  'assembler-1': 'screw',
  'assembler-2': 'bulb',
  'assembler-3': 'car',
  'decor-star': 'sun',
  'decor-heart': 'flower',
  'decor-flower': 'flower',
  'decor-smile': 'cookie',
};

export function StickerArt({ id, title }: { id: string; title?: string }) {
  const shape = STICKER_SHAPE[id] ?? 'sun';
  return <Shape id={id} shape={shape} color="#fff4df" accent="#b87a1a" title={title} />;
}
