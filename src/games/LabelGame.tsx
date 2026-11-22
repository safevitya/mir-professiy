import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { useEffect, useRef, useState } from 'react';
import { DECOR_STICKERS, STICKERS } from '../data';
import {
  FIELD_TITLE,
  LABEL_VIEW,
  ZONES,
  checkLabel,
  type LabelField,
  type LabelOption,
  type LabelTask,
} from '../game/label';
import { useStore } from '../store';
import type { GameApi } from '../types';
import { Shape, StickerArt, resolveEmoji } from '../ui/art';
import { Button, DragItem, DropZone, IconSpeaker, cx, useSfx } from '../ui/bits';

interface PlacedDecor {
  uid: string;
  id: string;
  x: number;
  y: number;
  size: number;
  rot: number;
}

const BG_COLORS = ['#ffffff', '#fff8e8', '#e5f4ef', '#eaf2fb', '#fdeef3'];
const BORDER_COLORS = ['#c8bba6', '#0f5c49', '#2c6eaa', '#b87a1a', '#b83b5e'];
const TEXT_COLORS = ['#1d2b27', '#0f5c49', '#2c6eaa', '#6b3e26', '#8a2346'];
const FONTS = [
  { id: 'sans', name: 'Обычный', css: '"Segoe UI", sans-serif' },
  { id: 'round', name: 'Мягкий', css: '"Trebuchet MS", sans-serif' },
  { id: 'serif', name: 'Книжный', css: 'Georgia, serif' },
];

export function LabelGame({
  task,
  register,
  onCheckLabel,
}: {
  task: LabelTask;
  register: (api: GameApi) => void;
  onCheckLabel: (label: string) => void;
  round: number;
}) {
  const { profile, addArtwork, say } = useStore();
  const sfx = useSfx();
  const [placed, setPlaced] = useState<Partial<Record<LabelField, string>>>({});
  const [activeField, setActiveField] = useState<LabelField>(task.required[0]);
  const [selectedOpt, setSelectedOpt] = useState<{ field: LabelField; id: string } | null>(null);
  const [badZones, setBadZones] = useState<LabelField[]>([]);
  const [hintZone, setHintZone] = useState<LabelField | null>(null);
  const [showZoneHints, setShowZoneHints] = useState(false);

  const [creativeUnlocked, setCreativeUnlocked] = useState(false);
  const [tab, setTab] = useState<'blocks' | 'decor'>('blocks');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [borderColor, setBorderColor] = useState('#c8bba6');
  const [textColor, setTextColor] = useState('#1d2b27');
  const [fontIdx, setFontIdx] = useState(0);

  const [tool, setTool] = useState<'none' | 'brush' | 'eraser'>('none');
  const [brushColor, setBrushColor] = useState('#0f5c49');
  const [decors, setDecors] = useState<PlacedDecor[]>([]);
  const [selectedDecor, setSelectedDecor] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    onCheckLabel(creativeUnlocked ? 'Готово' : 'Проверить');
  }, [creativeUnlocked, onCheckLabel]);

  function placeOption(field: LabelField, optionId: string) {
    sfx('put');
    setBadZones([]);
    setHintZone(null);
    setPlaced((current) => ({ ...current, [field]: optionId }));
  }

  function handleDragEnd(event: DragEndEvent) {
    if (!event.over) return;
    const overId = String(event.over.id);
    if (!overId.startsWith('zone:')) return;
    const zoneField = overId.slice(5) as LabelField;
    const raw = String(event.active.id);
    const sep = raw.indexOf(':');
    if (sep < 0) return;
    const optField = raw.slice(0, sep) as LabelField;
    const optId = raw.slice(sep + 1);
    if (optField === zoneField) {
      placeOption(zoneField, optId);
      setSelectedOpt(null);
    }
  }

  function coveredFields(): LabelField[] {
    const covered = new Set<LabelField>();
    for (const decor of decors) {
      const cxPx = (decor.x / 100) * LABEL_VIEW.w;
      const cyPx = (decor.y / 100) * LABEL_VIEW.h;
      const half = decor.size * 0.4;
      for (const field of task.required) {
        const z = ZONES[field];
        const overlapX = cxPx + half > z.x && cxPx - half < z.x + z.w;
        const overlapY = cyPx + half > z.y && cyPx - half < z.y + z.h;
        if (overlapX && overlapY) covered.add(field);
      }
    }
    return [...covered];
  }

  function renderPng(): string | null {
    const out = document.createElement('canvas');
    out.width = LABEL_VIEW.w * 2;
    out.height = LABEL_VIEW.h * 2;
    const ctx = out.getContext('2d');
    if (!ctx) return null;
    ctx.scale(2, 2);
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, LABEL_VIEW.w, LABEL_VIEW.h);
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, LABEL_VIEW.w - 6, LABEL_VIEW.h - 6);

    if (canvasRef.current) {
      ctx.drawImage(canvasRef.current, 0, 0, LABEL_VIEW.w, LABEL_VIEW.h);
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const emojiFont = '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
    for (const field of task.required) {
      const optId = placed[field];
      const opt = task.options[field].find((item) => item.id === optId);
      if (!opt) continue;
      const z = ZONES[field];
      const cx = z.x + z.w / 2;
      const cy = z.y + z.h / 2;
      if (opt.shape) {
        const boxSize = Math.min(72, z.w - 8, z.h - 8);
        ctx.save();
        ctx.fillStyle = opt.color ?? '#eee';
        ctx.strokeStyle = opt.accent ?? '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(cx - boxSize / 2, cy - boxSize / 2, boxSize, boxSize, 14);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#000';
        ctx.font = `${Math.round(boxSize * 0.64)}px ${emojiFont}`;
        ctx.fillText(resolveEmoji(undefined, opt.shape), cx, cy + 2);
        ctx.restore();
      } else {
        ctx.fillStyle = textColor;
        ctx.font = `bold ${field === 'name' ? 18 : 13}px ${FONTS[fontIdx].css}`;
        ctx.fillText(opt.text, cx, cy, z.w - 8);
      }
    }

    for (const decor of decors) {
      const x = (decor.x / 100) * LABEL_VIEW.w;
      const y = (decor.y / 100) * LABEL_VIEW.h;
      const boxSize = decor.size;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((decor.rot * Math.PI) / 180);
      ctx.fillStyle = '#fff4df';
      ctx.strokeStyle = '#b87a1a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-boxSize / 2, -boxSize / 2, boxSize, boxSize, 14);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#000';
      ctx.font = `${Math.round(boxSize * 0.58)}px ${emojiFont}`;
      ctx.fillText(resolveEmoji(decor.id), 0, 2);
      ctx.restore();
    }
    return out.toDataURL('image/png');
  }

  function canvasPoint(event: React.PointerEvent<HTMLCanvasElement>): { x: number; y: number } {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * LABEL_VIEW.w,
      y: ((event.clientY - rect.top) / rect.height) * LABEL_VIEW.h,
    };
  }

  function startDraw(event: React.PointerEvent<HTMLCanvasElement>) {
    if (tool === 'none') return;
    event.preventDefault();
    const ctx = event.currentTarget.getContext('2d');
    if (!ctx) return;
    drawingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    const pt = canvasPoint(event);
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
  }

  function moveDraw(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current || tool === 'none') return;
    const ctx = event.currentTarget.getContext('2d');
    if (!ctx) return;
    const pt = canvasPoint(event);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = tool === 'eraser' ? 18 : 6;
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = brushColor;
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
  }

  function endDraw() {
    drawingRef.current = false;
  }

  useEffect(() => {
    register({
      check: () => {
        const covered = coveredFields();
        const res = checkLabel(task, placed, covered);
        if (!res.ok) {
          sfx('again');
          setBadZones([...new Set([...res.empty, ...res.wrong, ...res.blocked])]);
          if (res.blocked.length > 0) {
            const msg = 'Освободи место для важных сведений.';
            return { status: 'error', message: msg, speech: msg };
          }
          const msg = 'Почти получилось! Проверь отмеченные блоки этикетки.';
          return { status: 'error', message: msg, speech: msg };
        }
        sfx('ok');
        setBadZones([]);
        if (!creativeUnlocked) {
          setCreativeUnlocked(true);
          setTab('decor');
          const msg = 'Обязательная часть готова! Можешь украсить этикетку или нажать «Готово».';
          return { status: 'next', message: msg, speech: msg };
        }
        return {
          status: 'done',
          message: 'Этикетка готова!',
          speech: 'Отличная этикетка!',
          finale: 'Этикетка оформлена!',
        };
      },
      hint: () => {
        setShowZoneHints(true);
        const target = task.required.find((field) => placed[field] !== task.correct[field]);
        if (!target) return { speech: 'Все обязательные блоки верны!' };
        setHintZone(target);
        setActiveField(target);
        const rightOpt = task.options[target].find((item) => item.id === task.correct[target]);
        return {
          speech: `Для блока «${FIELD_TITLE[target]}» выбери: ${rightOpt?.text ?? ''}.`,
        };
      },
      isDirty: () => Object.keys(placed).length > 0 || decors.length > 0,
    });
  });

  function findOption(field: LabelField, id?: string): LabelOption | undefined {
    return task.options[field].find((item) => item.id === id);
  }

  const unlockedStickers = STICKERS.filter((item) => profile?.stickers.includes(item.id));
  const activeDecor = decors.find((item) => item.uid === selectedDecor);

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <section className="panel" aria-label="Заявка на этикетку">
        <div className="spread">
          <h2>Заявка</h2>
          <Button tone="quiet" icon={<IconSpeaker />} onClick={() => say(task.intro)} aria-label="Озвучить заявку" />
        </div>
        <div className="stack">
          {task.required.map((field) => {
            const right = findOption(field, task.correct[field]);
            return (
              <div key={field} className={cx('order-row', hintZone === field && 'glow')}>
                {field === 'image' && right?.shape ? (
                  <Shape shape={right.shape} color={right.color ?? '#eee'} accent={right.accent ?? '#444'} />
                ) : null}
                <div className="grow">
                  <div className="tag">{FIELD_TITLE[field]}</div>
                  <b>{right?.text}</b>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel" aria-label="Заготовка этикетки">
        <h2>Заготовка</h2>
        <div
          className={cx('label-sheet', `label-${task.template}`)}
          style={{
            background: bgColor,
            borderColor,
            color: textColor,
            fontFamily: FONTS[fontIdx].css,
          }}
        >
          <canvas
            ref={canvasRef}
            width={LABEL_VIEW.w}
            height={LABEL_VIEW.h}
            className="paint"
            style={{
              pointerEvents: tool === 'none' ? 'none' : 'auto',
              zIndex: tool === 'none' ? 1 : 5,
            }}
            onPointerDown={startDraw}
            onPointerMove={moveDraw}
            onPointerUp={endDraw}
            onPointerCancel={endDraw}
          />
          {task.required.map((field) => {
            const z = ZONES[field];
            const opt = findOption(field, placed[field]);
            return (
              <div
                key={field}
                style={{
                  position: 'absolute',
                  left: `${(z.x / LABEL_VIEW.w) * 100}%`,
                  top: `${(z.y / LABEL_VIEW.h) * 100}%`,
                  width: `${(z.w / LABEL_VIEW.w) * 100}%`,
                  height: `${(z.h / LABEL_VIEW.h) * 100}%`,
                  pointerEvents: tool === 'none' ? 'auto' : 'none',
                  zIndex: 2,
                }}
              >
                <DropZone
                  id={`zone:${field}`}
                  label={`${FIELD_TITLE[field]}: ${opt?.text ?? 'пусто'}`}
                  className={cx(
                    'zone',
                    (task.zoneMode === 'labeled' || showZoneHints) && 'zone-labeled',
                    task.zoneMode === 'highlight' && 'zone-highlight',
                    task.zoneMode === 'plain' && !showZoneHints && 'zone-plain',
                    activeField === field && !creativeUnlocked && 'zone-active',
                    badZones.includes(field) && 'needs-fix',
                    hintZone === field && 'glow',
                  )}
                  onPress={() => {
                    if (selectedOpt && selectedOpt.field === field) {
                      placeOption(field, selectedOpt.id);
                      setSelectedOpt(null);
                    } else {
                      setActiveField(field);
                    }
                  }}
                >
                  {opt ? (
                    opt.shape ? (
                      <Shape shape={opt.shape} color={opt.color ?? '#eee'} accent={opt.accent ?? '#333'} />
                    ) : (
                      <span>{opt.text}</span>
                    )
                  ) : task.zoneMode === 'labeled' || showZoneHints ? (
                    <span className="tag">{FIELD_TITLE[field]}</span>
                  ) : null}
                </DropZone>
              </div>
            );
          })}
          {decors.map((decor) => (
            <button
              key={decor.uid}
              type="button"
              className={cx('decor', selectedDecor === decor.uid && 'selected')}
              style={{
                left: `${decor.x}%`,
                top: `${decor.y}%`,
                width: decor.size,
                height: decor.size,
                fontSize: `${Math.round(decor.size * 0.62)}px`,
                transform: `translate(-50%, -50%) rotate(${decor.rot}deg)`,
                background: 'transparent',
                border: 'none',
                padding: 0,
                pointerEvents: tool === 'none' ? 'auto' : 'none',
                zIndex: 3,
              }}
              aria-label="Украшение"
              onClick={() => setSelectedDecor((cur) => (cur === decor.uid ? null : decor.uid))}
            >
              <StickerArt id={decor.id} />
            </button>
          ))}
        </div>
      </section>

      <section className="panel" aria-label="Панель оформления">
        <div className="row">
          <Button tone={tab === 'blocks' ? 'primary' : 'quiet'} onClick={() => setTab('blocks')}>
            Блоки
          </Button>
          <Button
            tone={tab === 'decor' ? 'primary' : 'quiet'}
            disabled={!creativeUnlocked}
            onClick={() => setTab('decor')}
          >
            Украшения
          </Button>
        </div>

        {tab === 'blocks' ? (
          <div className="stack">
            <div className="row">
              {task.required.map((field) => (
                <Button
                  key={field}
                  tone={activeField === field ? 'primary' : 'quiet'}
                  onClick={() => setActiveField(field)}
                >
                  {FIELD_TITLE[field]} {placed[field] ? '✓' : ''}
                </Button>
              ))}
            </div>
            <p className="tag">Перетащи блок на этикетку или нажми вариант и нажми нужную зону:</p>
            <div className="stack">
              {task.options[activeField].map((opt) => (
                <DragItem
                  key={opt.id}
                  id={`${activeField}:${opt.id}`}
                  label={opt.text}
                  className="option"
                  selected={selectedOpt?.id === opt.id}
                  onSelect={() => {
                    sfx('take');
                    setSelectedOpt({ field: activeField, id: opt.id });
                  }}
                >
                  {opt.shape ? (
                    <Shape shape={opt.shape} color={opt.color ?? '#eee'} accent={opt.accent ?? '#333'} />
                  ) : null}
                  <span>{opt.text}</span>
                </DragItem>
              ))}
            </div>
          </div>
        ) : (
          <div className="stack">
            <b>Фон, рамка и текст</b>
            <div className="row">
              {BG_COLORS.map((c) => (
                <Button
                  key={c}
                  aria-label={`Фон ${c}`}
                  style={{ background: c }}
                  onClick={() => setBgColor(c)}
                >
                  {bgColor === c ? '✓' : 'Фон'}
                </Button>
              ))}
            </div>
            <div className="row">
              {BORDER_COLORS.map((c) => (
                <Button
                  key={c}
                  aria-label={`Рамка ${c}`}
                  style={{ borderColor: c, borderWidth: 4 }}
                  onClick={() => setBorderColor(c)}
                >
                  {borderColor === c ? '✓' : 'Рамка'}
                </Button>
              ))}
            </div>
            <div className="row">
              {TEXT_COLORS.map((c) => (
                <Button
                  key={c}
                  aria-label={`Цвет текста ${c}`}
                  style={{ color: c }}
                  onClick={() => setTextColor(c)}
                >
                  Аа
                </Button>
              ))}
              {FONTS.map((f, idx) => (
                <Button
                  key={f.id}
                  tone={fontIdx === idx ? 'primary' : 'quiet'}
                  onClick={() => setFontIdx(idx)}
                >
                  {f.name}
                </Button>
              ))}
            </div>

            <b>Кисть и ластик</b>
            <div className="row">
              <Button tone={tool === 'none' ? 'primary' : 'quiet'} onClick={() => setTool('none')}>
                Рука
              </Button>
              <Button tone={tool === 'brush' ? 'primary' : 'quiet'} onClick={() => setTool('brush')}>
                Кисть
              </Button>
              <Button tone={tool === 'eraser' ? 'primary' : 'quiet'} onClick={() => setTool('eraser')}>
                Ластик
              </Button>
              {['#0f5c49', '#e2a122', '#d64545', '#2c6eaa'].map((c) => (
                <Button
                  key={c}
                  aria-label={`Цвет кисти ${c}`}
                  style={{ background: c, color: '#fff' }}
                  onClick={() => {
                    setBrushColor(c);
                    setTool('brush');
                  }}
                >
                  ●
                </Button>
              ))}
              <Button
                tone="ghost"
                onClick={() => {
                  const ctx = canvasRef.current?.getContext('2d');
                  ctx?.clearRect(0, 0, LABEL_VIEW.w, LABEL_VIEW.h);
                }}
              >
                Очистить
              </Button>
            </div>

            <b>Наклейки</b>
            <div className="row">
              {[...DECOR_STICKERS, ...unlockedStickers].map((st) => (
                <Button
                  key={st.id}
                  tone="quiet"
                  onClick={() => {
                    sfx('put');
                    const uid = `${st.id}-${Date.now()}`;
                    setDecors((cur) => [...cur, { uid, id: st.id, x: 50, y: 88, size: 54, rot: 0 }]);
                    setSelectedDecor(uid);
                  }}
                >
                  <StickerArt id={st.id} title={st.name} />
                </Button>
              ))}
            </div>

            {activeDecor ? (
              <div className="row">
                <Button onClick={() => setDecors((c) => c.map((d) => (d.uid === activeDecor.uid ? { ...d, x: Math.max(8, d.x - 8) } : d)))}>
                  ←
                </Button>
                <Button onClick={() => setDecors((c) => c.map((d) => (d.uid === activeDecor.uid ? { ...d, x: Math.min(92, d.x + 8) } : d)))}>
                  →
                </Button>
                <Button onClick={() => setDecors((c) => c.map((d) => (d.uid === activeDecor.uid ? { ...d, y: Math.max(8, d.y - 8) } : d)))}>
                  ↑
                </Button>
                <Button onClick={() => setDecors((c) => c.map((d) => (d.uid === activeDecor.uid ? { ...d, y: Math.min(92, d.y + 8) } : d)))}>
                  ↓
                </Button>
                <Button onClick={() => setDecors((c) => c.map((d) => (d.uid === activeDecor.uid ? { ...d, rot: d.rot + 15 } : d)))}>
                  Повернуть
                </Button>
                <Button onClick={() => setDecors((c) => c.map((d) => (d.uid === activeDecor.uid ? { ...d, size: Math.min(96, d.size + 8) } : d)))}>
                  +
                </Button>
                <Button onClick={() => setDecors((c) => c.map((d) => (d.uid === activeDecor.uid ? { ...d, size: Math.max(32, d.size - 8) } : d)))}>
                  −
                </Button>
                <Button
                  tone="ghost"
                  onClick={() => {
                    setDecors((c) => c.filter((d) => d.uid !== activeDecor.uid));
                    setSelectedDecor(null);
                  }}
                >
                  Убрать
                </Button>
              </div>
            ) : null}

            <div className="row">
              <Button
                onClick={() => {
                  const dataUrl = renderPng();
                  if (!dataUrl) return;
                  const titleOpt = findOption('name', placed.name);
                  addArtwork({
                    id: `art-${Date.now()}`,
                    title: titleOpt?.text ?? 'Этикетка',
                    image: dataUrl,
                    createdAt: new Date().toISOString(),
                  });
                  setSavedMsg('Сохранено в «Мои работы»!');
                }}
              >
                Сохранить в Мои работы
              </Button>
              <Button
                onClick={() => {
                  const dataUrl = renderPng();
                  if (!dataUrl) return;
                  const link = document.createElement('a');
                  link.href = dataUrl;
                  link.download = 'etiketka.png';
                  link.click();
                }}
              >
                Скачать картинку
              </Button>
            </div>
            {savedMsg ? <p className="note">{savedMsg}</p> : null}
          </div>
        )}
      </section>
    </DndContext>
  );
}
