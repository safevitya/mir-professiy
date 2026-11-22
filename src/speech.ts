import type { Settings } from './types';

export type SpeechResult = 'ok' | 'off' | 'no-api' | 'no-ru';

export interface VoiceOption {
  voiceURI: string;
  name: string;
  label: string;
  isNeural: boolean;
}

function voiceScore(voice: SpeechSynthesisVoice): number {
  const n = voice.name.toLowerCase();
  let score = 0;
  if (n.includes('natural') || n.includes('neural')) score += 100;
  if (n.includes('online')) score += 50;
  if (n.includes('svetlana')) score += 45;
  if (n.includes('dmitry') || n.includes('dariya')) score += 40;
  if (n.includes('google') || n.includes('yandex') || n.includes('alice')) score += 35;
  if (n.includes('milena') || n.includes('yuri') || n.includes('katya')) score += 25;
  if (!voice.localService) score += 15;
  return score;
}

export function formatVoiceLabel(voice: SpeechSynthesisVoice): string {
  let clean = voice.name
    .replace(/^Microsoft\s+/i, '')
    .replace(/\s*-\s*Russian.*$/i, '')
    .replace(/\s*\(Russian.*$/i, '')
    .replace(/Online\s*\(Natural\)/i, '✨ Умный (Natural)')
    .trim();
  if (/^google\s+русский$/i.test(clean)) {
    clean = 'Google Русский ✨';
  }
  return clean || voice.name;
}

export function getRussianVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  const all = window.speechSynthesis.getVoices();
  const ru = all.filter(
    (voice) =>
      voice.lang.toLowerCase().startsWith('ru') ||
      voice.name.toLowerCase().includes('russian') ||
      voice.name.toLowerCase().includes('русский'),
  );
  return [...ru].sort((a, b) => voiceScore(b) - voiceScore(a));
}

export function getRussianVoiceOptions(): VoiceOption[] {
  return getRussianVoices().map((voice) => ({
    voiceURI: voice.voiceURI,
    name: voice.name,
    label: formatVoiceLabel(voice),
    isNeural: voiceScore(voice) >= 35,
  }));
}

export function pickBestRussianVoice(preferredURI?: string): SpeechSynthesisVoice | undefined {
  const ruVoices = getRussianVoices();
  if (ruVoices.length === 0) return undefined;
  if (preferredURI) {
    const found = ruVoices.find((v) => v.voiceURI === preferredURI || v.name === preferredURI);
    if (found) return found;
  }
  return ruVoices[0];
}

export function speakLines(lines: string[], settings: Settings): SpeechResult {
  if (typeof window === 'undefined' || !window.speechSynthesis) return 'no-api';
  window.speechSynthesis.cancel();
  if (!settings.speech || settings.muted || settings.speechVolume <= 0) return 'off';
  const allVoices = window.speechSynthesis.getVoices();
  const ru = pickBestRussianVoice(settings.voiceURI);
  if (allVoices.length > 0 && !ru) return 'no-ru';
  for (const text of lines) {
    const clean = text.trim();
    if (!clean) continue;
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = ru?.lang || 'ru-RU';
    if (ru) utterance.voice = ru;
    utterance.rate = settings.speechRate;
    utterance.volume = settings.speechVolume;
    window.speechSynthesis.speak(utterance);
  }
  return 'ok';
}

export function quietSpeech(): void {
  window.speechSynthesis?.cancel();
}
