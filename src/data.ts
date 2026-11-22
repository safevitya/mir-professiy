import type { Plant, Product, ProfessionId, ShapeId, StickerDef } from './types';

export interface ProfessionInfo {
  id: ProfessionId;
  title: string;
  full: string;
  short: string;
  color: string;
}

export const PROFESSIONS: ProfessionInfo[] = [
  { id: 'picker', title: 'Комплектовщик', full: 'Комплектовщик', short: 'Собери заказ', color: '#1f7a62' },
  { id: 'operator', title: 'Оператор', full: 'Оператор по обработке информации', short: 'Проверь данные', color: '#2c6eaa' },
  { id: 'label', title: 'Этикетки', full: 'Специалист по оформлению печатных материалов', short: 'Оформи упаковку', color: '#b87a1a' },
  { id: 'gardener', title: 'Садовник', full: 'Садовник-озеленитель', short: 'Собери клумбу', color: '#3d8b40' },
  { id: 'assembler', title: 'Сборщик', full: 'Сборщик изделий', short: 'Собери изделие', color: '#6d597a' },
];

export const AVATARS = ['fox', 'bear', 'cat', 'owl', 'frog', 'panda', 'rabbit', 'lion'] as const;
export type AvatarId = (typeof AVATARS)[number];

export const PRODUCTS: Product[] = [
  { id: 'milk', name: 'Молоко', group: 'dairy', shape: 'carton', color: '#d7ecf8', accent: '#2c6eaa', gender: 'm', forms: ['пакет молока', 'пакета молока', 'пакетов молока'] },
  { id: 'kefir', name: 'Кефир', group: 'dairy', shape: 'carton', color: '#e5f6ea', accent: '#1f7a62', gender: 'm', forms: ['пакет кефира', 'пакета кефира', 'пакетов кефира'] },
  { id: 'ryazhenka', name: 'Ряженка', group: 'dairy', shape: 'bottle', color: '#fde6d4', accent: '#c46b2c', gender: 'f', forms: ['бутылка ряженки', 'бутылки ряженки', 'бутылок ряженки'] },
  { id: 'yogurt', name: 'Йогурт', group: 'dairy', shape: 'jar', color: '#fdeef3', accent: '#c45b7a', gender: 'm', forms: ['йогурт', 'йогурта', 'йогуртов'] },
  { id: 'cheese', name: 'Сыр', group: 'dairy', shape: 'box', color: '#fff3c4', accent: '#d4a017', gender: 'm', forms: ['кусок сыра', 'куска сыра', 'кусков сыра'] },
  { id: 'butter', name: 'Масло', group: 'dairy', shape: 'box', color: '#fff6d8', accent: '#e6b325', gender: 'f', forms: ['пачка масла', 'пачки масла', 'пачек масла'] },
  { id: 'buckwheat', name: 'Гречка', group: 'grain', shape: 'bag', color: '#f3e2c8', accent: '#8a5a2b', gender: 'f', forms: ['упаковка гречки', 'упаковки гречки', 'упаковок гречки'] },
  { id: 'rice', name: 'Рис', group: 'grain', shape: 'bag', color: '#f7f1e4', accent: '#b7a48c', gender: 'm', forms: ['пакет риса', 'пакета риса', 'пакетов риса'] },
  { id: 'oats', name: 'Овсянка', group: 'grain', shape: 'bag', color: '#f6ead2', accent: '#c48a3a', gender: 'f', forms: ['упаковка овсянки', 'упаковки овсянки', 'упаковок овсянки'] },
  { id: 'millet', name: 'Пшено', group: 'grain', shape: 'bag', color: '#fff1c9', accent: '#d4a017', gender: 'm', forms: ['пакет пшена', 'пакета пшена', 'пакетов пшена'] },
  { id: 'pasta', name: 'Макароны', group: 'grain', shape: 'box', color: '#ffe8c2', accent: '#e09f3e', gender: 'f', forms: ['пачка макарон', 'пачки макарон', 'пачек макарон'] },
  { id: 'bread', name: 'Хлеб', group: 'bakery', shape: 'loaf', color: '#f3d2a4', accent: '#a86b32', gender: 'm', forms: ['батон хлеба', 'батона хлеба', 'батонов хлеба'] },
  { id: 'buns', name: 'Булочки', group: 'bakery', shape: 'loaf', color: '#f8d7b0', accent: '#d4894a', gender: 'f', forms: ['булочка', 'булочки', 'булочек'] },
  { id: 'cookies', name: 'Печенье', group: 'bakery', shape: 'cookie', color: '#f6e0b5', accent: '#c4843a', gender: 'n', forms: ['печенье', 'печенья', 'печений'] },
  { id: 'apples', name: 'Яблоки', group: 'fruit', shape: 'apple', color: '#f8d0d0', accent: '#d64545', gender: 'n', forms: ['яблоко', 'яблока', 'яблок'] },
  { id: 'pears', name: 'Груши', group: 'fruit', shape: 'pear', color: '#e7f0c8', accent: '#8da33a', gender: 'f', forms: ['груша', 'груши', 'груш'] },
  { id: 'juice', name: 'Сок', group: 'drink', shape: 'bottle', color: '#f8e1a8', accent: '#e2a122', gender: 'm', forms: ['пакет сока', 'пакета сока', 'пакетов сока'] },
  { id: 'water', name: 'Вода', group: 'drink', shape: 'bottle', color: '#d9f1fb', accent: '#3aa0d8', gender: 'f', forms: ['бутылка воды', 'бутылки воды', 'бутылок воды'] },
  { id: 'tea', name: 'Чай', group: 'drink', shape: 'box', color: '#e7f3d8', accent: '#5a8f3a', gender: 'f', forms: ['коробка чая', 'коробки чая', 'коробок чая'] },
  { id: 'sugar', name: 'Сахар', group: 'grocery', shape: 'bag', color: '#f4f4f4', accent: '#8d9399', gender: 'm', forms: ['пакет сахара', 'пакета сахара', 'пакетов сахара'] },
  { id: 'eggs', name: 'Яйца', group: 'grocery', shape: 'box', color: '#fff8e8', accent: '#e6c36a', gender: 'n', forms: ['яйцо', 'яйца', 'яиц'] },
  { id: 'tomato', name: 'Помидоры', group: 'veg', shape: 'apple', color: '#f8c9c0', accent: '#d84a3a', gender: 'm', forms: ['помидор', 'помидора', 'помидоров'] },
  { id: 'cucumber', name: 'Огурцы', group: 'veg', shape: 'leaf', color: '#d9f2cf', accent: '#3d8b40', gender: 'm', forms: ['огурец', 'огурца', 'огурцов'] },
  { id: 'chocolate', name: 'Шоколад', group: 'sweet', shape: 'cookie', color: '#e6c3a0', accent: '#6b3e26', gender: 'f', forms: ['плитка шоколада', 'плитки шоколада', 'плиток шоколада'] },
  { id: 'jam', name: 'Варенье', group: 'sweet', shape: 'jar', color: '#f3c1d0', accent: '#b83b5e', gender: 'n', forms: ['варенье', 'варенья', 'варений'] },
];

export function productById(id: string): Product {
  const found = PRODUCTS.find((item) => item.id === id);
  if (!found) throw new Error(`Нет товара ${id}`);
  return found;
}

export const PLANTS: Plant[] = [
  { id: 'tulip', name: 'Тюльпан', sun: true, wet: true, shape: 'flower', color: '#f7d0d0', accent: '#e85d4c' },
  { id: 'rose', name: 'Роза', sun: true, wet: true, shape: 'flower', color: '#f8d5dc', accent: '#c23b4a' },
  { id: 'basil', name: 'Базилик', sun: true, wet: true, shape: 'leaf', color: '#d9f2cf', accent: '#3d8b4f' },
  { id: 'peony', name: 'Пион', sun: true, wet: true, shape: 'flower', color: '#f8d6e6', accent: '#e989b0' },
  { id: 'sunflower', name: 'Подсолнух', sun: true, wet: false, shape: 'sun', color: '#fff1c2', accent: '#f0a202' },
  { id: 'cactus', name: 'Кактус', sun: true, wet: false, shape: 'cactus', color: '#e5f6ea', accent: '#2e8b57' },
  { id: 'lavender', name: 'Лаванда', sun: true, wet: false, shape: 'flower', color: '#e6e0fb', accent: '#7b68ee' },
  { id: 'daisy', name: 'Ромашка', sun: true, wet: false, shape: 'flower', color: '#fff8e8', accent: '#f0a202' },
  { id: 'succulent', name: 'Очиток', sun: true, wet: false, shape: 'leaf', color: '#e4f5d4', accent: '#7dba6a' },
  { id: 'fern', name: 'Папоротник', sun: false, wet: true, shape: 'leaf', color: '#d7ecdf', accent: '#2f6f4e' },
  { id: 'hosta', name: 'Хоста', sun: false, wet: true, shape: 'leaf', color: '#e3f3d6', accent: '#6aa84f' },
  { id: 'moss', name: 'Мох', sun: false, wet: true, shape: 'pot', color: '#e4f0df', accent: '#4f7d4a' },
  { id: 'ivy', name: 'Плющ', sun: false, wet: true, shape: 'leaf', color: '#d5f0e2', accent: '#1f7a4d' },
  { id: 'violet', name: 'Фиалка', sun: false, wet: true, shape: 'flower', color: '#eadff5', accent: '#7a4eab' },
  { id: 'mint', name: 'Мята', sun: false, wet: true, shape: 'leaf', color: '#d8f6ee', accent: '#3cba9a' },
  { id: 'sansevieria', name: 'Сансевиерия', sun: false, wet: false, shape: 'leaf', color: '#dceee8', accent: '#2f5d50' },
  { id: 'chlorophytum', name: 'Хлорофитум', sun: false, wet: false, shape: 'pot', color: '#e7f3df', accent: '#6b9a62' },
  { id: 'zamioculcas', name: 'Замиокулькас', sun: false, wet: false, shape: 'leaf', color: '#d5ebe3', accent: '#1e4d3a' },
];

export function plantById(id: string): Plant {
  const found = PLANTS.find((item) => item.id === id);
  if (!found) throw new Error(`Нет растения ${id}`);
  return found;
}

export const STICKERS: StickerDef[] = [
  { id: 'picker-1', profession: 'picker', need: 3, name: 'Коробка' },
  { id: 'picker-2', profession: 'picker', need: 6, name: 'Тележка' },
  { id: 'picker-3', profession: 'picker', need: 9, name: 'Звезда склада' },
  { id: 'operator-1', profession: 'operator', need: 3, name: 'Лист' },
  { id: 'operator-2', profession: 'operator', need: 6, name: 'Лупа' },
  { id: 'operator-3', profession: 'operator', need: 9, name: 'Галочка' },
  { id: 'label-1', profession: 'label', need: 3, name: 'Бирка' },
  { id: 'label-2', profession: 'label', need: 6, name: 'Кисточка' },
  { id: 'label-3', profession: 'label', need: 9, name: 'Палитра' },
  { id: 'gardener-1', profession: 'gardener', need: 3, name: 'Цветок' },
  { id: 'gardener-2', profession: 'gardener', need: 6, name: 'Лейка' },
  { id: 'gardener-3', profession: 'gardener', need: 9, name: 'Солнце' },
  { id: 'assembler-1', profession: 'assembler', need: 3, name: 'Винтик' },
  { id: 'assembler-2', profession: 'assembler', need: 6, name: 'Лампочка' },
  { id: 'assembler-3', profession: 'assembler', need: 9, name: 'Машинка' },
];

export const DECOR_STICKERS = [
  { id: 'decor-star', name: 'Звезда' },
  { id: 'decor-heart', name: 'Сердце' },
  { id: 'decor-flower', name: 'Цветочек' },
  { id: 'decor-smile', name: 'Улыбка' },
];

export interface LabelChoice {
  text: string;
  shape?: ShapeId;
  color?: string;
  accent?: string;
  similar?: boolean;
}

export interface LabelTheme {
  id: string;
  fields: Record<string, { correct: LabelChoice; near: LabelChoice[]; far: LabelChoice[] }>;
}

const pic = (text: string, shape: ShapeId, color: string, accent: string, similar?: boolean): LabelChoice => ({
  text, shape, color, accent, similar,
});

export const LABEL_THEMES: LabelTheme[] = [
  {
    id: 'juice',
    fields: {
      name: {
        correct: { text: 'Яблочный сок' },
        near: [{ text: 'Яблочнай сок', similar: true }, { text: 'Яблочный сироп', similar: true }],
        far: [{ text: 'Молоко' }, { text: 'Хлеб' }, { text: 'Чай' }],
      },
      image: {
        correct: pic('Яблоко', 'apple', '#f8d0d0', '#d64545'),
        near: [pic('Груша', 'pear', '#e7f0c8', '#8da33a', true)],
        far: [pic('Молоко', 'carton', '#d7ecf8', '#2c6eaa'), pic('Хлеб', 'loaf', '#f3d2a4', '#a86b32'), pic('Вода', 'bottle', '#d9f1fb', '#3aa0d8')],
      },
      weight: {
        correct: { text: '1 л' },
        near: [{ text: '1,1 л', similar: true }],
        far: [{ text: '250 г' }, { text: '5 л' }, { text: '100 мл' }],
      },
      expiry: {
        correct: { text: '12 месяцев' },
        near: [{ text: '10 месяцев', similar: true }],
        far: [{ text: '3 дня' }, { text: '2 часа' }, { text: '5 лет' }],
      },
      composition: {
        correct: { text: 'яблочный сок' },
        near: [{ text: 'сок и сахар', similar: true }],
        far: [{ text: 'молоко' }, { text: 'чай' }, { text: 'вода' }],
      },
      maker: {
        correct: { text: 'Садовод' },
        near: [{ text: 'Садовод+', similar: true }],
        far: [{ text: 'Хлебный дом' }, { text: 'Речка' }, { text: 'Молокозавод' }],
      },
      storage: {
        correct: { text: 'В прохладе' },
        near: [{ text: 'В тепле', similar: true }],
        far: [{ text: 'На солнце' }, { text: 'В морозилке' }, { text: 'Без крышки' }],
      },
      barcode: {
        correct: { text: '4601234' },
        near: [{ text: '4601235', similar: true }],
        far: [{ text: '1111111' }, { text: '9000001' }, { text: '123' }],
      },
    },
  },
  {
    id: 'milk',
    fields: {
      name: {
        correct: { text: 'Молоко' },
        near: [{ text: 'Молочко', similar: true }, { text: 'Малако', similar: true }],
        far: [{ text: 'Кефир' }, { text: 'Сок' }, { text: 'Вода' }],
      },
      image: {
        correct: pic('Пакет молока', 'carton', '#d7ecf8', '#2c6eaa'),
        near: [pic('Бутылка', 'bottle', '#e5f6ea', '#1f7a62', true)],
        far: [pic('Хлеб', 'loaf', '#f3d2a4', '#a86b32'), pic('Яблоко', 'apple', '#f8d0d0', '#d64545'), pic('Чай', 'cup', '#e7f3d8', '#5a8f3a')],
      },
      weight: {
        correct: { text: '900 мл' },
        near: [{ text: '1 л', similar: true }],
        far: [{ text: '200 г' }, { text: '5 кг' }, { text: '50 мл' }],
      },
      expiry: {
        correct: { text: '10 дней' },
        near: [{ text: '14 дней', similar: true }],
        far: [{ text: '2 года' }, { text: '1 час' }, { text: '6 месяцев' }],
      },
      composition: {
        correct: { text: 'нормализованное молоко' },
        near: [{ text: 'молоко и вода', similar: true }],
        far: [{ text: 'какао' }, { text: 'сок' }, { text: 'мёд' }],
      },
      maker: {
        correct: { text: 'Луг' },
        near: [{ text: 'Лужок', similar: true }],
        far: [{ text: 'Пекарня' }, { text: 'Море' }, { text: 'Сад' }],
      },
      storage: {
        correct: { text: 'В холодильнике' },
        near: [{ text: 'В холоде', similar: true }],
        far: [{ text: 'У батареи' }, { text: 'На окне' }, { text: 'В шкафу' }],
      },
      barcode: {
        correct: { text: '4605551' },
        near: [{ text: '4605552', similar: true }],
        far: [{ text: '2222222' }, { text: '8' }, { text: '4600000' }],
      },
    },
  },
  {
    id: 'grain',
    fields: {
      name: {
        correct: { text: 'Гречка' },
        near: [{ text: 'Греча', similar: true }, { text: 'Гречневая крупа', similar: true }],
        far: [{ text: 'Рис' }, { text: 'Сахар' }, { text: 'Соль' }],
      },
      image: {
        correct: pic('Пакет крупы', 'bag', '#f3e2c8', '#8a5a2b'),
        near: [pic('Рис', 'bag', '#f7f1e4', '#b7a48c', true)],
        far: [pic('Яблоко', 'apple', '#f8d0d0', '#d64545'), pic('Молоко', 'carton', '#d7ecf8', '#2c6eaa'), pic('Чай', 'cup', '#e7f3d8', '#5a8f3a')],
      },
      weight: {
        correct: { text: '800 г' },
        near: [{ text: '900 г', similar: true }],
        far: [{ text: '5 кг' }, { text: '50 г' }, { text: '2 л' }],
      },
      expiry: {
        correct: { text: '18 месяцев' },
        near: [{ text: '20 месяцев', similar: true }],
        far: [{ text: '2 дня' }, { text: '1 неделя' }, { text: '10 лет' }],
      },
      composition: {
        correct: { text: 'гречневая крупа' },
        near: [{ text: 'крупа и соль', similar: true }],
        far: [{ text: 'мука' }, { text: 'рис' }, { text: 'сахар' }],
      },
      maker: {
        correct: { text: 'Поле' },
        near: [{ text: 'Полюшко', similar: true }],
        far: [{ text: 'Море' }, { text: 'Город' }, { text: 'Лес' }],
      },
      storage: {
        correct: { text: 'В сухом месте' },
        near: [{ text: 'В сухости', similar: true }],
        far: [{ text: 'В воде' }, { text: 'На солнце' }, { text: 'В морозилке' }],
      },
      barcode: {
        correct: { text: '4608080' },
        near: [{ text: '4608088', similar: true }],
        far: [{ text: '333' }, { text: '1010101' }, { text: '7777777' }],
      },
    },
  },
  {
    id: 'cookie',
    fields: {
      name: {
        correct: { text: 'Печенье' },
        near: [{ text: 'Печеньки', similar: true }, { text: 'Печене', similar: true }],
        far: [{ text: 'Хлеб' }, { text: 'Сыр' }, { text: 'Чай' }],
      },
      image: {
        correct: pic('Печенье', 'cookie', '#f6e0b5', '#c4843a'),
        near: [pic('Булочка', 'loaf', '#f8d7b0', '#d4894a', true)],
        far: [pic('Яблоко', 'apple', '#f8d0d0', '#d64545'), pic('Молоко', 'carton', '#d7ecf8', '#2c6eaa'), pic('Огурец', 'leaf', '#d9f2cf', '#3d8b40')],
      },
      weight: {
        correct: { text: '200 г' },
        near: [{ text: '250 г', similar: true }],
        far: [{ text: '2 кг' }, { text: '1 л' }, { text: '20 г' }],
      },
      expiry: {
        correct: { text: '6 месяцев' },
        near: [{ text: '4 месяца', similar: true }],
        far: [{ text: '1 день' }, { text: '3 года' }, { text: '2 часа' }],
      },
      composition: {
        correct: { text: 'мука, сахар, масло' },
        near: [{ text: 'мука и соль', similar: true }],
        far: [{ text: 'молоко' }, { text: 'ягоды' }, { text: 'рыба' }],
      },
      maker: {
        correct: { text: 'Пекарня' },
        near: [{ text: 'Пекарь', similar: true }],
        far: [{ text: 'Порт' }, { text: 'Луг' }, { text: 'Река' }],
      },
      storage: {
        correct: { text: 'В закрытой пачке' },
        near: [{ text: 'В пакете', similar: true }],
        far: [{ text: 'На солнце' }, { text: 'В воде' }, { text: 'Без пачки' }],
      },
      barcode: {
        correct: { text: '4604242' },
        near: [{ text: '4604243', similar: true }],
        far: [{ text: '000' }, { text: '5555555' }, { text: '1212121' }],
      },
    },
  },
];

export interface AsmStep {
  id: string;
  name: string;
  shape: ShapeId;
  color: string;
  accent: string;
  x: number;
  y: number;
  decoyName: string;
  decoyColor: string;
}

export interface AsmBlueprint {
  id: 'furniture' | 'constructor' | 'electronics';
  title: string;
  finale: string;
  steps: AsmStep[];
}

export const BLUEPRINTS: AsmBlueprint[] = [
  {
    id: 'furniture',
    title: 'Табурет',
    finale: 'Табурет собран. Он крепко стоит.',
    steps: [
      { id: 'seat', name: 'Сиденье', shape: 'plank', color: '#f3d2a4', accent: '#a86b32', x: 50, y: 34, decoyName: 'Крышка', decoyColor: '#c48a4a' },
      { id: 'leg-f', name: 'Передняя ножка', shape: 'leg', color: '#e6c08a', accent: '#8a5a2b', x: 34, y: 62, decoyName: 'Короткая палочка', decoyColor: '#d7b48a' },
      { id: 'leg-b', name: 'Задняя ножка', shape: 'leg', color: '#e6c08a', accent: '#8a5a2b', x: 66, y: 62, decoyName: 'Тонкая палочка', decoyColor: '#c9a36e' },
      { id: 'leg-l', name: 'Левая ножка', shape: 'leg', color: '#efd0a0', accent: '#8a5a2b', x: 30, y: 78, decoyName: 'Веточка', decoyColor: '#b99464' },
      { id: 'leg-r', name: 'Правая ножка', shape: 'leg', color: '#efd0a0', accent: '#8a5a2b', x: 70, y: 78, decoyName: 'Карандаш', decoyColor: '#e6c35a' },
      { id: 'bar', name: 'Перекладина', shape: 'plank', color: '#f0d2a4', accent: '#a86b32', x: 50, y: 72, decoyName: 'Линейка', decoyColor: '#f4e2a8' },
      { id: 'screw-l', name: 'Левый винт', shape: 'screw', color: '#eceff1', accent: '#607d8b', x: 34, y: 48, decoyName: 'Гвоздь', decoyColor: '#cfd8dc' },
      { id: 'screw-r', name: 'Правый винт', shape: 'screw', color: '#eceff1', accent: '#607d8b', x: 66, y: 48, decoyName: 'Кнопка', decoyColor: '#b0bec5' },
      { id: 'pad-l', name: 'Левый подпятник', shape: 'box', color: '#d7ccc8', accent: '#6d4c41', x: 34, y: 90, decoyName: 'Ластик', decoyColor: '#f8bbd0' },
      { id: 'pad-r', name: 'Правый подпятник', shape: 'box', color: '#d7ccc8', accent: '#6d4c41', x: 66, y: 90, decoyName: 'Кубик', decoyColor: '#ffe082' },
    ],
  },
  {
    id: 'electronics',
    title: 'Фонарик',
    finale: 'Фонарик зажёгся.',
    steps: [
      { id: 'body', name: 'Корпус', shape: 'bottle', color: '#eceff1', accent: '#546e7a', x: 50, y: 58, decoyName: 'Тубус', decoyColor: '#b0bec5' },
      { id: 'spring', name: 'Пружина', shape: 'spring', color: '#cfd8dc', accent: '#455a64', x: 50, y: 82, decoyName: 'Проволока', decoyColor: '#90a4ae' },
      { id: 'battery', name: 'Батарейка', shape: 'box', color: '#fff3c4', accent: '#f0a202', x: 50, y: 70, decoyName: 'Пустая батарейка', decoyColor: '#e0e0e0' },
      { id: 'bulb', name: 'Лампочка', shape: 'bulb', color: '#fff8e1', accent: '#f0a202', x: 50, y: 28, decoyName: 'Шарик', decoyColor: '#ffe082' },
      { id: 'reflector', name: 'Отражатель', shape: 'reflector', color: '#f5f5f5', accent: '#90a4ae', x: 50, y: 40, decoyName: 'Крышечка', decoyColor: '#cfd8dc' },
      { id: 'glass', name: 'Стекло', shape: 'glass', color: '#e3f2fd', accent: '#42a5f5', x: 50, y: 18, decoyName: 'Плёнка', decoyColor: '#bbdefb' },
      { id: 'btn', name: 'Кнопка', shape: 'button', color: '#ffcdd2', accent: '#e57373', x: 68, y: 58, decoyName: 'Бусина', decoyColor: '#f8bbd0' },
      { id: 'wire', name: 'Провод', shape: 'spring', color: '#c8e6c9', accent: '#43a047', x: 34, y: 64, decoyName: 'Нитка', decoyColor: '#dcedc8' },
      { id: 'seal', name: 'Кольцо', shape: 'wheel', color: '#d7ccc8', accent: '#6d4c41', x: 50, y: 48, decoyName: 'Резинка', decoyColor: '#bcaaa4' },
      { id: 'cap', name: 'Крышка', shape: 'box', color: '#cfd8dc', accent: '#455a64', x: 50, y: 8, decoyName: 'Пробка', decoyColor: '#b0bec5' },
    ],
  },
  {
    id: 'constructor',
    title: 'Машинка',
    finale: 'Машинка поехала.',
    steps: [
      { id: 'chassis', name: 'Кузов', shape: 'car', color: '#ffcdd2', accent: '#e53935', x: 50, y: 48, decoyName: 'Коробка', decoyColor: '#ef9a9a' },
      { id: 'cabin', name: 'Кабина', shape: 'cabin', color: '#bbdefb', accent: '#1e88e5', x: 42, y: 34, decoyName: 'Окошко', decoyColor: '#90caf9' },
      { id: 'wheel-fl', name: 'Переднее колесо', shape: 'wheel', color: '#eceff1', accent: '#37474f', x: 30, y: 68, decoyName: 'Колесо самоката', decoyColor: '#cfd8dc' },
      { id: 'wheel-bl', name: 'Заднее колесо', shape: 'wheel', color: '#eceff1', accent: '#37474f', x: 70, y: 68, decoyName: 'Диск', decoyColor: '#b0bec5' },
      { id: 'wheel-fr', name: 'Правое колесо', shape: 'wheel', color: '#eceff1', accent: '#455a64', x: 28, y: 78, decoyName: 'Кружок', decoyColor: '#dfe6ea' },
      { id: 'wheel-br', name: 'Второе заднее', shape: 'wheel', color: '#eceff1', accent: '#455a64', x: 72, y: 78, decoyName: 'Шайба', decoyColor: '#c5d0d6' },
      { id: 'wheel-steer', name: 'Руль', shape: 'wheel', color: '#ffe0b2', accent: '#ef6c00', x: 40, y: 40, decoyName: 'Кольцо', decoyColor: '#ffcc80' },
      { id: 'lamp-l', name: 'Левая фара', shape: 'bulb', color: '#fff9c4', accent: '#fbc02d', x: 24, y: 48, decoyName: 'Фонарик', decoyColor: '#fff59d' },
      { id: 'lamp-r', name: 'Правая фара', shape: 'bulb', color: '#fff9c4', accent: '#f9a825', x: 76, y: 48, decoyName: 'Лампа', decoyColor: '#ffe082' },
      { id: 'spoiler', name: 'Спойлер', shape: 'plank', color: '#ffcdd2', accent: '#c62828', x: 78, y: 28, decoyName: 'Планка', decoyColor: '#e57373' },
    ],
  },
];
