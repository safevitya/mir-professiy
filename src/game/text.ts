import type { Gender } from '../types';

const WORDS: Record<number, Record<Gender, string>> = {
  1: { m: 'один', f: 'одна', n: 'одно' },
  2: { m: 'два', f: 'две', n: 'два' },
  3: { m: 'три', f: 'три', n: 'три' },
  4: { m: 'четыре', f: 'четыре', n: 'четыре' },
  5: { m: 'пять', f: 'пять', n: 'пять' },
  6: { m: 'шесть', f: 'шесть', n: 'шесть' },
  7: { m: 'семь', f: 'семь', n: 'семь' },
  8: { m: 'восемь', f: 'восемь', n: 'восемь' },
  9: { m: 'девять', f: 'девять', n: 'девять' },
};

export function formIndex(n: number): 0 | 1 | 2 {
  const n10 = n % 10;
  const n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return 0;
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return 1;
  return 2;
}

export function qtyPhrase(n: number, gender: Gender, forms: [string, string, string]): string {
  const word = WORDS[n]?.[gender] ?? String(n);
  return `${word} ${forms[formIndex(n)]}`;
}

export function capitalize(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function norm(value: string): string {
  return value.trim().toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ');
}

export function starsWord(n: number): string {
  const form = formIndex(n);
  return `${n} ${['звезда', 'звезды', 'звёзд'][form]}`;
}
