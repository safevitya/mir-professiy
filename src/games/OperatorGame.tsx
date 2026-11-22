import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { useEffect, useState } from 'react';
import { checkFill, checkMarks, lineValue, markKey, type OpField, type OpMark, type OperatorTask } from '../game/operator';
import { useStore } from '../store';
import type { GameApi } from '../types';
import { Button, DragItem, DropZone, IconSpeaker, cx, useSfx } from '../ui/bits';

const FIELD_NAMES: Record<OpField, string> = {
  product: 'Товар',
  qty: 'Кол-во',
  unit: 'Ед.',
  date: 'Дата',
  price: 'Цена',
};

const RU_ROWS = [
  ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ё'],
  ['Ж', 'З', 'И', 'Й', 'К', 'Л', 'М'],
  ['Н', 'О', 'П', 'Р', 'С', 'Т', 'У'],
  ['Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Щ', 'Ъ'],
  ['Ы', 'Ь', 'Э', 'Ю', 'Я'],
];

const NUM_ROWS = [
  ['1', '2', '3', '4', '5'],
  ['6', '7', '8', '9', '0'],
  ['.', '←', 'Очистить'],
];

export function OperatorGame({
  task,
  register,
  onCheckLabel,
}: {
  task: OperatorTask;
  register: (api: GameApi) => void;
  onCheckLabel: (label: string) => void;
  round: number;
}) {
  const { say } = useStore();
  const sfx = useSfx();
  const [step, setStep] = useState<'fill' | 'marks'>('fill');
  const [rows, setRows] = useState<Record<string, Partial<Record<OpField, string>>>>({});
  const [activeCell, setActiveCell] = useState<{ lineId: string; field: OpField }>({
    lineId: task.lines[0].id,
    field: task.fields[0],
  });
  const [selectedCard, setSelectedCard] = useState<{ field: OpField; value: string } | null>(null);
  const [badCells, setBadCells] = useState<string[]>([]);
  const [marks, setMarks] = useState<OpMark[]>([]);
  const [hintTarget, setHintTarget] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    onCheckLabel(step === 'fill' ? 'Проверить таблицу' : 'Проверить ошибки');
  }, [step, onCheckLabel]);

  function setCell(lineId: string, field: OpField, value: string) {
    sfx('put');
    setBadCells([]);
    setHintTarget(null);
    setRows((current) => ({
      ...current,
      [lineId]: { ...(current[lineId] ?? {}), [field]: value },
    }));
  }

  function handleDragEnd(event: DragEndEvent) {
    if (!event.over) return;
    const overId = String(event.over.id);
    if (!overId.startsWith('cell:')) return;
    const [, lineId, field] = overId.split(':');
    const cardRaw = String(event.active.id);
    const sep = cardRaw.indexOf(':');
    if (sep < 0) return;
    const cardField = cardRaw.slice(0, sep) as OpField;
    const value = cardRaw.slice(sep + 1);
    if (cardField === field) {
      setCell(lineId, field as OpField, value);
      setSelectedCard(null);
    }
  }

  function toggleMark(mark: OpMark) {
    sfx('click');
    setHintTarget(null);
    const key = markKey(mark);
    setMarks((current) =>
      current.some((item) => markKey(item) === key)
        ? current.filter((item) => markKey(item) !== key)
        : [...current, mark],
    );
  }

  function pressKey(k: string) {
    sfx('click');
    const { lineId, field } = activeCell;
    const cur = rows[lineId]?.[field] ?? '';
    if (k === 'Очистить') {
      setCell(lineId, field, '');
      return;
    }
    if (k === '←') {
      setCell(lineId, field, cur.slice(0, -1));
      return;
    }
    if (k === 'Пробел') {
      setCell(lineId, field, cur + ' ');
      return;
    }
    const next = cur.length === 0 ? k : cur + k.toLowerCase();
    setCell(lineId, field, next);
  }

  useEffect(() => {
    register({
      check: () => {
        if (step === 'fill') {
          const res = checkFill(task, rows);
          if (!res.ok) {
            sfx('again');
            setBadCells(res.bad.map((item) => `${item.lineId}:${item.field}`));
            const msg = 'Почти получилось! Проверь жёлтые ячейки.';
            return { status: 'error', message: msg, speech: msg };
          }
          sfx('ok');
          setBadCells([]);
          setHintTarget(null);
          setStep('marks');
          const msg = 'Таблица готова! Теперь найди ошибки в таблице коллеги.';
          return { status: 'next', message: msg, speech: msg };
        }
        const res = checkMarks(task, marks);
        if (res.ok) {
          sfx('ok');
          return {
            status: 'done',
            message: 'Все ошибки найдены!',
            speech: 'Отлично! Все ошибки найдены!',
            finale: 'Данные проверены!',
          };
        }
        sfx('again');
        const msg =
          res.missed > 0
            ? 'Почти получилось! Есть ещё ошибка, сравни с заявкой.'
            : 'Проверь отмеченные места: среди них есть верные.';
        return { status: 'error', message: msg, speech: msg };
      },
      hint: () => {
        if (step === 'fill') {
          for (const line of task.lines) {
            for (const field of task.fields) {
              const expected = lineValue(line, field);
              const got = (rows[line.id]?.[field] ?? '').trim().toLowerCase();
              if (got !== expected.toLowerCase()) {
                setHintTarget(`${line.id}:${field}`);
                setActiveCell({ lineId: line.id, field });
                return {
                  speech: `Строка ${task.lines.indexOf(line) + 1}, столбец «${FIELD_NAMES[field]}»: нужно «${expected}».`,
                };
              }
            }
          }
          return { speech: 'Всё заполнено! Нажми «Проверить таблицу».' };
        }
        const markedKeys = new Set(marks.map(markKey));
        const missingErr = task.errors.find((err) => !markedKeys.has(markKey(err)));
        if (missingErr) {
          const key = markKey(missingErr);
          setHintTarget(key);
          if (missingErr.type === 'missing') {
            return { speech: 'Посмотри в заявку: одной строки нет в таблице коллеги.' };
          }
          if (missingErr.type === 'extra') {
            return { speech: 'В таблице коллеги есть лишняя строка, которой нет в заявке.' };
          }
          return { speech: `Проверь столбец «${FIELD_NAMES[missingErr.field]}» в таблице коллеги.` };
        }
        return { speech: 'Нажми «Проверить ошибки».' };
      },
      isDirty: () =>
        step === 'marks' ||
        Object.values(rows).some((row) => Object.values(row).some((val) => Boolean(val?.trim()))),
    });
  });

  const qtyChoices = ['1', '2', '3', '4', '5', '6', '7', '8'];
  const markedKeys = new Set(marks.map(markKey));

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <section className="panel" aria-label="Заявка">
        <div className="spread">
          <h2>Заявка</h2>
          <Button tone="quiet" icon={<IconSpeaker />} onClick={() => say(task.intro)} aria-label="Озвучить заявку" />
        </div>
        <div className="stack">
          {task.lines.map((line, index) => {
            const missingKey = `missing:${line.id}`;
            const isMissingMarked = markedKeys.has(missingKey);
            return (
              <div
                key={line.id}
                className={cx(
                  'order-row',
                  hintTarget === missingKey && 'glow',
                  isMissingMarked && 'marked',
                )}
              >
                <b>{index + 1}.</b>
                <span className="grow">
                  {task.fields.map((field) => lineValue(line, field)).join(' · ')}
                </span>
                {step === 'marks' && task.level === 3 ? (
                  <Button
                    tone={isMissingMarked ? 'primary' : 'quiet'}
                    onClick={() => toggleMark({ type: 'missing', lineId: line.id })}
                  >
                    {isMissingMarked ? 'Пропущена ✓' : 'Нет в таблице'}
                  </Button>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      {step === 'fill' ? (
        <>
          <section className="panel" aria-label="Таблица для заполнения">
            <h2>Таблица</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {task.fields.map((field) => (
                      <th key={field}>{FIELD_NAMES[field]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {task.lines.map((line) => (
                    <tr key={line.id}>
                      {task.fields.map((field) => {
                        const cellId = `${line.id}:${field}`;
                        const value = rows[line.id]?.[field] ?? '';
                        const isActive = activeCell.lineId === line.id && activeCell.field === field;
                        return (
                          <td key={field}>
                            <DropZone
                              id={`cell:${cellId}`}
                              className={cx(
                                'cell-btn',
                                isActive && 'selected',
                                badCells.includes(cellId) && 'needs-fix',
                                hintTarget === cellId && 'glow',
                              )}
                              label={`${FIELD_NAMES[field]}, строка ${task.lines.indexOf(line) + 1}: ${value || 'пусто'}`}
                              onPress={() => {
                                if (task.level === 1 && selectedCard && selectedCard.field === field) {
                                  setCell(line.id, field, selectedCard.value);
                                  setSelectedCard(null);
                                } else {
                                  setActiveCell({ lineId: line.id, field });
                                }
                              }}
                            >
                              {value || '…'}
                            </DropZone>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel" aria-label="Ввод данных">
            <h2>
              {task.level === 1 ? 'Карточки' : task.level === 2 ? 'Выбери значение' : 'Клавиатура'}
            </h2>
            {task.level === 1 ? (
              <div className="stack">
                <p className="tag">Перетащи карточку в ячейку или нажми карточку, затем ячейку.</p>
                <b>Товары</b>
                <div className="row">
                  {task.productChoices.map((name) => (
                    <DragItem
                      key={name}
                      id={`product:${name}`}
                      label={name}
                      selected={selectedCard?.field === 'product' && selectedCard.value === name}
                      onSelect={() => {
                        sfx('take');
                        setSelectedCard({ field: 'product', value: name });
                      }}
                    >
                      {name}
                    </DragItem>
                  ))}
                </div>
                <b>Количество</b>
                <div className="row">
                  {qtyChoices.slice(0, 6).map((num) => (
                    <DragItem
                      key={num}
                      id={`qty:${num}`}
                      label={num}
                      selected={selectedCard?.field === 'qty' && selectedCard.value === num}
                      onSelect={() => {
                        sfx('take');
                        setSelectedCard({ field: 'qty', value: num });
                      }}
                    >
                      {num}
                    </DragItem>
                  ))}
                </div>
              </div>
            ) : task.level === 2 ? (
              <div className="stack">
                <p className="tag">Выбрано: {FIELD_NAMES[activeCell.field]}</p>
                {activeCell.field === 'product' ? (
                  <div className="row">
                    {task.productChoices.map((name) => (
                      <Button
                        key={name}
                        tone={rows[activeCell.lineId]?.product === name ? 'primary' : 'default'}
                        onClick={() => setCell(activeCell.lineId, 'product', name)}
                      >
                        {name}
                      </Button>
                    ))}
                  </div>
                ) : activeCell.field === 'unit' ? (
                  <div className="row">
                    {task.unitChoices.map((unit) => (
                      <Button
                        key={unit}
                        tone={rows[activeCell.lineId]?.unit === unit ? 'primary' : 'default'}
                        onClick={() => setCell(activeCell.lineId, 'unit', unit)}
                      >
                        {unit}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="row">
                    {qtyChoices.map((num) => (
                      <Button
                        key={num}
                        tone={rows[activeCell.lineId]?.qty === num ? 'primary' : 'default'}
                        onClick={() => setCell(activeCell.lineId, 'qty', num)}
                      >
                        {num}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="stack">
                <p className="tag">
                  Ячейка: {FIELD_NAMES[activeCell.field]} — «{rows[activeCell.lineId]?.[activeCell.field] ?? ''}»
                </p>
                <div className="keys">
                  {activeCell.field === 'product' || activeCell.field === 'unit' ? (
                    <>
                      {RU_ROWS.map((rowKeys, idx) => (
                        <div key={idx} className="keyrow">
                          {rowKeys.map((k) => (
                            <button key={k} type="button" className="key" onClick={() => pressKey(k)}>
                              {k}
                            </button>
                          ))}
                        </div>
                      ))}
                      <div className="keyrow">
                        <button type="button" className="key" onClick={() => pressKey('Пробел')}>
                          Пробел
                        </button>
                        <button type="button" className="key" onClick={() => pressKey('←')}>
                          ←
                        </button>
                        <button type="button" className="key" onClick={() => pressKey('Очистить')}>
                          Очистить
                        </button>
                      </div>
                    </>
                  ) : (
                    NUM_ROWS.map((rowKeys, idx) => (
                      <div key={idx} className="keyrow">
                        {rowKeys.map((k) => (
                          <button key={k} type="button" className="key" onClick={() => pressKey(k)}>
                            {k}
                          </button>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </section>
        </>
      ) : (
        <section className="panel" style={{ gridColumn: 'span 2' }} aria-label="Таблица коллеги">
          <div className="spread">
            <h2>Найди ошибки в таблице коллеги</h2>
            <span className="tag">Отмечено: {marks.length}</span>
          </div>
          <p className="note">Нажми на ячейки, где коллега ошибся. {task.level === 3 ? 'Лишнюю или пропущенную строку тоже отметь.' : ''}</p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {task.fields.map((field) => (
                    <th key={field}>{FIELD_NAMES[field]}</th>
                  ))}
                  {task.level === 3 ? <th>Строка</th> : null}
                </tr>
              </thead>
              <tbody>
                {task.colleague.map((row) => {
                  const extraKey = `extra:${row.id}`;
                  const extraMarked = markedKeys.has(extraKey);
                  return (
                    <tr key={row.id} className={cx(extraMarked && 'marked', hintTarget === extraKey && 'glow')}>
                      {task.fields.map((field) => {
                        const cellMark: OpMark = { type: 'cell', rowId: row.id, field };
                        const key = markKey(cellMark);
                        const isMarked = markedKeys.has(key);
                        return (
                          <td key={field}>
                            <button
                              type="button"
                              className={cx('cell-btn', isMarked && 'marked', hintTarget === key && 'glow')}
                              aria-pressed={isMarked}
                              onClick={() => toggleMark(cellMark)}
                            >
                              {row.cells[field] ?? ''}
                            </button>
                          </td>
                        );
                      })}
                      {task.level === 3 ? (
                        <td>
                          <Button
                            tone={extraMarked ? 'primary' : 'quiet'}
                            onClick={() => toggleMark({ type: 'extra', rowId: row.id })}
                          >
                            {extraMarked ? 'Лишняя ✓' : 'Лишняя'}
                          </Button>
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </DndContext>
  );
}
