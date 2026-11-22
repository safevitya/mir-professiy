import { useEffect, useState } from 'react';
import { AVATARS, PROFESSIONS, STICKERS } from '../data';
import { totalStars } from '../progress';
import { starsWord } from '../game/text';
import { getRussianVoiceOptions, speakLines, type VoiceOption } from '../speech';
import type { Level, ProfessionId } from '../types';
import { Avatar, StickerArt } from '../ui/art';
import { Button, Modal, Stars } from '../ui/bits';
import { useStore } from '../store';

export function VoiceBanner() {
  const { noVoice, dismissVoice } = useStore();
  if (!noVoice) return null;
  return (
    <div className="note note-warn" role="status">
      <p>В этом браузере нет русского голоса. Озвучка выключена. Играть можно без неё.</p>
      <Button tone="quiet" onClick={dismissVoice}>Понятно</Button>
    </div>
  );
}

export function SaveBanner() {
  const { saveError } = useStore();
  if (!saveError) return null;
  return <p className="note note-warn">Не удалось сохранить. Память устройства заполнена.</p>;
}

export function FontSwitch() {
  const { settings, updateSettings } = useStore();
  const sizes = [
    ['md', 'А', 'Обычный размер текста'],
    ['lg', 'А', 'Крупный размер текста'],
    ['xl', 'А', 'Очень крупный размер текста'],
  ] as const;
  return (
    <div className="font-switch" role="group" aria-label="Размер текста">
      {sizes.map(([id, label, name], index) => (
        <Button
          key={id}
          tone={settings.fontSize === id ? 'primary' : 'quiet'}
          className={['font-a', 'font-b', 'font-c'][index]}
          aria-label={name}
          aria-pressed={settings.fontSize === id}
          onClick={() => updateSettings({ fontSize: id })}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}

export function SoundButton() {
  const { settings, updateSettings } = useStore();
  return (
    <Button
      tone={settings.muted ? 'primary' : 'quiet'}
      aria-pressed={settings.muted}
      onClick={() => updateSettings({ muted: !settings.muted })}
    >
      {settings.muted ? 'Тихо' : 'Звук'}
    </Button>
  );
}

function PinPad({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Сброс', '0', '←'];
  return (
    <div className="stack">
      <div className="pin-dots" aria-label="Код">{[0, 1, 2, 3].map((index) => <span key={index}>{value[index] ? '●' : '○'}</span>)}</div>
      <div className="pin-grid">
        {digits.map((digit) => (
          <Button
            key={digit}
            onClick={() => {
              if (digit === 'Сброс') onChange('');
              else if (digit === '←') onChange(value.slice(0, -1));
              else if (value.length < 4) onChange(value + digit);
            }}
          >
            {digit}
          </Button>
        ))}
      </div>
    </div>
  );
}

export function LoginScreen({ onReady }: { onReady: () => void }) {
  const { profiles, createProfile, removeProfile, login } = useStore();
  const [mode, setMode] = useState<'list' | 'create'>('list');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<string>(AVATARS[0]);
  const [usePin, setUsePin] = useState(false);
  const [pin, setPin] = useState('');
  const [askId, setAskId] = useState<string | null>(null);
  const [pinTry, setPinTry] = useState('');
  const [message, setMessage] = useState('');
  const [dropId, setDropId] = useState<string | null>(null);

  const cleanName = name.trim();
  const nameOk = cleanName.length >= 2 && cleanName.length <= 12;

  async function enter(id: string, code?: string) {
    const result = await login(id, code);
    if (result === 'need-pin') {
      setAskId(id);
      setPinTry('');
      setMessage('');
      return;
    }
    if (result === 'bad-pin') {
      setMessage('Код не подошёл. Попробуй ещё раз.');
      setPinTry('');
      return;
    }
    onReady();
  }

  return (
    <div className="center-page">
      <VoiceBanner />
      <SaveBanner />
      <h2>Кто будет играть?</h2>
      {mode === 'list' ? (
        <>
          <div className="stack">
            {profiles.map((profile) => (
              <div key={profile.id} className="profile-card">
                <button type="button" className="profile-card" onClick={() => void enter(profile.id)}>
                  <Avatar id={profile.avatar} name={profile.name} />
                  <span>
                    <b>{profile.name}</b>
                    {profile.pinHash ? <span className="tag"> код</span> : null}
                  </span>
                </button>
                <Button tone="ghost" onClick={() => setDropId(profile.id)}>Удалить</Button>
              </div>
            ))}
            {profiles.length === 0 ? <p className="note">Создай профиль: имя и картинку. Почта не нужна.</p> : null}
          </div>
          <Button tone="primary" onClick={() => setMode('create')} disabled={profiles.length >= 12}>Новый профиль</Button>
        </>
      ) : (
        <form
          className="stack"
          onSubmit={(event) => {
            event.preventDefault();
            if (!nameOk || (usePin && pin.length < 4)) {
              setMessage('Напиши имя из 2–12 букв.');
              return;
            }
            void createProfile(cleanName, avatar, usePin ? pin : undefined).then(onReady);
          }}
        >
          <label className="field">
            Имя
            <input value={name} maxLength={12} onChange={(event) => setName(event.target.value)} />
          </label>
          <div className="avatar-grid">
            {AVATARS.map((id) => (
              <Button key={id} tone={avatar === id ? 'primary' : 'quiet'} aria-pressed={avatar === id} onClick={() => setAvatar(id)}>
                <Avatar id={id} />
              </Button>
            ))}
          </div>
          <Button tone={usePin ? 'primary' : 'quiet'} aria-pressed={usePin} onClick={() => setUsePin((value) => !value)}>
            Защитить кодом
          </Button>
          {usePin ? <PinPad value={pin} onChange={setPin} /> : null}
          {message ? <p className="note note-warn">{message}</p> : null}
          <div className="row">
            <Button onClick={() => setMode('list')}>Назад</Button>
            <Button tone="primary" type="submit">Создать</Button>
          </div>
        </form>
      )}
      {askId ? (
        <Modal title="Код профиля" onClose={() => setAskId(null)}>
          <PinPad value={pinTry} onChange={setPinTry} />
          {message ? <p className="note note-warn">{message}</p> : null}
          <Button tone="primary" disabled={pinTry.length < 4} onClick={() => void enter(askId, pinTry)}>Войти</Button>
        </Modal>
      ) : null}
      {dropId ? (
        <Modal title="Удалить профиль?" onClose={() => setDropId(null)}>
          <p>Прогресс этого профиля исчезнет с устройства.</p>
          <div className="row">
            <Button onClick={() => setDropId(null)}>Оставить</Button>
            <Button tone="primary" onClick={() => { removeProfile(dropId); setDropId(null); }}>Удалить</Button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

export function MenuScreen({
  onPlay,
  onAwards,
  onWorks,
}: {
  onPlay: (id: ProfessionId) => void;
  onAwards: () => void;
  onWorks: () => void;
}) {
  const { profile, say, updateProfile } = useStore();
  useEffect(() => {
    if (!profile || profile.greeted) return;
    say(`Привет, ${profile.name}! Выбери профессию.`);
    updateProfile((current) => (current.greeted ? current : { ...current, greeted: true }));
  }, [profile, say, updateProfile]);
  if (!profile) return null;
  return (
    <div className="stack">
      <VoiceBanner />
      <div className="spread">
        <p>Привет, {profile.name}! Выбери профессию.</p>
        <div className="row">
          <Button onClick={onAwards}>Мои награды</Button>
          <Button onClick={onWorks}>Мои работы</Button>
        </div>
      </div>
      <div className="city">
        {PROFESSIONS.map((job) => (
          <button key={job.id} type="button" className="job" onClick={() => onPlay(job.id)}>
            <span className="stripe" style={{ background: job.color }} />
            <b>{job.title}</b>
            <span>{job.short}</span>
            <Stars count={totalStars(profile, job.id)} max={9} />
          </button>
        ))}
      </div>
    </div>
  );
}

const CATEGORIES = [
  { id: 'any', title: 'Любое изделие' },
  { id: 'furniture', title: 'Мебель' },
  { id: 'constructor', title: 'Конструктор' },
  { id: 'electronics', title: 'Электроника' },
] as const;

export function LevelScreen({
  profession,
  onPick,
  onBack,
}: {
  profession: ProfessionId;
  onPick: (level: Level, category?: 'furniture' | 'constructor' | 'electronics') => void;
  onBack: () => void;
}) {
  const { profile } = useStore();
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]['id']>('any');
  if (!profile) return null;
  const info = PROFESSIONS.find((item) => item.id === profession)!;
  const block = profile.progress[profession];
  const recommended: Level = !block[1].completed ? 1 : !block[2].completed ? 2 : 3;
  return (
    <div className="center-page">
      <div className="spread">
        <h2>{info.full}</h2>
        <Button onClick={onBack}>В меню</Button>
      </div>
      <p>{info.short}. Уровни можно выбирать в любом порядке.</p>
      {profession === 'assembler' ? (
        <div className="row">
          {CATEGORIES.map((item) => (
            <Button key={item.id} tone={category === item.id ? 'primary' : 'quiet'} aria-pressed={category === item.id} onClick={() => setCategory(item.id)}>
              {item.title}
            </Button>
          ))}
        </div>
      ) : null}
      <div className="choice-grid">
        {([1, 2, 3] as Level[]).map((level) => {
          const slot = block[level];
          return (
            <button
              key={level}
              type="button"
              className={level === recommended && !slot.completed ? 'level-card recommended' : 'level-card'}
              onClick={() => onPick(level, category === 'any' ? undefined : category)}
            >
              <b>Уровень {level}</b>
              {level === recommended && !block[3].completed ? <span className="tag">Начни здесь</span> : null}
              <Stars count={slot.bestStars} />
              <span>{slot.completed ? 'Пройден' : 'Ещё не пройден'}</span>
              <span className="tag">Попыток {slot.attempts} · подсказок {slot.hints}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function AwardsScreen({ onBack }: { onBack: () => void }) {
  const { profile } = useStore();
  if (!profile) return null;
  return (
    <div className="center-page">
      <div className="spread">
        <h2>Трудовая книжка</h2>
        <Button onClick={onBack}>В меню</Button>
      </div>
      {PROFESSIONS.map((job) => {
        const sum = totalStars(profile, job.id);
        const stickers = STICKERS.filter((item) => item.profession === job.id);
        return (
          <section key={job.id} className="panel">
            <div className="book-row">
              <div>
                <b>{job.full}</b>
                <div><Stars count={sum} max={9} /></div>
                <span className="tag">{starsWord(sum)}</span>
              </div>
              <div className="row">
                {stickers.map((sticker) => {
                  const open = profile.stickers.includes(sticker.id);
                  return (
                    <div key={sticker.id} className={open ? 'sticker-slot' : 'sticker-slot locked'}>
                      <StickerArt id={sticker.id} title={open ? sticker.name : 'Закрыто'} />
                      <span className="tag">{open ? sticker.name : `${sticker.need}`}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="tag">
              {([1, 2, 3] as Level[]).map((level) => {
                const slot = profile.progress[job.id][level];
                return `Уровень ${level}: попыток ${slot.attempts}, подсказок ${slot.hints}, проверок ${slot.checks}. `;
              })}
            </p>
          </section>
        );
      })}
    </div>
  );
}

export function WorksScreen({ onBack }: { onBack: () => void }) {
  const { profile, updateProfile } = useStore();
  const [open, setOpen] = useState<string | null>(null);
  if (!profile) return null;
  const current = profile.artworks.find((item) => item.id === open);
  return (
    <div className="center-page">
      <div className="spread">
        <h2>Мои работы</h2>
        <Button onClick={onBack}>В меню</Button>
      </div>
      {profile.artworks.length === 0 ? <p className="note">Здесь появятся этикетки.</p> : null}
      <div className="works-grid">
        {profile.artworks.map((art) => (
          <button key={art.id} type="button" className="card" onClick={() => setOpen(art.id)}>
            <img src={art.image} alt={art.title} className="work-view" />
            <b>{art.title}</b>
          </button>
        ))}
      </div>
      {current ? (
        <Modal title={current.title} onClose={() => setOpen(null)}>
          <img src={current.image} alt={current.title} className="work-view" />
          <div className="row">
            <Button onClick={() => {
              const link = document.createElement('a');
              link.href = current.image;
              link.download = `${current.title}.png`;
              link.click();
            }}>Скачать картинку</Button>
            <Button onClick={() => {
              updateProfile((item) => ({ ...item, artworks: item.artworks.filter((art) => art.id !== current.id) }));
              setOpen(null);
            }}>Удалить</Button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { settings, updateSettings } = useStore();
  const [voices, setVoices] = useState<VoiceOption[]>(() => getRussianVoiceOptions());

  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const update = () => setVoices(getRussianVoiceOptions());
    update();
    synth.addEventListener('voiceschanged', update);
    return () => synth.removeEventListener('voiceschanged', update);
  }, []);

  const activeVoiceURI =
    (settings.voiceURI && voices.some((v) => v.voiceURI === settings.voiceURI)
      ? settings.voiceURI
      : voices[0]?.voiceURI) ?? '';

  return (
    <Modal title="Настройки" onClose={onClose}>
      <FontSwitch />
      <Button tone={settings.speech ? 'primary' : 'quiet'} aria-pressed={settings.speech} onClick={() => updateSettings({ speech: !settings.speech })}>
        Озвучка {settings.speech ? 'включена' : 'выключена'}
      </Button>
      {voices.length > 0 ? (
        <div className="field">
          <span>Голос озвучки</span>
          <div className="row">
            {voices.map((v) => (
              <Button
                key={v.voiceURI}
                tone={activeVoiceURI === v.voiceURI ? 'primary' : 'quiet'}
                aria-pressed={activeVoiceURI === v.voiceURI}
                onClick={() => {
                  const next = { ...settings, voiceURI: v.voiceURI, speech: true, muted: false };
                  updateSettings({ voiceURI: v.voiceURI, speech: true, muted: false });
                  speakLines(['Привет! Так звучит мой голос.'], next);
                }}
              >
                {v.label}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
      <div className="row">
        {([['Медленно', 0.8], ['Обычно', 0.92], ['Быстрее', 1.05]] as const).map(([label, rate]) => (
          <Button key={label} tone={settings.speechRate === rate ? 'primary' : 'quiet'} onClick={() => updateSettings({ speechRate: rate })}>
            {label}
          </Button>
        ))}
      </div>
      <label className="field">
        Громкость речи
        <input type="range" min={0} max={1} step={0.05} value={settings.speechVolume} onChange={(event) => updateSettings({ speechVolume: Number(event.target.value) })} />
      </label>
      <label className="field">
        Громкость звуков
        <input type="range" min={0} max={1} step={0.05} value={settings.sfxVolume} onChange={(event) => updateSettings({ sfxVolume: Number(event.target.value) })} />
      </label>
      <div className="row">
        <Button tone={settings.music ? 'primary' : 'quiet'} aria-pressed={settings.music} onClick={() => updateSettings({ music: !settings.music })}>
          Музыка {settings.music ? 'вкл' : 'выкл'}
        </Button>
        <Button tone={settings.contrast ? 'primary' : 'quiet'} aria-pressed={settings.contrast} onClick={() => updateSettings({ contrast: !settings.contrast })}>
          Высокий контраст
        </Button>
        <Button tone={settings.reducedMotion ? 'primary' : 'quiet'} aria-pressed={settings.reducedMotion} onClick={() => updateSettings({ reducedMotion: !settings.reducedMotion })}>
          Меньше анимации
        </Button>
        <Button tone={settings.muted ? 'primary' : 'quiet'} aria-pressed={settings.muted} onClick={() => updateSettings({ muted: !settings.muted })}>
          Выключить звук
        </Button>
      </div>
      <Button tone="primary" onClick={onClose}>Готово</Button>
    </Modal>
  );
}

export function ResultScreen({
  profession,
  level,
  stars,
  finale,
  newStickers,
  onAgain,
  onNext,
  onMenu,
}: {
  profession: ProfessionId;
  level: Level;
  stars: number;
  finale: string;
  newStickers: string[];
  onAgain: () => void;
  onNext: () => void;
  onMenu: () => void;
}) {
  const info = PROFESSIONS.find((item) => item.id === profession)!;
  const names = STICKERS.filter((item) => newStickers.includes(item.id));
  return (
    <div className="center-page celebrate">
      <h2>{finale}</h2>
      <p>{info.title}, уровень {level}</p>
      <Stars count={stars} />
      <p>{starsWord(stars)}</p>
      {names.length ? (
        <div className="row">
          {names.map((sticker) => (
            <div key={sticker.id} className="sticker-slot">
              <StickerArt id={sticker.id} title={sticker.name} />
              <span>Новый стикер: {sticker.name}</span>
            </div>
          ))}
        </div>
      ) : null}
      <div className="row">
        <Button onClick={onAgain}>Ещё раз</Button>
        <Button tone="primary" onClick={onNext}>{level < 3 ? 'Дальше' : 'К уровням'}</Button>
        <Button onClick={onMenu}>В меню</Button>
      </div>
    </div>
  );
}
