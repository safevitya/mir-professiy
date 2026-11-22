import { emptyProgress, applyWin, defaultSettings } from '../src/progress';
import { PRODUCTS } from '../src/data';
import { generateTask } from '../src/game/index';
import { pickerSimilarIds, checkPicker, type PickerTask } from '../src/game/picker';
import { checkFill, checkMarks, lineValue, type OperatorTask } from '../src/game/operator';
import { checkLabel, type LabelTask } from '../src/game/label';
import { checkGarden, plantFits, type GardenerTask } from '../src/game/gardener';
import { checkKit, type AssemblerTask } from '../src/game/assembler';
import { PICKER_RULES, OPERATOR_RULES, LABEL_RULES, GARDEN_RULES, ASM_RULES } from '../src/game/rules';
import { qtyPhrase } from '../src/game/text';
import { plantById } from '../src/data';
import type { Level, Profile } from '../src/types';

function assert(cond: boolean, message: string): void {
  if (!cond) throw new Error(message);
}

assert(qtyPhrase(2, 'm', ['пакет молока', 'пакета молока', 'пакетов молока']) === 'два пакета молока', 'молоко');
assert(qtyPhrase(1, 'f', ['упаковка гречки', 'упаковки гречки', 'упаковок гречки']) === 'одна упаковка гречки', 'гречка');
assert(qtyPhrase(3, 'm', ['йогурт', 'йогурта', 'йогуртов']) === 'три йогурта', 'йогурт');

const levels: Level[] = [1, 2, 3];

for (const level of levels) {
  let similarTasks = 0;
  for (let seed = 1; seed <= 40; seed += 1) {
    const task = generateTask('picker', level, { seed }) as PickerTask;
    const rules = PICKER_RULES[level];
    assert(task.lines.length >= rules.positions[0] && task.lines.length <= rules.positions[1], `позиции ${level}`);
    const ids = new Set(task.lines.map((line) => line.productId));
    assert(ids.size === task.lines.length, 'повтор позиции');
    const sum = task.lines.reduce((acc, line) => acc + line.qty, 0);
    assert(sum <= rules.cap, `сумма ${level} ${sum}`);
    for (const line of task.lines) {
      assert(line.qty >= 1 && line.qty <= rules.qty[1], 'количество');
      assert(task.shelf.includes(line.productId), 'товар заявки не на полке');
    }
    assert(task.shelf.length >= rules.shelf[0] && task.shelf.length <= rules.shelf[1], `полка ${level} ${task.shelf.length}`);
    assert(new Set(task.shelf).size === task.shelf.length, 'повтор на полке');
    const similar = pickerSimilarIds(task);
    if (level === 1) assert(similar.length === 0, 'на уровне 1 есть похожие');
    if (level === 3) assert(similar.length > 0, `на уровне 3 нет похожих seed ${seed}`);
    if (similar.length) similarTasks += 1;
    const basket: Record<string, number> = {};
    for (const line of task.lines) basket[line.productId] = line.qty;
    assert(checkPicker(task, basket).ok, 'верная корзина');
    basket[task.lines[0].productId] = 0;
    assert(!checkPicker(task, basket).ok, 'пустая позиция');
  }
  if (level === 2) assert(similarTasks > 0 && similarTasks < 40, `редко похожие: ${similarTasks}`);
}

for (const level of levels) {
  for (let seed = 1; seed <= 24; seed += 1) {
    const task = generateTask('operator', level, { seed }) as OperatorTask;
    const rules = OPERATOR_RULES[level];
    assert(task.lines.length >= rules.rows[0] && task.lines.length <= rules.rows[1], 'строки');
    assert(task.fields.length === level + 1, 'столбцы');
    assert(task.errors.length >= rules.errors[0] && task.errors.length <= rules.errors[1], 'число ошибок');
    const fill: Record<string, Record<string, string>> = {};
    for (const line of task.lines) {
      fill[line.id] = {};
      for (const field of task.fields) fill[line.id][field] = lineValue(line, field);
    }
    assert(checkFill(task, fill).ok, 'верная таблица');
    assert(checkMarks(task, task.errors).ok, 'верные пометки');
    assert(!checkMarks(task, []).ok, 'пустые пометки');
  }
}

for (const level of levels) {
  for (let seed = 1; seed <= 20; seed += 1) {
    const task = generateTask('label', level, { seed }) as LabelTask;
    const rules = LABEL_RULES[level];
    assert(task.required.length >= rules.blocks[0] && task.required.length <= rules.blocks[1], `блоки ${level} ${task.required.length}`);
    for (const field of task.required) {
      const count = task.options[field].length;
      assert(count >= rules.options[0] && count <= rules.options[1], 'варианты');
      assert(task.options[field].some((item) => item.id === task.correct[field]), 'верный вариант');
    }
    if (level === 3) {
      assert(task.required.includes('barcode') && task.required.includes('storage'), 'уровень 3 этикетки');
      assert(task.options.name.some((item) => item.similar), 'похожие названия');
    }
    const placed = Object.fromEntries(task.required.map((field) => [field, task.correct[field]]));
    assert(checkLabel(task, placed, []).ok, 'верная этикетка');
    assert(!checkLabel(task, placed, [task.required[0]]).ok, 'перекрытие');
  }
}

for (const level of levels) {
  for (let seed = 1; seed <= 20; seed += 1) {
    const task = generateTask('gardener', level, { seed }) as GardenerTask;
    const rules = GARDEN_RULES[level];
    assert(task.size === rules.size, 'сетка');
    const plants = task.scheme.flat().filter(Boolean);
    assert(plants.length >= rules.plants[0] && plants.length <= rules.plants[1], 'растения');
    for (let r = 0; r < task.size; r += 1) {
      for (let c = 0; c < task.size; c += 1) {
        const id = task.scheme[r][c];
        if (!id) continue;
        assert(plantFits(task, plantById(id), r, c), 'растение не подходит участку');
        assert(task.care[r][c] != null && task.careTypes.includes(task.care[r][c]!), 'уход');
      }
    }
    if (level === 3 && task.splitAt != null) {
      assert(task.sun[0][0] !== task.sun[0][task.size - 1] || task.wet[0][0] !== task.wet[0][task.size - 1], 'две зоны');
    }
    const cared = task.care.map((row) => row.map((item) => item != null));
    assert(checkGarden(task, task.scheme, cared).ok, 'верная клумба');
    const broken = task.scheme.map((row) => row.slice());
    broken[0][0] = broken[0][0] ? null : plants[0];
    assert(!checkGarden(task, broken, cared).ok, 'чужая клумба');
  }
}

for (const level of levels) {
  let missingCases = 0;
  for (let seed = 1; seed <= 20; seed += 1) {
    const task = generateTask('assembler', level, { seed }) as AssemblerTask;
    const rules = ASM_RULES[level];
    assert(task.parts.length >= rules.parts[0] && task.parts.length <= rules.parts[1], 'детали');
    const kitParts = new Set(task.kit.filter((piece) => piece.partId).map((piece) => piece.partId));
    for (const part of task.parts) {
      const present = kitParts.has(part.id);
      if (task.missingPartIds.includes(part.id)) assert(!present, 'лишняя недостающая');
      else assert(present, 'детали нет в наборе');
    }
    if (level === 1) assert(task.missingPartIds.length === 0 && task.extraKitIds.length === 0, 'уровень 1 комплект');
    if (level === 2) assert(task.extraKitIds.length === 0 && task.missingPartIds.length <= 1, 'уровень 2 комплект');
    if (level === 3) assert(task.kit.some((piece) => piece.decoy) && (task.missingPartIds.length + task.extraKitIds.length > 0), 'уровень 3');
    if (task.missingPartIds.length) missingCases += 1;
    const ok = checkKit(task, task.missingPartIds, task.extraKitIds, task.missingPartIds.length === 0 && task.extraKitIds.length === 0);
    assert(ok, 'верная комплектность');
    assert(!checkKit(task, [], [], task.missingPartIds.length + task.extraKitIds.length > 0), 'ложная комплектность');
  }
  if (level === 2) assert(missingCases > 0 && missingCases < 20, 'иногда не хватает детали');
}

const profile: Profile = {
  id: 't',
  name: 'Тест',
  avatar: 'fox',
  pinHash: null,
  createdAt: '',
  settings: defaultSettings(),
  progress: emptyProgress(),
  stickers: [],
  artworks: [],
  lastTasks: {},
  greeted: false,
};
let current = profile;
let fresh: string[] = [];
for (const level of levels) {
  const applied = applyWin(current, { profession: 'picker', level, stars: 3, hints: 1, checks: 1 });
  current = applied.profile;
  fresh = fresh.concat(applied.newStickers);
}
assert(fresh.length === 3, 'три стикера');
assert(current.progress.picker[2].bestStars === 3, 'звёзды');
assert(PRODUCTS.length >= 20, 'каталог');

const firstTask = generateTask('picker', 1, { seed: 5 }) as PickerTask;
const nextTask = generateTask('picker', 1, { seed: 5, avoid: firstTask.signature }) as PickerTask;
assert(nextTask.signature !== firstTask.signature, 'другая заявка');

console.log('selfcheck ok');
