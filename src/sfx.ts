export type SfxKind = 'click' | 'take' | 'put' | 'snap' | 'ok' | 'again';

let ctx: AudioContext | null = null;
let musicTimer = 0;
let musicOn = false;

function audio(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function playSfx(kind: SfxKind, volume: number): void {
  if (volume <= 0) return;
  const context = audio();
  const now = context.currentTime;
  const gain = context.createGain();
  gain.connect(context.destination);
  const tone = (freq: number, at: number, dur: number, peak: number) => {
    const osc = context.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.gain.setValueAtTime(0.0001, now + at);
    gain.gain.exponentialRampToValueAtTime(peak * volume, now + at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + at + dur);
    osc.start(now + at);
    osc.stop(now + at + dur + 0.02);
  };
  if (kind === 'click') tone(620, 0, 0.06, 0.04);
  if (kind === 'take') tone(520, 0, 0.08, 0.05);
  if (kind === 'put') tone(430, 0, 0.09, 0.05);
  if (kind === 'snap') {
    tone(640, 0, 0.08, 0.06);
    tone(820, 0.07, 0.1, 0.05);
  }
  if (kind === 'ok') {
    tone(523, 0, 0.12, 0.05);
    tone(659, 0.1, 0.16, 0.05);
  }
  if (kind === 'again') tone(340, 0, 0.1, 0.035);
}

const NOTES = [262, 294, 330, 392, 440];

export function setMusic(on: boolean, volume: number): void {
  musicOn = on && volume > 0;
  window.clearInterval(musicTimer);
  if (!musicOn) return;
  let step = 0;
  const tick = () => {
    if (!musicOn) return;
    const context = audio();
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = 'sine';
    osc.frequency.value = NOTES[step % NOTES.length];
    step += 1;
    osc.connect(gain);
    gain.connect(context.destination);
    const now = context.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.018 * volume, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
    osc.start(now);
    osc.stop(now + 0.72);
  };
  tick();
  musicTimer = window.setInterval(tick, 1400);
}
