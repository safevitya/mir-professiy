import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { useEffect, useState } from 'react';
import { PLANTS, plantById } from '../data';
import { checkGarden, plantFits, type Care, type GardenerTask } from '../game/gardener';
import { useStore } from '../store';
import type { GameApi } from '../types';
import { Shape } from '../ui/art';
import { Button, DragItem, DropZone, IconSpeaker, cx, useSfx } from '../ui/bits';

const CARE_TOOLS: Array<{ id: Care; label: string; action: string; icon: string }> = [
  { id: 'water', label: 'Лейка', action: 'Полить', icon: '🚿' },
  { id: 'weed', label: 'Тяпка', action: 'Прополоть', icon: '🪓' },
  { id: 'prune', label: 'Секатор', action: 'Обрезать', icon: '✂️' },
];

function makeGrid<T>(size: number, fill: T): T[][] {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => fill));
}

export function GardenerGame({
  task,
  register,
}: {
  task: GardenerTask;
  register: (api: GameApi) => void;
  onCheckLabel: (label: string) => void;
  round: number;
}) {
  const { say } = useStore();
  const sfx = useSfx();
  const [grid, setGrid] = useState<(string | null)[][]>(() => makeGrid(task.size, null));
  const [cared, setCared] = useState<boolean[][]>(() => makeGrid(task.size, false));
  const [selectedPlant, setSelectedPlant] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<Care | 'remove' | null>(null);
  const [badCells, setBadCells] = useState<string[]>([]);
  const [hintCell, setHintCell] = useState<string | null>(null);
  const [showIcons, setShowIcons] = useState(task.icons === 'always');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function placePlant(r: number, c: number, plantId: string) {
    sfx('put');
    setBadCells([]);
    setHintCell(null);
    setGrid((cur) => cur.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? plantId : cell)) : row)));
    setCared((cur) => cur.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? false : cell)) : row)));
  }

  function clearCell(r: number, c: number) {
    sfx('click');
    setBadCells([]);
    setGrid((cur) => cur.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? null : cell)) : row)));
    setCared((cur) => cur.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? false : cell)) : row)));
  }

  function applyTool(r: number, c: number, tool: Care) {
    const plantId = grid[r][c];
    if (!plantId) return;
    if (task.care[r][c] === tool) {
      sfx('snap');
      setBadCells([]);
      setHintCell(null);
      setCared((cur) => cur.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? true : cell)) : row)));
    } else {
      sfx('again');
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    if (!event.over) return;
    const overId = String(event.over.id);
    if (!overId.startsWith('cell:')) return;
    const [, rStr, cStr] = overId.split(':');
    const plantId = String(event.active.id);
    placePlant(Number(rStr), Number(cStr), plantId);
    setSelectedPlant(null);
    setActiveTool(null);
  }

  useEffect(() => {
    register({
      check: () => {
        const res = checkGarden(task, grid, cared);
        if (res.ok) {
          sfx('ok');
          return {
            status: 'done',
            message: 'Клумба готова!',
            speech: 'Прекрасная клумба! Все растения здоровы!',
            finale: 'Клумба расцвела!',
          };
        }
        sfx('again');
        setBadCells(res.bad.map((item) => `${item.r}:${item.c}`));
        const msg = res.careLeft
          ? 'Растения на месте, но им нужен уход! Выбери инструмент.'
          : 'Почти получилось! Проверь отмеченные клетки.';
        return { status: 'error', message: msg, speech: msg };
      },
      hint: () => {
        setShowIcons(true);
        for (let r = 0; r < task.size; r += 1) {
          for (let c = 0; c < task.size; c += 1) {
            const want = task.scheme[r][c];
            if (grid[r][c] !== want) {
              setHintCell(`${r}:${c}`);
              if (want) {
                const p = plantById(want);
                return { speech: `Ряд ${r + 1}, место ${c + 1}: посади ${p.name}.` };
              }
              return { speech: `Ряд ${r + 1}, место ${c + 1}: должно быть пусто.` };
            }
          }
        }
        for (let r = 0; r < task.size; r += 1) {
          for (let c = 0; c < task.size; c += 1) {
            const need = task.care[r][c];
            if (need && !cared[r][c]) {
              setHintCell(`${r}:${c}`);
              const toolName = CARE_TOOLS.find((t) => t.id === need)?.label ?? '';
              return { speech: `Ряд ${r + 1}, место ${c + 1}: нужен инструмент «${toolName}».` };
            }
          }
        }
        return { speech: 'Всё готово! Нажми «Проверить».' };
      },
      isDirty: () => grid.some((row) => row.some(Boolean)),
    });
  });

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <section className="panel" aria-label="Схема клумбы">
        <div className="spread">
          <h2>Схема</h2>
          <Button tone="quiet" icon={<IconSpeaker />} onClick={() => say(task.intro)} aria-label="Озвучить схему" />
        </div>
        <div className="stack">
          {task.intro.slice(1).map((line, i) => (
            <p key={i} className="note">{line}</p>
          ))}
        </div>
        <div
          className="plot scheme tiny"
          style={{
            gridTemplateColumns: `repeat(${task.size}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${task.size}, minmax(0, 1fr))`,
          }}
          aria-label="Образец расположения растений"
        >
          {task.scheme.map((row, r) =>
            row.map((plantId, c) => {
              const p = plantId ? plantById(plantId) : null;
              return (
                <div key={`${r}-${c}`} className="cell">
                  {p ? (
                    <Shape id={p.id} shape={p.shape} color={p.color} accent={p.accent} title={p.name} />
                  ) : null}
                </div>
              );
            }),
          )}
        </div>
      </section>

      <section className="panel" aria-label="Клумба">
        <div className="spread">
          <h2>Клумба</h2>
          {activeTool ? (
            <span className="tag">
              Инструмент: {activeTool === 'remove' ? 'Лопатка (убрать)' : CARE_TOOLS.find((t) => t.id === activeTool)?.label}
            </span>
          ) : selectedPlant ? (
            <span className="tag">Растение: {plantById(selectedPlant).name}</span>
          ) : null}
        </div>
        <div
          className="plot"
          style={{
            gridTemplateColumns: `repeat(${task.size}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${task.size}, minmax(0, 1fr))`,
          }}
        >
          {grid.map((row, r) =>
            row.map((plantId, c) => {
              const key = `${r}:${c}`;
              const plant = plantId ? plantById(plantId) : null;
              const fitsSpot = plant ? plantFits(task, plant, r, c) : true;
              const needCare = plant ? task.care[r][c] : null;
              const isCared = cared[r][c];
              const careTool = needCare ? CARE_TOOLS.find((t) => t.id === needCare) : null;
              const careClass =
                plant && needCare && !isCared
                  ? needCare === 'water'
                    ? 'wilt'
                    : needCare === 'weed'
                      ? 'weedy'
                      : 'grown'
                  : '';
              const sunIcon = task.sun[r][c] ? '☀️' : '🌙';
              const wetIcon = task.checkWet ? (task.wet[r][c] ? '💧' : '🏜️') : '';

              return (
                <DropZone
                  key={key}
                  id={`cell:${key}`}
                  label={`Клетка ${r + 1}-${c + 1}: ${plant?.name ?? 'пусто'}`}
                  className={cx(
                    'cell',
                    !fitsSpot && 'bad-spot',
                    careClass,
                    isCared && plant && 'is-ok',
                    badCells.includes(key) && 'needs-fix',
                    hintCell === key && 'glow',
                  )}
                  onPress={() => {
                    if (activeTool === 'remove' && plant) {
                      clearCell(r, c);
                    } else if (activeTool && activeTool !== 'remove' && plant) {
                      applyTool(r, c, activeTool);
                    } else if (selectedPlant) {
                      if (plant?.id === selectedPlant) {
                        clearCell(r, c);
                      } else {
                        placePlant(r, c, selectedPlant);
                      }
                    } else if (plant) {
                      clearCell(r, c);
                    }
                  }}
                >
                  <span style={{ position: 'absolute', left: 4, top: 3, fontSize: '0.68em', lineHeight: 1, zIndex: 1 }}>
                    {sunIcon}{wetIcon}
                  </span>
                  {plant ? (
                    <>
                      <button
                        type="button"
                        className="cell-remove"
                        aria-label={`Убрать ${plant.name}`}
                        title="Убрать растение"
                        onClick={(event) => {
                          event.stopPropagation();
                          clearCell(r, c);
                        }}
                      >
                        ✕
                      </button>
                      <Shape id={plant.id} shape={plant.shape} color={plant.color} accent={plant.accent} />
                      {needCare && !isCared && careTool ? (
                        <span className="care-badge" title={`${careTool.action} (${careTool.label})`}>
                          {careTool.icon} {task.size <= 4 ? careTool.action : ''}
                        </span>
                      ) : isCared ? (
                        <span className="care-badge care-done" title="Ухожено">
                          ✓
                        </span>
                      ) : null}
                    </>
                  ) : null}
                </DropZone>
              );
            }),
          )}
        </div>
      </section>

      <section className="panel" aria-label="Растения и уход">
        <h2>Уход</h2>
        <div className="row">
          {CARE_TOOLS.filter((tool) => task.careTypes.includes(tool.id)).map((tool) => (
            <Button
              key={tool.id}
              tone={activeTool === tool.id ? 'primary' : 'quiet'}
              aria-pressed={activeTool === tool.id}
              onClick={() => {
                sfx('click');
                setSelectedPlant(null);
                setActiveTool((cur) => (cur === tool.id ? null : tool.id));
              }}
            >
              {tool.icon} {tool.label}
            </Button>
          ))}
          <Button
            tone={activeTool === 'remove' ? 'primary' : 'quiet'}
            aria-pressed={activeTool === 'remove'}
            onClick={() => {
              sfx('click');
              setSelectedPlant(null);
              setActiveTool((cur) => (cur === 'remove' ? null : 'remove'));
            }}
          >
            🗑️ Убрать
          </Button>
        </div>

        <div className="spread">
          <h2>Растения</h2>
          {!showIcons ? (
            <Button tone="quiet" onClick={() => setShowIcons(true)}>
              Значки условий
            </Button>
          ) : null}
        </div>
        <div className="catalog">
          {PLANTS.map((plant) => (
            <DragItem
              key={plant.id}
              id={plant.id}
              label={plant.name}
              className="plant-card"
              selected={selectedPlant === plant.id}
              onSelect={() => {
                sfx('take');
                setActiveTool(null);
                setSelectedPlant((cur) => (cur === plant.id ? null : plant.id));
              }}
            >
              <Shape id={plant.id} shape={plant.shape} color={plant.color} accent={plant.accent} />
              <span>{plant.name}</span>
              {showIcons ? (
                <span className="tag">
                  {plant.sun ? '☀️' : '🌙'} {task.checkWet ? (plant.wet ? '💧' : '🏜️') : ''}
                </span>
              ) : null}
            </DragItem>
          ))}
        </div>
      </section>
    </DndContext>
  );
}
