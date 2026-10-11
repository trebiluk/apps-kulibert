// Flora pack. Birch and pine. Permanent ids 1200-1299, written once.
// Never reuse or renumber this band.
import { registerPack } from '../registry.js'
import './art.js'

export const FLORA_BAND = [1200, 1299]
export const FLORA_IDS = {
  birchLog: 1200,
  birchLeaves: 1201,
  birchPlanks: 1202,
  pineLog: 1203,
  pineNeedles: 1204,
  pinePlanks: 1205,
}

const blocks = [
  [FLORA_IDS.birchLog, 'birchLog', 'wrap_birchLog', 'Bi', null],
  [FLORA_IDS.birchLeaves, 'birchLeaves', 'wrap_birchLeaves', 'Be', null],
  [FLORA_IDS.birchPlanks, 'birchPlanks', 'wrap_birchPlanks', 'Bp', null],
  [FLORA_IDS.pineLog, 'pineLog', 'wrap_pineLog', 'Pi', null],
  [FLORA_IDS.pineNeedles, 'pineNeedles', 'wrap_pineNeedles', 'Ne', null],
  [FLORA_IDS.pinePlanks, 'pinePlanks', 'wrap_pinePlanks', 'Pp', null],
]

const items = [
  { key: 'birchLog', def: { block: FLORA_IDS.birchLog, letter: 'Bi', base: 4, stack: 64, sell: true } },
  { key: 'birchLeaves', def: { block: FLORA_IDS.birchLeaves, letter: 'Be', base: 0, sell: false, stack: 64 } },
  { key: 'birchPlanks', def: { block: FLORA_IDS.birchPlanks, letter: 'Bp', base: 1, stack: 64, sell: true } },
  { key: 'pineLog', def: { block: FLORA_IDS.pineLog, letter: 'Pi', base: 4, stack: 64, sell: true } },
  { key: 'pineNeedles', def: { block: FLORA_IDS.pineNeedles, letter: 'Ne', base: 0, sell: false, stack: 64 } },
  { key: 'pinePlanks', def: { block: FLORA_IDS.pinePlanks, letter: 'Pp', base: 1, stack: 64, sell: true } },
  { key: 'pinecone', def: { letter: 'Pc', base: 0, sell: false, stack: 64 } },
]

const recipes = [
  { id: 'birchPlanks', at: 'bench', in: [['birchLog', 1]], out: ['birchPlanks', 4], secs: 2 },
  { id: 'pinePlanks', at: 'bench', in: [['pineLog', 1]], out: ['pinePlanks', 4], secs: 2 },
]

const SKILL = {
  birchLog: 'skillBirchLog',
  birchLeaves: 'skillBirchLeaves',
  birchPlanks: 'skillBirchPlanks',
  pineLog: 'skillPineLog',
  pineNeedles: 'skillPineNeedles',
  pinePlanks: 'skillPinePlanks',
  pinecone: 'skillPinecone',
}

export function floraSkill(item) {
  return SKILL[item] || ''
}

export function floraExtra(blockId, x, y, z) {
  if ((blockId | 0) !== FLORA_IDS.pineNeedles) return ''
  const h = (Math.imul(x | 0, 2246822519) ^ Math.imul(y | 0, 3266489917) ^ Math.imul(z | 0, 668265263)) >>> 0
  return h % 3 === 0 ? 'pinecone' : ''
}

const strings = {
  en: {
    birchLog: 'Birch Log', birchLeaves: 'Birch Leaves', birchPlanks: 'Birch Planks',
    pineLog: 'Pine Log', pineNeedles: 'Pine Needles', pinePlanks: 'Pine Planks', pinecone: 'Pinecone',
    plankAny: 'Any planks',
    skillBirchLog: 'Birch bark is pale with dark marks. One birch log makes four pale planks at the Workbench.',
    skillBirchLeaves: 'Birch leaves are light green. Birch grows on the edge of a forest.',
    skillBirchPlanks: 'Birch planks are pale. Any recipe that needs planks takes them.',
    skillPineLog: 'Pine grows on hills and high ground. Its crown is a dark green cone.',
    skillPineNeedles: 'Pine needles stay dark green. Chop them and a pinecone may fall.',
    skillPinePlanks: 'Pine planks are dark. Any recipe that needs planks takes them.',
    skillPinecone: 'A pinecone is small Oven fuel. It burns for 1.',
  },
  uk: {
    birchLog: 'Березова колода', birchLeaves: 'Березове листя', birchPlanks: 'Березові дошки',
    pineLog: 'Соснова колода', pineNeedles: 'Соснова хвоя', pinePlanks: 'Соснові дошки', pinecone: 'Шишка',
    plankAny: 'Будь-які дошки',
    skillBirchLog: 'Кора берези світла, з темними рисочками. Одна колода дає чотири світлі дошки на верстаку.',
    skillBirchLeaves: 'Листя берези світло-зелене. Береза росте на краю лісу.',
    skillBirchPlanks: 'Березові дошки світлі. Будь-який рецепт із дощок їх бере.',
    skillPineLog: 'Сосна росте на пагорбах і височині. Крона — темно-зелений конус.',
    skillPineNeedles: 'Хвоя лишається темно-зеленою. Зрубай її, і може впасти шишка.',
    skillPinePlanks: 'Соснові дошки темні. Будь-який рецепт із дощок їх бере.',
    skillPinecone: 'Шишка — маленьке паливо для печі. Горить на 1.',
  },
  ru: {
    birchLog: 'Берёзовое бревно', birchLeaves: 'Берёзовые листья', birchPlanks: 'Берёзовые доски',
    pineLog: 'Сосновое бревно', pineNeedles: 'Сосновая хвоя', pinePlanks: 'Сосновые доски', pinecone: 'Шишка',
    plankAny: 'Любые доски',
    skillBirchLog: 'Кора берёзы светлая, с тёмными чёрточками. Одно бревно даёт четыре светлые доски на верстаке.',
    skillBirchLeaves: 'Листья берёзы светло-зелёные. Берёза растёт на краю леса.',
    skillBirchPlanks: 'Берёзовые доски светлые. Любой рецепт с досками их берёт.',
    skillPineLog: 'Сосна растёт на холмах и высоте. Крона — тёмно-зелёный конус.',
    skillPineNeedles: 'Хвоя остаётся тёмно-зелёной. Сруби её, и может упасть шишка.',
    skillPinePlanks: 'Сосновые доски тёмные. Любой рецепт с досками их берёт.',
    skillPinecone: 'Шишка — маленькое топливо для печи. Горит на 1.',
  },
  es: {
    birchLog: 'Tronco de abedul', birchLeaves: 'Hojas de abedul', birchPlanks: 'Tablas de abedul',
    pineLog: 'Tronco de pino', pineNeedles: 'Agujas de pino', pinePlanks: 'Tablas de pino', pinecone: 'Piña',
    plankAny: 'Cualquier tabla',
    skillBirchLog: 'La corteza del abedul es pálida con marcas oscuras. Un tronco da cuatro tablas pálidas en el banco.',
    skillBirchLeaves: 'Las hojas del abedul son verde claro. El abedul crece al borde del bosque.',
    skillBirchPlanks: 'Las tablas de abedul son pálidas. Cualquier receta de tablas las acepta.',
    skillPineLog: 'El pino crece en cerros y terreno alto. Su copa es un cono verde oscuro.',
    skillPineNeedles: 'Las agujas siguen verde oscuro. Al cortarlas puede caer una piña.',
    skillPinePlanks: 'Las tablas de pino son oscuras. Cualquier receta de tablas las acepta.',
    skillPinecone: 'Una piña es poco combustible del horno. Arde por 1.',
  },
  ar: {
    birchLog: 'جذع بتولا', birchLeaves: 'أوراق بتولا', birchPlanks: 'ألواح بتولا',
    pineLog: 'جذع صنوبر', pineNeedles: 'إبر صنوبر', pinePlanks: 'ألواح صنوبر', pinecone: 'كوز صنوبر',
    plankAny: 'أي ألواح',
    skillBirchLog: 'لحاء البتولا فاتح وفيه علامات داكنة. جذع واحد يعطي أربعة ألواح فاتحة على طاولة العمل.',
    skillBirchLeaves: 'أوراق البتولا خضراء فاتحة. البتولا ينمو على حافة الغابة.',
    skillBirchPlanks: 'ألواح البتولا فاتحة. أي وصفة تحتاج ألواحاً تقبلها.',
    skillPineLog: 'الصنوبر ينمو على التلال والأرض العالية. تاجه مخروط أخضر داكن.',
    skillPineNeedles: 'الإبر تبقى خضراء داكنة. اكسرها وقد يسقط كوز.',
    skillPinePlanks: 'ألواح الصنوبر داكنة. أي وصفة تحتاج ألواحاً تقبلها.',
    skillPinecone: 'كوز الصنوبر وقود صغير للفرن. يحترق بمقدار 1.',
  },
  'fa-AF': {
    birchLog: 'کُندهٔ غان', birchLeaves: 'برگ غان', birchPlanks: 'تختهٔ غان',
    pineLog: 'کُندهٔ کاج', pineNeedles: 'سوزن کاج', pinePlanks: 'تختهٔ کاج', pinecone: 'مخروط کاج',
    plankAny: 'هر تخته',
    skillBirchLog: 'پوست غان کم‌رنگ است و نشانه‌های تیره دارد. یک کُنده در میز کار چهار تختهٔ کم‌رنگ می‌دهد.',
    skillBirchLeaves: 'برگ غان سبز روشن است. غان در کنارهٔ جنگل می‌روید.',
    skillBirchPlanks: 'تختهٔ غان کم‌رنگ است. هر دستور که تخته می‌خواهد آن را می‌گیرد.',
    skillPineLog: 'کاج روی تپه و زمین بلند می‌روید. تاج آن مخروط سبز تیره است.',
    skillPineNeedles: 'سوزن کاج سبز تیره می‌ماند. اگر بشکنی، شاید مخروط بیفتد.',
    skillPinePlanks: 'تختهٔ کاج تیره است. هر دستور که تخته می‌خواهد آن را می‌گیرد.',
    skillPinecone: 'مخروط کاج سوخت کوچک تنور است. برای ۱ می‌سوزد.',
  },
  rw: {
    birchLog: 'Igiti cya birch', birchLeaves: 'Amababi ya birch', birchPlanks: 'Imbaho za birch',
    pineLog: 'Igiti cya pine', pineNeedles: 'Udusindani twa pine', pinePlanks: 'Imbaho za pine', pinecone: 'Ikozanyuma',
    plankAny: 'Imbaho zose',
    skillBirchLog: 'Igishishwa cya birch ni umweru kandi gifite udusonga twijimye. Igiti kimwe gitanga imbaho enye ku meza y\'imirimo.',
    skillBirchLeaves: 'Amababi ya birch ni icyatsi cyeruruka. Birch ikura ku mupaka w\'ishyamba.',
    skillBirchPlanks: 'Imbaho za birch ni umweru. Uko ukora ukoresha imbaho kuzemera.',
    skillPineLog: 'Pine ikura ku misozi no hejuru. Isura yayo ni icyatsi cyijimye nk\'ikoni.',
    skillPineNeedles: 'Udusindani twa pine tuguma twijimye. Nuvuna, ikozanyuma ishobora kugwa.',
    skillPinePlanks: 'Imbaho za pine nijimye. Uko ukora ukoresha imbaho kuzemera.',
    skillPinecone: 'Ikozanyuma ni amakara make y\'icyoto. Yaka 1.',
  },
  ti: {
    birchLog: 'ጐንዲ በርች', birchLeaves: 'ቆጽሊ በርች', birchPlanks: 'ጣውላ በርች',
    pineLog: 'ጐንዲ ጽድ', pineNeedles: 'ሽንጽሮ ጽድ', pinePlanks: 'ጣውላ ጽድ', pinecone: 'ኮን ጽድ',
    plankAny: 'ዝኾነ ጣውላ',
    skillBirchLog: 'ቅጫፍ በርች ፍካት እዩ፡ ጸሊም ምልክታት ኣለዎ። ሓንቲ ጐንዲ ኣብ መደብ ስራሕ ኣርባዕተ ፍኩሳት ጣውላ ትህብ።',
    skillBirchLeaves: 'ቆጽሊ በርች ፍኩስ ቀጠልያ እዩ። በርች ኣብ ወሰን ዱር ትበቕል።',
    skillBirchPlanks: 'ጣውላ በርች ፍኩስ እዩ። ጣውላ ዝደሊ ኩሉ ቅብሊት ይወስዶ።',
    skillPineLog: 'ጽድ ኣብ ኮረባታትን ልዑል መሬትን ትበቕል። ኣኽሊላ ጸሊም ቀጠልያ ኮን እዩ።',
    skillPineNeedles: 'ሽንጽሮ ጽድ ጸሊም ቀጠልያ ይጸንሕ። እንተ ሰበርካዮ ኮን ክወድቕ ይኽእል።',
    skillPinePlanks: 'ጣውላ ጽድ ጸሊም እዩ። ጣውላ ዝደሊ ኩሉ ቅብሊት ይወስዶ።',
    skillPinecone: 'ኮን ጽድ ንእሽቶ ነዳዲ እቶን እዩ። ን1 የንድድ።',
  },
}

registerPack({
  id: 'flora',
  v: 1,
  band: FLORA_BAND,
  blocks,
  items,
  recipes,
  drops: blocks.map((row) => [row[0], row[1]]),
  strings,
})
