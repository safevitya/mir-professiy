import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { useEffect, useState } from 'react';
import { checkKit, type AssemblerTask } from '../game/assembler';
import { useStore } from '../store';
import type { GameApi } from '../types';
import { Shape } from '../ui/art';
import { Button, DragItem, DropZone, IconSpeaker, cx, useSfx } from '../ui/bits';

export function AssemblerGame({
  task,
  register,
  onCheckLabel,
}: {
  task: AssemblerTask;
  register: (api: GameApi) => void;
  onCheckLabel: (label: string) => void;
  round: number;
}) {
  const { say } = useStore();
  const sfx = useSfx();
  const [phase, setPhase] = useState<'kit' | 'build'>('kit');
  const [markedMissing, setMarkedMissing] = useState<string[]>([]);
  const [markedExtra, setMarkedExtra] = useState<string[]>([]);
  const [claimedAllGood, setClaimedAllGood] = useState(false);

  const [stepIndex, setStepIndex] = useState(0);
  const [placedIds, setPlacedIds] = useState<string[]>([]);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [showStepHint, setShowStepHint] = useState(false);
  const [alive, setAlive] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const currentStep = task.parts[stepIndex] ?? null;

  useEffect(() => {
    onCheckLabel(phase === 'kit' ? 'Проверить комплект' : 'Проверить');
  }, [phase, onCheckLabel]);

  function toggleMissing(partId: string) {
    sfx('click');
    setClaimedAllGood(false);
    setMarkedMissing((cur) => (cur.includes(partId) ? cur.filter((id) => id !== partId) : [...cur, partId]));
  }

  function toggleExtra(kitId: string) {
    sfx('click');
    setClaimedAllGood(false);
    setMarkedExtra((cur) => (cur.includes(kitId) ? cur.filter((id) => id !== kitId) : [...cur, kitId]));
  }

  function tryPlace(partId: string, targetId?: string) {
    if (!currentStep) return;
    if (partId === currentStep.id && (!targetId || targetId === currentStep.id)) {
      sfx('snap');
      setPlacedIds((cur) => [...cur, partId]);
      setStepIndex((cur) => cur + 1);
      setSelectedPartId(null);
      setShowStepHint(false);
      if (stepIndex + 1 >= task.parts.length) {
        setAlive(true);
      }
    } else {
      sfx('again');
      say(`Сейчас нужна деталь: ${currentStep.name}.`);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    if (!event.over || phase !== 'build') return;
    const overId = String(event.over.id);
    const partId = String(event.active.id);
    if (overId === 'board-any') {
      tryPlace(partId);
    } else if (overId.startsWith('slot:')) {
      tryPlace(partId, overId.slice(5));
    }
  }

  useEffect(() => {
    register({
      check: () => {
        if (phase === 'kit') {
          const ok = checkKit(task, markedMissing, markedExtra, claimedAllGood);
          if (!ok) {
            sfx('again');
            const msg = 'Почти получилось! Сверь детали с перечнем.';
            return { status: 'error', message: msg, speech: msg };
          }
          sfx('ok');
          setPhase('build');
          const msg = `Комплект проверен! Собираем: ${task.productName}.`;
          return { status: 'next', message: msg, speech: msg };
        }
        if (placedIds.length < task.parts.length) {
          sfx('again');
          const msg = `Собери все детали. Сейчас: ${currentStep?.name ?? ''}.`;
          return { status: 'error', message: msg, speech: msg };
        }
        sfx('ok');
        setAlive(true);
        return {
          status: 'done',
          message: task.finale,
          speech: task.finale,
          finale: task.finale,
        };
      },
      hint: () => {
        if (phase === 'kit') {
          if (task.missingPartIds.length === 0 && task.extraKitIds.length === 0) {
            return { speech: 'Все детали на месте. Нажми «Всё на месте».' };
          }
          if (task.missingPartIds.length > 0) {
            const missing = task.parts.find((p) => task.missingPartIds.includes(p.id));
            return { speech: `В наборе не хватает детали: ${missing?.name ?? ''}. Отметь её в перечне.` };
          }
          return { speech: 'В наборе есть лишняя или неподходящая деталь. Отметь её.' };
        }
        setShowStepHint(true);
        if (!currentStep) return { speech: 'Изделие собрано! Нажми «Проверить».' };
        return { speech: `Шаг ${stepIndex + 1}: поставь «${currentStep.name}».` };
      },
      isDirty: () =>
        phase === 'build' ||
        markedMissing.length > 0 ||
        markedExtra.length > 0 ||
        claimedAllGood ||
        placedIds.length > 0,
    });
  });

  if (phase === 'kit') {
    return (
      <>
        <section className="panel" aria-label="Перечень деталей">
          <div className="spread">
            <h2>Перечень</h2>
            <Button tone="quiet" icon={<IconSpeaker />} onClick={() => say(task.intro)} aria-label="Озвучить" />
          </div>
          <p className="tag">
            {task.level === 1
              ? 'Сверь набор с перечнем.'
              : 'Если детали нет в наборе — нажми на неё в перечне.'}
          </p>
          <div className="stack">
            {task.parts.map((part) => {
              const isMiss = markedMissing.includes(part.id);
              return (
                <button
                  key={part.id}
                  type="button"
                  className={cx('part-row', isMiss && 'marked')}
                  onClick={() => (task.level > 1 ? toggleMissing(part.id) : undefined)}
                >
                  <Shape id={part.id} shape={part.shape} color={part.color} accent={part.accent} />
                  <span className="grow">{part.name}</span>
                  {isMiss ? <span className="tag">Нет</span> : null}
                </button>
              );
            })}
          </div>
        </section>

        <section className="panel" aria-label="Набор деталей">
          <h2>Набор деталей</h2>
          {task.level === 3 ? (
            <p className="tag">Если есть лишняя или чужая деталь — нажми на неё.</p>
          ) : null}
          <div className="kit-grid">
            {task.kit.map((piece) => {
              const isExtra = markedExtra.includes(piece.id);
              return (
                <button
                  key={piece.id}
                  type="button"
                  className={cx('piece', isExtra && 'marked')}
                  onClick={() => (task.level === 3 ? toggleExtra(piece.id) : undefined)}
                >
                  <Shape id={piece.partId ?? piece.id} shape={piece.shape} color={piece.color} accent={piece.accent} />
                  <span>{piece.name}</span>
                  {isExtra ? <span className="tag">Лишняя</span> : null}
                </button>
              );
            })}
          </div>
        </section>

        <section className="panel" aria-label="Проверка комплекта">
          <h2>Проверка</h2>
          <p className="note">Проверь, все ли детали для «{task.productName}» на месте.</p>
          <Button
            tone={claimedAllGood ? 'primary' : 'default'}
            aria-pressed={claimedAllGood}
            onClick={() => {
              sfx('click');
              setMarkedMissing([]);
              setMarkedExtra([]);
              setClaimedAllGood((cur) => !cur);
            }}
          >
            {claimedAllGood ? 'Всё на месте ✓' : 'Всё на месте'}
          </Button>
        </section>
      </>
    );
  }

  const remainingParts = task.parts.filter((part) => !placedIds.includes(part.id));

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <section className="panel" aria-label="Инструкция сборки">
        <div className="spread">
          <h2>{task.productName}</h2>
          <Button
            tone="quiet"
            icon={<IconSpeaker />}
            onClick={() => say(currentStep ? `Шаг ${stepIndex + 1}: ${currentStep.name}.` : task.finale)}
            aria-label="Озвучить шаг"
          />
        </div>
        <div className="stack">
          {task.parts.map((part, idx) => {
            const done = placedIds.includes(part.id);
            const isCur = idx === stepIndex;
            if (task.instruction === 'scheme' && !showStepHint && !done) {
              return (
                <div key={part.id} className="part-row">
                  <span>{idx + 1}. {part.name}</span>
                </div>
              );
            }
            return (
              <div
                key={part.id}
                className={cx(
                  'part-row',
                  done && 'is-ok',
                  isCur && (task.instruction === 'highlight' || showStepHint) && 'glow',
                )}
              >
                <Shape id={part.id} shape={part.shape} color={part.color} accent={part.accent} />
                <span className="grow">
                  {isCur ? '→ ' : ''}
                  {idx + 1}. {part.name}
                </span>
                {done ? <b>✓</b> : null}
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel" aria-label="Рабочее поле сборки">
        <h2>Сборка ({placedIds.length} / {task.parts.length})</h2>
        <DropZone
          id="board-any"
          className={cx('board', alive && `alive-${task.category}`)}
          label="Поле сборки"
          onPress={() => {
            if (selectedPartId && task.placeMode === 'none') {
              tryPlace(selectedPartId);
            }
          }}
        >
          {task.parts.map((part) => {
            const isPlaced = placedIds.includes(part.id);
            const isCurrent = currentStep?.id === part.id;
            if (isPlaced) {
              return (
                <div
                  key={part.id}
                  className="placed"
                  style={{ left: `${part.x}%`, top: `${part.y}%` }}
                >
                  <Shape id={part.id} shape={part.shape} color={part.color} accent={part.accent} />
                  <small>{part.name}</small>
                </div>
              );
            }
            const showSlot =
              task.placeMode === 'all' ||
              (task.placeMode === 'current' && isCurrent) ||
              (showStepHint && isCurrent);
            if (!showSlot) return null;
            return (
              <div
                key={part.id}
                style={{
                  position: 'absolute',
                  left: `${part.x}%`,
                  top: `${part.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <DropZone
                  id={`slot:${part.id}`}
                  className={cx('slot', isCurrent && (task.instruction === 'highlight' || showStepHint) && 'glow')}
                  label={`Место: ${part.name}`}
                  onPress={() => {
                    if (selectedPartId) tryPlace(selectedPartId, part.id);
                  }}
                >
                  <small>{part.name}</small>
                </DropZone>
              </div>
            );
          })}
        </DropZone>
      </section>

      <section className="panel" aria-label="Детали для сборки">
        <h2>Детали</h2>
        {remainingParts.length === 0 ? (
          <p className="note">{task.finale}</p>
        ) : (
          <div className="kit-grid">
            {remainingParts.map((part) => (
              <DragItem
                key={part.id}
                id={part.id}
                label={part.name}
                className="piece"
                selected={selectedPartId === part.id}
                onSelect={() => {
                  sfx('take');
                  setSelectedPartId((cur) => (cur === part.id ? null : part.id));
                }}
              >
                <Shape id={part.id} shape={part.shape} color={part.color} accent={part.accent} />
                <span>{part.name}</span>
              </DragItem>
            ))}
          </div>
        )}
      </section>
    </DndContext>
  );
}
