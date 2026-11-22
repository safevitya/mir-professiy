import { useEffect, useRef, useState } from 'react';
import { PROFESSIONS } from '../data';
import { generateTask, randomCategory } from '../game';
import { randomSeed } from '../game/rng';
import { starsWord } from '../game/text';
import { applyWin, starsForFails } from '../progress';
import type { CheckResult, GameApi, Level, ProfessionId } from '../types';
import { Mascot } from '../ui/art';
import { Button, IconBack, IconSpeaker, Modal } from '../ui/bits';
import { useStore } from '../store';
import { AssemblerGame } from '../games/AssemblerGame';
import { GardenerGame } from '../games/GardenerGame';
import { LabelGame } from '../games/LabelGame';
import { OperatorGame } from '../games/OperatorGame';
import { PickerGame } from '../games/PickerGame';

const spoken = new Set<string>();

export interface RoundResult {
  profession: ProfessionId;
  level: Level;
  stars: number;
  finale: string;
  newStickers: string[];
}

export function GameScreen({
  profession,
  level,
  category,
  onBack,
  onMenu,
  onDone,
}: {
  profession: ProfessionId;
  level: Level;
  category?: 'furniture' | 'constructor' | 'electronics';
  onBack: () => void;
  onMenu: () => void;
  onDone: (result: RoundResult) => void;
}) {
  const { profile, say, updateProfile } = useStore();
  const info = PROFESSIONS.find((item) => item.id === profession)!;
  const [task, setTask] = useState(() => {
    const seed = randomSeed();
    const key = `${profession}-${level}`;
    const chosen = profession === 'assembler' ? category ?? randomCategory(seed) : undefined;
    return generateTask(profession, level, {
      seed,
      avoid: profile?.lastTasks[key],
      category: chosen,
    });
  });
  const apiRef = useRef<GameApi | null>(null);
  const hintsRef = useRef(0);
  const checksRef = useRef(0);
  const failsRef = useRef(0);
  const [bubble, setBubble] = useState(task.intro[0] ?? '');
  const [mood, setMood] = useState<'calm' | 'happy' | 'think'>('calm');
  const [pending, setPending] = useState(false);
  const [leave, setLeave] = useState<'back' | 'menu' | null>(null);
  const [checkLabel, setCheckLabel] = useState('Проверить');
  const [round, setRound] = useState(0);

  useEffect(() => {
    const key = `${profession}-${level}`;
    updateProfile((current) => {
      if (current.lastTasks[key] === task.signature) return current;
      return { ...current, lastTasks: { ...current.lastTasks, [key]: task.signature } };
    });
  }, [profession, level, task.signature, updateProfile]);

  useEffect(() => {
    if (spoken.has(task.id)) return;
    spoken.add(task.id);
    say(task.intro);
  }, [task, say]);

  function askLeave(target: 'back' | 'menu') {
    if (apiRef.current?.isDirty()) setLeave(target);
    else if (target === 'back') onBack();
    else onMenu();
  }

  async function onCheck() {
    const api = apiRef.current;
    if (!api || pending) return;
    setPending(true);
    try {
      const result: CheckResult = await api.check();
      checksRef.current += 1;
      setBubble(result.message);
      setMood(result.status === 'error' ? 'think' : 'happy');
      if (result.status === 'error') failsRef.current += 1;
      if (result.status === 'done') {
        const stars = starsForFails(failsRef.current);
        const finale = result.finale ?? result.message;
        say(`${result.speech} ${starsWord(stars)}.`);
        let fresh: string[] = [];
        updateProfile((current) => {
          const applied = applyWin(current, {
            profession,
            level,
            stars,
            hints: hintsRef.current,
            checks: checksRef.current,
          });
          fresh = applied.newStickers;
          return applied.profile;
        });
        onDone({ profession, level, stars, finale, newStickers: fresh });
        return;
      }
      say(result.speech);
    } finally {
      setPending(false);
    }
  }

  function onHint() {
    const speech = apiRef.current?.hint().speech ?? 'Посмотри на заявку.';
    hintsRef.current += 1;
    setBubble(speech);
    setMood('think');
    say(speech);
  }

  const gameProps = {
    task: task as never,
    register: (api: GameApi) => {
      apiRef.current = api;
    },
    onCheckLabel: setCheckLabel,
    round,
  };

  return (
    <>
      <div className="game-layout">
        {task.kind === 'picker' ? <PickerGame {...gameProps} task={task} /> : null}
        {task.kind === 'operator' ? <OperatorGame {...gameProps} task={task} /> : null}
        {task.kind === 'label' ? <LabelGame {...gameProps} task={task} /> : null}
        {task.kind === 'gardener' ? <GardenerGame {...gameProps} task={task} /> : null}
        {task.kind === 'assembler' ? <AssemblerGame {...gameProps} task={task} /> : null}
      </div>
      <div className="footer-bar">
        <div className="bubble" aria-live="polite">
          <Mascot mood={mood} />
          <span>{bubble}</span>
        </div>
        <Button onClick={onHint}>Подсказка</Button>
        <Button tone="primary" disabled={pending} onClick={() => void onCheck()}>{checkLabel}</Button>
        <Button tone="quiet" icon={<IconSpeaker />} onClick={() => say(task.intro)}>Озвучить</Button>
        <Button tone="ghost" icon={<IconBack />} onClick={() => askLeave('back')}>Назад</Button>
      </div>
      {leave ? (
        <Modal title="Выйти из игры?" onClose={() => setLeave(null)}>
          <p>Эта заявка начнётся сначала.</p>
          <div className="row">
            <Button onClick={() => setLeave(null)}>Остаться</Button>
            <Button
              tone="primary"
              onClick={() => {
                const target = leave;
                setLeave(null);
                if (target === 'back') onBack();
                else onMenu();
              }}
            >
              Выйти
            </Button>
          </div>
        </Modal>
      ) : null}
      <span className="sr-only">{info.title}</span>
      <button type="button" hidden onClick={() => setRound((value) => value + 1)} />
    </>
  );
}
