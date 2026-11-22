import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { useEffect, useState } from 'react';
import { productById } from '../data';
import { checkPicker, type PickerDetail, type PickerTask } from '../game/picker';
import { capitalize, qtyPhrase } from '../game/text';
import { useStore } from '../store';
import type { GameApi } from '../types';
import { patternOf, Shape } from '../ui/art';
import { Button, DragItem, DropZone, IconSpeaker, cx, useSfx } from '../ui/bits';

export function PickerGame({
  task,
  register,
}: {
  task: PickerTask;
  register: (api: GameApi) => void;
  onCheckLabel: (label: string) => void;
  round: number;
}) {
  const { say } = useStore();
  const sfx = useSfx();
  const [basket, setBasket] = useState<Record<string, number>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPics, setShowPics] = useState(task.pictures === 'always');
  const [details, setDetails] = useState<PickerDetail[] | null>(null);
  const [hintStep, setHintStep] = useState(0);
  const [hintLineId, setHintLineId] = useState<string | null>(null);
  const [hintShelfId, setHintShelfId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function addItem(productId: string) {
    sfx('put');
    setDetails(null);
    setHintLineId(null);
    setHintShelfId(null);
    setBasket((current) => ({ ...current, [productId]: (current[productId] ?? 0) + 1 }));
  }

  function changeQty(productId: string, delta: number) {
    sfx(delta > 0 ? 'put' : 'click');
    setDetails(null);
    setBasket((current) => {
      const nextQty = Math.max(0, (current[productId] ?? 0) + delta);
      if (nextQty === 0) {
        const copy = { ...current };
        delete copy[productId];
        return copy;
      }
      return { ...current, [productId]: nextQty };
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    if (event.over?.id === 'basket') {
      addItem(String(event.active.id));
      setSelectedId(null);
    }
  }

  useEffect(() => {
    register({
      check: () => {
        const res = checkPicker(task, basket);
        setDetails(res.details);
        if (res.ok) {
          sfx('ok');
          return {
            status: 'done',
            message: 'Заказ готов!',
            speech: 'Заказ готов!',
            finale: 'Заказ собран!',
          };
        }
        sfx('again');
        const msg = 'Почти получилось! Проверь отмеченные товары.';
        return { status: 'error', message: msg, speech: msg };
      },
      hint: () => {
        const wrongLine = task.lines.find((line) => (basket[line.productId] ?? 0) !== line.qty);
        if (!wrongLine) {
          const extraId = Object.keys(basket).find((id) => (basket[id] ?? 0) > 0 && !task.lines.some((l) => l.productId === id));
          if (extraId) {
            const p = productById(extraId);
            return { speech: `Убери лишний товар из корзины: ${p.name}.` };
          }
          return { speech: 'Всё готово! Нажми «Проверить».' };
        }
        const product = productById(wrongLine.productId);
        if (hintStep % 2 === 0) {
          setHintLineId(wrongLine.productId);
          setHintShelfId(null);
          setHintStep((value) => value + 1);
          return {
            speech: `Посмотри в заявку: ${qtyPhrase(wrongLine.qty, product.gender, product.forms)}.`,
          };
        }
        setHintLineId(wrongLine.productId);
        setHintShelfId(wrongLine.productId);
        setHintStep((value) => value + 1);
        return {
          speech: `Найди на полке: ${product.name}.`,
        };
      },
      isDirty: () => Object.values(basket).some((qty) => qty > 0),
    });
  });

  const statusMap = new Map((details ?? []).map((item) => [item.productId, item.status]));
  const basketEntries = Object.entries(basket).filter(([, qty]) => qty > 0);

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <section className="panel" aria-label="Заявка">
        <div className="spread">
          <h2>Заявка</h2>
          {task.pictures === 'optional' ? (
            <Button tone="quiet" onClick={() => setShowPics((value) => !value)}>
              {showPics ? 'Скрыть картинки' : 'Картинки'}
            </Button>
          ) : null}
        </div>
        <div className="stack">
          {task.lines.map((line) => {
            const product = productById(line.productId);
            const phrase = capitalize(qtyPhrase(line.qty, product.gender, product.forms));
            const st = statusMap.get(line.productId);
            return (
              <div
                key={line.productId}
                className={cx(
                  'order-row',
                  hintLineId === line.productId && 'glow',
                  st === 'ok' && 'is-ok',
                  (st === 'miss' || st === 'extra') && 'needs-fix',
                )}
              >
                {showPics ? (
                  <Shape
                    id={product.id}
                    shape={product.shape}
                    color={product.color}
                    accent={product.accent}
                    pattern={patternOf(product.id)}
                  />
                ) : null}
                <b className="qty">{line.qty}</b>
                <span className="grow">{task.words ? product.name : phrase}</span>
                <Button
                  tone="quiet"
                  icon={<IconSpeaker />}
                  aria-label={`Озвучить: ${phrase}`}
                  onClick={() => say(phrase)}
                />
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel" aria-label="Стеллаж с товарами">
        <div className="spread">
          <h2>Стеллаж</h2>
          {selectedId ? <span className="tag">Выбрано: {productById(selectedId).name}</span> : null}
        </div>
        <div className="shelf">
          {task.shelf.map((productId) => {
            const product = productById(productId);
            return (
              <DragItem
                key={productId}
                id={productId}
                label={product.name}
                selected={selectedId === productId}
                className={cx(hintShelfId === productId && 'glow')}
                onSelect={() => {
                  sfx('take');
                  setSelectedId((current) => (current === productId ? null : productId));
                }}
              >
                <Shape
                  id={product.id}
                  shape={product.shape}
                  color={product.color}
                  accent={product.accent}
                  pattern={patternOf(product.id)}
                />
                <span>{product.name}</span>
              </DragItem>
            );
          })}
        </div>
      </section>

      <section className="panel" aria-label="Корзина">
        <h2>Корзина</h2>
        <DropZone
          id="basket"
          className="stack grow"
          label={selectedId ? `Положить ${productById(selectedId).name} в корзину` : 'Корзина для товаров'}
          onPress={() => {
            if (!selectedId) return;
            addItem(selectedId);
            setSelectedId(null);
          }}
        >
          {selectedId ? (
            <Button
              tone="primary"
              onClick={(event) => {
                event.stopPropagation();
                addItem(selectedId);
                setSelectedId(null);
              }}
            >
              Положить в корзину: {productById(selectedId).name}
            </Button>
          ) : null}
          {basketEntries.length === 0 ? (
            <p className="note">Перетащи товар сюда или нажми на товар и на корзину.</p>
          ) : null}
          {basketEntries.map(([productId, qty]) => {
            const product = productById(productId);
            const st = statusMap.get(productId);
            return (
              <div
                key={productId}
                className={cx(
                  'basket-row',
                  st === 'ok' && 'is-ok',
                  (st === 'miss' || st === 'extra') && 'needs-fix',
                )}
              >
                <Shape
                  id={product.id}
                  shape={product.shape}
                  color={product.color}
                  accent={product.accent}
                  pattern={patternOf(product.id)}
                />
                <span className="grow">
                  <b>{product.name}</b>
                </span>
                <div className="basket-controls">
                  <Button
                    aria-label={`Уменьшить ${product.name}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      changeQty(productId, -1);
                    }}
                  >
                    −
                  </Button>
                  <b className="qty">{qty}</b>
                  <Button
                    aria-label={`Увеличить ${product.name}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      changeQty(productId, 1);
                    }}
                  >
                    +
                  </Button>
                </div>
              </div>
            );
          })}
        </DropZone>
      </section>
    </DndContext>
  );
}
