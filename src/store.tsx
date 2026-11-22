import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { setMusic } from './sfx';
import { speakLines, quietSpeech } from './speech';
import { hashPin, loadFile, saveFile, type SaveFile } from './storage';
import { emptyProgress, defaultSettings } from './progress';
import type { Artwork, Profile, Settings } from './types';

interface StoreValue {
  profiles: Profile[];
  profile: Profile | null;
  settings: Settings;
  noVoice: boolean;
  saveError: boolean;
  login: (id: string, pin?: string) => Promise<'ok' | 'need-pin' | 'bad-pin'>;
  logout: () => void;
  createProfile: (name: string, avatar: string, pin?: string) => Promise<void>;
  removeProfile: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  updateProfile: (updater: (profile: Profile) => Profile) => void;
  addArtwork: (artwork: Artwork) => boolean;
  say: (lines: string | string[]) => void;
  dismissVoice: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function uid(): string {
  return crypto.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [file, setFile] = useState<SaveFile>(() => loadFile());
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [noVoice, setNoVoice] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const sessionRef = useRef<string | null>(null);
  sessionRef.current = sessionId;

  const profile = file.profiles.find((item) => item.id === sessionId) ?? null;
  const settings = profile?.settings ?? file.guest;

  useEffect(() => {
    const saved = loadFile();
    const active = saved.profiles.find((item) => item.id === saved.activeId);
    if (active && !active.pinHash) setSessionId(active.id);
  }, []);

  useEffect(() => {
    const ok = saveFile(file);
    setSaveError(!ok);
  }, [file]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.font = settings.fontSize;
    root.dataset.contrast = settings.contrast ? '1' : '0';
    root.dataset.motion = settings.reducedMotion ? 'reduce' : 'full';
  }, [settings]);

  useEffect(() => {
    const volume = settings.muted ? 0 : settings.sfxVolume;
    const apply = () => setMusic(settings.music && !settings.muted, volume);
    if (!settings.music || settings.muted) {
      setMusic(false, 0);
      return;
    }
    const onGesture = () => apply();
    window.addEventListener('pointerdown', onGesture);
    return () => {
      window.removeEventListener('pointerdown', onGesture);
      setMusic(false, 0);
    };
  }, [settings.music, settings.muted, settings.sfxVolume]);

  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) {
      setNoVoice(true);
      return;
    }
    const check = () => {
      const voices = synth.getVoices();
      if (voices.length > 0 && !voices.some((voice) => voice.lang.toLowerCase().startsWith('ru'))) {
        setNoVoice(true);
      }
    };
    check();
    synth.addEventListener('voiceschanged', check);
    return () => synth.removeEventListener('voiceschanged', check);
  }, []);

  const updateProfile = useCallback((updater: (profile: Profile) => Profile) => {
    setFile((current) => {
      const id = sessionRef.current;
      if (!id) return current;
      const found = current.profiles.find((item) => item.id === id);
      if (!found) return current;
      const next = updater(found);
      if (next === found) return current;
      return { ...current, profiles: current.profiles.map((item) => (item.id === id ? next : item)) };
    });
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    if (patch.muted === true || patch.speech === false || (patch.speechVolume !== undefined && patch.speechVolume <= 0)) {
      quietSpeech();
    }
    setFile((current) => {
      const id = sessionRef.current;
      if (!id) return { ...current, guest: { ...current.guest, ...patch } };
      return {
        ...current,
        profiles: current.profiles.map((item) =>
          item.id === id ? { ...item, settings: { ...item.settings, ...patch } } : item,
        ),
      };
    });
  }, []);

  useEffect(() => {
    if (!settings.speech || settings.muted || settings.speechVolume <= 0) {
      quietSpeech();
    }
  }, [settings.speech, settings.muted, settings.speechVolume]);

  useEffect(() => {
    if (noVoice && settings.speech) updateSettings({ speech: false });
  }, [noVoice, settings.speech, updateSettings]);

  const say = useCallback(
    (lines: string | string[]) => {
      const list = (Array.isArray(lines) ? lines : [lines]).map((line) => line.trim()).filter(Boolean);
      const result = speakLines(list, settings);
      if (result === 'no-ru' || result === 'no-api') setNoVoice(true);
    },
    [settings],
  );

  const value = useMemo<StoreValue>(
    () => ({
      profiles: file.profiles,
      profile,
      settings,
      noVoice,
      saveError,
      login: async (id, pin) => {
        const found = file.profiles.find((item) => item.id === id);
        if (!found) return 'bad-pin';
        if (found.pinHash) {
          if (!pin) return 'need-pin';
          const hash = await hashPin(found.id, pin);
          if (hash !== found.pinHash) return 'bad-pin';
        }
        setSessionId(found.id);
        setFile((current) => ({ ...current, activeId: found.pinHash ? null : found.id }));
        return 'ok';
      },
      logout: () => {
        quietSpeech();
        setSessionId(null);
        setFile((current) => ({ ...current, activeId: null }));
      },
      createProfile: async (name, avatar, pin) => {
        const id = uid();
        const next: Profile = {
          id,
          name: name.trim(),
          avatar,
          pinHash: pin ? await hashPin(id, pin) : null,
          createdAt: new Date().toISOString(),
          settings: { ...defaultSettings(), ...file.guest },
          progress: emptyProgress(),
          stickers: [],
          artworks: [],
          lastTasks: {},
          greeted: false,
        };
        setSessionId(id);
        setFile((current) => ({
          ...current,
          profiles: [...current.profiles, next],
          activeId: next.pinHash ? null : id,
        }));
      },
      removeProfile: (id) => {
        setFile((current) => ({
          ...current,
          profiles: current.profiles.filter((item) => item.id !== id),
          activeId: current.activeId === id ? null : current.activeId,
        }));
        setSessionId((current) => (current === id ? null : current));
      },
      updateSettings,
      updateProfile,
      addArtwork: (artwork) => {
        updateProfile((current) => ({
          ...current,
          artworks: [artwork, ...current.artworks].slice(0, 8),
        }));
        return true;
      },
      say,
      dismissVoice: () => setNoVoice(false),
    }),
    [file, profile, settings, noVoice, saveError, say, updateProfile, updateSettings],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const value = useContext(StoreContext);
  if (!value) throw new Error('Нет хранилища');
  return value;
}
