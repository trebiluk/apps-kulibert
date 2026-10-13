// Tech pack. Circuits. Permanent ids 1400-1405. Never reuse or renumber.
import { registerPack } from '../registry.js'
import { Rules } from '../../rules.js'

export const TECH = {
  cell: 1400,
  line: 1401,
  switch: 1402,
  switchOn: 1403,
  button: 1404,
  buttonOn: 1405,
}

const L = (en, uk, ru, es, ar, fa, rw, ti) => ({ en, uk, ru, es, ar, 'fa-AF': fa, rw, ti })

Rules.register({
  id: 'tech.circuits',
  type: 'bool',
  def: true,
  group: 'building',
  display: 'building',
  icon: '⚡',
  label: L('Circuits', 'Кола', 'Цепи', 'Circuitos', 'دوائر', 'مدارها', 'Amakuru y\'amashanyarazi', 'ሰርኪት'),
  desc: L(
    'A battery can light a lamp through a closed loop.',
    'Батарея може засвітити лампу через замкнене коло.',
    'Батарея может зажечь лампу через замкнутую цепь.',
    'Una pila puede encender una lámpara en un lazo cerrado.',
    'بطارية تضيء مصباحاً عبر حلقة مغلقة.',
    'یک پیل می‌تواند چراغ را از حلقهٔ بسته روشن کند.',
    'Bateri ishobora gucana itara binyuze mu ruziga rwuzuye.',
    'ባትሪ መብራህቲ ብዝተዓጽወ ዓንኬል ከብርህ ይኽእል።',
  ),
})

const blocks = [
  [TECH.cell, 'techCell', 'wrap_techCell', 'Bc', null],
  [TECH.line, 'techLine', 'wrap_techLine', 'Nl', null],
  [TECH.switch, 'techSwitch', 'wrap_techSwitch', 'Ts', null],
  [TECH.switchOn, 'techSwitchOn', 'wrap_techSwitchOn', 'To', null],
  [TECH.button, 'techButton', 'wrap_techButton', 'Tb', null],
  [TECH.buttonOn, 'techButtonOn', 'wrap_techButtonOn', 'Tn', null],
]

const items = [
  { key: 'techLine', def: { block: TECH.line, letter: 'Nl', base: 0, sell: false, stack: 64 } },
  { key: 'techSwitch', def: { block: TECH.switch, letter: 'Ts', base: 0, sell: false, stack: 64 } },
  { key: 'techButton', def: { block: TECH.button, letter: 'Tb', base: 0, sell: false, stack: 64 } },
  { key: 'circuitLens', def: { svg: 'circuitLens', letter: 'Cl', base: 0, sell: false, stack: 1, tool: 'lens' } },
]

const recipes = [
  { id: 'techLine', at: 'bench', in: [['copperIngot', 1]], out: ['techLine', 4], secs: 2 },
  { id: 'techSwitch', at: 'bench', in: [['copperIngot', 1], ['stick', 1]], out: ['techSwitch', 1], secs: 2 },
  { id: 'techButton', at: 'bench', in: [['copperIngot', 1]], out: ['techButton', 1], secs: 2 },
  { id: 'circuitLens', at: 'bench', in: [['glass', 1], ['copperIngot', 1]], out: ['circuitLens', 1], secs: 3 },
]

const drops = [
  [TECH.cell, 'batteryCell'],
  [TECH.line, 'techLine'],
  [TECH.switch, 'techSwitch'],
  [TECH.switchOn, 'techSwitch'],
  [TECH.button, 'techButton'],
  [TECH.buttonOn, 'techButton'],
]

registerPack({
  id: 'tech',
  v: 1,
  blocks,
  items,
  recipes,
  drops,
  strings: {
    en: {
      techCell: 'Battery Cell', techLine: 'Copper wire', techSwitch: 'Switch', techSwitchOn: 'Switch',
      techButton: 'Push Button', techButtonOn: 'Push Button', circuitLens: 'Circuit Lens',
    },
    uk: {
      techCell: 'Батарея', techLine: 'Мідний дріт', techSwitch: 'Вимикач', techSwitchOn: 'Вимикач',
      techButton: 'Кнопка', techButtonOn: 'Кнопка', circuitLens: 'Лінза кола',
    },
    ru: {
      techCell: 'Батарея', techLine: 'Медная проволока', techSwitch: 'Выключатель', techSwitchOn: 'Выключатель',
      techButton: 'Кнопка', techButtonOn: 'Кнопка', circuitLens: 'Линза цепи',
    },
    es: {
      techCell: 'Pila', techLine: 'Cable de cobre', techSwitch: 'Interruptor', techSwitchOn: 'Interruptor',
      techButton: 'Pulsador', techButtonOn: 'Pulsador', circuitLens: 'Lente del circuito',
    },
    ar: {
      techCell: 'خلية', techLine: 'سلك نحاس', techSwitch: 'مفتاح', techSwitchOn: 'مفتاح',
      techButton: 'زر ضغط', techButtonOn: 'زر ضغط', circuitLens: 'عدسة الدائرة',
    },
    'fa-AF': {
      techCell: 'پیل', techLine: 'سیم مس', techSwitch: 'کلید', techSwitchOn: 'کلید',
      techButton: 'دکمه فشاری', techButtonOn: 'دکمه فشاری', circuitLens: 'عدسی مدار',
    },
    rw: {
      techCell: 'Bateri', techLine: 'Umugozi wa kope', techSwitch: 'Ikinyuranyo', techSwitchOn: 'Ikinyuranyo',
      techButton: 'Buto', techButtonOn: 'Buto', circuitLens: 'Ishusho y\'uruziga',
    },
    ti: {
      techCell: 'ባትሪ', techLine: 'ገመድ ናሕስ', techSwitch: 'መቐለሊ', techSwitchOn: 'መቐለሊ',
      techButton: 'መጠወቒ', techButtonOn: 'መጠወቒ', circuitLens: 'መነጽር ሰርኪት',
    },
  },
})
