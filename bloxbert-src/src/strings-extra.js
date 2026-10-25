// Extra 2.2.0 strings. Dari is Dari, not Arabic.
import { packStrings } from './packs/registry.js'
import './packs/farm/pack.js'
import './packs/flora/pack.js'
import './packs/tech/pack.js'
import './packs/decor/pack.js'
export const EXTRA = {
  en: {
    changelog: 'Changelog', youAreHere: 'You are here', tourMove: 'Walk with WASD', tourLook: 'Drag to look', tourPlace: 'Place and break', tourBar: 'Open your bag', tourShop: 'Sell to Tally', tourTools: 'Fill a box', place10: 'Place 10 blocks', fillBox: 'Fill a box', sell3: 'Sell 3 logs', helpBody: 'Pick a tile', helpLamps: 'Get a Floor Lamp or Wall Lamp at the Woodshop. Hold it and tap the ground or a wall to place it. Tap it again to turn it on.', helpWoodshop: 'Tap a Woodshop to open it. Hang your 4 tools, then make a lamp or a Bed.', language: 'Language', pickLanguage: 'Pick', suitText: 'Suit {n}/{max}', backToHub: 'Back to the Hub', pvpOn: 'PvP: ON', pvpOff: 'PvP: OFF', keepStuffOn: 'Keep my stuff: ON', keepStuffOff: 'Keep my stuff: OFF', kitPvpOn: 'Kit PvP: ON', kitPvpOff: 'Kit PvP: OFF', select: 'Select', option: 'Option', phase1: 'Stamp coming', phase2: 'Conveyor', phase3: 'Vent left', rustbotNear: 'Rustbot nearby, hit its back', slam: 'Slam!', dexPage: 'New Bertodex page', badgeGot: 'Badge', scrapperTook: 'Scrapper took your item', zap: 'Zap!', rebooted: 'Rebooted!', pvpHint: 'Bertopia favors teaming up; PvP only if both players say yes. You keep your stuff in the main world.', tour: 'Tour', next: 'Next', skip: 'Skip', tryThis: 'Try', a11y: 'Accessibility', goalDone: 'Goal done', highContrast: 'High Contrast', gentle: 'Gentle Mode', sendTeacher: 'Send To Teacher', sentTeacher: 'Sent to Mr. Kulibert', noFly: 'No flying in Survival', tapCorner: 'Tap Corner A first', cornerA: 'Corner A set', addCoal: 'Add Coal', bake: 'Bake', sell: 'Sell', buy: 'Buy',
    filled: 'Filled {n} blocks', homeSet: 'Home set', homeCleared: 'Home cleared', pickup: 'Pick up', paste: 'Paste',
    buildTools: 'Build Tools', exitApp: 'Exit', leaveAsk: 'Leave Bertopia? Your world is saved.', leave: 'Leave', stay: 'Stay', myBuilds: 'My Builds', undoMinutes: 'Undo Minutes', snapshots: 'Snapshots', emptyBag: 'Empty bag: break blocks or buy at Tally\'s', emptySlot: 'Empty slot', tooBig: 'Too big: max 64 × 32 × 64', badBuild: 'That file is not a Bertopia build', fineLater: 'Fine-scale decor comes later', changedTo: 'Changed:',
    coreplate: 'Coreplate', workbench: 'Workbench', oven: 'Oven', vend: 'Vending Counter', storeCounter: 'Store Counter', bunk: 'Bunk', box: 'Box', woodTool: 'Wood Pickaxe', stoneTool: 'Stone Pickaxe', putIn: 'Put in', boxFull: 'The box is full.', door: 'Door', doorOpen: 'Open door', doorOpenMsg: 'The door is open.', doorShut: 'The door is shut.', pathTree: 'Chop the tree in front of you. It gives Planks.', pathTool: 'Make a Wood Pickaxe', pathStone: 'Mine stone', pathCoal: 'Dig up coal', pathDoor: 'Place a door', pathHome: 'Set a home on a bunk',
    whatsNewBody: 'Follow the gold step. Chop, make a tool, mine stone, dig coal, place a door, then set a home.',
    menuHint: 'Tap ☰ or press Esc for menu', menuHintTouch: 'Tap ☰ for menu', resume: 'Resume', inventory: 'Inventory', crafting: 'Crafting', shop: 'Shop', wallet: 'Wallet',
    practice: 'practice', worth: 'Worth', tallyPays: 'Tally pays', youHave: 'You have', usedIn: 'Used in', make: 'Make', bagFull: 'Bag full', noItem: 'You have no {item}.',
    coreplateToast: 'Coreplate. Nothing gets through.', poofTown: 'Poof! Back at Bertyville.', poofBunk: 'Poof! Back at your Bunk.', alreadyLeft: 'That block already left your bag.',
    needsOven: 'Needs an Oven nearby', needsBench: 'Needs a Workbench nearby', tallyEnough: 'Tally has enough {item} today', cantSell: '⚙ 0 · can\'t sell',
    sold: 'Sold {n} {item} to Tally', bought: 'Bought {n} {item}', townBought: 'A townsperson bought {n} {item} for ⚙ {cogs}',
    setHome: 'Set home here?', yes: 'Yes', no: 'No', teacher: 'Teacher', pin: 'PIN', priceDial: 'Price dial', dailyCap: 'Daily cap', startCogs: 'Start Cogs',
    townsfolk: 'Townsfolk', resetWallet: 'Reset wallet', onDevice: 'On this device only', pricesChanged: 'Prices changed', fair: 'Fair', yours: 'Yours',
    takeTill: 'Take till', soldOut: 'Sold out: restock', profit: 'Profit', spent: 'Spent', cogsIn: 'In', backMenu: 'Menu', survival: 'Survival',
    myCounter: 'My Counter', bunk: 'Bunk', prices: 'Prices', stock: 'Stock', needMore: 'Need ⚙ {n} more', shopProtected: 'The town stays. Build on a marked plot, or outside town.', setSpawnHere: 'Set spawn here', protectedArea: 'Protected area', protect: 'Protection', townYes: 'This device may change the town', townNo: 'This device leaves the town alone',
    ingredients: 'Ingredients: flour, sugar, berries · Bake 10 s', breadLabel: 'Ingredients: flour · Bake 8 s', versionSkew: 'That world uses a different version',
  },
  uk: {
    tour: 'Тур', tourMove: 'Йди з WASD', tourLook: 'Тягни щоб дивитись', tourPlace: 'Став і ламай', tourBar: 'Відкрий сумку', tourShop: 'Продай Таллі', tourTools: 'Заповни рамку', place10: 'Постав 10 блоків', fillBox: 'Заповни рамку', sell3: 'Продай 3 колоди', helpBody: 'Обери плитку', backToHub: 'Назад до Хабу', language: 'Мова', pickLanguage: 'Вибрати', suitText: 'Костюм {n}/{max}', pvpOn: 'PvP: УВІМК', pvpOff: 'PvP: ВИМК', keepStuffOn: 'Зберігати мої речі: УВІМК', keepStuffOff: 'Зберігати мої речі: ВИМК', kitPvpOn: 'PvP з наборами: УВІМК', kitPvpOff: 'PvP з наборами: ВИМК', pvpHint: 'У Bertopia краще грати разом. PvP лише тоді, коли обидва гравці кажуть «так». У головному світі твої речі залишаються з тобою.', helpLamps: 'Візьми підлогову або настінну лампу в Майстерні. Тримай її і торкнись землі чи стіни. Торкнись ще раз, щоб увімкнути.', helpWoodshop: 'Торкнись Майстерні, щоб відкрити. Повісь 4 інструменти, потім зроби лампу чи Ліжко.', a11y: 'Доступність', goalDone: 'Ціль виконано', highContrast: 'Високий контраст', gentle: 'Мʼякий режим', sendTeacher: 'Надіслати вчителю', sentTeacher: 'Надіслано вчителю', noFly: 'У Виживанні без польоту', tapCorner: 'Спершу кут А', cornerA: 'Кут А задано', addCoal: 'Додай вугілля', bake: 'Печи', sell: 'Продати', buy: 'Купити', filled: 'Заповнено {n}', homeSet: 'Дім задано', homeCleared: 'Дім знято', pickup: 'Забрати', paste: 'Вставити', fuel: 'Паливо', input: 'Вхід', output: 'Вихід', left: 'лишилось', bag: 'Сумка', slotN: 'слот {n}',
    changelog: 'Журнал', youAreHere: 'Ти тут', next: 'Далі', skip: 'Пропустити', tryThis: 'Спробуй', sell: 'Продати', buy: 'Купити', addCoal: 'Додай вугілля', bake: 'Печи',
    buildTools: 'Інструменти', exitApp: 'Вихід', leaveAsk: 'Вийти з Bertopia? Світ збережено.', leave: 'Вийти', stay: 'Лишитись', myBuilds: 'Мої будови', undoMinutes: 'Хвилини назад', snapshots: 'Знімки', emptyBag: 'Сумка порожня: ламай блоки або купи в Таллі', emptySlot: 'Порожня клітинка', tooBig: 'Завелике: макс 64 × 32 × 64', badBuild: 'Це не файл будови Bertopia', fineLater: 'Дрібний декор буде пізніше', changedTo: 'Змінено:',
    coreplate: 'Підлога-ядро', workbench: 'Верстак', oven: 'Піч', vend: 'Прилавок', storeCounter: 'Прилавок крамниці', bunk: 'Ліжко', box: 'Скриня', woodTool: 'Дерев’яне кайло', stoneTool: 'Кам’яне кайло', putIn: 'Покласти', boxFull: 'Скриня повна.', door: 'Двері', doorOpen: 'Відчинені двері', doorOpenMsg: 'Двері відчинено.', doorShut: 'Двері зачинено.', pathTree: 'Зрубай дерево перед собою. Воно дає Дошки.', pathTool: 'Зроби дерев’яне кайло', pathStone: 'Добудь камінь', pathCoal: 'Викопай вугілля', pathDoor: 'Постав двері', pathHome: 'Задай дім на ліжку',
    whatsNewBody: 'Bertopia 2.5.0: Картинний тур і цілі «Спробуй» показують, як грати. Обери свою панель будови. У Виживанні немає польоту. Є Допомога і Доступність, і можна надіслати Шестерні вчителю.',
    menuHint: 'Торкнись ☰ або Esc для меню', menuHintTouch: 'Торкнись ☰ для меню', resume: 'Далі', inventory: 'Сумка', crafting: 'Крафт', shop: 'Крамниця', wallet: 'Гаманець',
    practice: 'навчання', worth: 'Варто', tallyPays: 'Таллі платить', youHave: 'У тебе', usedIn: 'Входить у', make: 'Зробити', bagFull: 'Сумка повна', noItem: 'Немає: {item}.',
    coreplateToast: 'Підлога-ядро. Нічого не проходить.', poofTown: 'Пуф! Знову в Бертівіллі.', poofBunk: 'Пуф! Знову в ліжку.', alreadyLeft: 'Цей блок уже пішов із сумки.',
    needsOven: 'Потрібна піч поруч', needsBench: 'Потрібен верстак поруч', tallyEnough: 'Таллі досить {item} сьогодні', cantSell: '⚙ 0 · не продається',
    sold: 'Продано {n} {item} Таллі', bought: 'Куплено {n} {item}', townBought: 'Містянин купив {n} {item} за ⚙ {cogs}',
    setHome: 'Дім тут?', yes: 'Так', no: 'Ні', teacher: 'Вчитель', pin: 'PIN', priceDial: 'Ціна', dailyCap: 'Ліміт дня', startCogs: 'Старт',
    townsfolk: 'Містяни', resetWallet: 'Скинути гаманець', onDevice: 'Лише на цьому пристрої', pricesChanged: 'Ціни змінено', fair: 'Чесно', yours: 'Твоя',
    takeTill: 'Забрати касу', soldOut: 'Немає: поповни', profit: 'Прибуток', spent: 'Витрачено', cogsIn: 'Надходження', backMenu: 'Меню', survival: 'Виживання',
    myCounter: 'Мій прилавок', bunk: 'Ліжко', prices: 'Ціни', stock: 'Запас', needMore: 'Ще ⚙ {n}', shopProtected: 'Місто лишається. Будуй на ділянці або за містом.', setSpawnHere: 'Постав спавн тут', protectedArea: 'Захищена зона', protect: 'Захист', townYes: 'Цей пристрій може змінювати місто', townNo: 'Цей пристрій не чіпає місто',
    ingredients: 'Склад: борошно, цукор, ягоди · Випічка 10 с', breadLabel: 'Склад: борошно · Випічка 8 с', versionSkew: 'Цей світ іншої версії',
  },
  ru: {
    changelog: 'Журнал', youAreHere: 'Ты здесь', next: 'Дальше', skip: 'Пропустить', tryThis: 'Попробуй', tour: 'Тур', tourMove: 'Иди с WASD', tourLook: 'Тяни чтобы смотреть', tourPlace: 'Ставь и ломай', tourBar: 'Открой сумку', tourShop: 'Продай Талли', tourTools: 'Заполни рамку', place10: 'Поставь 10 блоков', fillBox: 'Заполни рамку', sell3: 'Продай 3 бревна', helpBody: 'Выбери плитку', backToHub: 'Назад в Хаб', language: 'Язык', pickLanguage: 'Выбрать', suitText: 'Костюм {n}/{max}', pvpOn: 'PvP: ВКЛ', pvpOff: 'PvP: ВЫКЛ', keepStuffOn: 'Сохранять мои вещи: ВКЛ', keepStuffOff: 'Сохранять мои вещи: ВЫКЛ', kitPvpOn: 'PvP с наборами: ВКЛ', kitPvpOff: 'PvP с наборами: ВЫКЛ', pvpHint: 'В Bertopia лучше играть вместе. PvP только если оба игрока говорят «да». В главном мире твои вещи остаются с тобой.', helpLamps: 'Возьми напольную или настенную лампу в Мастерской. Держи её и коснись земли или стены. Коснись ещё раз, чтобы включить.', helpWoodshop: 'Коснись Мастерской, чтобы открыть. Повесь 4 инструмента, потом сделай лампу или Кровать.', a11y: 'Доступность', goalDone: 'Цель готова', highContrast: 'Высокий контраст', gentle: 'Мягкий режим', sendTeacher: 'Отправить учителю', sentTeacher: 'Отправлено учителю', noFly: 'В Выживании без полёта', tapCorner: 'Сначала угол А', cornerA: 'Угол А задан', addCoal: 'Добавь уголь', bake: 'Пеки', sell: 'Продать', buy: 'Купить', filled: 'Заполнено {n}', homeSet: 'Дом задан', homeCleared: 'Дом снят', pickup: 'Забрать', paste: 'Вставить', fuel: 'Топливо', input: 'Вход', output: 'Выход', left: 'осталось', bag: 'Сумка', slotN: 'слот {n}', needBlocks: 'Нужно ещё {n} {item}', pickBlock: 'Сначала выбери блок на панели',
    buildTools: 'Инструменты', exitApp: 'Выход', leaveAsk: 'Выйти из Bertopia? Мир сохранён.', leave: 'Выйти', stay: 'Остаться', myBuilds: 'Мои стройки', undoMinutes: 'Минуты назад', snapshots: 'Снимки', emptyBag: 'Сумка пуста: ломай блоки или купи у Талли', emptySlot: 'Пустая ячейка', tooBig: 'Слишком большое: макс 64 × 32 × 64', badBuild: 'Это не файл стройки Bertopia', fineLater: 'Мелкий декор будет позже', changedTo: 'Изменено:',
    coreplate: 'Пол-ядро', workbench: 'Верстак', oven: 'Печь', vend: 'Прилавок', storeCounter: 'Прилавок лавки', bunk: 'Кровать', box: 'Сундук', woodTool: 'Деревянная кирка', stoneTool: 'Каменная кирка', putIn: 'Положить', boxFull: 'Сундук полон.', door: 'Дверь', doorOpen: 'Открытая дверь', doorOpenMsg: 'Дверь открыта.', doorShut: 'Дверь закрыта.', pathTree: 'Сруби дерево перед собой. Оно даёт Доски.', pathTool: 'Сделай деревянную кирку', pathStone: 'Добудь камень', pathCoal: 'Выкопай уголь', pathDoor: 'Поставь дверь', pathHome: 'Задай дом на кровати',
    whatsNewBody: 'Bertopia 2.5.0: Картинный тур и цели «Попробуй» показывают, как играть. Выбери свою панель стройки. В Выживании нет полёта. Есть Помощь и Доступность, и можно отправить Шестерни учителю.',
    menuHint: 'Нажми ☰ или Esc для меню', menuHintTouch: 'Нажми ☰ для меню', resume: 'Дальше', inventory: 'Сумка', crafting: 'Крафт', shop: 'Лавка', wallet: 'Кошелёк',
    practice: 'учёба', worth: 'Цена', tallyPays: 'Талли платит', youHave: 'У тебя', usedIn: 'Нужен в', make: 'Сделать', bagFull: 'Сумка полна', noItem: 'Нет: {item}.',
    coreplateToast: 'Пол-ядро. Ничего не проходит.', poofTown: 'Пуф! Снова в Бертивилле.', poofBunk: 'Пуф! Снова у кровати.', alreadyLeft: 'Этот блок уже ушёл из сумки.',
    needsOven: 'Нужна печь рядом', needsBench: 'Нужен верстак рядом', tallyEnough: 'Талли хватит {item} сегодня', cantSell: '⚙ 0 · нельзя продать',
    sold: 'Продано {n} {item} Талли', bought: 'Куплено {n} {item}', townBought: 'Житель купил {n} {item} за ⚙ {cogs}',
    setHome: 'Дом здесь?', yes: 'Да', no: 'Нет', teacher: 'Учитель', pin: 'PIN', priceDial: 'Цена', dailyCap: 'Лимит дня', startCogs: 'Старт',
    townsfolk: 'Жители', resetWallet: 'Сбросить кошелёк', onDevice: 'Только на этом устройстве', pricesChanged: 'Цены изменены', fair: 'Честно', yours: 'Твоя',
    takeTill: 'Забрать кассу', soldOut: 'Нет: пополни', profit: 'Прибыль', spent: 'Потрачено', cogsIn: 'Приход', backMenu: 'Меню', survival: 'Выживание',
    myCounter: 'Мой прилавок', bunk: 'Кровать', prices: 'Цены', stock: 'Запас', needMore: 'Ещё ⚙ {n}', shopProtected: 'Город остаётся. Строй на участке или за городом.', setSpawnHere: 'Поставь спавн здесь', protectedArea: 'Защищённая зона', protect: 'Защита', townYes: 'Это устройство может менять город', townNo: 'Это устройство не трогает город',
    ingredients: 'Состав: мука, сахар, ягоды · Выпечка 10 с', breadLabel: 'Состав: мука · Выпечка 8 с', versionSkew: 'Этот мир другой версии',
  },
  es: {
    changelog: 'Registro', youAreHere: 'Estás aquí', next: 'Siguiente', skip: 'Saltar', tryThis: 'Prueba esto', tour: 'Recorrido', tourMove: 'Camina con WASD', tourLook: 'Arrastra para mirar', tourPlace: 'Pon y rompe', tourBar: 'Abre la bolsa', tourShop: 'Vende a Tally', tourTools: 'Rellena una caja', place10: 'Pon 10 bloques', fillBox: 'Rellena una caja', sell3: 'Vende 3 troncos', helpBody: 'Elige una ficha', language: 'Idioma', pickLanguage: 'Elegir', pvpOn: 'PvP: SÍ', pvpOff: 'PvP: NO', keepStuffOn: 'Guarda mis cosas: SÍ', keepStuffOff: 'Guarda mis cosas: NO', kitPvpOn: 'PvP de equipo: SÍ', kitPvpOff: 'PvP de equipo: NO', pvpHint: 'Bertopia favorece el trabajo en equipo; PvP solo si ambos jugadores dicen que sí. Conservas tus cosas en el mundo principal.', suitText: 'Traje {n}/{max}', backToHub: 'Volver al Hub', helpLamps: 'Consigue una Lámpara de pie o de pared en el Taller. Sujétala y toca el suelo o una pared. Tócala otra vez para encenderla.', helpWoodshop: 'Toca un Taller para abrirlo. Cuelga tus 4 herramientas, luego haz una lámpara o una Cama.', a11y: 'Accesibilidad', goalDone: 'Meta lista', highContrast: 'Alto contraste', gentle: 'Modo suave', sendTeacher: 'Enviar al maestro', sentTeacher: 'Enviado al maestro', noFly: 'Sin volar en Supervivencia', tapCorner: 'Toca la esquina A', cornerA: 'Esquina A lista', addCoal: 'Añade carbón', bake: 'Hornea', sell: 'Vender', buy: 'Comprar', filled: 'Rellenados {n}', homeSet: 'Casa lista', homeCleared: 'Casa quitada', pickup: 'Recoger', paste: 'Pegar', fuel: 'Combustible', input: 'Entrada', output: 'Salida', left: 'quedan', bag: 'Bolsa', slotN: 'casilla {n}',
    buildTools: 'Herramientas', exitApp: 'Salir', leaveAsk: '¿Salir de Bertopia? Tu mundo está guardado.', leave: 'Salir', stay: 'Quedarme', myBuilds: 'Mis construcciones', undoMinutes: 'Minutos atrás', snapshots: 'Instantáneas', emptyBag: 'Bolsa vacía: rompe bloques o compra a Tally', emptySlot: 'Casilla vacía', tooBig: 'Demasiado grande: máx 64 × 32 × 64', badBuild: 'Ese archivo no es una construcción Bertopia', fineLater: 'El decorado fino llega después', changedTo: 'Cambiado:',
    coreplate: 'Núcleo', workbench: 'Banco', oven: 'Horno', vend: 'Mostrador', storeCounter: 'Mostrador de Tally', bunk: 'Litera', box: 'Caja', woodTool: 'Pico de madera', stoneTool: 'Pico de piedra', putIn: 'Guardar', boxFull: 'La caja está llena.', door: 'Puerta', doorOpen: 'Puerta abierta', doorOpenMsg: 'La puerta está abierta.', doorShut: 'La puerta está cerrada.', pathTree: 'Tala el árbol que tienes delante. Da Tablas.', pathTool: 'Haz un pico de madera', pathStone: 'Mina piedra', pathCoal: 'Cava carbón', pathDoor: 'Pon una puerta', pathHome: 'Marca casa en una litera',
    whatsNewBody: 'Bertopia 2.5.0: Un recorrido con dibujos y metas Prueba esto muestran cómo jugar. Elige tu barra de construcción. Supervivencia no vuela. Ayuda y Accesibilidad son nuevas, y puedes enviar Engranajes a tu maestro.',
    menuHint: 'Toca ☰ o pulsa Esc para el menú', menuHintTouch: 'Toca ☰ para el menú', resume: 'Seguir', inventory: 'Bolsa', crafting: 'Fabricar', shop: 'Tienda', wallet: 'Bolsillo',
    practice: 'práctica', worth: 'Vale', tallyPays: 'Tally paga', youHave: 'Tienes', usedIn: 'Se usa en', make: 'Hacer', bagFull: 'Bolsa llena', noItem: 'No tienes {item}.',
    coreplateToast: 'Núcleo. Nada pasa.', poofTown: '¡Puf! De vuelta en Bertyville.', poofBunk: '¡Puf! De vuelta en tu litera.', alreadyLeft: 'Ese bloque ya salió de tu bolsa.',
    needsOven: 'Necesitas un horno cerca', needsBench: 'Necesitas un banco cerca', tallyEnough: 'Tally ya tiene {item} hoy', cantSell: '⚙ 0 · no se vende',
    sold: 'Vendiste {n} {item} a Tally', bought: 'Compraste {n} {item}', townBought: 'Un vecino compró {n} {item} por ⚙ {cogs}',
    setHome: '¿Casa aquí?', yes: 'Sí', no: 'No', teacher: 'Profe', pin: 'PIN', priceDial: 'Precio', dailyCap: 'Tope del día', startCogs: 'Inicio',
    townsfolk: 'Vecinos', resetWallet: 'Reiniciar bolsillo', onDevice: 'Solo en este aparato', pricesChanged: 'Precios cambiados', fair: 'Justo', yours: 'Tuyo',
    takeTill: 'Cobrar caja', soldOut: 'Agotado: repón', profit: 'Ganancia', spent: 'Gastado', cogsIn: 'Entró', backMenu: 'Menú', survival: 'Supervivencia',
    myCounter: 'Mi mostrador', bunk: 'Litera', prices: 'Precios', stock: 'Stock', needMore: 'Faltan ⚙ {n}', shopProtected: 'El pueblo se queda. Construye en un solar o fuera del pueblo.', setSpawnHere: 'Pon el inicio aquí', protectedArea: 'Zona protegida', protect: 'Protección', townYes: 'Este aparato puede cambiar el pueblo', townNo: 'Este aparato deja el pueblo quieto',
    ingredients: 'Ingredientes: harina, azúcar, bayas · Hornear 10 s', breadLabel: 'Ingredientes: harina · Hornear 8 s', versionSkew: 'Ese mundo usa otra versión',
  },
  ar: {
    changelog: 'السجل', youAreHere: 'أنت هنا', next: 'التالي', skip: 'تخطَّ', tryThis: 'جرّب هذا', tour: 'جولة', tourMove: 'امش مع WASD', tourLook: 'اسحب لتنظر', tourPlace: 'ضع واكسر', tourBar: 'افتح الحقيبة', tourShop: 'بع لتالي', tourTools: 'املأ صندوقاً', place10: 'ضع 10 مكعبات', fillBox: 'املأ صندوقاً', sell3: 'بع 3 جذوع', helpBody: 'اختر بلاطة', suitText: 'البدلة {n}/{max}', language: 'اللغة', pickLanguage: 'اختر', pvpOn: 'PvP: تشغيل', pvpOff: 'PvP: إيقاف', keepStuffOn: 'احتفظ بأغراضي: تشغيل', keepStuffOff: 'احتفظ بأغراضي: إيقاف', kitPvpOn: 'PvP الفريق: تشغيل', kitPvpOff: 'PvP الفريق: إيقاف', pvpHint: 'Bertopia يفضل العمل الجماعي؛ PvP فقط إذا وافق اللاعبان.', backToHub: 'العودة إلى المركز', helpLamps: 'احصل على مصباح أرضي أو جداري من الورشة. أمسكه والمس الأرض أو الجدار. المس مرة أخرى لتشغيله.', helpWoodshop: 'المس الورشة لفتحها. علّق أدواتك الأربع، ثم اصنع مصباحًا أو سريرًا.', a11y: 'سهولة الوصول', goalDone: 'تم الهدف', highContrast: 'تباين عال', gentle: 'وضع لطيف', sendTeacher: 'أرسل للمعلم', sentTeacher: 'أُرسل للمعلم', noFly: 'لا طيران في البقاء', tapCorner: 'المس الزاوية أ', cornerA: 'الزاوية أ جاهزة', addCoal: 'أضف فحماً', bake: 'اخبز', sell: 'بيع', buy: 'شراء', filled: 'مُلئ {n}', homeSet: 'البيت جاهز', homeCleared: 'أُزيل البيت', pickup: 'التقط', paste: 'الصق', fuel: 'وقود', input: 'مدخل', output: 'مخرج', left: 'متبق', bag: 'حقيبة', slotN: 'خانة {n}',
    buildTools: 'أدوات البناء', exitApp: 'خروج', leaveAsk: 'مغادرة بيرتوبيا؟ عالمك محفوظ.', leave: 'غادر', stay: 'ابق', myBuilds: 'مبانيي', undoMinutes: 'دقائق سابقة', snapshots: 'لقطات', emptyBag: 'الحقيبة فارغة: اكسر مكعبات أو اشتر من تالي', emptySlot: 'خانة فارغة', tooBig: 'كبير جداً: الحد 64 × 32 × 64', badBuild: 'هذا الملف ليس بناء بيرتوبيا', fineLater: 'الزخرفة الدقيقة لاحقاً', changedTo: 'تغيّر:',
    coreplate: 'النواة', workbench: 'منضدة', oven: 'فرن', vend: 'مِنضدة بيع', storeCounter: 'مِنضدة المتجر', bunk: 'سرير', box: 'صندوق', woodTool: 'معول خشب', stoneTool: 'معول حجر', putIn: 'ضع', boxFull: 'الصندوق ممتلئ.', door: 'باب', doorOpen: 'باب مفتوح', doorOpenMsg: 'الباب مفتوح.', doorShut: 'الباب مغلق.', pathTree: 'اقطع الشجرة التي أمامك. تعطيك ألواح.', pathTool: 'اصنع معول خشب', pathStone: 'استخرج حجراً', pathCoal: 'احفر فحماً', pathDoor: 'ضع باباً', pathHome: 'اجعل البيت على سرير',
    whatsNewBody: 'بيرتوبيا 2.5.0: جولة بالصور وأهداف جرّب هذا تعلّمك اللعب. اختر شريط البناء من الحقيبة. البقاء بلا طيران. المساعدة وسهولة الوصول جديدتان، ويمكنك إرسال التروس إلى معلمك.',
    menuHint: 'اضغط ☰ أو Esc للقائمة', menuHintTouch: 'اضغط ☰ للقائمة', resume: 'متابعة', inventory: 'حقيبة', crafting: 'صنع', shop: 'متجر', wallet: 'محفظة',
    practice: 'تدريب', worth: 'القيمة', tallyPays: 'تالي يدفع', youHave: 'معك', usedIn: 'يُستخدم في', make: 'اصنع', bagFull: 'الحقيبة ممتلئة', noItem: 'ليس معك {item}.',
    coreplateToast: 'النواة. لا شيء يمر.', poofTown: 'بوف! عدت إلى بيرتيفيل.', poofBunk: 'بوف! عدت إلى سريرك.', alreadyLeft: 'هذا المكعب غادر حقيبتك.',
    needsOven: 'يلزم فرن قريب', needsBench: 'يلزم منضدة قريبة', tallyEnough: 'تالي اكتفى من {item} اليوم', cantSell: '⚙ 0 · لا يُباع',
    sold: 'بعت {n} {item} لتالي', bought: 'اشتريت {n} {item}', townBought: 'اشترى أحد السكان {n} {item} بـ ⚙ {cogs}',
    setHome: 'البيت هنا؟', yes: 'نعم', no: 'لا', teacher: 'المعلم', pin: 'رمز', priceDial: 'السعر', dailyCap: 'حد اليوم', startCogs: 'البداية',
    townsfolk: 'السكان', resetWallet: 'تصفير المحفظة', onDevice: 'على هذا الجهاز فقط', pricesChanged: 'تغيّرت الأسعار', fair: 'عادل', yours: 'سعرك',
    takeTill: 'خذ الصندوق', soldOut: 'نفد: أعد التعبئة', profit: 'الربح', spent: 'المصروف', cogsIn: 'الداخل', backMenu: 'القائمة', survival: 'بقاء',
    myCounter: 'مِنضدتي', bunk: 'سرير', prices: 'الأسعار', stock: 'المخزون', needMore: 'يلزم ⚙ {n}', shopProtected: 'البلدة تبقى. ابنِ في قطعة أو خارج البلدة.', setSpawnHere: 'ضع نقطة البداية هنا', protectedArea: 'منطقة محمية', protect: 'حماية', townYes: 'هذا الجهاز يستطيع تغيير البلدة', townNo: 'هذا الجهاز يترك البلدة',
    ingredients: 'المكونات: دقيق وسكر وتوت · خبز 10 ث', breadLabel: 'المكونات: دقيق · خبز 8 ث', versionSkew: 'هذا العالم نسخة مختلفة',
  },
  'fa-AF': {
    changelog: 'فهرست تغییر', youAreHere: 'اینجا هستی', next: 'بعدی', skip: 'بگذر', tryThis: 'این را بیازما', tour: 'گشت', tourMove: 'با WASD برو', tourLook: 'بکش تا ببینی', tourPlace: 'بگذار و بشکن', tourBar: 'بکس را باز کن', tourShop: 'به تالی بفروش', tourTools: 'یک جعبه را پر کن', place10: '۱۰ بلاک بگذار', fillBox: 'یک جعبه را پر کن', sell3: '۳ کُنده بفروش', helpBody: 'یک خانه برگزین', suitText: 'لباس {n}/{max}', language: 'زبان', pickLanguage: 'انتخاب', pvpOn: 'PvP: روشن', pvpOff: 'PvP: خاموش', keepStuffOn: 'وسایلم بماند: روشن', keepStuffOff: 'وسایلم بماند: خاموش', kitPvpOn: 'PvP تیم: روشن', kitPvpOff: 'PvP تیم: خاموش', pvpHint: 'Bertopia کار گروهی را ترجیح می‌دهد؛ PvP فقط اگر هر دو بازیکن بگویند بله.', backToHub: 'بازگشت به هاب', helpLamps: 'یک چراغ زمینی یا دیواری از کارگاه بگیر. آن را بگیر و زمین یا دیوار را لمس کن. دوباره لمس کن تا روشن شود.', helpWoodshop: 'کارگاه را لمس کن تا باز شود. ۴ ابزارت را بیاویز، سپس یک چراغ یا تخت بساز.', a11y: 'دسترسی', goalDone: 'هدف شد', highContrast: 'کنتراست بلند', gentle: 'حالت نرم', sendTeacher: 'به معلم بفرست', sentTeacher: 'به معلم رفت', noFly: 'در بقا پرواز نیست', tapCorner: 'اول گوشه الف', cornerA: 'گوشه الف آماده است', addCoal: 'زغال بیفزای', bake: 'بپز', sell: 'فروش', buy: 'خرید', filled: 'پر شد {n}', homeSet: 'خانه آماده است', homeCleared: 'خانه برداشته شد', pickup: 'بردار', paste: 'بچسبان', fuel: 'سوخت', input: 'ورود', output: 'خروج', left: 'مانده', bag: 'بکس', slotN: 'خانه {n}',
    buildTools: 'ابزار ساخت', exitApp: 'خروج', leaveAsk: 'از برتوپیا بیرون می‌روی؟ جهان ذخیره شد.', leave: 'برو', stay: 'بمان', myBuilds: 'ساخت‌های من', undoMinutes: 'دقیقه‌های پیش', snapshots: 'نسخه‌ها', emptyBag: 'بکس خالی است: بلاک بشکن یا از تالی بخر', emptySlot: 'خانه خالی', tooBig: 'خیلی بزرگ: حد ۶۴ × ۳۲ × ۶۴', badBuild: 'این فایل ساخت برتوپیا نیست', fineLater: 'آرایش ریز بعداً می‌آید', changedTo: 'عوض شد:',
    coreplate: 'کف هسته', workbench: 'میز کار', oven: 'تنور', vend: 'پیشخوان فروش', storeCounter: 'پیشخوان دکان', bunk: 'بستر', box: 'صندوق', woodTool: 'کلنگ چوبی', stoneTool: 'کلنگ سنگی', putIn: 'بگذار', boxFull: 'صندوق پر است.', door: 'در', doorOpen: 'در باز', doorOpenMsg: 'در باز است.', doorShut: 'در بسته است.', pathTree: 'درختی را که پیش روی تو است ببر. تخته می‌دهد.', pathTool: 'کلنگ چوبی بساز', pathStone: 'سنگ بیرون بیاور', pathCoal: 'زغال بکن', pathDoor: 'یک در بگذار', pathHome: 'خانه را روی بستر بگذار',
    whatsNewBody: 'برتوپیا ۲.۵.۰: یک گشت تصویری و هدف‌های «این را بیازما» بازی را نشان می‌دهند. نوار ساخت را خود برگزین. بقا پرواز ندارد. رهنما و دسترسی نو اند، و می‌توانی چرخ‌دنده به معلم بفرستی.',
    menuHint: '☰ یا Esc را برای فهرست بزن', menuHintTouch: '☰ را برای فهرست بزن', resume: 'ادامه', inventory: 'بکس', crafting: 'ساختن', shop: 'دکان', wallet: 'کیسه',
    practice: 'تمرین', worth: 'ارزش', tallyPays: 'تالی می‌پردازد', youHave: 'داری', usedIn: 'در این به کار می‌رود', make: 'بساز', bagFull: 'بکس پر است', noItem: '{item} نداری.',
    coreplateToast: 'کف هسته. چیزی رد نمی‌شود.', poofTown: 'پوف! دوباره در برتی‌ویل.', poofBunk: 'پوف! دوباره کنار بستر.', alreadyLeft: 'این بلاک از بکس رفته است.',
    needsOven: 'تنور نزدیک می‌خواهد', needsBench: 'میز کار نزدیک می‌خواهد', tallyEnough: 'تالی امروز {item} بس است', cantSell: '⚙ ۰ · فروخته نمی‌شود',
    sold: '{n} {item} به تالی فروختی', bought: '{n} {item} خریدی', townBought: 'یک شهریان {n} {item} را به ⚙ {cogs} خرید',
    setHome: 'خانه اینجا؟', yes: 'بله', no: 'نه', teacher: 'معلم', pin: 'رمز', priceDial: 'نرخ', dailyCap: 'سقف روز', startCogs: 'آغاز',
    townsfolk: 'شهریان', resetWallet: 'کیسه را صفر کن', onDevice: 'فقط روی این دستگاه', pricesChanged: 'نرخ‌ها عوض شد', fair: 'منصفانه', yours: 'مال تو',
    takeTill: 'صندوق را بگیر', soldOut: 'تمام شد: دوباره بگذار', profit: 'سود', spent: 'خرج', cogsIn: 'درآمد', backMenu: 'فهرست', survival: 'بقا',
    myCounter: 'پیشخوان من', bunk: 'بستر', prices: 'نرخ‌ها', stock: 'ذخیره', needMore: '⚙ {n} دیگر لازم است', shopProtected: 'شهر می‌ماند. روی قطعه یا بیرون شهر بساز.', setSpawnHere: 'شروع را اینجا بگذار', protectedArea: 'جای محافظت‌شده', protect: 'محافظت', townYes: 'این دستگاه می‌تواند شهر را عوض کند', townNo: 'این دستگاه شهر را دست نمی‌زند',
    ingredients: 'مواد: آرد، شکر، توت · پخت ۱۰ ث', breadLabel: 'مواد: آرد · پخت ۸ ث', versionSkew: 'این جهان نسخه دیگر است',
  },
  rw: {
    changelog: 'Inkururagamba', youAreHere: 'Uri hano', next: 'Ikurikira', skip: 'Simbuka', tryThis: 'Gerageza', tour: 'Urugendo', tourMove: 'Genda na WASD', tourLook: 'Kurura urebe', tourPlace: 'Shyira uvune', tourBar: 'Fungura agasaho', tourShop: 'Gurisha Tally', tourTools: 'Uzuza agasanduku', place10: 'Shyira block 10', fillBox: 'Uzuza agasanduku', sell3: 'Gurisha ibiti 3', helpBody: 'Hitamo agakaro', suitText: 'Imyenda {n}/{max}', language: 'Ururimi', pickLanguage: 'Hitamo', pvpOn: 'PvP: BIRAKORA', pvpOff: 'PvP: BIRAZIMYE', keepStuffOn: 'Bika ibintu byanjye: BIRAKORA', keepStuffOff: 'Bika ibintu byanjye: BIRAZIMYE', kitPvpOn: "PvP y'itsinda: BIRAKORA", kitPvpOff: "PvP y'itsinda: BIRAZIMYE", pvpHint: 'Bertopia ikunda gukorana; PvP gusa iyo bombi bemeye.', backToHub: 'Gusubira kuri Hub', helpLamps: 'Fata itara ryo hasi cyangwa ku rukuta muri Ububaji. Fata urikande hasi cyangwa ku rukuta. Rikande nanone kugira ngo ryake.', helpWoodshop: 'Kanda Ububaji kugira ngo ufungure. Manika ibikoresho byawe 4, hanyuma ukore itara cyangwa uburiri.', a11y: 'Ubushobozi', goalDone: 'Intego yarangiye', highContrast: 'Itandukaniro rinini', gentle: 'Uburyo bworoshye', sendTeacher: 'Ohereza mwarimu', sentTeacher: 'Byohererejwe mwarimu', noFly: 'Nta kuguruka mu Bugingo', tapCorner: 'Kanda igisigisigi A', cornerA: 'Igisigisigi A cyateguwe', addCoal: 'Ongeraho amakara', bake: 'Teka', sell: 'Gurisha', buy: 'Gura', filled: 'Byuzuye {n}', homeSet: 'Urugo rwateguwe', homeCleared: 'Urugo ruvanyweho', pickup: 'Tora', paste: 'Shyira', fuel: 'Amakara', input: 'Iwinjira', output: 'Ibisohoka', left: 'bisigaye', bag: 'Agasaho', slotN: 'akazu {n}',
    buildTools: 'Ibikoresho', exitApp: 'Sohoka', leaveAsk: 'Sohoka muri Bertopia? Isi yawe yabitswe.', leave: 'Sohoka', stay: 'Guma', myBuilds: 'Imyubakire yanjye', undoMinutes: 'Iminota ishize', snapshots: 'Amafoto', emptyBag: 'Agasaho karimo ubusa: vuna block cyangwa ugure kwa Tally', emptySlot: 'Akazu ubusa', tooBig: 'Kinini cyane: max 64 × 32 × 64', badBuild: 'Iyi dosiye si iyubakwa rya Bertopia', fineLater: 'Ibitangaje bito bizaza nyuma', changedTo: 'Byahindutse:',
    coreplate: 'Uruhome', workbench: 'Ameza', oven: 'Ibyoto', vend: 'Counter', storeCounter: 'Counter y\'iduka', bunk: 'Buriri', box: 'Agasanduku', woodTool: 'Icyuma cy\'ibiti', stoneTool: 'Icyuma cy\'ibuye', putIn: 'Shyiramo', boxFull: 'Agasanduku karuzuye.', door: 'Urugi', doorOpen: 'Urugi rufunguye', doorOpenMsg: 'Urugi rufunguye.', doorShut: 'Urugi rufunze.', pathTree: 'Tema igiti kiri imbere yawe. Gitanga Imbaho.', pathTool: 'Kora icyuma cy\'ibiti', pathStone: 'Tora ibuye', pathCoal: 'Tora amakara', pathDoor: 'Shyira urugi', pathHome: 'Shyira urugo ku buriri',
    whatsNewBody: 'Bertopia 2.5.0: Urugendo rwamashusho nintego Gerageza bigaragaza uko ukina. Hitamo umurongo wawe. Ubugingo ntibura kuguruka. Ubufasha nUbushobozi bishya, kandi wohereza amapine ku mwarimu.',
    menuHint: 'Kanda ☰ cyangwa Esc ku menu', menuHintTouch: 'Kanda ☰ ku menu', resume: 'Komeza', inventory: 'Agasaho', crafting: 'Kora', shop: 'Iduka', wallet: 'Ikibanza',
    practice: 'imyitozo', worth: 'Agaciro', tallyPays: 'Tally yishyura', youHave: 'Ufite', usedIn: 'Ikoreshwa muri', make: 'Kora', bagFull: 'Agasaho karuzuye', noItem: 'Nta {item} ufite.',
    coreplateToast: 'Uruhome. Ntacyo kirengana.', poofTown: 'Poof! Subira i Bertyville.', poofBunk: 'Poof! Subira ku buriri.', alreadyLeft: 'Iyo block yavuye mu gasaho.',
    needsOven: 'Ukeneye ibuye ry\'ububiko hafi', needsBench: 'Ukeneye ameza hafi', tallyEnough: 'Tally ahaze {item} uyu munsi', cantSell: '⚙ 0 · ntigurishwa',
    sold: 'Wagurishije {n} {item} kuri Tally', bought: 'Waguze {n} {item}', townBought: 'Umuturage yaguze {n} {item} ⚙ {cogs}',
    setHome: 'Inzu hano?', yes: 'Yego', no: 'Oya', teacher: 'Umwarimu', pin: 'PIN', priceDial: 'Igiciro', dailyCap: 'Umupaka w\'umunsi', startCogs: 'Intangiriro',
    townsfolk: 'Abaturage', resetWallet: 'Subiza ikibanza', onDevice: 'Kuri iki gikoresho gusa', pricesChanged: 'Ibiciro byahindutse', fair: 'Ukuri', yours: 'Iyawe',
    takeTill: 'Fata keshye', soldOut: 'Byarangiye: ongera', profit: 'Inyungu', spent: 'Byakoreshejwe', cogsIn: 'Byinjiye', backMenu: 'Menu', survival: 'Ubugingo',
    myCounter: 'Counter yanjye', bunk: 'Buriri', prices: 'Ibiciro', stock: 'Ibyo ufite', needMore: 'Ukeneye ⚙ {n}', shopProtected: 'Umudugudu uguma. Ubake ku gice cyangwa hanze.', setSpawnHere: 'Shyira aho utangirira hano', protectedArea: 'Akarere karinzwe', protect: 'Kurinda', townYes: 'Iki gikoresho gishobora guhindura umudugudu', townNo: 'Iki gikoresho gisiga umudugudu',
    ingredients: 'Ibikoresho: ifu, isukari, imbuto · Oteka 10s', breadLabel: 'Ibikoresho: ifu · Oteka 8s', versionSkew: 'Isi ikoresha indi verisiyo',
  },
  ti: {
    changelog: 'ዝርዝር', youAreHere: 'ኣብዚ ኢኻ', next: 'ዝቕጽል', skip: 'ዝለል', tryThis: 'ፈትን እዚ', tour: 'ዙር', tourMove: 'ብ WASD ኪድ', tourLook: 'ጎተት ርአ', tourPlace: 'ኣቐምጥ ሰብር', tourBar: 'ቦርሳ ክፈት', tourShop: 'ንታሊ ሸይጥ', tourTools: 'ሳጹን ምላእ', place10: '10 ብሎክ ኣቐምጥ', fillBox: 'ሳጹን ምላእ', sell3: '3 ገመድ ሸይጥ', helpBody: 'ንጣፍ ምረጽ', suitText: 'ክዳን {n}/{max}', language: 'ቋንቋ', pickLanguage: 'ምረጽ', pvpOn: 'PvP: ክፉት', pvpOff: 'PvP: ዕጹው', keepStuffOn: 'ንብረተይ ሓሉ: ክፉት', keepStuffOff: 'ንብረተይ ሓሉ: ዕጹው', kitPvpOn: 'PvP ብኪት: ክፉት', kitPvpOff: 'PvP ብኪት: ዕጹው', pvpHint: 'Bertopia ሓባራዊ ስራሕ ይመርጽ፤ PvP ክልቲኦም እንተ ኣሚኖም ጥራይ።', backToHub: 'ናብ ሃብ ተመለስ', helpLamps: 'ካብ ቤት ዕዮ ዕንጨይቲ ናይ መሬት ወይ ናይ ግድግዳ መብራህቲ ውሰድ። ሒዝካ መሬት ወይ ግድግዳ ጠውቕ። ደጊምካ ጠውቕ ንምብራህ።', helpWoodshop: 'ቤት ዕዮ ዕንጨይቲ ጠውቕ ንምኽፋት። 4 መሳርሒታትካ ሰቅል፣ ድሕሪኡ መብራህቲ ወይ ዓራት ግበር።', a11y: 'ተበጻሕነት', goalDone: 'ዕላማ ተዛዚሙ', highContrast: 'ልዑል ፍልልይ', gentle: 'ለውሃት ኩነት', sendTeacher: 'ናብ መምህር ስደድ', sentTeacher: 'ናብ መምህር ተላኢኹ', noFly: 'ኣብ ህይወት ኣይነፍርን', tapCorner: 'መጀመርታ ኩርናዕ ሀ', cornerA: 'ኩርናዕ ሀ ተዳሊዩ', addCoal: 'ከሰል ወስኽ', bake: 'ኣብስል', sell: 'ሽያጥ', buy: 'ግዢ', filled: 'ተመልኢ {n}', homeSet: 'ገዛ ተዳሊዩ', homeCleared: 'ገዛ ተቐንጢጡ', pickup: 'ውሰድ', paste: 'ለጥፍ', fuel: 'ነዳዲ', input: 'እታው', output: 'ውጻኢ', left: 'ተሪፉ', bag: 'ቦርሳ', slotN: 'ቦታ {n}',
    buildTools: 'መሳርሒ', exitApp: 'ውጻእ', leaveAsk: 'ካብ በርቶፕያ ትወጽእ? ዓለምካ ተዓቂቡ።', leave: 'ውጻእ', stay: 'ጽናሕ', myBuilds: 'ህንጻታተይ', undoMinutes: 'ደቒቕ ዝሓለፈ', snapshots: 'ስእልታት', emptyBag: 'ቦርሳ ባዶ እዩ፡ ብሎክ ሰብር ወይ ካብ ታሊ ግዛእ', emptySlot: 'ባዶ ቦታ', tooBig: 'ዝያዳ ዓቢ፡ ደረት 64 × 32 × 64', badBuild: 'እዚ ፋይል ህንጻ በርቶፕያ ኣይኮነን', fineLater: 'ዝርዝር ጌጣ ጌጣ ድሒሩ', changedTo: 'ተቐይሩ:',
    coreplate: 'ኮርፕሌት', workbench: 'ሰደቓ', oven: 'እቶን', vend: 'መደብ መሸጢ', storeCounter: 'መደብ ድኳን', bunk: 'ዓራት', box: 'ሳንዱቅ', woodTool: 'ናይ ዕንጨይቲ መኮፍ', stoneTool: 'ናይ እምኒ መኮፍ', putIn: 'ኣእቱ', boxFull: 'ሳንዱቅ መሊኡ።', door: 'ማዕጾ', doorOpen: 'እተኸፈተ ማዕጾ', doorOpenMsg: 'ማዕጾ ተኸፊቱ።', doorShut: 'ማዕጾ ተዓጺጉ።', pathTree: 'ዕንጨይቲ ኣብ ቅድሚኻ ቍረጽ። ጣውላ ይህብ።', pathTool: 'ናይ ዕንጨይቲ መኮፍ ግበር', pathStone: 'እምኒ እውጽእ', pathCoal: 'ከሰል እኸድ', pathDoor: 'ማዕጾ ኣቐምጥ', pathHome: 'ገዛ ኣብ ዓራት ኣቐምጥ',
    whatsNewBody: 'በርቶፕያ 2.5.0፡ ስእላዊ ዙርን ንቕሓት ፈትን እዚን ከመይ ከም ትጻወት የርእዩ። ናይ ህንጻ መስመር ምረጽ። ህይወት ኣይነፍርን። ሓገዝን ተበጻሕነትን ሓደሽቲ እዮም፡ ኮግ ናብ መምህርካ ስደድ።',
    menuHint: '☰ ወይ Esc ንመእተዊ', menuHintTouch: '☰ ንመእተዊ', resume: 'ቀጽል', inventory: 'ቦርሳ', crafting: 'ምስራሕ', shop: 'ድኳን', wallet: 'ኪስ',
    practice: 'ምልምማድ', worth: 'ዋጋ', tallyPays: 'ታሊ ይከፍል', youHave: 'ኣለካ', usedIn: 'ይውዕል ኣብ', make: 'ግበር', bagFull: 'ቦርሳ መሊኡ', noItem: '{item} የብልካን።',
    coreplateToast: 'ኮርፕሌት። ዝኾነ ኣይሓልፍን።', poofTown: 'ፑፍ! ናብ በርቲቪል ተመሊስካ።', poofBunk: 'ፑፍ! ናብ ዓራትካ ተመሊስካ።', alreadyLeft: 'እዚ ብሎክ ካብ ቦርሳኻ ወጺኡ።',
    needsOven: 'እቶን ኣብ ቀረባ የድሊ', needsBench: 'ሰደቓ ኣብ ቀረባ የድሊ', tallyEnough: 'ታሊ ሎሚ {item} እኹል ኣሎ', cantSell: '⚙ 0 · ኣይሽየጥን',
    sold: '{n} {item} ንታሊ ሸይጥካ', bought: '{n} {item} ገዚእካ', townBought: 'ሓደ ሰብ {n} {item} ብ ⚙ {cogs} ገዚኡ',
    setHome: 'ገዛ ኣብዚ?', yes: 'እወ', no: 'ኣይፋል', teacher: 'መምህር', pin: 'PIN', priceDial: 'ዋጋ', dailyCap: 'ዕለታዊ ደረት', startCogs: 'መጀመርታ',
    townsfolk: 'ሰባት', resetWallet: 'ኪስ ዳግማይ', onDevice: 'ኣብዚ መሳርሒ ጥራይ', pricesChanged: 'ዋጋ ተቐይሩ', fair: 'ፍትሓዊ', yours: 'ናትካ',
    takeTill: 'ሳንዱቅ ውሰድ', soldOut: 'ተወዲኡ፡ መልእ', profit: 'መእገዲ', spent: 'ዝወጸ', cogsIn: 'ዝኣተወ', backMenu: 'መእተዊ', survival: 'ህይወት',
    myCounter: 'መደብይ', bunk: 'ዓራት', prices: 'ዋጋታት', stock: 'ኣቕሓ', needMore: '⚙ {n} የድሊ', shopProtected: 'ከተማ ትቕጽል። ኣብ መሬት ወይ ወጻኢ ሃንጽ።', setSpawnHere: 'መበገሲ ኣብዚ ኣቐምጥ', protectedArea: 'ዝተሓለወ ከባቢ', protect: 'ሓለዋ', townYes: 'እዚ መሳርሒ ከተማ ክቅይር ይኽእል', townNo: 'እዚ መሳርሒ ከተማ ኣይትንክፍን',
    ingredients: 'ኣቕሑ፡ ዱቄት፡ ሽኮር፡ ፍረ · ምሕሳስ 10 ሰ', breadLabel: 'ኣቕሑ፡ ዱቄት · ምሕሳስ 8 ሰ', versionSkew: 'እዚ ዓለም ካልእ ስሪት እዩ',
  },
}

const FIX = {
  en: { tourMoveTouch: 'Move with the stick', askStaff: 'Ask your teacher to unlock this device in the Tech Room staff page', keysHint: 'WASD walks. Shift runs. Z crouches. Space jumps one block. Hold left click to break. Right click places. Q drops one. E opens the Bag. Esc opens the menu.', keysHintTouch: 'Move with the stick. Drag to look. Hold your finger on a block to break it. Tap to place. Jump and Crouch are buttons.', keysLine: 'WASD walk · Shift run · Z crouch · Space jump · Left hold breaks · Right places · Q drops · E bag · Esc menu', crouch: 'Crouch', stickSide: 'Stick side', whatsNewBody: 'Bertopia 2.5.49: nights get darker, and lanterns light the way without slowing the game.', canNow: 'Can make now', almost: 'Almost', showAll: 'Show all', timesMax: '×Max', findFirst: 'Find it first', lookSens: 'Look speed', invertY: 'Invert look', hideTips: 'Hide tips', toolFaster: 'A Wood Tool is faster.', stoneFaster: 'A Stone Tool is faster.', wideView: 'Wide view', ate: 'Ate {item}.', pickChip: 'Copy', holdToBreak: 'Hold your finger on a block to break it.', pathTreeTouch: 'Hold this tree. It gives Planks.', copyTip: 'Copy a block you already have into your hand.', pickNeed: 'That block is not in your bag.', climb: 'Auto-climb', autoJump: 'Auto-jump', hotbar: 'Hotbar', pockets: 'Pockets', buildLocked: 'The build world is for a teacher.', teacherOn: 'This device can build', teacherOff: 'This device is a student', teacherAsk: 'Only a teacher should turn this on. Students stay in Survival.', studentWorld: 'Survival. A teacher can open the build world.', keptAside: 'Older stacks are in Lost & Found.', holdIt: 'Hold this', notABlock: 'You cannot place that.', alreadyHere: 'You are already here.', dropped: 'Dropped.', lostFound: 'The ground is full. It is in Lost & Found.', lostBtn: 'Lost & Found', drop1: 'Drop 1', dropAll: 'Drop all', pickedUp: 'Picked up.', fuel: 'Fuel', input: 'Input', output: 'Output', bag: 'Bag', left: 'left', needBlocks: 'Need {n} more {item}', pickBlock: 'Pick a block in your hotbar first', fillN: 'Fill {n}', wallsN: 'Walls {n}', nothingBake: 'Nothing to bake yet', alwaysDay: 'Always day', c1SafeZone: 'Bertyville is a safe zone', c1Bonk: 'Bonk', c1Bonked: 'Bonked! Your stuff is safe', c1BackToBed: 'Back to bed', c1Low: 'Low' },
  uk: { tourMoveTouch: 'Рухайся стиком', askStaff: 'Попроси вчителя відкрити цей пристрій на сторінці персоналу Tech Room', keysHint: 'WASD крок. Shift біг. Z присід. Пробіл стрибає на 1 блок. Тримай ліву кнопку щоб ламати. Права ставить. Q кидає 1. E відкриває сумку. Esc відкриває меню.', keysHintTouch: 'Рухайся стиком. Тягни щоб дивитись. Тримай палець на блоці, щоб зламати. Торкнись, щоб поставити. Стрибок і Присід — це кнопки.', keysLine: 'WASD крок · Shift біг · Z присід · Пробіл стрибок · Ліва тримай ламає · Права ставить · Q кидає · E сумка · Esc меню', crouch: 'Присід', stickSide: 'Бік стика', whatsNewBody: 'Bertopia 2.5.49: ночі темніші, і ліхтарі освітлюють шлях, не сповільнюючи гру.', canNow: 'Можна зараз', almost: 'Майже', showAll: 'Показати все', timesMax: '×Max', findFirst: 'Спершу знайди', lookSens: 'Швидкість огляду', invertY: 'Перевернути погляд', hideTips: 'Сховати підказки', toolFaster: 'Дерев’яне знаряддя швидше.', stoneFaster: 'Кам’яне знаряддя швидше.', wideView: 'Широкий огляд', ate: 'Зʼїв {item}.', pickChip: 'Копія', holdToBreak: 'Тримай палець на блоці, щоб зламати.', pathTreeTouch: 'Тримай це дерево. Воно дає Дошки.', copyTip: 'Копіюй блок, який уже маєш, у руку.', pickNeed: 'Цього блока немає в сумці.', climb: 'Автосхід', autoJump: 'Автострибок', hotbar: 'Панель', pockets: 'Кишені', buildLocked: 'Світ будівлі для вчителя.', teacherOn: 'Цей пристрій може будувати', teacherOff: 'Цей пристрій учнівський', teacherAsk: 'Це вмикає лише вчитель. Учні лишаються у Виживанні.', studentWorld: 'Виживання. Вчитель може відкрити світ будівлі.', keptAside: 'Старі стоси в Загубленому.', holdIt: 'Тримати', notABlock: 'Це не поставиш.', alreadyHere: 'Ти вже тут.', dropped: 'Викинуто.', lostFound: 'Земля повна. Це в Загубленому.', lostBtn: 'Загублене', drop1: 'Викинути 1', dropAll: 'Викинути все', pickedUp: 'Підібрано.', tour: 'Тур', a11y: 'Доступність', helpBody: 'Обери плитку', sendTeacher: 'Надіслати вчителю', highContrast: 'Високий контраст', place10: 'Постав 10 блоків', pin: 'Пін', fuel: 'Паливо', input: 'Вхід', output: 'Вихід', bag: 'Сумка', needBlocks: 'Ще {n} {item}', pickBlock: 'Спершу обери блок на панелі', fillN: 'Заповни {n}', wallsN: 'Стіни {n}', nothingBake: 'Ще нема що пекти', alwaysDay: 'Завжди день', c1SafeZone: 'Bertyville — безпечна зона', c1Bonk: 'Бонк', c1Bonked: 'Бонк! Твої речі в безпеці', c1BackToBed: 'Назад до ліжка', c1Low: 'Мало' },
  ru: { tourMoveTouch: 'Двигайся стиком', askStaff: 'Попроси учителя открыть это устройство на странице персонала', keysHint: 'WASD шаг. Shift бег. Z присед. Пробел прыгает на 1 блок. Держи левую кнопку чтобы ломать. Правая ставит. Q бросает 1. E открывает сумку. Esc открывает меню.', keysHintTouch: 'Двигайся стиком. Тяни чтобы смотреть. Держи палец на блоке, чтобы сломать. Коснись, чтобы поставить. Прыжок и Присед — это кнопки.', keysLine: 'WASD шаг · Shift бег · Z присед · Пробел прыжок · Левая держи ломает · Правая ставит · Q бросает · E сумка · Esc меню', crouch: 'Присед', stickSide: 'Сторона стика', whatsNewBody: '2.5.49: ночи темнее, и фонари светят путь, не замедляя игру.', canNow: 'Можно сейчас', almost: 'Почти', showAll: 'Показать все', timesMax: '×Max', findFirst: 'Сначала найди', lookSens: 'Скорость обзора', invertY: 'Перевернуть взгляд', hideTips: 'Скрыть подсказки', toolFaster: 'Деревянное орудие быстрее.', stoneFaster: 'Каменное орудие быстрее.', wideView: 'Широкий обзор', ate: 'Съел {item}.', pickChip: 'Копия', holdToBreak: 'Держи палец на блоке, чтобы сломать.', pathTreeTouch: 'Держи это дерево. Оно даёт Доски.', copyTip: 'Копируй блок, который уже есть, в руку.', pickNeed: 'Этого блока нет в сумке.', climb: 'Автоподъём', autoJump: 'Автопрыжок', hotbar: 'Панель', pockets: 'Карманы', buildLocked: 'Мир стройки для учителя.', teacherOn: 'Это устройство может строить', teacherOff: 'Это устройство ученика', teacherAsk: 'Это включает только учитель. Ученики остаются в Выживании.', studentWorld: 'Выживание. Учитель может открыть мир стройки.', keptAside: 'Старые стопки в Потерянном.', holdIt: 'Держать', notABlock: 'Это не поставить.', alreadyHere: 'Ты уже здесь.', dropped: 'Брошено.', lostFound: 'Земля полна. Это в Потерянном.', lostBtn: 'Потерянное', drop1: 'Бросить 1', dropAll: 'Бросить всё', pickedUp: 'Подобрано.', changelog: 'Журнал', youAreHere: 'Ты здесь', next: 'Дальше', skip: 'Пропустить', tryThis: 'Попробуй', tour: 'Тур', tourMove: 'Иди с WASD', a11y: 'Доступность', helpBody: 'Выбери плитку', sendTeacher: 'Отправить учителю', highContrast: 'Высокий контраст', place10: 'Поставь 10 блоков', pin: 'Пин', fuel: 'Топливо', input: 'Вход', output: 'Выход', bag: 'Сумка', addCoal: 'Добавь уголь', bake: 'Пеки', sell: 'Продать', buy: 'Купить', needBlocks: 'Нужно ещё {n} {item}', pickBlock: 'Сначала выбери блок на панели', fillN: 'Заполни {n}', wallsN: 'Стены {n}', nothingBake: 'Пока нечего печь', alwaysDay: 'Всегда день', c1SafeZone: 'Bertyville — безопасная зона', c1Bonked: 'Бонк! Твои вещи в безопасности', c1BackToBed: 'Назад в кровать', c1Low: 'Мало' },
  es: { tourMoveTouch: 'Muévete con el palo', askStaff: 'Pide al profe que abra este aparato en la página del personal de Tech Room', keysHint: 'WASD camina. Shift corre. Z se agacha. Espacio salta un bloque. Mantén el clic izquierdo para romper. El derecho pone. Q suelta uno. E abre la Bolsa. Esc abre el menú.', keysHintTouch: 'Muévete con el palo. Arrastra para mirar. Mantén el dedo en un bloque para romperlo. Toca para poner. Saltar y Agacharse son botones.', keysLine: 'WASD camina · Shift corre · Z agacha · Espacio salta · Izquierda rompe · Derecha pone · Q suelta · E bolsa · Esc menú', crouch: 'Agacharse', stickSide: 'Lado del stick', whatsNewBody: 'Bertopia 2.5.49: las noches se oscurecen, y los faroles alumbran el camino sin frenar el juego.', canNow: 'Puedes hacer', almost: 'Casi', showAll: 'Ver todo', timesMax: '×Max', findFirst: 'Encúentralo primero', lookSens: 'Velocidad de mirada', invertY: 'Invertir mirada', hideTips: 'Ocultar avisos', toolFaster: 'Una herramienta de madera es más rápida.', stoneFaster: 'Una herramienta de piedra es más rápida.', wideView: 'Vista ancha', ate: 'Comiste {item}.', pickChip: 'Copiar', holdToBreak: 'Mantén el dedo en un bloque para romperlo.', pathTreeTouch: 'Sostén este árbol. Da Tablas.', copyTip: 'Copia un bloque que ya tienes a tu mano.', pickNeed: 'Ese bloque no está en tu bolsa.', climb: 'Auto-subir', autoJump: 'Auto-salto', hotbar: 'Barra', pockets: 'Bolsillos', buildLocked: 'El mundo de construir es para el profe.', teacherOn: 'Este aparato puede construir', teacherOff: 'Este aparato es de un alumno', teacherAsk: 'Solo un profe debería activar esto. Los alumnos se quedan en Supervivencia.', studentWorld: 'Supervivencia. Un profe puede abrir el mundo de construir.', keptAside: 'Las pilas viejas están en Perdidos.', holdIt: 'Sostener', notABlock: 'Eso no se puede poner.', alreadyHere: 'Ya estás aquí.', dropped: 'Soltaste.', lostFound: 'El suelo está lleno. Está en Perdidos.', lostBtn: 'Perdidos', drop1: 'Soltar 1', dropAll: 'Soltar todo', pickedUp: 'Recogido.', changelog: 'Registro', youAreHere: 'Estás aquí', next: 'Siguiente', skip: 'Saltar', tryThis: 'Prueba esto', tour: 'Recorrido', tourMove: 'Camina con WASD', a11y: 'Accesibilidad', helpBody: 'Elige una ficha', sendTeacher: 'Enviar al maestro', highContrast: 'Alto contraste', place10: 'Pon 10 bloques', pin: 'Clave', fuel: 'Combustible', input: 'Entrada', output: 'Salida', bag: 'Bolsa', needBlocks: 'Faltan {n} {item}', pickBlock: 'Elige un bloque en la barra', fillN: 'Llena {n}', wallsN: 'Paredes {n}', nothingBake: 'Aún no hay nada para hornear', alwaysDay: 'Siempre día', c1SafeZone: 'Bertyville es una zona segura', c1Bonked: '¡Bonk! Tus cosas están seguras', c1BackToBed: 'Volver a la cama', c1Low: 'Bajo' },
  ar: { tourMoveTouch: 'تحرك بالعصا', askStaff: 'اطلب من معلمك أن يفتح هذا الجهاز في صفحة موظفي غرفة التقنية', keysHint: 'WASD للمشي. Shift للجري. Z للانحناء. المسافة تقفز مكعباً واحداً. اضغط الزر الأيسر مطولاً للكسر. الأيمن يضع. Q يُسقط واحداً. E يفتح الحقيبة. Esc يفتح القائمة.', keysHintTouch: 'تحرك بالعصا. اسحب لتنظر. أبقِ إصبعك على المكعب لكسره. المس لتضع. القفز والانحناء زرّان.', keysLine: 'WASD مشي · Shift جري · Z انحناء · مسافة قفز · يسار مطول يكسر · يمين يضع · Q يسقط · E حقيبة · Esc القائمة', crouch: 'انحناء', stickSide: 'جهة العصا', whatsNewBody: '2.5.49: الليل أظلم، والفوانيس تضيء الطريق دون أن تبطئ اللعب.', canNow: 'يمكنك الصنع الآن', almost: 'تقريباً', showAll: 'أظهر الكل', timesMax: '×Max', findFirst: 'جده أولاً', lookSens: 'سرعة النظر', invertY: 'اعكس النظر', hideTips: 'أخفِ النصائح', toolFaster: 'أداة الخشب أسرع.', stoneFaster: 'أداة الحجر أسرع.', wideView: 'عرض واسع', ate: 'أكلت {item}.', pickChip: 'انسخ', holdToBreak: 'أبقِ إصبعك على المكعب لكسره.', pathTreeTouch: 'أمسك هذه الشجرة. تعطيك ألواح.', copyTip: 'انسخ مكعباً تملكه إلى يدك.', pickNeed: 'هذا المكعب ليس في حقيبتك.', climb: 'تسلّق تلقائي', autoJump: 'قفز تلقائي', hotbar: 'الشريط', pockets: 'الجيوب', buildLocked: 'عالم البناء للمعلم.', teacherOn: 'هذا الجهاز يستطيع البناء', teacherOff: 'هذا الجهاز لتلميذ', teacherAsk: 'المعلم فقط يشغّل هذا. التلاميذ يبقون في البقاء.', studentWorld: 'البقاء. المعلم يستطيع فتح عالم البناء.', keptAside: 'الأكوام القديمة في المفقودات.', holdIt: 'أمسك هذا', notABlock: 'لا يمكن وضع هذا.', alreadyHere: 'أنت هنا أصلاً.', dropped: 'أُسقط.', lostFound: 'الأرض ممتلئة. هو في المفقودات.', lostBtn: 'المفقودات', drop1: 'أسقط 1', dropAll: 'أسقط الكل', pickedUp: 'التُقط.', changelog: 'السجل', youAreHere: 'أنت هنا', next: 'التالي', skip: 'تخطَّ', tryThis: 'جرّب هذا', tour: 'جولة', tourMove: 'امش مع WASD', a11y: 'سهولة الوصول', helpBody: 'اختر بلاطة', sendTeacher: 'أرسل للمعلم', highContrast: 'تباين عال', place10: 'ضع 10 مكعبات', pin: 'رمز', fuel: 'وقود', input: 'مدخل', output: 'مخرج', bag: 'حقيبة', needBlocks: 'يلزم {n} من {item}', pickBlock: 'اختر مكعبا في الشريط أولا', fillN: 'املأ {n}', wallsN: 'جدران {n}', nothingBake: 'لا يوجد شيء لخبزه بعد', alwaysDay: 'نهار دائما', c1SafeZone: 'Bertyville منطقة آمنة', c1Bonked: 'بونك! أغراضك آمنة', c1BackToBed: 'العودة إلى السرير', c1Low: 'منخفض' },
  'fa-AF': { tourMoveTouch: 'با اهرم برو', askStaff: 'از معلمت بخواه این دستگاه را در صفحه کارکنان اتاق فن باز کند', keysHint: 'WASD راه رفتن. Shift دویدن. Z خم شدن. فاصله یک بلاک می‌پرد. کلیک چپ را نگه دار تا بشکند. راست می‌گذارد. Q یکی می‌اندازد. E بکس را باز می‌کند. Esc فهرست را باز می‌کند.', keysHintTouch: 'با اهرم برو. بکش تا ببینی. انگشت را روی بلاک نگه دار تا بشکند. لمس کن تا بگذاری. پرش و خم شدن دکمه‌اند.', keysLine: 'WASD راه · Shift دو · Z خم · فاصله پرش · چپ نگه می‌شکند · راست می‌گذارد · Q می‌اندازد · E بکس · Esc فهرست', crouch: 'خم شدن', stickSide: 'سمت اهرم', whatsNewBody: '2.5.49: شب‌ها تاریک‌تر می‌شوند، و فانوس‌ها راه را روشن می‌کنند بدون کند کردن بازی.', canNow: 'حالا بساز', almost: 'نزدیک', showAll: 'همه را نشان بده', timesMax: '×Max', findFirst: 'اول پیدایش کن', lookSens: 'سرعت نگاه', invertY: 'نگاه را برگردان', hideTips: 'نکته‌ها را پنهان کن', toolFaster: 'ابزار چوبی تندتر است.', stoneFaster: 'ابزار سنگی تندتر است.', wideView: 'نمای پهن', ate: '{item} را خوردی.', pickChip: 'کپی', holdToBreak: 'انگشت را روی بلاک نگه دار تا بشکند.', pathTreeTouch: 'این درخت را نگه دار. تخته می‌دهد.', copyTip: 'بلاکی را که داری به دستت کپی کن.', pickNeed: 'این بلاک در بکس تو نیست.', climb: 'بالارفتن خودکار', autoJump: 'پرش خودکار', hotbar: 'نوار', pockets: 'جیب‌ها', buildLocked: 'جهان ساختن برای معلم است.', teacherOn: 'این دستگاه می‌تواند بسازد', teacherOff: 'این دستگاه شاگرد است', teacherAsk: 'فقط معلم این را روشن کند. شاگردان در بقا می‌مانند.', studentWorld: 'بقا. معلم می‌تواند جهان ساختن را باز کند.', keptAside: 'پشته‌های قدیمی در گم‌شده‌ها است.', holdIt: 'این را بگیر', notABlock: 'این را نمی‌توان گذاشت.', alreadyHere: 'از قبل اینجایی.', dropped: 'افتاد.', lostFound: 'زمین پر است. در گم‌شده‌ها است.', lostBtn: 'گم‌شده‌ها', drop1: 'یکی بنداز', dropAll: 'همه را بنداز', pickedUp: 'برداشته شد.', changelog: 'فهرست تغییر', youAreHere: 'اینجا هستی', next: 'بعدی', skip: 'بگذر', tryThis: 'این را بیازما', tour: 'گشت', tourMove: 'با WASD برو', a11y: 'دسترسی', helpBody: 'یک خانه برگزین', sendTeacher: 'به معلم بفرست', highContrast: 'کنتراست بلند', place10: '۱۰ بلاک بگذار', pin: 'رمز', fuel: 'سوخت', input: 'ورود', output: 'خروج', bag: 'بکس', needBlocks: '{n} تای {item} دیگر لازم است', pickBlock: 'اول یک بلاک در نوار برگزین', fillN: 'پر کن {n}', wallsN: 'دیوارها {n}', nothingBake: 'هنوز چیزی برای پختن نیست', alwaysDay: 'همیشه روز', c1SafeZone: 'Bertyville منطقه امن است', c1Bonked: 'بونک! وسایلت امن است', c1BackToBed: 'بازگشت به تخت', c1Low: 'کم' },
  rw: { tourMoveTouch: 'Genda n\'agastike', askStaff: 'Saba umwarimu afungure iki gikoresho ku ipaji y\'abakozi', keysHint: 'WASD kugenda. Shift kwiruka. Z kwicaramye. Umwanya usimbuka igice kimwe. Fata ibumoso uvunagure. Iburyo gushyira. Q ikubita 1. E ifungura agasaho. Esc ifungura ibikubiyemo.', keysHintTouch: 'Genda n\'agastike. Kurura urebe. Fata urutoki ku block uvunagure. Kanda ushyire. Simbuka na Icaramye ni buto.', keysLine: 'WASD genda · Shift iruka · Z icaramye · Umwanya simbu · Ibumoso fata vunagura · Iburyo shyira · Q kubita · E agasaho · Esc ibikubiyemo', crouch: 'Icaramye', stickSide: 'Uruhande rw’agastike', whatsNewBody: 'Bertopia 2.5.49: ijoro rirakaba, kandi amatarara araka inzira itindewe.', canNow: 'Ushobora ubu', almost: 'Hafi', showAll: 'Erekana byose', timesMax: '×Max', findFirst: 'Banza ubone', lookSens: 'Umuvuduko w\'amaso', invertY: 'Hindura amaso', hideTips: 'Hisha inama', toolFaster: 'Igikoresho cy\'ibiti kirihuta.', stoneFaster: 'Igikoresho cy\'ibuye kirihuta.', wideView: 'Reba byagutse', ate: 'Wariye {item}.', pickChip: 'Kopa', holdToBreak: 'Fata urutoki ku block uvunagure.', pathTreeTouch: 'Fata iki giti. Gitanga Imbaho.', copyTip: 'Kopa block ufite mu kuboko.', pickNeed: 'Iyo block ntiri mu gasaho.', climb: 'Kuzamuka', autoJump: 'Oto-simbuka', hotbar: 'Umukandara', pockets: 'Amajepo', buildLocked: 'Isi yo kubaka ni iy’umwarimu.', teacherOn: 'Iki gikoresho gishobora kubaka', teacherOff: 'Iki gikoresho ni icy’umunyeshuri', teacherAsk: 'Umwarimu wenyine akaguka. Abanyeshuri baguma mu Bugingo.', studentWorld: 'Ubugingo. Umwarimu ashobora gufungura isi yo kubaka.', keptAside: 'Imifuka ishaje iri mu byabuze.', holdIt: 'Fata iki', notABlock: 'Ibyo ntibishyirwa.', alreadyHere: 'Usanzwe hano.', dropped: 'Cyatawe.', lostFound: 'Hasi byuzuye. Biri mu byabuze.', lostBtn: 'Ibyabuze', drop1: 'Tanga 1', dropAll: 'Tanga byose', pickedUp: 'Byatanzwe.', changelog: 'Inkururagamba', youAreHere: 'Uri hano', next: 'Ikurikira', skip: 'Simbuka', tryThis: 'Gerageza', tour: 'Urugendo', tourMove: 'Genda na WASD', a11y: 'Ubushobozi', helpBody: 'Hitamo agakaro', sendTeacher: 'Ohereza mwarimu', highContrast: 'Itandukaniro rinini', place10: 'Shyira block 10', pin: 'Kode', fuel: 'Amakara', input: 'Iwinjira', output: 'Ibisohoka', bag: 'Agasaho', needBlocks: 'Hagura {n} {item}', pickBlock: 'Hitamo block ku murongo', fillN: 'Uzuza {n}', wallsN: 'Inkuta {n}', nothingBake: 'Nta kintu cyo kotsa kirahari', alwaysDay: 'Umunsi buri gihe', c1SafeZone: 'Bertyville ni ahantu hizewe', c1Bonked: 'Bonk! Ibintu byawe birizewe', c1BackToBed: 'Gusubira ku buriri', c1Low: 'Bike' },
  ti: { tourMoveTouch: 'ብስቲክ ኪድ', askStaff: 'መምህርካ ነዚ መሳርሒ ኣብ ገጽ ሰራሕተኛታት ክኸፍቶ ሕተት', keysHint: 'WASD ምኻድ። Shift ምጉያይ። Z ምድንጋር። Space ሓደ ብሎክ ይነጥ። ጸጋማይ ሓዝ ንምስባር። የማናይ የቐምጥ። Q ሓደ የውድቕ። E ቦርሳ ይኸፍት። Esc ዝርዝር ይኸፍት።', keysHintTouch: 'ብስቲክ ኪድ። ጎተት ርአ። ኣጻብዕቲ ኣብ ብሎክ ሓዝ ንምስባር። ጠውቕ ኣቐምጥ። ንጻን ድንጋርን መጠወቒ እዮም።', keysLine: 'WASD ኺድ · Shift ጉያይ · Z ድንጋር · Space ነጥ · ጸጋማይ ሓዝ ይስብር · የማናይ የቐምጥ · Q የውድቕ · E ቦርሳ · Esc ዝርዝር', crouch: 'ድንጋር', stickSide: 'ገጽ ስቲክ', whatsNewBody: '2.5.49፡ ለይቲ ይጸልም፡ መብራህቲ ድማ ጸወታ ከይዘሓየወ መንገዲ የብርሁ።', canNow: 'ሕጂ ትኽእል', almost: 'ዳርጋ', showAll: 'ኩሉ ኣርኢ', timesMax: '×Max', findFirst: 'መጀመርታ ረኸቦ', lookSens: 'ፍጥነት ምርኣይ', invertY: 'ግልባጢ ምርኣይ', hideTips: 'ምኽርታት ሕባእ', toolFaster: 'ናይ ዕንጨይቲ መሳርሒ ይቕልጥፍ።', stoneFaster: 'ናይ እምኒ መሳርሒ ይቕልጥፍ።', wideView: 'ሰፊሕ ምርኣይ', ate: '{item} በሊዕካ።', pickChip: 'ቅዳሕ', holdToBreak: 'ኣጻብዕቲ ኣብ ብሎክ ሓዝ ንምስባር።', pathTreeTouch: 'ነዚ ዕንጨይቲ ሓዝ። ጣውላ ይህብ።', copyTip: 'ብሎክ ዘለካ ናብ ኢድካ ቅዳሕ።', pickNeed: 'እዚ ብሎክ ኣብ ቦርሳኻ የለን።', climb: 'ባዕሉ ምውጻእ', autoJump: 'ብባዕሉ ምንጻ', hotbar: 'መስመር', pockets: 'ጁባ', buildLocked: 'ዓለም ህንጻ ንመምህር እዩ።', teacherOn: 'እዚ መሳርሒ ይሃንጽ', teacherOff: 'እዚ መሳርሒ ናይ ተምሃራይ እዩ', teacherAsk: 'መምህር ጥራይ ይውልዖ። ተምሃሮ ኣብ ህይወት ይቕጽሉ።', studentWorld: 'ህይወት። መምህር ዓለም ህንጻ ክኸፍት ይኽእል።', keptAside: 'ናይ ቀደም ዕስለ ኣብ ዝጠፍአ ኣሎ።', holdIt: 'እዚ ሓዝ', notABlock: 'እዚ ኣይትቐምጦን።', alreadyHere: 'ድሮ ኣብዚ ኢኻ።', dropped: 'ወዲቑ።', lostFound: 'መሬት መሊኡ። ኣብ ዝጠፍአ ኣሎ።', lostBtn: 'ዝጠፍአ', drop1: 'ሓደ ኣውድቕ', dropAll: 'ኩሉ ኣውድቕ', pickedUp: 'ተልዒሉ።', changelog: 'ዝርዝር', youAreHere: 'ኣብዚ ኢኻ', next: 'ዝቕጽል', skip: 'ዝለል', tryThis: 'ፈትን እዚ', tour: 'ዙር', tourMove: 'ብ WASD ኪድ', a11y: 'ተበጻሕነት', helpBody: 'ንጣፍ ምረጽ', sendTeacher: 'ናብ መምህር ስደድ', highContrast: 'ልዑል ፍልልይ', place10: '10 ብሎክ ኣቐምጥ', pin: 'መለለዪ', fuel: 'ነዳዲ', input: 'እታው', output: 'ውጻኢ', bag: 'ቦርሳ', needBlocks: '{n} ተወሳኺ {item} የድሊ', pickBlock: 'መጀመርታ ብሎክ ኣብ መስመር ምረጽ', fillN: '{n} ምላእ', wallsN: 'መናድቕ {n}', nothingBake: 'ገና ዝስንከት የለን', alwaysDay: 'ኩሉ ግዜ መዓልቲ', c1SafeZone: 'Bertyville ውሑስ ቦታ እዩ', c1Bonked: 'ቦንክ! ንብረትካ ውሑስ እዩ', c1BackToBed: 'ናብ ዓራት ተመለስ', c1Low: 'ውሑድ' },
}
const BASICS = {
  en: {
    stick: 'Stick', doorGlass: 'Glass door', doorMetal: 'Metal door', doorSliding: 'Sliding door', lever: 'Lever', pushButton: 'Push button', smelter: 'Smelter', fabricator: 'Fabricator', ironOre: 'Iron ore', copperOre: 'Copper ore', zincOre: 'Zinc ore', lantern: 'Lantern', charger: 'Charger', ironIngot: 'Iron ingot', copperIngot: 'Copper ingot', zincIngot: 'Zinc ingot', steel: 'Steel', copperWire: 'Copper wire', batteryCell: 'Battery cell',
    doorGlassOpen: 'Open glass door', doorMetalOpen: 'Open metal door', doorSlidingOpen: 'Open sliding door', leverOn: 'Lever on', pushButtonOn: 'Button on',
    doorLocked: 'Locked.', needsButton: 'Needs a button or lever', needsT4: 'Needs T4 - Smelter', needsT5: 'Needs T5 - Fabricator',
    leverToastOn: 'Lever on', leverToastOff: 'Lever off', lanternLow: 'Low', lanternMed: 'Med', lanternHigh: 'High', starterKit: 'Maker parts to get you started. Now the Fabricator can make more.', lightUp: 'Light Up Bertyville', brighterNights: 'Brighter nights', autoClose: 'Auto-close', padlock: 'Padlock',
  },
  uk: {
    stick: 'Палиця', doorGlass: 'Скляні двері', doorMetal: 'Металеві двері', doorSliding: 'Розсувні двері', lever: 'Важіль', pushButton: 'Кнопка', smelter: 'Плавильня', fabricator: 'Виробник', ironOre: 'Залізна руда', copperOre: 'Мідна руда', zincOre: 'Цинкова руда', lantern: 'Ліхтар', charger: 'Зарядка', ironIngot: 'Залізний зливок', copperIngot: 'Мідний зливок', zincIngot: 'Цинковий зливок', steel: 'Сталь', copperWire: 'Мідний дріт', batteryCell: 'Батарея',
    doorGlassOpen: 'Відчинені скляні', doorMetalOpen: 'Відчинені металеві', doorSlidingOpen: 'Відчинені розсувні', leverOn: 'Важіль увімкнено', pushButtonOn: 'Кнопка натиснута',
    doorLocked: 'Замкнено.', needsButton: 'Потрібна кнопка або важіль', needsT4: 'Потрібен рівень 4 — плавильня', needsT5: 'Потрібен рівень 5 — виробник',
    leverToastOn: 'Важіль увімкнено', leverToastOff: 'Важіль вимкнено', lanternLow: 'Мало', lanternMed: 'Середньо', lanternHigh: 'Багато', starterKit: 'Деталі, щоб почати. Тепер виробник зробить ще.', lightUp: 'Засвіти Бертівілль', brighterNights: 'Ясніші ночі', autoClose: 'Саме зачиняється', padlock: 'Замок',
  },
  ru: {
    stick: 'Палка', doorGlass: 'Стеклянная дверь', doorMetal: 'Металлическая дверь', doorSliding: 'Раздвижная дверь', lever: 'Рычаг', pushButton: 'Кнопка', smelter: 'Плавильня', fabricator: 'Изготовитель', ironOre: 'Железная руда', copperOre: 'Медная руда', zincOre: 'Цинковая руда', lantern: 'Фонарь', charger: 'Зарядник', ironIngot: 'Железный слиток', copperIngot: 'Медный слиток', zincIngot: 'Цинковый слиток', steel: 'Сталь', copperWire: 'Медная проволока', batteryCell: 'Батарея',
    doorGlassOpen: 'Открытая стеклянная', doorMetalOpen: 'Открытая металлическая', doorSlidingOpen: 'Открытая раздвижная', leverOn: 'Рычаг включён', pushButtonOn: 'Кнопка нажата',
    doorLocked: 'На замке.', needsButton: 'Нужна кнопка или рычаг', needsT4: 'Нужна ступень 4 — плавильня', needsT5: 'Нужна ступень 5 — изготовитель',
    leverToastOn: 'Рычаг включён', leverToastOff: 'Рычаг выключен', lanternLow: 'Мало', lanternMed: 'Средне', lanternHigh: 'Много', starterKit: 'Детали, чтобы начать. Теперь изготовитель сделает ещё.', lightUp: 'Зажги город', brighterNights: 'Светлее ночью', autoClose: 'Само закрытие', padlock: 'Замок',
  },
  es: {
    stick: 'Palo', doorGlass: 'Puerta de vidrio', doorMetal: 'Puerta de metal', doorSliding: 'Puerta corrediza', lever: 'Palanca', pushButton: 'Botón', smelter: 'Fundidora', fabricator: 'Fabricador', ironOre: 'Mineral de hierro', copperOre: 'Mineral de cobre', zincOre: 'Mineral de zinc', lantern: 'Farol', charger: 'Cargador', ironIngot: 'Lingote de hierro', copperIngot: 'Lingote de cobre', zincIngot: 'Lingote de zinc', steel: 'Acero', copperWire: 'Cable de cobre', batteryCell: 'Pila',
    doorGlassOpen: 'Puerta de vidrio abierta', doorMetalOpen: 'Puerta de metal abierta', doorSlidingOpen: 'Puerta corrediza abierta', leverOn: 'Palanca puesta', pushButtonOn: 'Botón pulsado',
    doorLocked: 'Con llave.', needsButton: 'Necesita un botón o una palanca', needsT4: 'Necesita nivel 4 — fundidora', needsT5: 'Necesita nivel 5 — fabricador',
    leverToastOn: 'Palanca encendida', leverToastOff: 'Palanca apagada', lanternLow: 'Bajo', lanternMed: 'Medio', lanternHigh: 'Alto', starterKit: 'Piezas para empezar. Ahora el fabricador puede hacer más.', lightUp: 'Ilumina Bertyville', brighterNights: 'Noches más claras', autoClose: 'Cierre solo', padlock: 'Candado',
  },
  ar: {
    stick: 'عصا', doorGlass: 'باب زجاج', doorMetal: 'باب معدن', doorSliding: 'باب منزلق', lever: 'رافعة', pushButton: 'زر', smelter: 'مصهر', fabricator: 'مصنع', ironOre: 'خام حديد', copperOre: 'خام نحاس', zincOre: 'خام خارصين', lantern: 'فانوس', charger: 'شاحن', ironIngot: 'سبيكة حديد', copperIngot: 'سبيكة نحاس', zincIngot: 'سبيكة خارصين', steel: 'فولاذ', copperWire: 'سلك نحاس', batteryCell: 'خلية',
    doorGlassOpen: 'باب زجاج مفتوح', doorMetalOpen: 'باب معدن مفتوح', doorSlidingOpen: 'باب منزلق مفتوح', leverOn: 'الرافعة تعمل', pushButtonOn: 'الزر مضغوط',
    doorLocked: 'مقفل.', needsButton: 'يلزم زر أو رافعة', needsT4: 'يلزم المستوى 4 — المصهر', needsT5: 'يلزم المستوى 5 — المصنع',
    leverToastOn: 'الرافعة تعمل', leverToastOff: 'الرافعة متوقفة', lanternLow: 'منخفض', lanternMed: 'وسط', lanternHigh: 'عال', starterKit: 'قطع لتبدأ. الآن المصنع يصنع المزيد.', lightUp: 'أضئ البلدة', brighterNights: 'ليال أوضح', autoClose: 'إغلاق تلقائي', padlock: 'قفل',
  },
  'fa-AF': {
    stick: 'چوب', doorGlass: 'در شیشه', doorMetal: 'در فلز', doorSliding: 'در کشویی', lever: 'اهرم', pushButton: 'دکمه', smelter: 'کوره گداز', fabricator: 'سازنده', ironOre: 'سنگ آهن', copperOre: 'سنگ مس', zincOre: 'سنگ روی', lantern: 'فانوس', charger: 'شارژر', ironIngot: 'شمش آهن', copperIngot: 'شمش مس', zincIngot: 'شمش روی', steel: 'فولاد', copperWire: 'سیم مس', batteryCell: 'پیل',
    doorGlassOpen: 'در شیشه باز', doorMetalOpen: 'در فلز باز', doorSlidingOpen: 'در کشویی باز', leverOn: 'اهرم روشن', pushButtonOn: 'دکمه فشرده',
    doorLocked: 'قفل است.', needsButton: 'دکمه یا اهرم لازم است', needsT4: 'پله ۴ لازم است — کوره', needsT5: 'پله ۵ لازم است — سازنده',
    leverToastOn: 'اهرم روشن', leverToastOff: 'اهرم خاموش', lanternLow: 'کم', lanternMed: 'میانه', lanternHigh: 'زیاد', starterKit: 'قطعه‌ها برای شروع. حالا سازنده بیشتر می‌سازد.', lightUp: 'شهر را روشن کن', brighterNights: 'شب روشن‌تر', autoClose: 'بستن خودکار', padlock: 'قفل',
  },
  rw: {
    stick: 'Inkoni', doorGlass: 'Urugi rwibirahuri', doorMetal: 'Urugi rwicyuma', doorSliding: 'Urugi rusunikwa', lever: 'Inyego', pushButton: 'Buto', smelter: 'Isaturire', fabricator: 'Umukorwa', ironOre: 'Amabuye yicyuma', copperOre: 'Amabuye ya kope', zincOre: 'Amabuye ya zenk', lantern: 'Itara', charger: 'Isharize', ironIngot: 'Igisiga cyicyuma', copperIngot: 'Igisiga cya kope', zincIngot: 'Igisiga cya zenk', steel: 'Icyuma gikomeye', copperWire: 'Umugozi wa kope', batteryCell: 'Bateri',
    doorGlassOpen: 'Urugi rwibirahuri rufunguye', doorMetalOpen: 'Urugi rwicyuma rufunguye', doorSlidingOpen: 'Urugi rusunikwa rufunguye', leverOn: 'Inyego ikora', pushButtonOn: 'Buto yakanzwe',
    doorLocked: 'Irakingiwe.', needsButton: 'Ikeneye buto cyangwa inyego', needsT4: 'Ikeneye urwego 4 — isaturire', needsT5: 'Ikeneye urwego 5 — umukorwa',
    leverToastOn: 'Inyego iri ku', leverToastOff: 'Inyego iri hasi', lanternLow: 'Gake', lanternMed: 'Hagati', lanternHigh: 'Cyane', starterKit: 'Ibice byo gutangira. Ubu umukorwa ashobora gukora ibindi.', lightUp: 'Murika Bertyville', brighterNights: 'Ijoro ryiza', autoClose: 'Ifunga wenyine', padlock: 'Urufunguzo',
  },
  ti: {
    stick: 'በትሪ', doorGlass: 'ማዕጾ ብርጭቆ', doorMetal: 'ማዕጾ ብረት', doorSliding: 'ተንሸራታይ ማዕጾ', lever: 'መቐለሊ', pushButton: 'መጠወቒ', smelter: 'መፍለሒ', fabricator: 'ሰራሒ', ironOre: 'ብረት እምኒ', copperOre: 'ናሕስ እምኒ', zincOre: 'ዚንክ እምኒ', lantern: 'መብራህቲ', charger: 'መሙሊ', ironIngot: 'ብረት ሓጺን', copperIngot: 'ናሕስ ሓጺን', zincIngot: 'ዚንክ ሓጺን', steel: 'ጽኑዕ ብረት', copperWire: 'ገመድ ናሕስ', batteryCell: 'ባትሪ',
    doorGlassOpen: 'ክፉት ማዕጾ ብርጭቆ', doorMetalOpen: 'ክፉት ማዕጾ ብረት', doorSlidingOpen: 'ክፉት ተንሸራታይ ማዕጾ', leverOn: 'መቐለሊ ወሊዑ', pushButtonOn: 'መጠወቒ ተጸቒጡ',
    doorLocked: 'ተዓጽዩ።', needsButton: 'መጠወቒ ወይ መቐለሊ የድሊ', needsT4: 'ደረጃ 4 የድሊ — መፍለሒ', needsT5: 'ደረጃ 5 የድሊ — ሰራሒ',
    leverToastOn: 'መቐለሊ ወሊዑ', leverToastOff: 'መቐለሊ ጠፊኡ', lanternLow: 'ውሑድ', lanternMed: 'ማእከል', lanternHigh: 'ልዑል', starterKit: 'ንኽትጅምር ኣቑሑት። ሕጂ ሰራሒ ተወሳኺ ይሰርሕ።', lightUp: 'ከተማ ኣብርህ', brighterNights: 'ብሩህ ለይቲ', autoClose: 'ባዕሉ ይዕጾ', padlock: 'መቆለፊ',
  },
}
for (const [lang, row] of Object.entries(FIX)) Object.assign(EXTRA[lang], row)
for (const [lang, row] of Object.entries(BASICS)) Object.assign(EXTRA[lang], row)
const NEXT = {
  en: {
    whatsNewBody: 'Your Boxes, Ovens and everything in them are always saved, and harvest replants with any seed you carry.',
    saveFull: 'Couldn\'t save - storage full',
    updateReady: 'Update ready - tap to refresh',
    saveKept: 'Couldn\'t open your saved world. It is still kept.',
    notRipeHold: 'Not ripe yet - hold to break it',
    stuckStep: 'Stuck? Dig a step or place a block to climb out.',
    bagHint: 'Press E (or Esc, then click Bag) to open your Bag.',
    inPockets: '{item} went to your Bag pockets.',
    eatTip: 'Right-click or press F to eat.',
    useFood: 'Use',
    ovenNeed: '{out} needs {n} {item}. Add {more} more.',
    ovenFirst: '{item} becomes {out} at the {where} first.',
    fromSrc: 'from {item}',
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    water: 'Water',
    
    notebook: 'Notebook', notebookEmpty: 'Your notes show up here.',
    boxClick: 'Click an item, then a slot. Or drag.',
    pickFuel: 'Pick a fuel',
    pickBake: 'Pick something to bake',
    addToBake: 'Add something to bake.',
    ovenAddFuel: 'Add fuel.',
    ovenClick: 'Click an item, then the slot. Or drag.',
    makeAsk: 'Make {n}? Uses {uses}', leftLine: '{item} left: {n}', cancel: 'Cancel',
    doorTall: 'Door (2 blocks tall)', hungryEat: 'You are hungry. Break {leaves} for {berries}, or bake {bread} from {flour} in the {oven}.',
    lostWhyBag: 'The bag was full', lostWhyAside: 'From an older save',
    berryMany: 'Berries', berryDrop: '{berries} drop from {leaves}. {how}',
    berryEat: 'Eat one with F, or tap its slot.', berryEatTouch: 'Tap its slot to eat one.',
    bakesHint: 'Bakes: {list}', rawFood: 'Raw food', bakedFood: 'Food',
    ovenNoBake: 'The Oven cannot bake {item}.', ovenNoBurn: '{item} will not burn.', fuelBounce: "{item} can't burn. Fuel takes Planks or Logs.",
    gotItem: '{item} picked up',
    tooFar: 'Too far away',
    standing: 'You are standing there',
    fillTray: 'Fill', slotNeeds: 'This slot needs {item}',
    bakeInOven: 'Bake in Oven', addFuelWood: 'Add planks, a log or coal',
    needN: 'need {n} {item}', shortN: 'x{n} short',
    srcChop: 'chop a tree', srcStone: 'break stone', srcCoal: 'break coal', groundFull: 'The ground is full',
    energyLow: 'Low energy - eat something', energyFull: "You're full", energyOn: 'Energy on', energyOff: 'Energy off',
    lightLabel: 'Light',
    needsWood: 'Needs a Wood Tool', needsStone: 'Needs a Stone Tool', toolStick: 'Your tool wore out. You got a Stick.',
    woodToolLine: 'Wood tool. Mines faster.', stoneToolLine: 'Stone tool. Mines faster still.', 
    autoCloseOn: 'Auto-close on', autoCloseOff: 'Auto-close off', padlockOn: 'Padlock on', padlockOff: 'Padlock off',
  },
  uk: {
    whatsNewBody: 'Скрині, печі й усе в них завжди зберігаються, і збір сіє знову будь-яким насінням, яке несеш.',
    saveFull: 'Не збереглося — сховище повне',
    updateReady: 'Оновлення готове — торкнись, щоб оновити',
    saveKept: 'Не вдалося відкрити збережений світ. Його не стерто.',
    notRipeHold: 'Ще не стигле — тримай, щоб зламати.',
    stuckStep: 'Застряг? Прокопай сходинку або постав блок, щоб вилізти.',
    bagHint: 'Натисни E (або Esc, потім клік Сумка), щоб відкрити сумку.',
    inPockets: '{item} пішов у кишені сумки.',
    eatTip: 'Правий клік або клавіша F — зʼїсти.',
    useFood: 'Вжити',
    ovenNeed: '{out} треба {n} {item}. Додай ще {more}.',
    ovenFirst: '{item} спершу стає {out} на {where}.',
    fromSrc: 'з {item}',
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    water: 'Вода', 
    
    notebook: 'Зошит', notebookEmpty: 'Твої нотатки з’являться тут.',
    boxClick: 'Натисни предмет, потім комірку. Або перетягни.',
    pickFuel: 'Обери паливо',
    pickBake: 'Обери, що спекти',
    addToBake: 'Додай щось спекти.',
    ovenAddFuel: 'Додай паливо.',
    ovenClick: 'Натисни предмет, потім комірку. Або перетягни.',
    makeAsk: 'Зробити {n}? Піде {uses}', leftLine: '{item} лишилось: {n}', cancel: 'Скасувати',
    doorTall: 'Двері (2 блоки заввишки)', hungryEat: 'Ти голодний. Ламай {leaves} заради {berries}, або спечи {bread} з {flour} в {oven}.',
    lostWhyBag: 'Сумка була повна', lostWhyAside: 'Зі старого збереження',
    berryMany: 'Ягоди', berryDrop: '{berries} падають з {leaves}. {how}',
    berryEat: 'Зʼїж одну клавішею F або торкнись її слота.', berryEatTouch: 'Торкнись її слота, щоб зʼїсти.',
    bakesHint: 'Пече: {list}', rawFood: 'Сира їжа', bakedFood: 'Їжа',
    ovenNoBake: 'Піч не може спекти {item}.', ovenNoBurn: '{item} не горить.', fuelBounce: '{item} не горить. Паливо — дошки або колоди.',
    gotItem: '{item} підібрано',
    tooFar: 'Занадто далеко',
    standing: 'Ти стоїш там',
    fillTray: 'Наповни', slotNeeds: 'Цій комірці треба {item}',
    bakeInOven: 'Печи в печі', addFuelWood: 'Додай дошки, колоду або вугілля',
    needN: 'треба {n} {item}', shortN: 'бракує {n}',
    srcChop: 'рубай дерево', srcStone: 'розбий камінь', srcCoal: 'розбий вугілля', groundFull: 'Земля повна',
    energyLow: 'Мало енергії — з’їж щось', energyFull: 'Ти ситий', energyOn: 'Енергія увімкнена', energyOff: 'Енергія вимкнена',
    lightLabel: 'Світло',
    needsWood: 'Потрібне дерев’яне знаряддя', needsStone: 'Потрібне кам’яне знаряддя', toolStick: 'Знаряддя зносилось. Ти отримав палицю.',
    woodToolLine: 'Дерев’яне знаряддя. Копає швидше.', stoneToolLine: 'Кам’яне знаряддя. Копає ще швидше.', 
    autoCloseOn: 'Самозачинення увімкнено', autoCloseOff: 'Самозачинення вимкнено', padlockOn: 'Замок зачинено', padlockOff: 'Замок відчинено',
  },
  ru: {
    whatsNewBody: 'Сундуки, печи и всё в них всегда сохраняются, а сбор сеет снова любым семенем, которое несёшь.',
    saveFull: 'Не сохранилось — хранилище полно',
    updateReady: 'Обновление готово — нажми, чтобы обновить',
    saveKept: 'Не удалось открыть сохранённый мир. Он не стёрт.',
    notRipeHold: 'Ещё не спелое — держи, чтобы сломать.',
    stuckStep: 'Застрял? Прокопай ступеньку или поставь блок, чтобы вылезти.',
    bagHint: 'Нажми E (или Esc, потом клик Сумка), чтобы открыть сумку.',
    inPockets: '{item} ушёл в карманы сумки.',
    eatTip: 'Правый клик или клавиша F — съесть.',
    useFood: 'Съесть',
    ovenNeed: '{out} нужно {n} {item}. Добавь ещё {more}.',
    ovenFirst: '{item} сначала становится {out} на {where}.',
    fromSrc: 'из {item}',
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    water: 'Вода', 
    
    notebook: 'Тетрадь', notebookEmpty: 'Твои заметки появятся здесь.',
    boxClick: 'Нажми предмет, потом ячейку. Или перетащи.',
    pickFuel: 'Выбери топливо',
    pickBake: 'Выбери, что испечь',
    addToBake: 'Добавь что-нибудь испечь.',
    ovenAddFuel: 'Добавь топливо.',
    ovenClick: 'Нажми предмет, потом ячейку. Или перетащи.',
    makeAsk: 'Сделать {n}? Уйдёт {uses}', leftLine: '{item} осталось: {n}', cancel: 'Отмена',
    doorTall: 'Дверь (2 блока в высоту)', hungryEat: 'Ты голоден. Ломай {leaves} ради {berries}, или испеки {bread} из {flour} в {oven}.',
    lostWhyBag: 'Сумка была полна', lostWhyAside: 'Из старого сохранения',
    berryMany: 'Ягоды', berryDrop: '{berries} падают из {leaves}. {how}',
    berryEat: 'Съешь одну клавишей F или нажми её слот.', berryEatTouch: 'Нажми её слот, чтобы съесть.',
    bakesHint: 'Печёт: {list}', rawFood: 'Сырая еда', bakedFood: 'Еда',
    ovenNoBake: 'Печь не может испечь {item}.', ovenNoBurn: '{item} не горит.', fuelBounce: '{item} не горит. Топливо — доски или брёвна.',
    gotItem: '{item} подобрано',
    tooFar: 'Слишком далеко',
    standing: 'Ты стоишь там',
    fillTray: 'Заполни', slotNeeds: 'Этой ячейке нужно {item}',
    bakeInOven: 'Пеки в печи', addFuelWood: 'Добавь доски, бревно или уголь',
    needN: 'нужно {n} {item}', shortN: 'не хватает {n}',
    srcChop: 'сруби дерево', srcStone: 'разбей камень', srcCoal: 'разбей уголь', groundFull: 'Земля полна',
    energyLow: 'Мало энергии — съешь что-нибудь', energyFull: 'Ты сыт', energyOn: 'Энергия включена', energyOff: 'Энергия выключена',
    lightLabel: 'Свет',
    needsWood: 'Нужно деревянное орудие', needsStone: 'Нужно каменное орудие', toolStick: 'Орудие износилось. Ты получил палку.',
    woodToolLine: 'Деревянное орудие. Копает быстрее.', stoneToolLine: 'Каменное орудие. Копает ещё быстрее.', 
    autoCloseOn: 'Самозакрытие включено', autoCloseOff: 'Самозакрытие выключено', padlockOn: 'Замок закрыт', padlockOff: 'Замок открыт',
  },
  es: {
    whatsNewBody: 'Las cajas, los hornos y todo lo que hay dentro siempre se guardan, y la cosecha replanta con cualquier semilla que lleves.',
    saveFull: 'No se pudo guardar: el almacenamiento está lleno',
    updateReady: 'Actualización lista: toca para recargar',
    saveKept: 'No se pudo abrir tu mundo guardado. Sigue guardado.',
    notRipeHold: 'Aún no está maduro: mantén para romperlo.',
    stuckStep: '¿Atrapado? Cava un escalón o pon un bloque para salir.',
    bagHint: 'Pulsa E (o Esc y luego Bolsa) para abrir tu Bolsa.',
    inPockets: '{item} fue a los bolsillos de la bolsa.',
    eatTip: 'Clic derecho o F para comer.',
    useFood: 'Usar',
    ovenNeed: '{out} necesita {n} {item}. Añade {more} más.',
    ovenFirst: '{item} primero se vuelve {out} en el {where}.',
    fromSrc: 'de {item}',
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    water: 'Agua', 
    
    notebook: 'Cuaderno', notebookEmpty: 'Tus notas aparecen aquí.',
    boxClick: 'Haz clic en un objeto y luego en una casilla. O arrastra.',
    pickFuel: 'Elige un combustible',
    pickBake: 'Elige qué hornear',
    addToBake: 'Añade algo para hornear.',
    ovenAddFuel: 'Añade combustible.',
    ovenClick: 'Haz clic en un objeto y luego en la casilla. O arrastra.',
    makeAsk: '¿Hacer {n}? Usa {uses}', leftLine: '{item} quedan: {n}', cancel: 'Cancelar',
    doorTall: 'Puerta (2 bloques de alto)', hungryEat: 'Tienes hambre. Rompe {leaves} para {berries}, o hornea {bread} con {flour} en el {oven}.',
    lostWhyBag: 'La bolsa estaba llena', lostWhyAside: 'De un guardado viejo',
    berryMany: 'Bayas', berryDrop: '{berries} caen de {leaves}. {how}',
    berryEat: 'Come una con F, o toca su casilla.', berryEatTouch: 'Toca su casilla para comer una.',
    bakesHint: 'Hornea: {list}', rawFood: 'Comida cruda', bakedFood: 'Comida',
    ovenNoBake: 'El horno no puede hornear {item}.', ovenNoBurn: '{item} no arde.', fuelBounce: '{item} no arde. El combustible son tablones o troncos.',
    gotItem: '{item} recogido',
    tooFar: 'Demasiado lejos',
    standing: 'Estás parado ahí',
    fillTray: 'Llenar', slotNeeds: 'Esta casilla necesita {item}',
    bakeInOven: 'Hornea en el horno', addFuelWood: 'Añade tablas, un tronco o carbón',
    needN: 'faltan {n} {item}', shortN: 'falta {n}',
    srcChop: 'tala un árbol', srcStone: 'rompe piedra', srcCoal: 'rompe carbón', groundFull: 'El suelo está lleno',
    energyLow: 'Poca energía: come algo', energyFull: 'Estás lleno', energyOn: 'Energía activada', energyOff: 'Energía apagada',
    lightLabel: 'Luz',
    needsWood: 'Necesitas una herramienta de madera', needsStone: 'Necesitas una herramienta de piedra', toolStick: 'Tu herramienta se gastó. Recibiste un palo.',
    woodToolLine: 'Herramienta de madera. Mina más rápido.', stoneToolLine: 'Herramienta de piedra. Mina aún más rápido.', 
    autoCloseOn: 'Cierre solo activo', autoCloseOff: 'Cierre solo apagado', padlockOn: 'Candado puesto', padlockOff: 'Candado quitado',
  },
  ar: {
    whatsNewBody: 'الصناديق والأفران وكل ما فيها تُحفظ دائماً، والحصاد يعيد الزرع بأي بذرة تحملها.',
    saveFull: 'تعذّر الحفظ — التخزين ممتلئ',
    updateReady: 'التحديث جاهز — المس للتحديث',
    saveKept: 'تعذّر فتح عالمك المحفوظ. ما زال محفوظاً.',
    notRipeHold: 'لم ينضج بعد — اضغط مطولاً لكسره.',
    stuckStep: 'عالِق؟ احفر درجة أو ضع مكعباً لتتسلق للخارج.',
    bagHint: 'اضغط E (أو Esc ثم الحقيبة) لفتح حقيبتك.',
    inPockets: '{item} ذهب إلى جيوب الحقيبة.',
    eatTip: 'انقر باليمين أو اضغط F لتأكل.',
    useFood: 'استخدم',
    ovenNeed: '{out} يحتاج {n} {item}. أضف {more} زيادة.',
    ovenFirst: '{item} يصبح {out} في {where} أولاً.',
    fromSrc: 'من {item}',
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    water: 'ماء', 
    
    notebook: 'دفتر', notebookEmpty: 'ملاحظاتك تظهر هنا.',
    boxClick: 'انقر عنصراً ثم خانة. أو اسحب.',
    pickFuel: 'اختر وقوداً',
    pickBake: 'اختر شيئاً لتخبزه',
    addToBake: 'أضف شيئاً لتخبزه.',
    ovenAddFuel: 'أضف وقوداً.',
    ovenClick: 'انقر عنصراً ثم الخانة. أو اسحب.',
    makeAsk: 'تصنع {n}؟ يستخدم {uses}', leftLine: 'يبقى {item}: {n}', cancel: 'إلغاء',
    doorTall: 'باب (بارتفاع مكعبين)', hungryEat: 'أنت جائع. اكسر {leaves} من أجل {berries}، أو اخبز {bread} من {flour} في {oven}.',
    lostWhyBag: 'الحقيبة كانت ممتلئة', lostWhyAside: 'من حفظ أقدم',
    berryMany: 'توت', berryDrop: '{berries} تسقط من {leaves}. {how}',
    berryEat: 'كُل واحدة بمفتاح F، أو المس خانتها.', berryEatTouch: 'المس خانتها لتأكل واحدة.',
    bakesHint: 'يخبز: {list}', rawFood: 'طعام نيء', bakedFood: 'طعام',
    ovenNoBake: 'الفرن لا يخبز {item}.', ovenNoBurn: '{item} لا يحترق.', fuelBounce: '{item} لا يحترق. الوقود ألواح أو جذوع.',
    gotItem: 'تم التقاط {item}',
    tooFar: 'بعيد جداً',
    standing: 'أنت واقف هناك',
    fillTray: 'املأ', slotNeeds: 'هذه الخانة تحتاج {item}',
    bakeInOven: 'اخبز في الفرن', addFuelWood: 'أضف ألواحاً أو جذعاً أو فحماً',
    needN: 'يلزم {n} {item}', shortN: 'ناقص {n}',
    srcChop: 'اقطع شجرة', srcStone: 'اكسر الحجر', srcCoal: 'اكسر الفحم', groundFull: 'الأرض ممتلئة',
    energyLow: 'طاقة قليلة — كُل شيئاً', energyFull: 'أنت شبعان', energyOn: 'الطاقة مفتوحة', energyOff: 'الطاقة مغلقة',
    lightLabel: 'ضوء',
    needsWood: 'تحتاج أداة خشب', needsStone: 'تحتاج أداة حجر', toolStick: 'أداتك بليت. حصلت على عصا.',
    woodToolLine: 'أداة خشب. تحفر أسرع.', stoneToolLine: 'أداة حجر. تحفر أسرع أكثر.', 
    autoCloseOn: 'الإغلاق التلقائي يعمل', autoCloseOff: 'الإغلاق التلقائي متوقف', padlockOn: 'القفل مغلق', padlockOff: 'القفل مفتوح',
  },
  'fa-AF': {
    whatsNewBody: 'صندوق‌ها، تنورها و هرچه در آن‌هاست همیشه ذخیره می‌شود، و برداشت با هر دانه‌ای که داری دوباره می‌کارد.',
    saveFull: 'ذخیره نشد — جا پر است',
    updateReady: 'به‌روزرسانی آماده است — بزن تا تازه شود',
    saveKept: 'جهان ذخیره‌ات باز نشد. هنوز نگه داشته شده.',
    notRipeHold: 'هنوز نرسیده — برای شکستن نگه دار.',
    stuckStep: 'گیر کردی؟ یک پله بکن یا بلاک بگذار تا بالا بیایی.',
    bagHint: 'E را بزن (یا Esc، بعد بکس) تا بکس باز شود.',
    inPockets: '{item} به جیب‌های بکس رفت.',
    eatTip: 'کلیک راست یا F را بزن تا بخوری.',
    useFood: 'استفاده',
    ovenNeed: '{out} به {n} {item} نیاز دارد. {more} تای دیگر بیفزای.',
    ovenFirst: '{item} اول در {where} به {out} تبدیل می‌شود.',
    fromSrc: 'از {item}',
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    water: 'آب', 
    
    notebook: 'کتابچه', notebookEmpty: 'یادداشت‌هایت اینجا می‌آیند.',
    boxClick: 'یک چیز را بزن، بعد یک خانه. یا بکش.',
    pickFuel: 'یک سوخت برگزین',
    pickBake: 'چیزی برای پختن برگزین',
    addToBake: 'چیزی برای پختن بیفزای.',
    ovenAddFuel: 'سوخت بیفزای.',
    ovenClick: 'یک چیز را بزن، بعد خانه. یا بکش.',
    makeAsk: '{n} بسازی؟ مصرف {uses}', leftLine: '{item} مانده: {n}', cancel: 'لغو',
    doorTall: 'در (۲ بلاک بلند)', hungryEat: 'گرسنه‌ای. {leaves} را بشکن تا {berries} بیابی، یا {bread} را از {flour} در {oven} بپز.',
    lostWhyBag: 'بکس پر بود', lostWhyAside: 'از ذخیره کهنه‌تر',
    berryMany: 'توت‌ها', berryDrop: '{berries} از {leaves} می‌افتند. {how}',
    berryEat: 'یکی را با F بخور، یا خانه‌اش را بزن.', berryEatTouch: 'خانه‌اش را بزن تا یکی بخوری.',
    bakesHint: 'می‌پزد: {list}', rawFood: 'غذای خام', bakedFood: 'غذا',
    ovenNoBake: 'تنور {item} را نمی‌پزد.', ovenNoBurn: '{item} نمی‌سوزد.', fuelBounce: '{item} نمی‌سوزد. سوخت تخته یا کنده است.',
    gotItem: '{item} برداشته شد',
    tooFar: 'خیلی دور است',
    standing: 'آنجا ایستاده‌ای',
    fillTray: 'پر کن', slotNeeds: 'این خانه به {item} نیاز دارد',
    bakeInOven: 'در تنور بپز', addFuelWood: 'تخته، کنده یا زغال بیفزای',
    needN: 'لازم {n} {item}', shortN: 'کم است {n}',
    srcChop: 'یک درخت ببر', srcStone: 'سنگ را بشکن', srcCoal: 'زغال را بشکن', groundFull: 'زمین پر است',
    energyLow: 'انرژی کم است — چیزی بخور', energyFull: 'سیر شدی', energyOn: 'انرژی روشن', energyOff: 'انرژی خاموش',
    lightLabel: 'روشنایی',
    needsWood: 'ابزار چوبی لازم است', needsStone: 'ابزار سنگی لازم است', toolStick: 'ابزارت تمام شد. یک چوب گرفتی.',
    woodToolLine: 'ابزار چوبی. تندتر می‌کند.', stoneToolLine: 'ابزار سنگی. باز هم تندتر می‌کند.', 
    autoCloseOn: 'بستن خودکار روشن', autoCloseOff: 'بستن خودکار خاموش', padlockOn: 'قفل بسته', padlockOff: 'قفل باز',
  },
  rw: {
    whatsNewBody: 'Agasanduku, ibyoto n\'ibiri muri byo bibikwa buri gihe, kandi isarura isubiza imbuto iyo ari yo wose ufite.',
    saveFull: 'Ntibibitswe — ububiko bwuzuye',
    updateReady: 'Ivugurura riteguye — kanda kugisubiza',
    saveKept: 'Isi yawe ibitswe ntiyafungutse. Irakibitswe.',
    notRipeHold: 'Ntirikwira — fata kugira ngo uvunagure.',
    stuckStep: 'Wafashwe? Yimba urutambike cyangwa shyira block winjire hejuru.',
    bagHint: 'Kanda E (cyangwa Esc, hanyuma Agasaho) ufungure agasaho.',
    inPockets: '{item} yagiye mu mifuka y\'agasaho.',
    eatTip: 'Kanda iburyo cyangwa F urye.',
    useFood: 'Koresha',
    ovenNeed: '{out} ukeneye {n} {item}. Ongeraho {more}.',
    ovenFirst: '{item} iba {out} ku {where} mbere.',
    fromSrc: 'iva mu {item}',
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    water: 'Amazi', 
    
    notebook: 'Igitabo', notebookEmpty: 'Inyandiko zawe zigaragara hano.',
    boxClick: 'Kanda ikintu, hanyuma akazu. Cyangwa kurura.',
    pickFuel: 'Hitamo ibishya',
    pickBake: 'Hitamo icyo uteka',
    addToBake: 'Ongeraho icyo uteka.',
    ovenAddFuel: 'Ongeraho ibishya.',
    ovenClick: 'Kanda ikintu, hanyuma akazu. Cyangwa kurura.',
    makeAsk: 'Ukore {n}? Ikoresha {uses}', leftLine: '{item} yasigaye: {n}', cancel: 'Hagarika',
    doorTall: 'Urugi (uburebure bwa block 2)', hungryEat: 'Urashonje. Vuna {leaves} ubone {berries}, cyangwa teka {bread} ukoreshe {flour} mu {oven}.',
    lostWhyBag: 'Agasaho kari karuzuye', lostWhyAside: 'Bivuye mu kubika gushaje',
    berryMany: 'Imbuto', berryDrop: '{berries} ziva mu {leaves}. {how}',
    berryEat: 'Rya imwe ukoreshe F, cyangwa kanda akazu kayo.', berryEatTouch: 'Kanda akazu kayo urye imwe.',
    bakesHint: 'Iteka: {list}', rawFood: 'Ibiryo bitoze', bakedFood: 'Ibiryo',
    ovenNoBake: 'Icyoto ntigishobora guteka {item}.', ovenNoBurn: '{item} ntizishya.', fuelBounce: '{item} ntizishya. Igicamuriro ni amapulanka cyangwa ibiti.',
    gotItem: '{item} yatoranywe',
    tooFar: 'Kiri kure cyane',
    standing: 'Uri hahandi',
    fillTray: 'Uzuza', slotNeeds: 'Iki gice gikeneye {item}',
    bakeInOven: 'Teka mu byoto', addFuelWood: 'Ongeraho amabaho, igiti cyangwa amakara',
    needN: 'ukeneye {n} {item}', shortN: 'kubura {n}',
    srcChop: 'temura igiti', srcStone: 'vuna ibuye', srcCoal: 'vuna amakara', groundFull: 'Hasi byuzuye',
    energyLow: 'Ingufu nke — rya ikintu', energyFull: 'Wuzuye', energyOn: 'Ingufu ziriho', energyOff: 'Ingufu zizimye',
    lightLabel: 'Urumuri',
    needsWood: 'Ukeneye igikoresho cy\'ibiti', needsStone: 'Ukeneye igikoresho cy\'ibuye', toolStick: 'Igikoresho cyawe cyarashize. Wakiriye inkoni.',
    woodToolLine: 'Igikoresho cy\'ibiti. Ivuna vuba.', stoneToolLine: 'Igikoresho cy\'ibuye. Ivuna vuba kurushaho.', 
    autoCloseOn: 'Ifunga wenyine iriho', autoCloseOff: 'Ifunga wenyine yakuweho', padlockOn: 'Urufunguzo rwafunze', padlockOff: 'Urufunguzo rwafunguwe',
  },
  ti: {
    whatsNewBody: 'ሳንዱቕ፡ እቶንን ኩሉ ዘሎ ኣብኡን ኩሉ ግዜ ይቕመጥ፡ ምእካብ ድማ ብዝኾነ ዘለካ ዘርኢ ዳግማይ ይዝርእ።',
    saveFull: 'ኣይተዓቀበን — መኽዘን መሊኡ',
    updateReady: 'ምዕራፍ ድሉው እዩ — ጠውቕ ንምሕዳስ',
    saveKept: 'ዝተዓቀበ ዓለምካ ኣይተኸፈተን። ግና ተዓቂቡ ኣሎ።',
    notRipeHold: 'ገና ኣይበስለን — ሓዝ ንምስባር።',
    stuckStep: 'ተሓጺንካ? ስጉምቲ ጉድጓድ ወይ ብሎክ ኣቐምጥ ንምውጻእ።',
    bagHint: 'E ጠውቕ (ወይ Esc፡ ድሕሪኡ ቦርሳ) ቦርሳኻ ንምኽፋት።',
    inPockets: '{item} ናብ ጁባ ቦርሳኻ ከይዱ።',
    eatTip: 'የማናይ ጠውቕ ወይ F ጠውቕ ንምብላዕ።',
    useFood: 'ተጠቐም',
    ovenNeed: '{out} {n} {item} የድሊ። {more} ወስኽ።',
    ovenFirst: '{item} መጀመርታ ኣብ {where} {out} ይኸውን።',
    fromSrc: 'ካብ {item}',
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    water: 'ማይ', 
    
    notebook: 'መጽሓፍ', notebookEmpty: 'መዘክርካ ኣብዚ ይርአ።',
    boxClick: 'ነገር ጠውቕ ድሕሪኡ ቦታ። ወይ ጎተት።',
    pickFuel: 'ነዳዲ ምረጽ',
    pickBake: 'ንምጥባስ ምረጽ',
    addToBake: 'ንምጥባስ ወስኽ።',
    ovenAddFuel: 'ነዳዲ ወስኽ።',
    ovenClick: 'ነገር ጠውቕ ድሕሪኡ ቦታ። ወይ ጎተት።',
    makeAsk: 'ግበር {n}? ይጥቀም {uses}', leftLine: '{item} ተሪፉ: {n}', cancel: 'ሰርዝ',
    doorTall: 'ማዕጾ (2 ብሎክ ቁመት)', hungryEat: 'ጥሙኻ። {leaves} ሰብር {berries} ንምርካብ፡ ወይ {bread} ካብ {flour} ኣብ {oven} ኣብስል።',
    lostWhyBag: 'ቦርሳ መሊኡ ነበረ', lostWhyAside: 'ካብ ዝነበረ ዓቐብ',
    berryMany: 'ፍረታት', berryDrop: '{berries} ካብ {leaves} ይወድቑ። {how}',
    berryEat: 'ሓንቲ ብ F ብላዕ፡ ወይ ቦታኣ ጠውቕ።', berryEatTouch: 'ቦታኣ ጠውቕ ሓንቲ ንምብላዕ።',
    bakesHint: 'የብስል፡ {list}', rawFood: 'ጥሬ መግቢ', bakedFood: 'መግቢ',
    ovenNoBake: 'እቶን {item} ኣይብስልን።', ovenNoBurn: '{item} ኣይነድድን።', fuelBounce: '{item} ኣይነድድን። ነዳዲ ጣውላ ወይ ግንድ እዩ።',
    gotItem: '{item} ተለቂሙ',
    tooFar: 'ኣዝዩ ርሑቕ እዩ',
    standing: 'ኣብኡ ትቐውም ኣለኻ',
    fillTray: 'መልእ', slotNeeds: 'እዚ ቦታ {item} የድልዮ',
    bakeInOven: 'ኣብ እቶን ኣብስል', addFuelWood: 'ጣውላ፡ ግንድ ወይ ከሰል ወስኽ',
    needN: 'የድሊ {n} {item}', shortN: 'ጎዲሉ {n}',
    srcChop: 'ዕንጨይቲ ቑረጽ', srcStone: 'እምኒ ሰብር', srcCoal: 'ከሰል ሰብር', groundFull: 'መሬት መሊኡ',
    energyLow: 'ጉልበት ውሑድ — ገለ ብላዕ', energyFull: 'ጽጉዕካ', energyOn: 'ጉልበት ወሊዑ', energyOff: 'ጉልበት ጠፊኡ',
    lightLabel: 'ብርሃን',
    needsWood: 'ናይ ዕንጨይቲ መሳርሒ የድሊ', needsStone: 'ናይ እምኒ መሳርሒ የድሊ', toolStick: 'መሳርሒኻ ተበላሽዩ። በትሪ ረኺብካ።',
    woodToolLine: 'ናይ ዕንጨይቲ መሳርሒ። ብቐልጢፍ ይኮፍ።', stoneToolLine: 'ናይ እምኒ መሳርሒ። ብዝያዳ ይቕልጥፍ።', 
    autoCloseOn: 'ባዕሉ ምዕጻው ወሊዑ', autoCloseOff: 'ባዕሉ ምዕጻው ጠፊኡ', padlockOn: 'መቆለፊ ተዓጽዩ', padlockOff: 'መቆለፊ ተኸፊቱ',
  },
}
for (const [lang, row] of Object.entries(NEXT)) Object.assign(EXTRA[lang], row)
const SHOP = {
  en: {
    whatsNewBody: 'A Woodshop Bench holds your Glasses, Tape, Saw and Hammer, and the shop rules show the first time.',
    woodshop: 'Woodshop Bench', woodshopSide: 'Woodshop Bench',
    clay: 'Clay', clayGuide: 'Clay is very fine soil. Fired in a kiln it turns hard.',
    safetyGlasses: 'Safety Glasses', measuringTape: 'Measuring Tape', handSaw: 'Hand Saw', hammer: 'Hammer',
    noRoom: 'No room', woolAny: 'Wool', stoneAny: 'Stone or Slate',
    inBag: 'In bag: {n}', woodPickToast: 'Wood Pickaxe - mines stone faster', digOutside: 'dig outside town',
    openOld: 'Open my old world', openDated: 'Open · {date}', archiveOpen: 'Old world open',
    archiveFresh: 'Fresh start', archiveSwap: 'Swapped out', archiveBlocks: '{n} blocks', archiveBag: 'Bag {n}', oldestWorld: 'Oldest old world removed',
    confirmFresh: 'Start a fresh world? Your old world stays in the menu.',
    confirmFreshFull: 'Start a fresh world? Your oldest old world ({date}) will be removed.',
    newWorld: 'New world', makerNormal: 'Normal', makerFlat: 'Flat', makerVoid: 'Void',
    makerHills: 'Hills', makerWater: 'Water', makerTrees: 'Trees', makerShuffle: 'New seed', makerName: 'Name',
    makerStart: 'Make this world', makerBack: 'Back', makerOn: 'World Maker on', makerOff: 'World Maker off',
    makerIslands: 'Islands', makerSky: 'Sky', makerParkour: 'Parkour Start',
    makerTipFlat: 'Flat world: build anything', makerTipVoid: 'Void: one platform. Do not fall!',
    makerTipIslands: 'Islands: swim between the sand.', makerTipSky: 'Sky: hop the islands. Do not fall!',
    makerTipParkour: 'Parkour: jump the pads to the green one.', makerTryAgain: 'Try again!',
    makerCode: 'Enter code', makerUseCode: 'Use code', makerCodeBad: 'That code does not match a world.', makerShareFile: 'Share as a file',
    switchOn: 'ON', switchOff: 'OFF', quality: 'Quality', areaHint: 'This area is protected',
    wandShort: 'Wand', buildWand: 'Build Wand', wandTip: 'Scroll to change mode, click two corners, then check.',
    wandSelect: 'Select', wandFill: 'Fill', wandWalls: 'Walls', wandCopy: 'Copy', wandPaste: 'Paste', wandNeed: 'Craft a Build Wand at the Workbench.',
    needsGlasses: 'Needs Glasses', needsTape: 'Needs Tape', needsSaw: 'Needs Saw', needsHammer: 'Needs Hammer',
    hangTools: 'Hang your tools ({n}/4)', missingPackAim: 'Missing pack item: {name}, comes back when the pack returns',
    woodshopReady: 'Woodshop ready', glassesOn: 'Glasses on.',
    fieldGuide: 'Field Guide', safetyOk: 'Got it',
    safetyBody: 'Real shop rules: 1 Glasses on. 2 Measure twice, cut once. 3 Clamp it, don\'t hold it. 4 Cut away from your body. 5 Ask your teacher before using real tools.',
    skillGlasses: 'Wear eye protection every time. Chips fly.',
    skillTape: 'Measure twice, cut once.',
    skillSaw: 'Let the saw do the work. Long, steady strokes.',
    skillHammer: 'Hold the nail low, tap gently, then hit firmly.',
    skillBench: 'This bench keeps your tools in one place. Hang them on the wall before you work.',
  },
  uk: {
    whatsNewBody: 'Верстат тримає окуляри, рулетку, пилку й молоток, а правила майстерні з’являються вперше.',
    woodshop: 'Верстат', woodshopSide: 'Верстат',
    clay: 'Глина', clayGuide: 'Глина — дуже дрібний ґрунт. У печі вона стає твердою.',
    safetyGlasses: 'Захисні окуляри', measuringTape: 'Рулетка', handSaw: 'Ножівка', hammer: 'Молоток',
    noRoom: 'Немає місця', woolAny: 'Вовна', stoneAny: 'Камінь або сланець',
    inBag: 'У сумці: {n}', woodPickToast: 'Дерев’яне кайло — копає камінь швидше', digOutside: 'копай поза містом',
    openOld: 'Відкрити мій старий світ', openDated: 'Відкрити · {date}', archiveOpen: 'Старий світ відкрито',
    archiveFresh: 'Новий старт', archiveSwap: 'Поміняно', archiveBlocks: '{n} блоків', archiveBag: 'Сумка {n}', oldestWorld: 'Найстаріший старий світ знято',
    confirmFresh: 'Почати новий світ? Старий світ лишається в меню.',
    confirmFreshFull: 'Почати новий світ? Найстаріший старий світ ({date}) буде знято.',
    newWorld: 'Новий світ', makerNormal: 'Звичайний', makerFlat: 'Рівний', makerVoid: 'Порожнеча',
    makerHills: 'Пагорби', makerWater: 'Вода', makerTrees: 'Дерева', makerShuffle: 'Нове зерно', makerName: 'Назва',
    makerStart: 'Зробити цей світ', makerBack: 'Назад', makerOn: 'Творець світу увімкнено', makerOff: 'Творець світу вимкнено',
    makerIslands: 'Острови', makerSky: 'Небо', makerParkour: 'Старт паркуру',
    makerTipFlat: 'Рівний світ: будуй що хочеш', makerTipVoid: 'Порожнеча: одна платформа. Не падай!',
    makerTipIslands: 'Острови: пливи між піском.', makerTipSky: 'Небо: стрибай островами. Не падай!',
    makerTipParkour: 'Паркур: стрибай по майданчиках до зеленого.', makerTryAgain: 'Спробуй ще!',
    makerCode: 'Введи код', makerUseCode: 'Застосувати', makerCodeBad: 'Цей код не збігається зі світом.', makerShareFile: 'Поділитись файлом',
    switchOn: 'УВІМК', switchOff: 'ВИМК', quality: 'Якість', areaHint: 'Ця зона захищена',
    wandShort: 'Жезл', buildWand: 'Жезл будови', wandTip: 'Крути щоб змінити режим, клацни два кути, потім галочку.',
    wandSelect: 'Вибір', wandFill: 'Заповнити', wandWalls: 'Стіни', wandCopy: 'Копія', wandPaste: 'Вставити', wandNeed: 'Зроби Жезл будови на верстаті.',
    needsGlasses: 'Потрібні окуляри', needsTape: 'Потрібна рулетка', needsSaw: 'Потрібна пилка', needsHammer: 'Потрібен молоток',
    hangTools: 'Повісь інструменти ({n}/4)', missingPackAim: 'Немає предмета з паку: {name}, повернеться, коли пак повернеться.',
    woodshopReady: 'Майстерня готова', glassesOn: 'Окуляри надіті.',
    fieldGuide: 'Путівник', safetyOk: 'Зрозуміло',
    safetyBody: 'Правила майстерні: 1 Окуляри надінь. 2 Міряй двічі, ріж раз. 3 Затисни, не тримай рукою. 4 Ріж від себе. 5 Питай учителя перед справжніми інструментами.',
    skillGlasses: 'Захищай очі щоразу. Тріски летять.',
    skillTape: 'Міряй двічі, ріж раз.',
    skillSaw: 'Нехай пилка працює сама. Довгі рівні рухи.',
    skillHammer: 'Тримай цвях низько, легенько підстукай, тоді бий міцно.',
    skillBench: 'Цей верстат тримає інструменти разом. Повісь їх на стіну перед роботою.',
  },
  ru: {
    whatsNewBody: 'Верстак хранит очки, рулетку, пилу и молоток, а правила мастерской показываются в первый раз.',
    woodshop: 'Верстак', woodshopSide: 'Верстак',
    clay: 'Глина', clayGuide: 'Глина — очень мелкая почва. В печи она становится твёрдой.',
    safetyGlasses: 'Защитные очки', measuringTape: 'Рулетка', handSaw: 'Ножовка', hammer: 'Молоток',
    noRoom: 'Нет места', woolAny: 'Шерсть', stoneAny: 'Камень или сланец',
    inBag: 'В сумке: {n}', woodPickToast: 'Деревянная кирка — копает камень быстрее', digOutside: 'копай за городом',
    openOld: 'Открыть мой старый мир', openDated: 'Открыть · {date}', archiveOpen: 'Старый мир открыт',
    archiveFresh: 'Новый старт', archiveSwap: 'Заменён', archiveBlocks: '{n} блоков', archiveBag: 'Сумка {n}', oldestWorld: 'Самый старый мир снят',
    confirmFresh: 'Начать новый мир? Старый мир остаётся в меню.',
    confirmFreshFull: 'Начать новый мир? Самый старый мир ({date}) будет снят.',
    newWorld: 'Новый мир', makerNormal: 'Обычный', makerFlat: 'Ровный', makerVoid: 'Пустота',
    makerHills: 'Холмы', makerWater: 'Вода', makerTrees: 'Деревья', makerShuffle: 'Новое зерно', makerName: 'Имя',
    makerStart: 'Сделать этот мир', makerBack: 'Назад', makerOn: 'Мастер мира включён', makerOff: 'Мастер мира выключен',
    makerIslands: 'Острова', makerSky: 'Небо', makerParkour: 'Старт паркура',
    makerTipFlat: 'Ровный мир: строй что хочешь', makerTipVoid: 'Пустота: одна платформа. Не падай!',
    makerTipIslands: 'Острова: плыви между песком.', makerTipSky: 'Небо: прыгай по островам. Не падай!',
    makerTipParkour: 'Паркур: прыгай по площадкам к зелёной.', makerTryAgain: 'Ещё раз!',
    makerCode: 'Введи код', makerUseCode: 'Применить', makerCodeBad: 'Этот код не подходит к миру.', makerShareFile: 'Поделиться файлом',
    switchOn: 'ВКЛ', switchOff: 'ВЫКЛ', quality: 'Качество', areaHint: 'Эта зона защищена',
    wandShort: 'Жезл', buildWand: 'Жезл стройки', wandTip: 'Крути чтобы сменить режим, щёлкни два угла, потом галочку.',
    wandSelect: 'Выбор', wandFill: 'Заполнить', wandWalls: 'Стены', wandCopy: 'Копия', wandPaste: 'Вставить', wandNeed: 'Сделай Жезл стройки на верстаке.',
    needsGlasses: 'Нужны очки', needsTape: 'Нужна рулетка', needsSaw: 'Нужна пила', needsHammer: 'Нужен молоток',
    hangTools: 'Повесь инструменты ({n}/4)', missingPackAim: 'Нет предмета из пака: {name}, вернётся, когда пак вернётся.',
    woodshopReady: 'Мастерская готова', glassesOn: 'Очки надеты.',
    fieldGuide: 'Справочник', safetyOk: 'Понятно',
    safetyBody: 'Правила мастерской: 1 Надень очки. 2 Семь раз отмерь, один раз отрежь. 3 Зажми, не держи рукой. 4 Режь от себя. 5 Спроси учителя перед настоящими инструментами.',
    skillGlasses: 'Защищай глаза каждый раз. Щепки летят.',
    skillTape: 'Семь раз отмерь, один раз отрежь.',
    skillSaw: 'Пусть пила работает сама. Длинные ровные движения.',
    skillHammer: 'Держи гвоздь низко, слегка подстучи, потом бей крепко.',
    skillBench: 'Этот верстак держит инструменты вместе. Повесь их на стену перед работой.',
  },
  es: {
    whatsNewBody: 'El banco de madera guarda las gafas, la cinta, el serrucho y el martillo, y las reglas del taller salen la primera vez.',
    woodshop: 'Banco de madera', woodshopSide: 'Banco de madera',
    clay: 'Arcilla', clayGuide: 'La arcilla es un suelo muy fino. Cocida en un horno se vuelve dura.',
    safetyGlasses: 'Gafas de seguridad', measuringTape: 'Cinta métrica', handSaw: 'Serrucho', hammer: 'Martillo',
    noRoom: 'No hay sitio', woolAny: 'Lana', stoneAny: 'Piedra o pizarra',
    inBag: 'En la bolsa: {n}', woodPickToast: 'Pico de madera: mina piedra más rápido', digOutside: 'cava fuera del pueblo',
    openOld: 'Abrir mi mundo viejo', openDated: 'Abrir · {date}', archiveOpen: 'Mundo viejo abierto',
    archiveFresh: 'Inicio nuevo', archiveSwap: 'Se cambió', archiveBlocks: '{n} bloques', archiveBag: 'Bolsa {n}', oldestWorld: 'Se quitó el mundo viejo más antiguo',
    confirmFresh: '¿Empezar un mundo nuevo? Tu mundo viejo se queda en el menú.',
    confirmFreshFull: '¿Empezar un mundo nuevo? Se quitará tu mundo viejo más antiguo ({date}).',
    newWorld: 'Mundo nuevo', makerNormal: 'Normal', makerFlat: 'Plano', makerVoid: 'Vacío',
    makerHills: 'Cerros', makerWater: 'Agua', makerTrees: 'Árboles', makerShuffle: 'Semilla nueva', makerName: 'Nombre',
    makerStart: 'Hacer este mundo', makerBack: 'Atrás', makerOn: 'Creador de mundos activo', makerOff: 'Creador de mundos apagado',
    makerIslands: 'Islas', makerSky: 'Cielo', makerParkour: 'Inicio de parkour',
    makerTipFlat: 'Mundo plano: construye lo que quieras', makerTipVoid: 'Vacío: una plataforma. ¡No caigas!',
    makerTipIslands: 'Islas: nada entre la arena.', makerTipSky: 'Cielo: salta las islas. ¡No caigas!',
    makerTipParkour: 'Parkour: salta los bloques hasta el verde.', makerTryAgain: '¡Otra vez!',
    makerCode: 'Pon el código', makerUseCode: 'Usar código', makerCodeBad: 'Ese código no es de un mundo.', makerShareFile: 'Comparte como archivo',
    switchOn: 'SÍ', switchOff: 'NO', quality: 'Calidad', areaHint: 'Esta zona está protegida',
    wandShort: 'Varita', buildWand: 'Varita de construir', wandTip: 'Gira para cambiar el modo, clic en dos esquinas, luego la marca.',
    wandSelect: 'Elegir', wandFill: 'Rellenar', wandWalls: 'Muros', wandCopy: 'Copiar', wandPaste: 'Pegar', wandNeed: 'Haz una Varita de construir en el banco.',
    needsGlasses: 'Necesita las gafas', needsTape: 'Necesita la cinta', needsSaw: 'Necesita el serrucho', needsHammer: 'Necesita el martillo',
    hangTools: 'Cuelga tus herramientas ({n}/4)', missingPackAim: 'Falta un objeto del paquete: {name}, vuelve cuando el paquete regrese.',
    woodshopReady: 'Taller listo', glassesOn: 'Gafas puestas.',
    fieldGuide: 'Guía', safetyOk: 'Entendido',
    safetyBody: 'Reglas del taller: 1 Gafas puestas. 2 Mide dos veces, corta una. 3 Sujétalo con una prensa, no con la mano. 4 Corta lejos de tu cuerpo. 5 Pregunta a tu profe antes de usar herramientas de verdad.',
    skillGlasses: 'Ponte protección en los ojos siempre. Saltan astillas.',
    skillTape: 'Mide dos veces, corta una.',
    skillSaw: 'Deja que el serrucho trabaje. Golpes largos y firmes.',
    skillHammer: 'Sujeta el clavo abajo, da golpes suaves y luego pega fuerte.',
    skillBench: 'Este banco guarda las herramientas juntas. Cuélgalas en la pared antes de trabajar.',
  },
  ar: {
    whatsNewBody: 'منضدة الخشب تحفظ النظارة والشريط والمنشار والمطرقة، وقواعد الورشة تظهر أول مرة.',
    woodshop: 'منضدة الخشب', woodshopSide: 'منضدة الخشب',
    clay: 'طين', clayGuide: 'الطين تربة ناعمة جداً. إذا أُحرق في الفرن يصير صلباً.',
    safetyGlasses: 'نظارة أمان', measuringTape: 'شريط قياس', handSaw: 'منشار يد', hammer: 'مطرقة',
    noRoom: 'لا مكان', woolAny: 'صوف', stoneAny: 'حجر أو أردواز',
    inBag: 'في الحقيبة: {n}', woodPickToast: 'معول خشب - يستخرج الحجر أسرع', digOutside: 'احفر خارج البلدة',
    openOld: 'افتح عالمي القديم', openDated: 'افتح · {date}', archiveOpen: 'العالم القديم مفتوح',
    archiveFresh: 'بداية جديدة', archiveSwap: 'بُدّل', archiveBlocks: '{n} مكعبات', archiveBag: 'الحقيبة {n}', oldestWorld: 'أُزيل أقدم عالم قديم',
    confirmFresh: 'تبدأ عالماً جديداً؟ عالمك القديم يبقى في القائمة.',
    confirmFreshFull: 'تبدأ عالماً جديداً؟ سيُزال أقدم عالم قديم ({date}).',
    newWorld: 'عالم جديد', makerNormal: 'عادي', makerFlat: 'مسطح', makerVoid: 'فراغ',
    makerHills: 'تلال', makerWater: 'ماء', makerTrees: 'أشجار', makerShuffle: 'بذرة جديدة', makerName: 'اسم',
    makerStart: 'اصنع هذا العالم', makerBack: 'رجوع', makerOn: 'صانع العالم يعمل', makerOff: 'صانع العالم متوقف',
    makerIslands: 'جزر', makerSky: 'سماء', makerParkour: 'بداية القفز',
    makerTipFlat: 'عالم مسطح: ابنِ ما تشاء', makerTipVoid: 'فراغ: منصة واحدة. لا تسقط!',
    makerTipIslands: 'جزر: اسبح بين الرمل.', makerTipSky: 'سماء: اقفز بين الجزر. لا تسقط!',
    makerTipParkour: 'قفز: اقفز على المنصات حتى الخضراء.', makerTryAgain: 'حاول مرة أخرى!',
    makerCode: 'أدخل الرمز', makerUseCode: 'استخدم الرمز', makerCodeBad: 'هذا الرمز لا يطابق عالماً.', makerShareFile: 'شارك كملف',
    switchOn: 'تشغيل', switchOff: 'إيقاف', quality: 'الجودة', areaHint: 'هذه المنطقة محمية',
    wandShort: 'العصا', buildWand: 'عصا البناء', wandTip: 'مرّر لتغيير الوضع، انقر زاويتين، ثم العلامة.',
    wandSelect: 'تحديد', wandFill: 'ملء', wandWalls: 'جدران', wandCopy: 'نسخ', wandPaste: 'لصق', wandNeed: 'اصنع عصا البناء عند طاولة العمل.',
    needsGlasses: 'يحتاج النظارة', needsTape: 'يحتاج الشريط', needsSaw: 'يحتاج المنشار', needsHammer: 'يحتاج المطرقة',
    hangTools: 'علّق أدواتك ({n}/4)', missingPackAim: 'عنصر الحزمة مفقود: {name}، يعود عندما تعود الحزمة.',
    woodshopReady: 'الورشة جاهزة', glassesOn: 'النظارة على عينيك.',
    fieldGuide: 'دليل', safetyOk: 'فهمت',
    safetyBody: 'قواعد الورشة: ١ النظارة على عينيك. ٢ قس مرتين واقطع مرة. ٣ ثبّته بالمربط ولا تمسكه بيدك. ٤ اقطع بعيداً عن جسمك. ٥ اسأل معلمك قبل الأدوات الحقيقية.',
    skillGlasses: 'البس حماية العين كل مرة. الشظايا تطير.',
    skillTape: 'قس مرتين واقطع مرة.',
    skillSaw: 'دع المنشار يعمل. ضربات طويلة ثابتة.',
    skillHammer: 'أمسك المسمار من الأسفل، اطرق بلطف ثم اضرب بقوة.',
    skillBench: 'هذه المنضدة تجمع الأدوات. علّقها على الجدار قبل العمل.',
  },
  'fa-AF': {
    whatsNewBody: 'میز نجاری عینک، متر، اره و چکش را نگه می‌دارد، و قانون کارگاه بار اول نشان داده می‌شود.',
    woodshop: 'میز نجاری', woodshopSide: 'میز نجاری',
    clay: 'گل رس', clayGuide: 'گل رس خاک بسیار نرم است. در کوره که پخته شود سخت می‌شود.',
    safetyGlasses: 'عینک ایمنی', measuringTape: 'متر', handSaw: 'اره دستی', hammer: 'چکش',
    noRoom: 'جا نیست', woolAny: 'پشم', stoneAny: 'سنگ یا سنگ‌لوح',
    inBag: 'در کیف: {n}', woodPickToast: 'کلنگ چوبی - سنگ را تندتر می‌کند', digOutside: 'بیرون شهر بکن',
    openOld: 'جهان کهنه‌ام را باز کن', openDated: 'باز کن · {date}', archiveOpen: 'جهان کهنه باز شد',
    archiveFresh: 'شروع تازه', archiveSwap: 'عوض شد', archiveBlocks: '{n} بلاک', archiveBag: 'بکس {n}', oldestWorld: 'کهنه‌ترین جهان کهنه برداشته شد',
    confirmFresh: 'جهان تازه شروع شود؟ جهان کهنه در منو می‌ماند.',
    confirmFreshFull: 'جهان تازه شروع شود؟ کهنه‌ترین جهان کهنه ({date}) برداشته می‌شود.',
    newWorld: 'جهان تازه', makerNormal: 'عادی', makerFlat: 'هموار', makerVoid: 'خالی',
    makerHills: 'تپه', makerWater: 'آب', makerTrees: 'درخت', makerShuffle: 'بذر تازه', makerName: 'نام',
    makerStart: 'این جهان را بساز', makerBack: 'بازگشت', makerOn: 'سازنده جهان روشن', makerOff: 'سازنده جهان خاموش',
    makerIslands: 'جزیره‌ها', makerSky: 'آسمان', makerParkour: 'شروع پارکور',
    makerTipFlat: 'جهان هموار: هر چه خواهی بساز', makerTipVoid: 'خالی: یک سکو. نیفت!',
    makerTipIslands: 'جزیره‌ها: میان شن شنا کن.', makerTipSky: 'آسمان: از جزیره به جزیره بپر. نیفت!',
    makerTipParkour: 'پارکور: تا سکوی سبز بپر.', makerTryAgain: 'دوباره بزن!',
    makerCode: 'کد را بنویس', makerUseCode: 'کد را بگذار', makerCodeBad: 'این کد با جهانی جور نیست.', makerShareFile: 'به شکل فایل بده',
    switchOn: 'روشن', switchOff: 'خاموش', quality: 'کیفیت', areaHint: 'این جا محافظت شده است',
    wandShort: 'عصا', buildWand: 'عصای ساخت', wandTip: 'بچرخان تا حالت عوض شود، دو گوشه را بزن، بعد تیک.',
    wandSelect: 'انتخاب', wandFill: 'پر کردن', wandWalls: 'دیوار', wandCopy: 'کپی', wandPaste: 'چسباندن', wandNeed: 'عصای ساخت را روی میز کار بساز.',
    needsGlasses: 'عینک لازم است', needsTape: 'متر لازم است', needsSaw: 'اره لازم است', needsHammer: 'چکش لازم است',
    hangTools: 'ابزارت را بیاویز ({n}/4)', missingPackAim: 'چیز بسته گم است: {name}، وقتی بسته برگردد برمی‌گردد.',
    woodshopReady: 'کارگاه آماده است', glassesOn: 'عینک زده شد.',
    fieldGuide: 'راهنما', safetyOk: 'فهمیدم',
    safetyBody: 'قانون کارگاه: ۱ عینک را بزن. ۲ دو بار اندازه بگیر، یک بار ببر. ۳ آن را گیره کن، با دست نگیر. ۴ از بدن خود دور ببر. ۵ پیش از ابزار واقعی از معلمت بپرس.',
    skillGlasses: 'هر بار از چشم خود محافظت کن. تراشه می‌پرد.',
    skillTape: 'دو بار اندازه بگیر، یک بار ببر.',
    skillSaw: 'بگذار اره کار کند. ضربه‌های بلند و یکنواخت.',
    skillHammer: 'میخ را پایین بگیر، آهسته بزن، بعد محکم بکوب.',
    skillBench: 'این میز ابزار را یکجا نگه می‌دارد. پیش از کار آن‌ها را به دیوار بیاویز.',
  },
  rw: {
    whatsNewBody: 'Intebe y\'ububaji ibika amararo, umugozi, urubanza n\'inyundo, kandi amategeko y\'ikigo agaragara ubwa mbere.',
    woodshop: 'Intebe y\'ububaji', woodshopSide: 'Intebe y\'ububaji',
    clay: 'Ibumba', clayGuide: 'Ibumba ni ubutaka bworoshye cyane. Iyo bwashyushye mu ziko buba inkome.',
    safetyGlasses: 'Amararo y\'umutekano', measuringTape: 'Umugozi wo gupima', handSaw: 'Urubanza', hammer: 'Inyundo',
    noRoom: 'Nta mwanya', woolAny: 'Ubwoya', stoneAny: 'Ibuye cyangwa slate',
    inBag: 'Mu gasakoshi: {n}', woodPickToast: 'Icyuma cy\'ibiti - ivuna ibuye vuba', digOutside: 'kora hanze y\'umujyi',
    openOld: 'Fungura isi yanjye ya kera', openDated: 'Fungura · {date}', archiveOpen: 'Isi ya kera irafunguye',
    archiveFresh: 'Gutangira bushya', archiveSwap: 'Cyahinduwe', archiveBlocks: 'amabuye {n}', archiveBag: 'Agasaho {n}', oldestWorld: 'Isi ya kera cyane yakuweho',
    confirmFresh: 'Tangira isi nshya? Isi ya kera iguma mu menyu.',
    confirmFreshFull: 'Tangira isi nshya? Isi ya kera cyane ({date}) izakuweho.',
    newWorld: 'Isi nshya', makerNormal: 'Isanzwe', makerFlat: 'Igororotse', makerVoid: 'Ubusa',
    makerHills: 'Imisozi', makerWater: 'Amazi', makerTrees: 'Ibiti', makerShuffle: 'Imbuto nshya', makerName: 'Izina',
    makerStart: 'Kora iyi si', makerBack: 'Subira', makerOn: 'Ukora isi arakora', makerOff: 'Ukora isi arahagaritswe',
    makerIslands: 'Ibirwa', makerSky: 'Ijuru', makerParkour: 'Tangira parkour',
    makerTipFlat: 'Isi igororotse: ubake icyo ushaka', makerTipVoid: 'Ubusa: urubuga rumwe. Ntugwe!',
    makerTipIslands: 'Ibirwa: oga hagati y\'umucanga.', makerTipSky: 'Ijuru: simba ibirwa. Ntugwe!',
    makerTipParkour: 'Parkour: simba udubuga kugeza ku cyatsi.', makerTryAgain: 'Ongera ugerageze!',
    makerCode: 'Andika kode', makerUseCode: 'Koresha kode', makerCodeBad: 'Iyi kode ntihura n\'isi.', makerShareFile: 'Sangira nk\'idosiye',
    switchOn: 'YEGO', switchOff: 'OYA', quality: 'Ubwiza', areaHint: 'Aha harinzwe',
    wandShort: 'Inkoni', buildWand: 'Inkoni y\'ubwubatsi', wandTip: 'Zungurura uhindure uburyo, kanda ibisigisigi bibiri, hanyuma akamenyetso.',
    wandSelect: 'Hitamo', wandFill: 'Uzuza', wandWalls: 'Inkuta', wandCopy: 'Kopa', wandPaste: 'Shyira', wandNeed: 'Kora Inkoni y\'ubwubatsi ku meza y\'akazi.',
    needsGlasses: 'Ikeneye amararo', needsTape: 'Ikeneye umugozi', needsSaw: 'Ikeneye urubanza', needsHammer: 'Ikeneye inyundo',
    hangTools: 'Manika ibikoresho byawe ({n}/4)', missingPackAim: 'Ikintu cy\'umupaki kirabuze: {name}, kigaruka iyo umupaki usubira.',
    woodshopReady: 'Ikigo cyiteguye', glassesOn: 'Amararo arashyinguwe.',
    fieldGuide: 'Umuyoboro', safetyOk: 'Ndumva',
    safetyBody: 'Amategeko y\'ikigo: 1 Shyira amararo. 2 Pima kabiri, ca rimwe. 3 Gibumbate, ntukagifate n\'intoki. 4 Ca ureba kure y\'umubiri. 5 Baza umwarimu mbere y\'ibikoresho by\'ukuri.',
    skillGlasses: 'Shyira amararo buri gihe. Udusimba durarururumba.',
    skillTape: 'Pima kabiri, ca rimwe.',
    skillSaw: 'Reka urubanza rukore. Ibisita birebire kandi bihoraho.',
    skillHammer: 'Fata umusumari hasi, komanga buhoro, hanyuma ukomeze.',
    skillBench: 'Iyi ntebe ibika ibikoresho hamwe. Abihambike ku rukuta mbere yo gukora.',
  },
  ti: {
    whatsNewBody: 'ናይ ዕንጨይቲ መደብ መነጽር፡ መለክዒ፡ መጋዝን መጥሓንን ይሕዝ፡ ሕግታት ዕድጊ ድማ መጀመርታ ይረኣዩ።',
    woodshop: 'መደብ ዕንጨይቲ', woodshopSide: 'መደብ ዕንጨይቲ',
    clay: 'ሸክላ', clayGuide: 'ሸክላ ብጣዕሚ ደቂቕ ሓመድ እዩ። ኣብ እቶን ምስ ተነድደ ይደርቕ።',
    safetyGlasses: 'መነጽር ድሕንነት', measuringTape: 'መለክዒ', handSaw: 'መጋዝ ኢድ', hammer: 'መጥሓን',
    noRoom: 'ቦታ የለን', woolAny: 'ጥምጢ', stoneAny: 'እምኒ ወይ ስሌት',
    inBag: 'ኣብ ሳንጣ: {n}', woodPickToast: 'ናይ ዕንጨይቲ መኮፍ - እምኒ ብቐልጢፍ ይኮፍ', digOutside: 'ካብ ከተማ ወጻኢ እኸድ',
    openOld: 'ናተይ ናይ ቀደም ዓለም ክፈት', openDated: 'ክፈት · {date}', archiveOpen: 'ናይ ቀደም ዓለም ተኸፊቱ',
    archiveFresh: 'ሓድሽ ጅማረ', archiveSwap: 'ተቐይሩ', archiveBlocks: '{n} ብሎክ', archiveBag: 'ቦርሳ {n}', oldestWorld: 'ዝኸበረ ናይ ቀደም ዓለም ተደምሲሱ',
    confirmFresh: 'ሓድሽ ዓለም ትጅምር? እቲ ናይ ቀደም ዓለም ኣብ ምናሌ ይጸንሕ።',
    confirmFreshFull: 'ሓድሽ ዓለም ትጅምር? እቲ ዝኸበረ ናይ ቀደም ዓለም ({date}) ክውጽእ እዩ።',
    newWorld: 'ሓድሽ ዓለም', makerNormal: 'ልሙድ', makerFlat: 'ለሚዕ', makerVoid: 'ባዶ',
    makerHills: 'ኮረባታት', makerWater: 'ማይ', makerTrees: 'ኣእዋም', makerShuffle: 'ሓድሽ ዘርኢ', makerName: 'ስም',
    makerStart: 'እዚ ዓለም ግበር', makerBack: 'ተመለስ', makerOn: 'ሰራሒ ዓለም ይሰርሕ', makerOff: 'ሰራሒ ዓለም ጠፊኡ',
    makerIslands: 'ደሴታት', makerSky: 'ሰማይ', makerParkour: 'መጀመርታ ፓርኩር',
    makerTipFlat: 'ለሚዕ ዓለም: ዝደለኻ ህነጽ', makerTipVoid: 'ባዶ: ሓንቲ መድረኽ። ኣይትወድቕ!',
    makerTipIslands: 'ደሴታት: ኣብ መንጎ ሑጻ ሓምበር።', makerTipSky: 'ሰማይ: ካብ ደሴት ናብ ደሴት ነጥ። ኣይትወድቕ!',
    makerTipParkour: 'ፓርኩር: ክሳብ ቀጠልያ መድረኽ ነጥ።', makerTryAgain: 'ደጊምካ ፈትን!',
    makerCode: 'ኮድ ኣእቱ', makerUseCode: 'ኮድ ተጠቐም', makerCodeBad: 'እዚ ኮድ ምስ ዓለም ኣይሰማማዕን።', makerShareFile: 'ከም ፋይል ኣካፍል',
    switchOn: 'ወሊዑ', switchOff: 'ጠፊኡ', quality: 'ጽሬት', areaHint: 'እዚ ከባቢ ተሓልዩ ኣሎ',
    wandShort: 'በትሪ', buildWand: 'በትሪ ህንጻ', wandTip: 'ሸብሸብ ንምቅያር ኩነት፡ ክልተ ኩርናዕ ጠውቕ፡ ድሕሪኡ ምልክት።',
    wandSelect: 'ምረጽ', wandFill: 'ምላእ', wandWalls: 'መንደቕ', wandCopy: 'ቅዳሕ', wandPaste: 'ለጥፍ', wandNeed: 'በትሪ ህንጻ ኣብ መደብ ስራሕ ሰርሕ።',
    needsGlasses: 'መነጽር የድሊ', needsTape: 'መለክዒ የድሊ', needsSaw: 'መጋዝ የድሊ', needsHammer: 'መጥሓን የድሊ',
    hangTools: 'መሳርሕታትካ ሰቅል ({n}/4)', missingPackAim: 'ዝጠፍአ ናይ ጥቕሊ ኣቕሓ: {name}፡ ጥቕሊ ምስ ተመለሰ ይምለስ።',
    woodshopReady: 'ዕድጊ ድሉው እዩ', glassesOn: 'መነጽር ተገቢሩ።',
    fieldGuide: 'መምርሒ', safetyOk: 'ተረዲኡ',
    safetyBody: 'ሕግታት ዕድጊ፡ 1 መነጽር ግበር። 2 ክልተ ግዜ ለክዕ፡ ሓደ ግዜ ቑረጽ። 3 ቐጥቅጦ፡ ብኢድካ ኣይትሕዞ። 4 ካብ ሰብነትካ ርሒቕካ ቑረጽ። 5 ቅድሚ ሓቀኛ መሳርሒ መምህርካ ሕተት።',
    skillGlasses: 'ዓይኒ ኩሉ ግዜ ሓልው። ስብራት ይንፈር።',
    skillTape: 'ክልተ ግዜ ለክዕ፡ ሓደ ግዜ ቑረጽ።',
    skillSaw: 'መጋዝ ንሱ ግበሮ። ነዊሕ ቀጻሊ ምውስዋስ።',
    skillHammer: 'ምስማር ታሕቲ ሓዝ፡ ቀስ ኢልካ ጠውቕ፡ ድሕሪኡ ጽኑዕ ምቱ።',
    skillBench: 'እዚ መደብ መሳርሕታት ኣብ ሓደ ይሕዝ። ቅድሚ ስራሕ ኣብ መንደቕ ሰቅሎም።',
  },
}
for (const [lang, row] of Object.entries(SHOP)) Object.assign(EXTRA[lang], row)
const BED = {
  en: {
    whatsNewBody: 'A Bed is built at the Woodshop. Design it or just build it, then rest to fill your energy.',
    bunk: 'Bed',
    justBuild: 'Just build', designIt: 'Design it', builtChip: 'Built!',
    fitsBerty: 'Fits 1 Berty, under 6 planks',
    toneWord: 'Wood', toneNatural: 'Natural', toneHoney: 'Honey', toneDark: 'Dark',
    fabricWord: 'Fabric', patternWord: 'Pattern', patternPlain: 'Plain', patternStripes: 'Stripes', patternChecks: 'Checks',
    measureWord: 'Measure', cutWord: 'Cut', againWord: 'Again', exactWord: 'Exact', closeWord: 'Close', offWord: 'Off',
    assembleWord: 'Assemble', nailWord: 'Nail', testWord: 'Test',
    steadyWord: 'Steady', slightWobble: 'Slight wobble', bigWobble: 'Big wobble',
    fixIt: 'Fix it', keepIt: 'Keep it', remakeBest: 'Remake my best', nextWord: 'Next',
    skillNeed: 'Ask: Engineers start by asking who it\'s for.',
    skillPlan: 'Plan: A sketch lets you find mistakes before you cut.',
    skillTest: 'Test: Testing shows what to improve.',
    skillImprove: 'Improve: Real designs get better every round.',
    starWorks: '1 star · works', starSteady: '2 stars · steady', starBest: '3 stars · steady',
    restWord: 'Rest', restWait: 'Rest again soon', rested: 'Rested.', goldTrim: 'Gold trim',
    pathKid: 'Kid chooses', pathDesign: 'Design it required', pathBuild: 'Just build only',
    helpMeasure: 'Help me measure', shopRequired: 'Woodshop required', shopTeacher: 'Teacher',
    bedNeedTools: 'Needs Glasses, Tape, Saw and Hammer', bedNeedMats: 'Needs 3 Planks and 3 Wool', boardWord: 'Board',
  },
  uk: {
    whatsNewBody: 'Ліжко роблять на верстаті. Спроектуй його або просто збери, тоді відпочинь, щоб набрати енергію.',
    bunk: 'Ліжко',
    justBuild: 'Просто збери', designIt: 'Спроектуй', builtChip: 'Збудовано!',
    fitsBerty: 'На 1 Берті, менше 6 дощок',
    toneWord: 'Дерево', toneNatural: 'Натуральне', toneHoney: 'Медове', toneDark: 'Темне',
    fabricWord: 'Тканина', patternWord: 'Візерунок', patternPlain: 'Гладко', patternStripes: 'Смуги', patternChecks: 'Клітинка',
    measureWord: 'Міряй', cutWord: 'Ріж', againWord: 'Знову', exactWord: 'Точно', closeWord: 'Близько', offWord: 'Мимо',
    assembleWord: 'Збери', nailWord: 'Цвях', testWord: 'Перевір',
    steadyWord: 'Рівно', slightWobble: 'Легкий хит', bigWobble: 'Сильний хит',
    fixIt: 'Виправ', keepIt: 'Лиши', remakeBest: 'Зроби найкраще', nextWord: 'Далі',
    skillNeed: 'Ask: Інженери спочатку питають, для кого це.',
    skillPlan: 'Plan: Ескіз показує помилки ще до різу.',
    skillTest: 'Test: Перевірка показує, що поліпшити.',
    skillImprove: 'Improve: Справжні задуми кращають щоразу.',
    starWorks: '1 зірка · працює', starSteady: '2 зірки · рівно', starBest: '3 зірки · рівно',
    restWord: 'Відпочинь', restWait: 'Відпочинь згодом', rested: 'Відпочив.', goldTrim: 'Золота смуга',
    pathKid: 'Дитина обирає', pathDesign: 'Тільки проєкт', pathBuild: 'Тільки збірка',
    helpMeasure: 'Допоможи міряти', shopRequired: 'Лише майстерня', shopTeacher: 'Вчитель',
    bedNeedTools: 'Потрібні окуляри, рулетка, пилка й молоток', bedNeedMats: 'Потрібні 3 дошки і 3 вовни', boardWord: 'Дошка',
  },
  ru: {
    whatsNewBody: 'Кровать делают на верстаке. Спроектируй её или просто собери, потом отдохни, чтобы набрать энергию.',
    bunk: 'Кровать',
    justBuild: 'Просто собери', designIt: 'Спроектируй', builtChip: 'Готово!',
    fitsBerty: 'На 1 Берти, меньше 6 досок',
    toneWord: 'Дерево', toneNatural: 'Натуральное', toneHoney: 'Медовое', toneDark: 'Тёмное',
    fabricWord: 'Ткань', patternWord: 'Узор', patternPlain: 'Гладко', patternStripes: 'Полосы', patternChecks: 'Клетка',
    measureWord: 'Меряй', cutWord: 'Режь', againWord: 'Снова', exactWord: 'Точно', closeWord: 'Близко', offWord: 'Мимо',
    assembleWord: 'Собери', nailWord: 'Гвоздь', testWord: 'Проверь',
    steadyWord: 'Ровно', slightWobble: 'Лёгкий шат', bigWobble: 'Сильный шат',
    fixIt: 'Исправь', keepIt: 'Оставь', remakeBest: 'Собери лучшее', nextWord: 'Дальше',
    skillNeed: 'Ask: Инженеры сначала спрашивают, для кого это.',
    skillPlan: 'Plan: Эскиз показывает ошибки ещё до реза.',
    skillTest: 'Test: Проверка показывает, что улучшить.',
    skillImprove: 'Improve: Настоящие замыслы становятся лучше каждый круг.',
    starWorks: '1 звезда · работает', starSteady: '2 звезды · ровно', starBest: '3 звезды · ровно',
    restWord: 'Отдохни', restWait: 'Отдохни позже', rested: 'Отдохнул.', goldTrim: 'Золотая кромка',
    pathKid: 'Ребёнок выбирает', pathDesign: 'Только проект', pathBuild: 'Только сборка',
    helpMeasure: 'Помоги измерить', shopRequired: 'Только мастерская', shopTeacher: 'Учитель',
    bedNeedTools: 'Нужны очки, рулетка, пила и молоток', bedNeedMats: 'Нужны 3 доски и 3 шерсти', boardWord: 'Доска',
  },
  es: {
    whatsNewBody: 'La cama se hace en el banco de madera. Diséñala o solo constrúyela, luego descansa para llenar tu energía.',
    bunk: 'Cama',
    justBuild: 'Solo construir', designIt: 'Diseñarla', builtChip: '¡Listo!',
    fitsBerty: 'Cabe 1 Berty, menos de 6 tablas',
    toneWord: 'Madera', toneNatural: 'Natural', toneHoney: 'Miel', toneDark: 'Oscura',
    fabricWord: 'Tela', patternWord: 'Dibujo', patternPlain: 'Liso', patternStripes: 'Rayas', patternChecks: 'Cuadros',
    measureWord: 'Medir', cutWord: 'Cortar', againWord: 'Otra vez', exactWord: 'Exacto', closeWord: 'Cerca', offWord: 'Lejos',
    assembleWord: 'Armar', nailWord: 'Clavo', testWord: 'Probar',
    steadyWord: 'Firme', slightWobble: 'Leve vaivén', bigWobble: 'Gran vaivén',
    fixIt: 'Arreglar', keepIt: 'Quedarse', remakeBest: 'Repetir la mejor', nextWord: 'Siguiente',
    skillNeed: 'Ask: Los ingenieros empiezan preguntando para quién es.',
    skillPlan: 'Plan: Un dibujo deja ver errores antes de cortar.',
    skillTest: 'Test: Probar muestra qué mejorar.',
    skillImprove: 'Improve: Los diseños de verdad mejoran en cada vuelta.',
    starWorks: '1 estrella · sirve', starSteady: '2 estrellas · firme', starBest: '3 estrellas · firme',
    restWord: 'Descansar', restWait: 'Descansa luego', rested: 'Descansaste.', goldTrim: 'Borde de oro',
    pathKid: 'El niño elige', pathDesign: 'Hay que diseñarla', pathBuild: 'Solo construir',
    helpMeasure: 'Ayúdame a medir', shopRequired: 'Hace falta el taller', shopTeacher: 'Profe',
    bedNeedTools: 'Hacen falta gafas, cinta, serrucho y martillo', bedNeedMats: 'Hacen falta 3 tablas y 3 lanas', boardWord: 'Tabla',
  },
  ar: {
    whatsNewBody: 'السرير يُصنع على منضدة الخشب. صمّمه أو ابنِه فقط، ثم استرح لملء الطاقة.',
    bunk: 'سرير',
    justBuild: 'ابنِ فقط', designIt: 'صمّمه', builtChip: 'تم البناء!',
    fitsBerty: 'يناسب بيرتي واحد، أقل من 6 ألواح',
    toneWord: 'خشب', toneNatural: 'طبيعي', toneHoney: 'عسلي', toneDark: 'داكن',
    fabricWord: 'قماش', patternWord: 'نقشة', patternPlain: 'سادة', patternStripes: 'خطوط', patternChecks: 'مربعات',
    measureWord: 'قس', cutWord: 'اقطع', againWord: 'من جديد', exactWord: 'مضبوط', closeWord: 'قريب', offWord: 'بعيد',
    assembleWord: 'ركّب', nailWord: 'مسمار', testWord: 'اختبر',
    steadyWord: 'ثابت', slightWobble: 'تمايل خفيف', bigWobble: 'تمايل كبير',
    fixIt: 'أصلح', keepIt: 'أبقه', remakeBest: 'أعد الأفضل', nextWord: 'التالي',
    skillNeed: 'Ask: المهندس يبدأ بالسؤال: لمن هذا؟',
    skillPlan: 'Plan: الرسمة تكشف الخطأ قبل القص.',
    skillTest: 'Test: الاختبار يُظهر ما يُحسَّن.',
    skillImprove: 'Improve: التصميم الحقيقي يتحسن في كل جولة.',
    starWorks: 'نجمة · يعمل', starSteady: 'نجمتان · ثابت', starBest: '3 نجوم · ثابت',
    restWord: 'استرح', restWait: 'استرح بعد قليل', rested: 'استرحت.', goldTrim: 'حافة ذهبية',
    pathKid: 'الطفل يختار', pathDesign: 'التصميم مطلوب', pathBuild: 'البناء فقط',
    helpMeasure: 'ساعدني في القياس', shopRequired: 'الورشة مطلوبة', shopTeacher: 'المعلم',
    bedNeedTools: 'يلزم النظارة والشريط والمنشار والمطرقة', bedNeedMats: 'يلزم 3 ألواح و3 صوف', boardWord: 'لوح',
  },
  'fa-AF': {
    whatsNewBody: 'تخت در میز نجاری ساخته می‌شود. آن را طرح کن یا فقط بساز، بعد استراحت کن تا انرژی پر شود.',
    bunk: 'تخت',
    justBuild: 'فقط بساز', designIt: 'طرح کن', builtChip: 'ساخته شد!',
    fitsBerty: 'برای ۱ برتی، کمتر از ۶ تخته',
    toneWord: 'چوب', toneNatural: 'طبیعی', toneHoney: 'عسلی', toneDark: 'تیره',
    fabricWord: 'پارچه', patternWord: 'نقش', patternPlain: 'ساده', patternStripes: 'راه راه', patternChecks: 'چهارخانه',
    measureWord: 'اندازه', cutWord: 'ببر', againWord: 'دوباره', exactWord: 'دقیق', closeWord: 'نزدیک', offWord: 'دور',
    assembleWord: 'ببند', nailWord: 'میخ', testWord: 'امتحان',
    steadyWord: 'پایدار', slightWobble: 'لرزش کم', bigWobble: 'لرزش زیاد',
    fixIt: 'درست کن', keepIt: 'نگه دار', remakeBest: 'بهترین را بساز', nextWord: 'بعدی',
    skillNeed: 'Ask: مهندس اول می‌پرسد این برای کیست.',
    skillPlan: 'Plan: طرح، غلط را پیش از بریدن نشان می‌دهد.',
    skillTest: 'Test: امتحان نشان می‌دهد چه بهتر شود.',
    skillImprove: 'Improve: طرح واقعی هر دور بهتر می‌شود.',
    starWorks: '۱ ستاره · کار می‌کند', starSteady: '۲ ستاره · پایدار', starBest: '۳ ستاره · پایدار',
    restWord: 'استراحت', restWait: 'کمی بعد استراحت کن', rested: 'استراحت کردی.', goldTrim: 'لبه طلایی',
    pathKid: 'کودک انتخاب می‌کند', pathDesign: 'طرح لازم است', pathBuild: 'فقط ساخت',
    helpMeasure: 'در اندازه کمک کن', shopRequired: 'کارگاه لازم است', shopTeacher: 'معلم',
    bedNeedTools: 'عینک، متر، اره و چکش لازم است', bedNeedMats: '۳ تخته و ۳ پشم لازم است', boardWord: 'تخته',
  },
  rw: {
    whatsNewBody: 'Ikiriri gikorerwa ku ntebe y\'ububaji. Kigire cyangwa ukubake gusa, hanyuma wuhuke ujye kuzuza imbaraga.',
    bunk: 'Ikiriri',
    justBuild: 'Kubaka gusa', designIt: 'Kigire', builtChip: 'Byarakozwe!',
    fitsBerty: 'Bimera Berty 1, munsi y\'amabaho 6',
    toneWord: 'Igiti', toneNatural: 'Kamere', toneHoney: 'Ubuki', toneDark: 'Cyijimye',
    fabricWord: 'Umupira', patternWord: 'Igishushanyo', patternPlain: 'Irisanzwe', patternStripes: 'Imirongo', patternChecks: 'Amakarito',
    measureWord: 'Pima', cutWord: 'Ca', againWord: 'Ongera', exactWord: 'Nicyo', closeWord: 'Hafi', offWord: 'Kure',
    assembleWord: 'Huza', nailWord: 'Umusumari', testWord: 'Gerageza',
    steadyWord: 'Gitagomwa', slightWobble: 'Kigara gato', bigWobble: 'Kigara cyane',
    fixIt: 'Kosora', keepIt: 'Kigumane', remakeBest: 'Ongera icyiza', nextWord: 'Komeza',
    skillNeed: 'Ask: Injeniyeri ibanza kubaza iki kigenewe nde.',
    skillPlan: 'Plan: Igishushanyo kigaragaza amakosa mbere yo guca.',
    skillTest: 'Test: Igerageza rigaragaza icyo wakosora.',
    skillImprove: 'Improve: Igitekerezo cy\'ukuri kiragenda neza buri nshuro.',
    starWorks: 'Inyenyeri 1 · kirakora', starSteady: 'Inyenyeri 2 · kitagomwa', starBest: 'Inyenyeri 3 · kitagomwa',
    restWord: 'Uhuke', restWait: 'Uhuke vuba', rested: 'Waruhutse.', goldTrim: 'Uruhero rw\'izahabu',
    pathKid: 'Umwana ahitamo', pathDesign: 'Igishushanyo gikenewe', pathBuild: 'Kubaka gusa',
    helpMeasure: 'Mfashe gupima', shopRequired: 'Ikigo gikenewe', shopTeacher: 'Umwarimu',
    bedNeedTools: 'Ukeneye amararo, umugozi, urubanza n\'inyundo', bedNeedMats: 'Ukeneye amabaho 3 n\'ubwoya 3', boardWord: 'Urubaho',
  },
  ti: {
    whatsNewBody: 'ዓራት ኣብ መደብ ዕንጨይቲ ይስራሕ። ንድፊ ግበሮ ወይ ጥራይ ሃንጾ፡ ድሕሪኡ ዕረፍ ጉልበት ንምምላእ።',
    bunk: 'ዓራት',
    justBuild: 'ጥራይ ሃንጽ', designIt: 'ንድፊ ግበር', builtChip: 'ተሰሪሑ!',
    fitsBerty: 'ን1 በርቲ፡ ትሕቲ 6 ጣውላ',
    toneWord: 'ዕንጨይቲ', toneNatural: 'ተፈጥሮ', toneHoney: 'መዓር', toneDark: 'ጸሊም',
    fabricWord: 'ጨርቂ', patternWord: 'ስእሊ', patternPlain: 'ለውጢ', patternStripes: 'መስመር', patternChecks: 'ምልክት',
    measureWord: 'ለክዕ', cutWord: 'ቑረጽ', againWord: 'ደጊም', exactWord: 'ልክዕ', closeWord: 'ቀረባ', offWord: 'ርሑቕ',
    assembleWord: 'ኣኪብ', nailWord: 'ምስማር', testWord: 'ፈትን',
    steadyWord: 'ውዕዉዕ', slightWobble: 'ንእሽቶ ምንቅጥቃጥ', bigWobble: 'ዓቢ ምንቅጥቃጥ',
    fixIt: 'ኣዕሪ', keepIt: 'ግደፎ', remakeBest: 'ነቲ ዝበለጸ ደጋግም', nextWord: 'ቀጻሊ',
    skillNeed: 'Ask: መሃንዲስ መጀመርታ ነዚ ንመን ከም ዝኸውን ይሕተት።',
    skillPlan: 'Plan: ንድፊ ቅድሚ ምቑራጽ ጌጋ የርኢ።',
    skillTest: 'Test: ምፍታን እንታይ ከም ዝመሓየሽ የርኢ።',
    skillImprove: 'Improve: ሓቀኛ ንድፊ ኣብ ነፍሲ ወከፍ ዙር ይመሓየሽ።',
    starWorks: '1 ኮኾብ · ይሰርሕ', starSteady: '2 ኮኾብ · ውዕዉዕ', starBest: '3 ኮኾብ · ውዕዉዕ',
    restWord: 'ዕረፍ', restWait: 'ድሕሪ ቁሩብ ዕረፍ', rested: 'ዓሪፍካ።', goldTrim: 'ወርቃዊ ወሰን',
    pathKid: 'ህጻን ይመርጽ', pathDesign: 'ንድፊ የድሊ', pathBuild: 'ምህናጽ ጥራይ',
    helpMeasure: 'ኣብ ምልካዕ ሓግዘኒ', shopRequired: 'ዕድጊ የድሊ', shopTeacher: 'መምህር',
    bedNeedTools: 'መነጽር፡ መለክዒ፡ መጋዝን መጥሓንን የድሊ', bedNeedMats: '3 ጣውላን 3 ጥምጢን የድሊ', boardWord: 'ጣውላ',
  },
}
for (const [lang, row] of Object.entries(BED)) Object.assign(EXTRA[lang], row)
const LESSONS = {
  en: {
    lessonLoop: 'A circuit is a loop. Break the loop and the light goes out.',
    lessonSwitch: 'A switch opens and closes the loop.',
    lessonCopper: 'Copper wire carries current. The Circuit Lens shows where the current stops at a break in the loop.',
  },
  uk: {
    lessonLoop: 'Коло — це петля. Розірви петлю — і світло згасне.',
    lessonSwitch: 'Вимикач відкриває і закриває петлю.',
    lessonCopper: 'Мідний дріт проводить струм. Лінза кола показує, де струм зупиняється на розриві петлі.',
  },
  ru: {
    lessonLoop: 'Цепь — это петля. Разорви петлю — и свет погаснет.',
    lessonSwitch: 'Выключатель открывает и закрывает петлю.',
    lessonCopper: 'Медная проволока проводит ток. Линза цепи показывает, где ток останавливается на разрыве петли.',
  },
  es: {
    lessonLoop: 'Un circuito es un lazo. Rompe el lazo y la luz se apaga.',
    lessonSwitch: 'Un interruptor abre y cierra el lazo.',
    lessonCopper: 'El cable de cobre lleva la corriente. La lente muestra dónde se detiene la corriente en un corte del lazo.',
  },
  ar: {
    lessonLoop: 'الدائرة حلقة. اقطع الحلقة فينطفئ الضوء.',
    lessonSwitch: 'المفتاح يفتح الحلقة ويغلقها.',
    lessonCopper: 'سلك النحاس ينقل التيار. عدسة الدائرة تُظهر أين يتوقف التيار عند قطع في الحلقة.',
  },
  'fa-AF': {
    lessonLoop: 'مدار یک حلقه است. حلقه را بشکن و نور خاموش می‌شود.',
    lessonSwitch: 'کلید حلقه را باز و بسته می‌کند.',
    lessonCopper: 'سیم مس جریان را می‌برد. عدسی مدار نشان می‌دهد جریان کجا در شکاف حلقه می‌ایستد.',
  },
  rw: {
    lessonLoop: 'Circuit ni uruziga. Vunagura uruziga n\'urumuri ruzima.',
    lessonSwitch: 'Ikinyuranyo gifungura no gufunga uruziga.',
    lessonCopper: 'Umugozi wa kope utwara umuriro. Ishusho y\'uruziga yerekana aho umuriro uhagarara ku buvune bw\'uruziga.',
  },
  ti: {
    lessonLoop: 'ሰርኪት ዓንኬል እዩ። ዓንኬል ስበር መብራህቲ ይጠፍእ።',
    lessonSwitch: 'መቐለሊ ዓንኬል ይኸፍትን ይዕጾን።',
    lessonCopper: 'ገመድ ናሕስ ኤሌክትሪክ ይወስድ። መነጽር ሰርኪት ኤሌክትሪክ ኣብ ምቁራጽ ዓንኬል ኣበይ ከም ዝቁረጽ የርኢ።',
  },
}
for (const [lang, row] of Object.entries(LESSONS)) if (EXTRA[lang]) Object.assign(EXTRA[lang], row)
for (const [lang, row] of Object.entries(packStrings())) if (EXTRA[lang]) Object.assign(EXTRA[lang], row)
const FARM_NEWS = {
  en: { whatsNewBody: 'A tap on a Bed, Oven, Box, Counter or Woodshop opens it. Crouch to build beside it, and a 3-star Bed keeps its design.' },
  uk: { whatsNewBody: 'Дотик до ліжка, печі, скрині, прилавка чи майстерні відкриває їх. Присядь, щоб будувати поруч, і ліжко на 3 зірки зберігає свій вигляд.' },
  ru: { whatsNewBody: 'Нажатие на кровать, печь, сундук, прилавок или мастерскую открывает их. Присядь, чтобы строить рядом, и кровать на 3 звезды хранит свой вид.' },
  es: { whatsNewBody: 'Un toque en la cama, el horno, la caja, el mostrador o el taller los abre. Agáchate para construir al lado, y una cama de 3 estrellas guarda su diseño.' },
  ar: { whatsNewBody: 'لمسة على السرير أو الفرن أو الصندوق أو المنضدة أو الورشة تفتحها. انحنِ لتبني بجانبها، وسرير 3 نجوم يحفظ تصميمه.' },
  'fa-AF': { whatsNewBody: 'زدن روی تخت، تنور، صندوق، پیشخوان یا کارگاه آن را باز می‌کند. خم شو تا کنارش بسازی، و تخت ۳ ستاره طرحش را نگه می‌دارد.' },
  rw: { whatsNewBody: 'Gukanda ikiriri, icyoto, agasanduku, counter cyangwa ikigo birafunguka. Icaramye ushyire iruhande, kandi ikiriri cy\'inyenyeri 3 kigumana isura.' },
  ti: { whatsNewBody: 'ዓራት፡ እቶን፡ ሳንዱቕ፡ መደብን ዕድጊን ምጥዋቕ ይኸፍቶም። ብድንጋር ኣብ ጥቓኦም ሃንጽ፡ ዓራት 3 ኮኾብ ድማ ንድፊኡ ይሕልው።' },
}
for (const [lang, row] of Object.entries(FARM_NEWS)) if (EXTRA[lang]) Object.assign(EXTRA[lang], row)
const BACKUPS = {
  en: {
    backups: 'Backups', classSnap: 'Class snapshot', backupName: 'Backup name', saveBackup: 'Save backup',
    restoreBackup: 'Restore', deleteBackup: 'Delete', confirmDeleteBackup: 'Delete this backup?',
    backupSaved: 'Backup saved', backupRestored: 'Backup restored', backupGone: 'Backup deleted',
    backupNeedName: 'Type a name first', backupEmpty: 'No backups yet',
    cloudLater: 'A cloud copy is a later step. These stay on this device.',
    backupBefore: 'Before restore - {time}', classSnapName: 'Class - {when}',
    restoreAsk: 'Restore this backup? The current world is saved first.',
    oldestDropped: 'Oldest backup removed',
  },
  uk: {
    backups: 'Копії', classSnap: 'Знімок класу', backupName: 'Назва копії', saveBackup: 'Зберегти копію',
    restoreBackup: 'Відновити', deleteBackup: 'Видалити', confirmDeleteBackup: 'Видалити цю копію?',
    backupSaved: 'Копію збережено', backupRestored: 'Копію відновлено', backupGone: 'Копію видалено',
    backupNeedName: 'Спершу напиши назву', backupEmpty: 'Копій ще немає',
    cloudLater: 'Хмарна копія — це пізніший крок. Ці лишаються на цьому пристрої.',
    backupBefore: 'Перед відновленням - {time}', classSnapName: 'Клас - {when}',
    restoreAsk: 'Відновити цю копію? Поточний світ спершу зберігається.',
    oldestDropped: 'Найстарішу копію знято',
  },
  ru: {
    backups: 'Копии', classSnap: 'Снимок класса', backupName: 'Имя копии', saveBackup: 'Сохранить копию',
    restoreBackup: 'Вернуть', deleteBackup: 'Удалить', confirmDeleteBackup: 'Удалить эту копию?',
    backupSaved: 'Копия сохранена', backupRestored: 'Копия возвращена', backupGone: 'Копия удалена',
    backupNeedName: 'Сначала напиши имя', backupEmpty: 'Копий пока нет',
    cloudLater: 'Облачная копия — это следующий шаг. Эти остаются на этом устройстве.',
    backupBefore: 'Перед возвратом - {time}', classSnapName: 'Класс - {when}',
    restoreAsk: 'Вернуть эту копию? Текущий мир сначала сохранится.',
    oldestDropped: 'Старая копия снята',
  },
  es: {
    backups: 'Copias', classSnap: 'Foto de la clase', backupName: 'Nombre de la copia', saveBackup: 'Guardar copia',
    restoreBackup: 'Restaurar', deleteBackup: 'Borrar', confirmDeleteBackup: '¿Borrar esta copia?',
    backupSaved: 'Copia guardada', backupRestored: 'Copia restaurada', backupGone: 'Copia borrada',
    backupNeedName: 'Escribe un nombre primero', backupEmpty: 'Aún no hay copias',
    cloudLater: 'Una copia en la nube es un paso posterior. Estas se quedan en este aparato.',
    backupBefore: 'Antes de restaurar - {time}', classSnapName: 'Clase - {when}',
    restoreAsk: '¿Restaurar esta copia? El mundo actual se guarda primero.',
    oldestDropped: 'Se quitó la copia más vieja',
  },
  ar: {
    backups: 'نسخ', classSnap: 'لقطة الصف', backupName: 'اسم النسخة', saveBackup: 'احفظ النسخة',
    restoreBackup: 'استعد', deleteBackup: 'احذف', confirmDeleteBackup: 'تحذف هذه النسخة؟',
    backupSaved: 'حُفظت النسخة', backupRestored: 'عادت النسخة', backupGone: 'حُذفت النسخة',
    backupNeedName: 'اكتب اسماً أولاً', backupEmpty: 'لا نسخ بعد',
    cloudLater: 'نسخة السحابة خطوة لاحقة. هذه تبقى على هذا الجهاز.',
    backupBefore: 'قبل الاستعادة - {time}', classSnapName: 'الصف - {when}',
    restoreAsk: 'تستعيد هذه النسخة؟ العالم الحالي يُحفظ أولاً.',
    oldestDropped: 'أُزيلت أقدم نسخة',
  },
  'fa-AF': {
    backups: 'نسخه‌ها', classSnap: 'عکس صنف', backupName: 'نام نسخه', saveBackup: 'نسخه را ذخیره کن',
    restoreBackup: 'برگردان', deleteBackup: 'حذف', confirmDeleteBackup: 'این نسخه حذف شود؟',
    backupSaved: 'نسخه ذخیره شد', backupRestored: 'نسخه برگشت', backupGone: 'نسخه حذف شد',
    backupNeedName: 'اول یک نام بنویس', backupEmpty: 'هنوز نسخه‌ای نیست',
    cloudLater: 'نسخه ابری یک گام بعدی است. این‌ها روی همین دستگاه می‌مانند.',
    backupBefore: 'پیش از برگرداندن - {time}', classSnapName: 'صنف - {when}',
    restoreAsk: 'این نسخه برگردد؟ جهان کنونی اول ذخیره می‌شود.',
    oldestDropped: 'کهنه‌ترین نسخه برداشته شد',
  },
  rw: {
    backups: 'Kopi', classSnap: 'Ifoto y\'ishuri', backupName: 'Izina rya kopi', saveBackup: 'Bika kopi',
    restoreBackup: 'Garura', deleteBackup: 'Siba', confirmDeleteBackup: 'Siba iyi kopi?',
    backupSaved: 'Kopi yabitswe', backupRestored: 'Kopi yagarutse', backupGone: 'Kopi yasibwe',
    backupNeedName: 'Banza wandike izina', backupEmpty: 'Nta kopi irahari',
    cloudLater: 'Kopi yo mu bicu ni intambwe izaza. Izi ziguma kuri iki gikoresho.',
    backupBefore: 'Mbere yo kugarura - {time}', classSnapName: 'Ishuri - {when}',
    restoreAsk: 'Garura iyi kopi? Isi iriho ibanzwa kubikwa.',
    oldestDropped: 'Kopi ya kera yakuweho',
  },
  ti: {
    backups: 'ቅዳሕ', classSnap: 'ስእሊ ክፍሊ', backupName: 'ስም ቅዳሕ', saveBackup: 'ቅዳሕ ዓቅብ',
    restoreBackup: 'መልስ', deleteBackup: 'ደምስስ', confirmDeleteBackup: 'ነዚ ቅዳሕ ትደምስስ?',
    backupSaved: 'ቅዳሕ ተዓቂቡ', backupRestored: 'ቅዳሕ ተመሊሱ', backupGone: 'ቅዳሕ ተደምሲሱ',
    backupNeedName: 'መጀመርታ ስም ጽሓፍ', backupEmpty: 'ቅዳሕ የለን',
    cloudLater: 'ናይ ደበና ቅዳሕ ድሒሩ እዩ። እዚኦም ኣብዚ መሳርሒ ይጸንሑ።',
    backupBefore: 'ቅድሚ ምምላስ - {time}', classSnapName: 'ክፍሊ - {when}',
    restoreAsk: 'ነዚ ቅዳሕ ትመልስ? እዚ ዓለም መጀመርታ ይዕቀብ።',
    oldestDropped: 'ዝኸበረ ቅዳሕ ተደምሲሱ',
  },
}
for (const [lang, row] of Object.entries(BACKUPS)) if (EXTRA[lang]) Object.assign(EXTRA[lang], row)
const MENU_UI = {
  en: { menuPlay: 'Play', menuMake: 'Make', menuStaff: 'teacher only' },
  uk: { menuPlay: 'Гра', menuMake: 'Зроби', menuStaff: 'лише вчитель' },
  ru: { menuPlay: 'Игра', menuMake: 'Сделай', menuStaff: 'только учитель' },
  es: { menuPlay: 'Jugar', menuMake: 'Crear', menuStaff: 'solo el profe' },
  ar: { menuPlay: 'العب', menuMake: 'اصنع', menuStaff: 'للمعلم فقط' },
  'fa-AF': { menuPlay: 'بازی', menuMake: 'بساز', menuStaff: 'فقط معلم' },
  rw: { menuPlay: 'Kina', menuMake: 'Kora', menuStaff: 'umwarimu gusa' },
  ti: { menuPlay: 'ጻወት', menuMake: 'ስራሕ', menuStaff: 'መምህር ጥራይ' },
}
for (const [lang, row] of Object.entries(MENU_UI)) if (EXTRA[lang]) Object.assign(EXTRA[lang], row)
const QOL = {
  en: { qolHalf: 'Half', qolOne: 'One', qolMove: 'Move', qolItem: 'Item' },
  uk: { qolHalf: 'Половина', qolOne: 'Один', qolMove: 'Перенести', qolItem: 'Річ' },
  ru: { qolHalf: 'Половина', qolOne: 'Один', qolMove: 'Перенести', qolItem: 'Вещь' },
  es: { qolHalf: 'Mitad', qolOne: 'Uno', qolMove: 'Mover', qolItem: 'Cosa' },
  ar: { qolHalf: 'نصف', qolOne: 'واحد', qolMove: 'انقل', qolItem: 'شيء' },
  'fa-AF': { qolHalf: 'نیم', qolOne: 'یکی', qolMove: 'ببر', qolItem: 'چیز' },
  rw: { qolHalf: 'Igice', qolOne: 'Rimwe', qolMove: 'Imura', qolItem: 'Ikintu' },
  ti: { qolHalf: 'ፍርቂ', qolOne: 'ሓደ', qolMove: 'ወስድ', qolItem: 'ኣቕሓ' },
}
for (const [lang, row] of Object.entries(QOL)) if (EXTRA[lang]) Object.assign(EXTRA[lang], row)
const CRAFT_UI = {
  en: { craftAll: 'All', craftCan: 'Can make', craftTools: 'Tools', craftBuild: 'Building', craftMachines: 'Machines', craftDecor: 'Decor', craftSearch: 'Search', craftNone: 'Nothing here' },
  uk: { craftAll: 'Усе', craftCan: 'Можна', craftTools: 'Знаряддя', craftBuild: 'Будова', craftMachines: 'Машини', craftDecor: 'Декор', craftSearch: 'Шукай', craftNone: 'Тут порожньо' },
  ru: { craftAll: 'Все', craftCan: 'Можно', craftTools: 'Инструменты', craftBuild: 'Стройка', craftMachines: 'Машины', craftDecor: 'Декор', craftSearch: 'Поиск', craftNone: 'Тут пусто' },
  es: { craftAll: 'Todo', craftCan: 'Puedes', craftTools: 'Útiles', craftBuild: 'Construcción', craftMachines: 'Máquinas', craftDecor: 'Decoro', craftSearch: 'Buscar', craftNone: 'Nada aquí' },
  ar: { craftAll: 'الكل', craftCan: 'تقدر', craftTools: 'أدوات', craftBuild: 'بناء', craftMachines: 'آلات', craftDecor: 'زينة', craftSearch: 'ابحث', craftNone: 'لا شيء' },
  'fa-AF': { craftAll: 'همه', craftCan: 'می‌توانی', craftTools: 'ابزار', craftBuild: 'ساختمان', craftMachines: 'ماشین', craftDecor: 'دکورا', craftSearch: 'بگرد', craftNone: 'این‌جا خالی است' },
  rw: { craftAll: 'Byose', craftCan: 'Ushobora', craftTools: 'Ibikoresho', craftBuild: 'Ubwubatsi', craftMachines: 'Imashini', craftDecor: 'Ubwiza', craftSearch: 'Shakisha', craftNone: 'Nta kintu' },
  ti: { craftAll: 'ኩሉ', craftCan: 'ትኽእል', craftTools: 'መሳርሒ', craftBuild: 'ህንጻ', craftMachines: 'ማሽን', craftDecor: 'ጌጣ', craftSearch: 'ድለ', craftNone: 'የለን' },
}
for (const [lang, row] of Object.entries(CRAFT_UI)) if (EXTRA[lang]) Object.assign(EXTRA[lang], row)
const AUTO_UI = {
  en: { autoSmoother: 'Auto: smoother', autoFull: 'Full detail', autoPlants: 'Fewer plants', autoView: 'Nearer view', autoLook: 'Softer graphics' },
  uk: { autoSmoother: 'Авто: плавніше', autoFull: 'Повна деталізація', autoPlants: 'Менше рослин', autoView: 'Ближчий огляд', autoLook: 'М’якша графіка' },
  ru: { autoSmoother: 'Авто: плавнее', autoFull: 'Полная детализация', autoPlants: 'Меньше растений', autoView: 'Ближе обзор', autoLook: 'Мягче графика' },
  es: { autoSmoother: 'Auto: más suave', autoFull: 'Todo el detalle', autoPlants: 'Menos plantas', autoView: 'Vista más cerca', autoLook: 'Gráficos suaves' },
  ar: { autoSmoother: 'تلقائي: أنعم', autoFull: 'كل التفاصيل', autoPlants: 'نباتات أقل', autoView: 'منظر أقرب', autoLook: 'رسوم ألطف' },
  'fa-AF': { autoSmoother: 'خودکار: نرم‌تر', autoFull: 'همه جزئیات', autoPlants: 'گیاه کمتر', autoView: 'دید نزدیک‌تر', autoLook: 'گرافیک نرم‌تر' },
  rw: { autoSmoother: 'Byikora: biroroshye', autoFull: 'Ibisobanuro byose', autoPlants: 'Ibimera bike', autoView: 'Kureba hafi', autoLook: 'Amashusho yoroshye' },
  ti: { autoSmoother: 'ብባዕሉ: ልስሉስ', autoFull: 'ምሉእ ዝርዝር', autoPlants: 'ውሑድ ተኽለ', autoView: 'ቀረባ ትርኢት', autoLook: 'ልስሉስ ስእሊ' },
}
for (const [lang, row] of Object.entries(AUTO_UI)) if (EXTRA[lang]) Object.assign(EXTRA[lang], row)
const USE_UI = {
  en: { useSit: 'Sit', useSleep: 'Sleep', useOpen: 'Open', useShut: 'Shut', useBake: 'Bake', useCraft: 'Craft', useBuild: 'Build', useSew: 'Sew', useFlip: 'Flip', usePress: 'Press', notTired: 'Not tired yet', chair: 'Chair', sewing: 'Sewing Machine' },
  uk: { useSit: 'Сісти', useSleep: 'Спати', useOpen: 'Відкрити', useShut: 'Зачинити', useBake: 'Пекти', useCraft: 'Крафт', useBuild: 'Будувати', useSew: 'Шити', useFlip: 'Клац', usePress: 'Тисни', notTired: 'Ще не хочеться спати', chair: 'Стілець', sewing: 'Швейна машина' },
  ru: { useSit: 'Сесть', useSleep: 'Спать', useOpen: 'Открыть', useShut: 'Закрыть', useBake: 'Печь', useCraft: 'Крафт', useBuild: 'Строить', useSew: 'Шить', useFlip: 'Щёлк', usePress: 'Жми', notTired: 'Ещё не хочется спать', chair: 'Стул', sewing: 'Швейная машина' },
  es: { useSit: 'Sentarse', useSleep: 'Dormir', useOpen: 'Abrir', useShut: 'Cerrar', useBake: 'Hornear', useCraft: 'Crear', useBuild: 'Construir', useSew: 'Coser', useFlip: 'Girar', usePress: 'Pulsar', notTired: 'Aún no tienes sueño', chair: 'Silla', sewing: 'Máquina de coser' },
  ar: { useSit: 'اجلس', useSleep: 'نم', useOpen: 'افتح', useShut: 'أغلق', useBake: 'اخبز', useCraft: 'اصنع', useBuild: 'ابنِ', useSew: 'خِط', useFlip: 'اقلب', usePress: 'اضغط', notTired: 'لست متعباً بعد', chair: 'كرسي', sewing: 'آلة خياطة' },
  'fa-AF': { useSit: 'بنشین', useSleep: 'بخواب', useOpen: 'باز کن', useShut: 'ببند', useBake: 'بپز', useCraft: 'بساز', useBuild: 'بنا کن', useSew: 'بدوز', useFlip: 'بچرخان', usePress: 'بفشار', notTired: 'هنوز خسته نیستی', chair: 'چوکی', sewing: 'ماشین خیاطی' },
  rw: { useSit: 'Icya', useSleep: 'Sinzira', useOpen: 'Fungura', useShut: 'Funga', useBake: 'Teka', useCraft: 'Kora', useBuild: 'Ubaka', useSew: 'Doda', useFlip: 'Hindura', usePress: 'Kanda', notTired: 'Nturananiwe', chair: 'Intebe', sewing: 'Imashini y\'udodo' },
  ti: { useSit: 'ቅመጥ', useSleep: 'ድቐስ', useOpen: 'ክፈት', useShut: 'ዕጾ', useBake: 'ጥዚ', useCraft: 'ግበር', useBuild: 'ሃንጽ', useSew: 'ስፈ', useFlip: 'ገልብጥ', usePress: 'ጠውቕ', notTired: 'ገና ኣይደከምካን', chair: 'መቐመጢ', sewing: 'ማሽን ስፌት' },
}
for (const [lang, row] of Object.entries(USE_UI)) if (EXTRA[lang]) Object.assign(EXTRA[lang], row)
const CLOCK_UI = {
  en: { clockDay: 'Day {n}', clockNight: 'Night in {n} min, sleep in a bed to skip.', clockMorning: 'Morning in {n} min. Sleep in a bed to skip.' },
  uk: { clockDay: 'День {n}', clockNight: 'Ніч за {n} хв, спи на ліжку щоб пропустити.', clockMorning: 'Ранок за {n} хв. Спи на ліжку щоб пропустити.' },
  ru: { clockDay: 'День {n}', clockNight: 'Ночь через {n} мин, спи на кровати чтобы пропустить.', clockMorning: 'Утро через {n} мин. Спи на кровати чтобы пропустить.' },
  es: { clockDay: 'Día {n}', clockNight: 'Noche en {n} min, duerme en una cama para saltar.', clockMorning: 'Mañana en {n} min. Duerme en una cama para saltar.' },
  ar: { clockDay: 'يوم {n}', clockNight: 'الليل بعد {n} د، نم في سرير لتتخطى.', clockMorning: 'الصباح بعد {n} د. نم في سرير لتتخطى.' },
  'fa-AF': { clockDay: 'روز {n}', clockNight: 'شب تا {n} دقیقه، در بستر بخواب تا بپری.', clockMorning: 'صبح تا {n} دقیقه. در بستر بخواب تا بپری.' },
  rw: { clockDay: 'Umunsi {n}', clockNight: 'Ijoro mu min {n}, sinzira ku buriri usimbe.', clockMorning: 'Gitondo mu min {n}. Sinzira ku buriri usimbe.' },
  ti: { clockDay: 'መዓልቲ {n}', clockNight: 'ለይቲ ኣብ {n} ደቒቕ፡ ኣብ ዓራት ድቐስ ንምዝላል።', clockMorning: 'ጥዋሕ ኣብ {n} ደቒቕ። ኣብ ዓራት ድቐስ ንምዝላል።' },
}
for (const [lang, row] of Object.entries(CLOCK_UI)) if (EXTRA[lang]) Object.assign(EXTRA[lang], row)
const HELD_UI = {
  en: { packFarm: 'Farm', packFlora: 'Plants', packTech: 'Tech', packDecor: 'Decor' },
  uk: { packFarm: 'Ферма', packFlora: 'Рослини', packTech: 'Техніка', packDecor: 'Декор' },
  ru: { packFarm: 'Ферма', packFlora: 'Растения', packTech: 'Техника', packDecor: 'Декор' },
  es: { packFarm: 'Granja', packFlora: 'Plantas', packTech: 'Tecnología', packDecor: 'Decoro' },
  ar: { packFarm: 'مزرعة', packFlora: 'نبات', packTech: 'تقنية', packDecor: 'زينة' },
  'fa-AF': { packFarm: 'کشت', packFlora: 'گیاه', packTech: 'فن', packDecor: 'دکورا' },
  rw: { packFarm: 'Isambu', packFlora: 'Ibimera', packTech: 'Ikoranabuhanga', packDecor: 'Ubwiza' },
  ti: { packFarm: 'እርሻ', packFlora: 'ተኽሊ', packTech: 'ቴክ', packDecor: 'ጌጣ' },
}
for (const [lang, row] of Object.entries(HELD_UI)) if (EXTRA[lang]) Object.assign(EXTRA[lang], row)

// G2-14: machine zones (Input -> Process -> Output -> Feedback)
const ZONE_UI = {
  en: { zoneIn: 'Input', zoneProc: 'Process', zoneOut: 'Output', zoneInfo: 'Feedback', fbAdd: 'Add parts', fbWorking: 'Working... {n}%', fbDone: 'Done! Take it', fbFull: 'Output full', fbMissing: 'Missing: {list}', fbReady: 'Ready to make' },
  uk: { zoneIn: 'Вхід', zoneProc: 'Процес', zoneOut: 'Вихід', zoneInfo: 'Відгук', fbAdd: 'Додай частини', fbWorking: 'Працює... {n}%', fbDone: 'Готово! Бери', fbFull: 'Вихід повний', fbMissing: 'Бракує: {list}', fbReady: 'Можна робити' },
  ru: { zoneIn: 'Вход', zoneProc: 'Процесс', zoneOut: 'Выход', zoneInfo: 'Отклик', fbAdd: 'Добавь детали', fbWorking: 'Работает... {n}%', fbDone: 'Готово! Бери', fbFull: 'Выход полон', fbMissing: 'Не хватает: {list}', fbReady: 'Можно делать' },
  es: { zoneIn: 'Entrada', zoneProc: 'Proceso', zoneOut: 'Salida', zoneInfo: 'Aviso', fbAdd: 'Pon piezas', fbWorking: 'Trabajando... {n}%', fbDone: '¡Listo! Tómalo', fbFull: 'Salida llena', fbMissing: 'Falta: {list}', fbReady: 'Listo para hacer' },
  ar: { zoneIn: 'مدخل', zoneProc: 'عملية', zoneOut: 'مخرج', zoneInfo: 'إفادة', fbAdd: 'أضف قطعاً', fbWorking: 'يعمل... {n}%', fbDone: 'تم! خذه', fbFull: 'المخرج ممتلئ', fbMissing: 'ينقص: {list}', fbReady: 'جاهز للصنع' },
  'fa-AF': { zoneIn: 'ورودی', zoneProc: 'پروسه', zoneOut: 'خروجی', zoneInfo: 'بازخورد', fbAdd: 'قطعه بگذار', fbWorking: 'کار می‌کند... {n}%', fbDone: 'تمام! بگیر', fbFull: 'خروجی پر است', fbMissing: 'کم است: {list}', fbReady: 'آمادهٔ ساختن' },
  rw: { zoneIn: 'Injiza', zoneProc: 'Igikorwa', zoneOut: 'Ibisohoka', zoneInfo: 'Igisubizo', fbAdd: 'Shyiramo ibice', fbWorking: 'Birakora... {n}%', fbDone: 'Byarangiye! Fata', fbFull: 'Ibisohoka byuzuye', fbMissing: 'Habura: {list}', fbReady: 'Biteguye gukorwa' },
  ti: { zoneIn: 'ኣእቱ', zoneProc: 'መስርሕ', zoneOut: 'ውጽኢት', zoneInfo: 'ርእይቶ', fbAdd: 'ክፋላት ወስኽ', fbWorking: 'ይሰርሕ... {n}%', fbDone: 'ተዛዚሙ! ውሰድ', fbFull: 'ውጽኢት መሊኡ', fbMissing: 'ይጎድል: {list}', fbReady: 'ንምስራሕ ድሉው' },
}
for (const [lang, row] of Object.entries(ZONE_UI)) if (EXTRA[lang]) Object.assign(EXTRA[lang], row)

// A1-63 conveyor. The build checker reads EXTRA, not a later runtime assign.
const BELT_UI = {
  en: {
    conveyor: 'Conveyor',
    beltHint: 'Belt the Smelter to the Box',
    beltIn: 'In: Conveyor',
    beltOut: 'Out: Conveyor',
    beltMove: 'Input {inn} -> 4/sec -> Output {outn}',
    beltFull: 'Full',
    beltPaused: 'Paused',
    tooManyMachines: 'Too many machines here',
  },
  uk: {
    conveyor: 'Конвеєр',
    beltHint: 'Стрічка: Плавильня до Скриня',
    beltIn: 'Вхід: Конвеєр',
    beltOut: 'Вихід: Конвеєр',
    beltMove: 'Вхід {inn} -> 4/сек -> Вихід {outn}',
    beltFull: 'Повно',
    beltPaused: 'Пауза',
    tooManyMachines: 'Тут забагато машин',
  },
  ru: {
    conveyor: 'Конвейер',
    beltHint: 'Лента: Плавильня до Сундук',
    beltIn: 'Вход: Конвейер',
    beltOut: 'Выход: Конвейер',
    beltMove: 'Вход {inn} -> 4/сек -> Выход {outn}',
    beltFull: 'Полно',
    beltPaused: 'Пауза',
    tooManyMachines: 'Слишком много машин',
  },
  es: {
    conveyor: 'Transportador',
    beltHint: 'Cinta de la Fundidora a la Caja',
    beltIn: 'Entra: Transportador',
    beltOut: 'Sale: Transportador',
    beltMove: 'Entrada {inn} -> 4/s -> Salida {outn}',
    beltFull: 'Lleno',
    beltPaused: 'Pausa',
    tooManyMachines: 'Demasiadas máquinas aquí',
  },
  ar: {
    conveyor: 'سير',
    beltHint: 'صِل مصهر إلى صندوق',
    beltIn: 'داخل: سير',
    beltOut: 'خارج: سير',
    beltMove: 'مدخل {inn} -> 4/ث -> مخرج {outn}',
    beltFull: 'ممتلئ',
    beltPaused: 'متوقف',
    tooManyMachines: 'آلات كثيرة هنا',
  },
  'fa-AF': {
    conveyor: 'نوار',
    beltHint: 'کوره گداز را به صندوق برسان',
    beltIn: 'ورود: نوار',
    beltOut: 'خروج: نوار',
    beltMove: 'ورود {inn} -> ۴/ث -> خروج {outn}',
    beltFull: 'پر',
    beltPaused: 'مکث',
    tooManyMachines: 'اینجا ماشین زیاد است',
  },
  rw: {
    conveyor: 'Umugozi',
    beltHint: 'Huza Isaturire na Agasanduku',
    beltIn: 'Injira: Umugozi',
    beltOut: 'Sohoka: Umugozi',
    beltMove: 'Iwinjira {inn} -> 4/seg -> Ibisohoka {outn}',
    beltFull: 'Byuzuye',
    beltPaused: 'Hagarara',
    tooManyMachines: 'Imashini nyinshi hano',
  },
  ti: {
    conveyor: 'መተሓላለፊ',
    beltHint: 'መፍለሒ ናብ ሳንዱቅ',
    beltIn: 'እታይ: መተሓላለፊ',
    beltOut: 'ወጻኢ: መተሓላለፊ',
    beltMove: 'እታይ {inn} -> 4/ሰ -> ወጻኢ {outn}',
    beltFull: 'መሊኡ',
    beltPaused: 'ደው',
    tooManyMachines: 'ማሽን ብዙሕ ኣሎ',
  },
}
for (const [lang, row] of Object.entries(BELT_UI)) if (EXTRA[lang]) Object.assign(EXTRA[lang], row)

const CALM = {
  en: { pause: 'Pause', showEverything: 'Show everything', chipNew: 'New', pathBench: 'Make a Workbench', fillParts: 'Fill', needLine: '{n} {item} needed', goalNeed: '{item}: needs {n} {need}. You have {have}.', niceLog: 'Nice! Planks', niceMake: 'Nice! Made', nicePlace: 'Nice! Placed', niceWall: 'Nice! Wall' },
  uk: { pause: 'Пауза', showEverything: 'Показати все', chipNew: 'Нове', pathBench: 'Зроби верстак', fillParts: 'Наповни', needLine: 'треба {n} {item}', goalNeed: '{item}: треба {n} {need}. У тебе {have}.', niceLog: 'Гарно! Дошки', niceMake: 'Гарно! Зробив', nicePlace: 'Гарно! Поставив', niceWall: 'Гарно! Стіна' },
  ru: { pause: 'Пауза', showEverything: 'Показать всё', chipNew: 'Новое', pathBench: 'Сделай верстак', fillParts: 'Заполни', needLine: 'нужно {n} {item}', goalNeed: '{item}: нужно {n} {need}. У тебя {have}.', niceLog: 'Здорово! Доски', niceMake: 'Здорово! Сделал', nicePlace: 'Здорово! Поставил', niceWall: 'Здорово! Стена' },
  es: { pause: 'Pausa', showEverything: 'Mostrar todo', chipNew: 'Nuevo', pathBench: 'Haz un banco', fillParts: 'Llenar', needLine: 'faltan {n} {item}', goalNeed: '{item}: necesita {n} {need}. Tienes {have}.', niceLog: '¡Bien! Tablas', niceMake: '¡Bien! Hecho', nicePlace: '¡Bien! Puesto', niceWall: '¡Bien! Muro' },
  ar: { pause: 'إيقاف', showEverything: 'أظهر كل شيء', chipNew: 'جديد', pathBench: 'اصنع منضدة', fillParts: 'املأ', needLine: 'يلزم {n} {item}', goalNeed: '{item}: يلزم {n} {need}. معك {have}.', niceLog: 'أحسنت! ألواح', niceMake: 'أحسنت! صنع', nicePlace: 'أحسنت! وضع', niceWall: 'أحسنت! جدار' },
  'fa-AF': { pause: 'مکث', showEverything: 'همه را نشان بده', chipNew: 'نو', pathBench: 'میز کار بساز', fillParts: 'پر کن', needLine: '{n} {item} لازم است', goalNeed: '{item}: {n} {need} لازم است. تو {have} داری.', niceLog: 'آفرین! تخته', niceMake: 'آفرین! ساخت', nicePlace: 'آفرین! گذاشت', niceWall: 'آفرین! دیوار' },
  rw: { pause: 'Hagarara', showEverything: 'Erekana byose', chipNew: 'Gishya', pathBench: 'Kora ameza', fillParts: 'Uzuza', needLine: 'bikenewe {n} {item}', goalNeed: '{item}: bikenewe {n} {need}. Ufite {have}.', niceLog: 'Ni byiza! Imbaho', niceMake: 'Ni byiza! Byakozwe', nicePlace: 'Ni byiza! Byashyizwe', niceWall: 'Ni byiza! Urukuta' },
  ti: { pause: 'ደው', showEverything: 'ኩሉ ኣርኢ', chipNew: 'ሓድሽ', pathBench: 'ሰደቓ ግበር', fillParts: 'መልእ', needLine: '{n} {item} የድሊ', goalNeed: '{item}: {n} {need} የድሊ። ኣለካ {have}።', niceLog: 'ጽቡቕ! ጣውላ', niceMake: 'ጽቡቕ! ተገይሩ', nicePlace: 'ጽቡቕ! ተቐሚጡ', niceWall: 'ጽቡቕ! መንደቕ' },
}
for (const [lang, row] of Object.entries(CALM)) if (EXTRA[lang]) Object.assign(EXTRA[lang], row)

const KIDWALK = {
  en: {
    whatsNewBody: 'Chop right where your finger is, and your Bot\'s wall stays after a reload.',
    walkCloser: 'Walk closer',
  },
  es: {
    whatsNewBody: 'Corta justo donde está tu dedo, y el muro de tu Bot sigue ahí al recargar.',
    walkCloser: 'Acércate',
  },
  uk: {
    whatsNewBody: 'Рубай там, де палець, і стіна Бота лишається після перезавантаження.',
    walkCloser: 'Підійди ближче',
  },
  ru: {
    whatsNewBody: 'Руби там, где палец, а стена Бота остаётся после перезагрузки.',
    walkCloser: 'Подойди ближе',
  },
  ar: {
    whatsNewBody: 'اقطع حيث يوجد إصبعك تمامًا، ويبقى جدار الروبوت بعد إعادة التحميل.',
    walkCloser: 'اقترب',
  },
  'fa-AF': {
    whatsNewBody: 'همان‌جا که انگشتت است ببر، و دیوار بوت بعد از بار دوباره می‌ماند.',
    walkCloser: 'نزدیک‌تر بیا',
  },
  rw: {
    whatsNewBody: 'Kata aho urutoki rwawe ruri, kandi urukuta rwa Bot ruguma nyuma yo kongera gutangiza.',
    walkCloser: 'Egerekera hafi',
  },
  ti: {
    whatsNewBody: 'ኣብ ዘለዎ ኣጻብዕቲኻ ቍረጽ፡ መንደቕ ቦት ድማ ድሕሪ ምጽዓን ይጸንሕ።',
    walkCloser: 'ቀረብ',
  },
}
const KEYBOARD = {
  en: { whatsNewBody: 'Play with just a keyboard: Tab, Enter and Esc work in every menu.' },
  es: { whatsNewBody: 'Juega solo con el teclado: Tab, Enter y Esc funcionan en todos los menús.' },
  ar: { whatsNewBody: 'العب بلوحة المفاتيح فقط: تعمل Tab وEnter وEsc في كل القوائم.' },
  ru: { whatsNewBody: 'Играй только с клавиатурой: Tab, Enter и Esc работают в каждом меню.' },
  uk: { whatsNewBody: 'Грай лише з клавіатури: Tab, Enter і Esc працюють у кожному меню.' },
  'fa-AF': { whatsNewBody: 'فقط با کیبورد بازی کن: Tab و Enter و Esc در هر فهرست کار می‌کنند.' },
  rw: { whatsNewBody: 'Kina ukoresheje clavier gusa: Tab, Enter na Esc bikora muri menu zose.' },
  ti: { whatsNewBody: 'ብኪቦርድ ጥራይ ጻወት፡ Tab፡ Enterን Escን ኣብ ኩሉ ዝርዝር ይሰርሑ።' },
}
for (const [lang, row] of Object.entries(KEYBOARD)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}
for (const [lang, row] of Object.entries(KIDWALK)) if (EXTRA[lang]) Object.assign(EXTRA[lang], row)

const SHOW = {
  en: { whatsNewBody: 'Arrow keys work in the Menu, and you can always see what is picked.' },
  es: { whatsNewBody: 'Las flechas funcionan en el Menú, y siempre ves lo que está elegido.' },
  uk: { whatsNewBody: 'Стрілки працюють у Меню, і завжди видно, що вибрано.' },
  ru: { whatsNewBody: 'Стрелки работают в Меню, и всегда видно, что выбрано.' },
  ar: { whatsNewBody: 'مفاتيح الأسهم تعمل في القائمة، ويمكنك دائماً رؤية ما تم اختياره.' },
  'fa-AF': { whatsNewBody: 'کلیدهای جهت در فهرست کار می‌کنند، و همیشه می‌بینی چه چیزی برگزیده شده.' },
  rw: { whatsNewBody: 'Imyambi ikora muri Menyu, kandi ubona buri gihe icyatoranyijwe.' },
  ti: { whatsNewBody: 'ናይ ምልክት መጠወቒታት ኣብ ዝርዝር ይሰርሑ፡ ዝተመርጸ ኩሉ ግዜ ትርእዮ።' },
}
for (const [lang, row] of Object.entries(SHOW)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}
const CHOPWOOD = {
  en: { whatsNewBody: 'Chopping trees gives you wood again.', moveCloser: 'Move closer', gotWood: '+1 Log' },
  es: { whatsNewBody: 'Talar árboles vuelve a darte madera.', moveCloser: 'Acércate', gotWood: '+1 Tronco' },
  uk: { whatsNewBody: 'Рубання дерев знову дає деревину.', moveCloser: 'Підійди ближче', gotWood: '+1 Колода' },
  ru: { whatsNewBody: 'Рубка деревьев снова даёт древесину.', moveCloser: 'Подойди ближе', gotWood: '+1 Бревно' },
  ar: { whatsNewBody: 'قطع الأشجار يعطيك خشباً من جديد.', moveCloser: 'اقترب', gotWood: '+1 جذع' },
  'fa-AF': { whatsNewBody: 'بریدن درخت دوباره چوب می‌دهد.', moveCloser: 'نزدیک‌تر بیا', gotWood: '+1 کنده' },
  rw: { whatsNewBody: 'Gutema ibiti bisubiza ibiti.', moveCloser: 'Egerekera hafi', gotWood: '+1 Igiti' },
  ti: { whatsNewBody: 'ምቍራጽ ዕንጨይቲ እንደገና ዕንጨይቲ ይህብ።', moveCloser: 'ቀረብ', gotWood: '+1 ግንዲ' },
}
for (const [lang, row] of Object.entries(CHOPWOOD)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}
const READ = {
  en: { whatsNewBody: 'Menus are easier to read.', tryThis: 'Try', timesMax: 'Make all' },
  es: { whatsNewBody: 'Los menús se leen mejor.', tryThis: 'Prueba', timesMax: 'Haz todo' },
  uk: { whatsNewBody: 'Меню легше читати.', tryThis: 'Спробуй', timesMax: 'Зроби все' },
  ru: { whatsNewBody: 'Меню легче читать.', tryThis: 'Попробуй', timesMax: 'Сделай всё' },
  ar: { whatsNewBody: 'القوائم أسهل للقراءة.', tryThis: 'جرّب', timesMax: 'اصنع الكل' },
  'fa-AF': { whatsNewBody: 'فهرست‌ها خواناتر شدند.', tryThis: 'بیازما', timesMax: 'همه را بساز' },
  rw: { whatsNewBody: 'Menu zisoma neza.', tryThis: 'Gerageza', timesMax: 'Kora byose' },
  ti: { whatsNewBody: 'ዝርዝራት ብቐሊሉ ይንበቡ።', tryThis: 'ፈትን', timesMax: 'ኩሉ ግበር' },
}
for (const [lang, row] of Object.entries(READ)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}
for (const [lang, row] of Object.entries(SHOW)) {
  if (EXTRA[lang]) EXTRA[lang].whatsNewBody = row.whatsNewBody
}
const FIRST = {
  en: { whatsNewBody: 'Make works on the first click, Esc closes just the panel, and new worlds start fresh.' },
  es: { whatsNewBody: 'Hacer funciona al primer clic, Esc cierra solo el panel, y los mundos nuevos empiezan de cero.' },
  ar: { whatsNewBody: 'زر اصنع يعمل من أول نقرة، وEsc يغلق اللوحة فقط، والعوالم الجديدة تبدأ من جديد.' },
  ru: { whatsNewBody: 'Сделать работает с первого нажатия, Esc закрывает только панель, и новые миры начинаются заново.' },
  uk: { whatsNewBody: 'Зробити працює з першого натискання, Esc закриває лише панель, і нові світи починаються спочатку.' },
  'fa-AF': { whatsNewBody: 'بساز از همان کلیک اول کار می‌کند، Esc فقط تخته را می‌بندد، و جهان‌های تازه از نو شروع می‌شوند.' },
  rw: { whatsNewBody: 'Kora ikora ku gukanda kwa mbere, Esc ifunga gusa ikadiri, kandi isi nshya itangira bushya.' },
  ti: { whatsNewBody: 'ግበር ካብ ቀዳማይ ጠውቃይ ይሰርሕ፡ Esc ነቲ ሰሌዳ ጥራይ ይዕጾ፡ ሓደሽቲ ዓለማት ድማ ካብ ጀማሪ ይጅምሩ።' },
}
for (const [lang, row] of Object.entries(FIRST)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}
const BAGKEY = {
  en: { whatsNewBody: 'Press E to open your Bag.' },
  es: { whatsNewBody: 'Pulsa E para abrir tu Bolsa.' },
  uk: { whatsNewBody: 'Натисни E, щоб відкрити Сумку.' },
  ru: { whatsNewBody: 'Нажми E, чтобы открыть Сумку.' },
  ar: { whatsNewBody: 'اضغط E لفتح حقيبتك.' },
  'fa-AF': { whatsNewBody: 'E را بزن تا بکس باز شود.' },
  rw: { whatsNewBody: 'Kanda E ufungure agasaho.' },
  ti: { whatsNewBody: 'E ጠውቕ ቦርሳኻ ንምኽፋት።' },
}
for (const [lang, row] of Object.entries(BAGKEY)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}
const PHONE = {
  en: { whatsNewBody: 'Phone top bar fits, Crafting is in Survival, and a tree waits by spawn.' },
  es: { whatsNewBody: 'La barra de arriba cabe en el teléfono, Fabricar está en Supervivencia, y un árbol espera junto al inicio.' },
  ar: { whatsNewBody: 'الشريط العلوي يناسب الهاتف، والصنع موجود في النجاة، وشجرة تنتظر عند البداية.' },
  ru: { whatsNewBody: 'Верхняя полоса помещается на телефоне, Крафт есть в Выживании, и дерево ждёт у старта.' },
  uk: { whatsNewBody: 'Верхня смуга вміщується на телефоні, Крафт є в Виживанні, і дерево чекає біля старту.' },
  'fa-AF': { whatsNewBody: 'تختهٔ بالا در موبایل می‌گنجد، ساختن در حالت بقا است، و یک درخت کنار آغاز منتظر است.' },
  rw: { whatsNewBody: 'Umurongo wo hejuru winjira muri telefoni, Kora iri muri Kubaho, kandi igiti kirategereje hafi y\'intangiriro.' },
  ti: { whatsNewBody: 'ላዕለዋይ መስመር ኣብ ተሌፎን ይኣትዉ፡ ምስራሕ ኣብ ሕያውነት ኣሎ፡ ዕንጨይቲ ድማ ኣብ ጥቓ መጀመርታ ይጽበ።' },
}
for (const [lang, row] of Object.entries(PHONE)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}
const GOAL = {
  en: {
    whatsNewBody: '2.5.268 — Recipe words fit, and phone slots are easier to tap.',
    goalPlanks: 'Get Planks · {have}/{need}',
    goalBenchReady: 'You have {n} Planks — tap Make',
  },
  es: {
    whatsNewBody: '2.5.268 — Las palabras de las recetas caben y las casillas del teléfono son más fáciles de tocar.',
    goalPlanks: 'Consigue Tablas · {have}/{need}',
    goalBenchReady: 'Tienes {n} Tablas — toca Hacer',
  },
  uk: {
    whatsNewBody: '2.5.268 — Слова рецептів вміщуються, а слоти на телефоні легше натискати.',
    goalPlanks: 'Візьми Дошки · {have}/{need}',
    goalBenchReady: 'У тебе {n} Дошки — торкнись Зробити',
  },
  ru: {
    whatsNewBody: '2.5.268 — Слова рецептов помещаются, а слоты на телефоне легче нажимать.',
    goalPlanks: 'Возьми Доски · {have}/{need}',
    goalBenchReady: 'У тебя {n} Доски — нажми Сделать',
  },
  ar: {
    whatsNewBody: '2.5.268 — كلمات الوصفات تناسب مكانها، وفتحات الهاتف أسهل للنقر.',
    goalPlanks: 'اجمع ألواح · {have}/{need}',
    goalBenchReady: 'معك {n} ألواح — المس اصنع',
  },
  'fa-AF': {
    whatsNewBody: '2.5.268 — کلمات دستورها جا می‌شوند و خانه‌های تلفن آسان‌تر زده می‌شوند.',
    goalPlanks: 'تخته بگیر · {have}/{need}',
    goalBenchReady: 'تو {n} تخته داری — بساز را بزن',
  },
  rw: {
    whatsNewBody: '2.5.268 — Amagambo y\'ibikoresho arakwira, kandi udusanduku twa telefoni turoroshye gukanda.',
    goalPlanks: 'Shaka Imbaho · {have}/{need}',
    goalBenchReady: 'Ufite Imbaho {n} — kanda Kora',
  },
  ti: {
    whatsNewBody: '2.5.268 — ቃላት ኣሰራርሓ ይኣክሉ፣ ቦታታት ተሌፎን ድማ ንምንካይ ቀሊል እዮም።',
    goalPlanks: 'ጣውላ ረክብ · {have}/{need}',
    goalBenchReady: '{n} ጣውላ ኣለካ — ግበር ጠውቕ',
  },
}
for (const [lang, row] of Object.entries(GOAL)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}
const FIT269 = {
  en: { whatsNewBody: '2.5.270 — Item pictures are bigger, so Planks, Logs and Berries are easy to tell apart. Pop-ups stay out of the way, and Creative fits on phones.' },
  uk: { whatsNewBody: '2.5.270 — Картинки предметів більші, тож Дошки, Колоду і Ягоди легко розрізнити. Спливаючі підказки не заважають, а Творчий режим вміщається на телефоні.' },
  ru: { whatsNewBody: '2.5.270 — Картинки предметов больше, поэтому Доски, Бревно и Ягоды легко различить. Подсказки не мешают, а Творческий режим помещается на телефоне.' },
  es: { whatsNewBody: '2.5.270 — Las imágenes de los objetos son más grandes, así que Tablones, Tronco y Bayas se distinguen fácil. Los avisos ya no estorban y el modo Creativo cabe en el teléfono.' },
  ar: { whatsNewBody: '2.5.270 — صور الأغراض أكبر، لذا يسهل تمييز الألواح والحطب والتوت. النوافذ المنبثقة لا تعترض طريقك، ووضع الإبداع يناسب الهاتف.' },
  'fa-AF': { whatsNewBody: '2.5.270 — عکس‌های اشیا بزرگ‌تر شده‌اند، پس تخته‌ها، کنده و توت را آسان تشخیص می‌دهی. پیام‌ها دیگر سر راه نیستند و حالت خلاق روی تلفن جا می‌شود.' },
  rw: { whatsNewBody: '2.5.270 — Amashusho y\'ibintu yakuze, bityo Imbaho, Igiti n\'Imbuto biroroshye gutandukanya. Ubutumwa ntibukibangamira, kandi Creative ikwira kuri telefone.' },
  ti: { whatsNewBody: '2.5.270 — ስእልታት ኣቑሑት ዓብዮም እዮም፣ ስለዚ ጽላት፣ ዕጸን ፍረታትን ብቐሊሉ ትፈልዮም። መልእኽትታት ኣይዓግቱን፣ Creative ድማ ኣብ ተሌፎን ይኣቱ።' },
}
for (const [lang, row] of Object.entries(FIT269)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}
const FIT271 = {
  en: { whatsNewBody: '2.5.271 — Tips fade fast, stay off your hotbar, and talk touch on phones.' },
  uk: { whatsNewBody: '2.5.271 — Підказки швидко зникають, не закривають панель предметів і говорять мовою дотиків на телефоні.' },
  ru: { whatsNewBody: '2.5.271 — Подсказки быстро исчезают, не закрывают панель предметов и на телефоне говорят про касания.' },
  es: { whatsNewBody: '2.5.271 — Los avisos se van rápido, no tapan tu barra y en el teléfono hablan de toques.' },
  ar: { whatsNewBody: '2.5.271 — التلميحات تختفي بسرعة، ولا تغطي شريط الأدوات، وتتحدث باللمس على الهاتف.' },
  'fa-AF': { whatsNewBody: '2.5.271 — راهنماها زود محو می‌شوند، روی نوار ابزار نمی‌افتند و در تلفن به زبان لمس حرف می‌زنند.' },
  rw: { whatsNewBody: '2.5.271 — Inama zihita zigenda vuba, ntizipfuka umurongo w\'ibikoresho, kandi kuri telefone zivuga gukoraho.' },
  ti: { whatsNewBody: '2.5.271 — ምኽርታት ቀልጢፎም ይጠፍኡ፣ ንመስርዕ ኣቑሑትካ ኣይሽፍኑን፣ ኣብ ተሌፎን ድማ ብምንካእ ይዛረቡ።' },
}
for (const [lang, row] of Object.entries(FIT271)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}
// 2.5.271: phones say touch words. Last write wins over the keyboard line.
const TOUCH271 = {
  en: { keysLineTouch: 'Stick to walk · Hold to break · Tap to place', tapToPlay: 'Tap to play' },
  uk: { keysLineTouch: 'Стік щоб іти · Тримай щоб ламати · Торкнись щоб ставити', tapToPlay: 'Торкнись, щоб грати' },
  ru: { keysLineTouch: 'Стик чтобы идти · Держи чтобы ломать · Коснись чтобы ставить', tapToPlay: 'Коснись, чтобы играть' },
  es: { keysLineTouch: 'Palito para caminar · Mantén para romper · Toca para poner', tapToPlay: 'Toca para jugar' },
  ar: { keysLineTouch: 'العصا للمشي · اضغط مطولاً للكسر · المس للوضع', tapToPlay: 'المس للعب' },
  'fa-AF': { keysLineTouch: 'اهرم برای راه رفتن · نگه دار برای شکستن · لمس کن برای گذاشتن', tapToPlay: 'برای بازی لمس کن' },
  rw: { keysLineTouch: 'Agastike kugenda · Fata uvunagure · Kanda ushyire', tapToPlay: 'Kanda-ho ukine' },
  ti: { keysLineTouch: 'ስቲክ ንምኻድ · ሓዝ ንምስባር · ጠውቕ ንምቕማጥ', tapToPlay: 'ኣጻብዕቲ ጠውቕ ንምጻወት' },
}
for (const [lang, row] of Object.entries(TOUCH271)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}
const FIT272 = {
  en: { whatsNewBody: '2.5.272 — Pop-ups stay off your Bag, Pause steps aside, and every block name fits.' },
  uk: { whatsNewBody: '2.5.272 — Спливні підказки не закривають Сумку, Пауза не заважає, і кожна назва блоку вміщується.' },
  ru: { whatsNewBody: '2.5.272 — Всплывающие подсказки не закрывают Сумку, Пауза не мешает, и каждое название блока помещается.' },
  es: { whatsNewBody: '2.5.272 — Los avisos ya no tapan tu Bolsa, Pausa se aparta y cada nombre de bloque cabe.' },
  ar: { whatsNewBody: '2.5.272 — النوافذ المنبثقة لا تغطي الحقيبة، وزر الإيقاف يبتعد، وكل اسم مكعب يظهر كاملاً.' },
  'fa-AF': { whatsNewBody: '2.5.272 — پیام‌ها دیگر روی کیف نمی‌افتند، دکمهٔ توقف کنار می‌رود و نام هر بلاک کامل دیده می‌شود.' },
  rw: { whatsNewBody: '2.5.272 — Ubutumwa ntibugipfuka Igikapu, Hagarara iva mu nzira, kandi izina rya buri bloki rirasomeka ryose.' },
  ti: { whatsNewBody: '2.5.272 — መልእኽትታት ንሳንጣኻ ኣይሽፍኑን፣ ደው ምባል ይርሕቕ፣ ስም ነፍሲ ወከፍ ብሎክ ምሉእ ይንበብ።' },
}
for (const [lang, row] of Object.entries(FIT272)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}
const FIT273 = {
  en: { whatsNewBody: '2.5.273 — Pop-ups stay off the Bag on phones, and block names read right.' },
  uk: { whatsNewBody: '2.5.273 — Спливні підказки не закривають Сумку на телефонах, а назви блоків читаються правильно.' },
  ru: { whatsNewBody: '2.5.273 — Всплывающие подсказки не закрывают Сумку на телефонах, а названия блоков читаются правильно.' },
  es: { whatsNewBody: '2.5.273 — Los avisos ya no tapan la Bolsa en el móvil y los nombres de bloques se leen bien.' },
  ar: { whatsNewBody: '2.5.273 — النوافذ المنبثقة لا تغطي الحقيبة على الهاتف، وأسماء المكعبات تُقرأ بشكل صحيح.' },
  'fa-AF': { whatsNewBody: '2.5.273 — پیام‌ها روی کیف در تلفن نمی‌افتند و نام بلاک‌ها درست خوانده می‌شود.' },
  rw: { whatsNewBody: '2.5.273 — Ubutumwa ntibugipfuka Igikapu kuri telefoni, kandi amazina ya bloki asomeka neza.' },
  ti: { whatsNewBody: '2.5.273 — መልእኽትታት ኣብ ተሌፎን ንሳንጣ ኣይሽፍኑን፣ ኣስማት ብሎካት ድማ ብግቡእ ይንበቡ።' },
}
for (const [lang, row] of Object.entries(FIT273)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}
const FIT274 = {
  en: { whatsNewBody: '2.5.274 — Every block name fits in the hotbar.' },
  uk: { whatsNewBody: '2.5.274 — Кожна назва блока вміщується на панелі швидкого доступу.' },
  ru: { whatsNewBody: '2.5.274 — Каждое название блока помещается на панели быстрого доступа.' },
  es: { whatsNewBody: '2.5.274 — Todos los nombres de bloques caben en la barra rápida.' },
  ar: { whatsNewBody: '2.5.274 — كل أسماء المكعبات تظهر كاملة في شريط الأدوات.' },
  'fa-AF': { whatsNewBody: '2.5.274 — نام همه بلاک‌ها به‌طور کامل در نوار ابزار جا می‌شود.' },
  rw: { whatsNewBody: '2.5.274 — Amazina yose ya bloki agaragara yuzuye mu murongo w\'ibikoresho.' },
  ti: { whatsNewBody: '2.5.274 — ኩሉ ኣስማት ብሎካት ምሉእ ኮይኑ ኣብ መሳርሒ መስመር ይርአ።' },
}
for (const [lang, row] of Object.entries(FIT274)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}
const FIT275 = {
  en: { whatsNewBody: '2.5.275 — Leaves finally fits in the hotbar.' },
  uk: { whatsNewBody: '2.5.275 — Листя нарешті вміщується на панелі швидкого доступу.' },
  ru: { whatsNewBody: '2.5.275 — Листва наконец помещается на панели быстрого доступа.' },
  es: { whatsNewBody: '2.5.275 — Hojas por fin cabe en la barra rápida.' },
  ar: { whatsNewBody: '2.5.275 — أخيرًا يظهر اسم الأوراق كاملًا في شريط الأدوات.' },
  'fa-AF': { whatsNewBody: '2.5.275 — بالاخره نام برگ‌ها کامل در نوار ابزار جا می‌شود.' },
  rw: { whatsNewBody: '2.5.275 — Amababi noneho agaragara yuzuye mu murongo w\'ibikoresho.' },
  ti: { whatsNewBody: '2.5.275 — ቆጽሊ ኣብ መወዳእታ ምሉእ ኮይኑ ኣብ መሳርሒ መስመር ይርአ።' },
}
for (const [lang, row] of Object.entries(FIT275)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}
const HUBLANG = {
  en: { helpHubLang: 'Bertopia opens in the same language you picked on the Hub.' },
  uk: { helpHubLang: 'Bertopia відкривається тією мовою, яку ти обрав на Хабі.' },
  ru: { helpHubLang: 'Bertopia открывается на языке, который ты выбрал в Хабе.' },
  es: { helpHubLang: 'Bertopia se abre en el idioma que elegiste en el Hub.' },
  ar: { helpHubLang: 'يفتح Bertopia باللغة التي اخترتها في المركز.' },
  'fa-AF': { helpHubLang: 'Bertopia به زبانی باز می‌شود که در هاب انتخاب کردی.' },
  rw: { helpHubLang: 'Bertopia ifunguka mu rurimi rwahisemo kuri Hub.' },
  ti: { helpHubLang: 'Bertopia ብቋንቋ ኣብ ሃብ ዝመረጽካዮ ይኽፈት።' },
}
for (const [lang, row] of Object.entries(HUBLANG)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}
const FIT301 = {
  en: { whatsNewBody: '2.5.301 — After you walk, you stay where you walked.' },
  uk: { whatsNewBody: '2.5.301 — Після того, як ти йдеш, ти лишаєшся там, де йшов.' },
  ru: { whatsNewBody: '2.5.301 — После того как ты идёшь, ты остаёшься там, где прошёл.' },
  es: { whatsNewBody: '2.5.301 — Después de caminar, te quedas donde caminaste.' },
  ar: { whatsNewBody: '2.5.301 — بعد أن تمشي، تبقى حيث مشيت.' },
  'fa-AF': { whatsNewBody: '2.5.301 — بعد از این که راه می‌روی، همان‌جا که رفتی می‌مانی.' },
  rw: { whatsNewBody: '2.5.301 — Nyuma yo kugenda, usigara aho wageze.' },
  ti: { whatsNewBody: '2.5.301 — ድሕሪ ምኻድ፡ ኣብ ዝኸድካዮ ቦታ ትጸንሕ።' },
}
for (const [lang, row] of Object.entries(FIT301)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}
const FIT304 = {
  en: { whatsNewBody: '2.5.304 — Bigger item counts you can read from your seat, and bigger slots on phones.' },
  uk: { whatsNewBody: '2.5.304 — Кількість предметів більша і читається з місця, а клітинки на телефоні більші.' },
  ru: { whatsNewBody: '2.5.304 — Числа предметов крупнее и читаются с места, а ячейки на телефоне больше.' },
  es: { whatsNewBody: '2.5.304 — Los números de objetos se leen desde tu asiento, y las casillas son más grandes en el teléfono.' },
  ar: { whatsNewBody: '2.5.304 — عدد القطع أكبر ويُقرأ من مقعدك، والخانات أكبر على الهاتف.' },
  'fa-AF': { whatsNewBody: '2.5.304 — شمار قطعات بزرگ‌تر است و از جایت خوانده می‌شود، و خانه‌ها در تلفن بزرگ‌تر اند.' },
  rw: { whatsNewBody: '2.5.304 — Imibare y\'ibintu irakura kandi isomeka uviye ku ntebe, kandi uduce ni bunini kuri telefoni.' },
  ti: { whatsNewBody: '2.5.304 — ቁጽሪ ኣቑሑት ዓብዪ እዩ ከምኡውን ካብ መንበርካ ይንበብ፣ ቦታታት ድማ ኣብ ተሌፎን ዓበዩ።' },
}
for (const [lang, row] of Object.entries(FIT304)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}

const FIT306 = {
  en: { whatsNewBody: '2.5.306 — The PvP switches say ON and OFF in the right language.' },
  uk: { whatsNewBody: '2.5.306 — Перемикачі PvP пишуть УВІМК і ВИМК своєю мовою.' },
  ru: { whatsNewBody: '2.5.306 — Переключатели PvP пишут ВКЛ и ВЫКЛ на своём языке.' },
  es: { whatsNewBody: '2.5.306 — Los interruptores de PvP dicen SÍ y NO en el idioma correcto.' },
  ar: { whatsNewBody: '2.5.306 — مفاتيح PvP تقول تشغيل وإيقاف باللغة الصحيحة.' },
  'fa-AF': { whatsNewBody: '2.5.306 — دکمه‌های PvP روشن و خاموش را به زبان درست می‌گویند.' },
  rw: { whatsNewBody: '2.5.306 — Ibikoresho bya PvP bivuga BIRAKORA na BIRAZIMYE mu rurimi rwabyo.' },
  ti: { whatsNewBody: '2.5.306 — መቐየሪ PvP ብቕኑዕ ቋንቋ ክፉትን ዕጹውን ይብል።' },
}
for (const [lang, row] of Object.entries(FIT306)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}
const FIT307 = {
  en: {
    helpTapAgain: 'If you tap again, the hint shows again so you know the game heard you.',
    whatsNewBody: '2.5.307 — If you tap again, the hint shows again so you know the game heard you.',
  },
  uk: {
    helpTapAgain: 'Якщо торкнешся ще раз, підказка з’явиться знову, і ти знатимеш, що гра почула тебе.',
    whatsNewBody: '2.5.307 — Якщо торкнешся ще раз, підказка з’явиться знову, і ти знатимеш, що гра почула тебе.',
  },
  ru: {
    helpTapAgain: 'Если нажмёшь ещё раз, подсказка появится снова, и ты будешь знать, что игра тебя услышала.',
    whatsNewBody: '2.5.307 — Если нажмёшь ещё раз, подсказка появится снова, и ты будешь знать, что игра тебя услышала.',
  },
  es: {
    helpTapAgain: 'Si tocas otra vez, el aviso vuelve para que sepas que el juego te oyó.',
    whatsNewBody: '2.5.307 — Si tocas otra vez, el aviso vuelve para que sepas que el juego te oyó.',
  },
  ar: {
    helpTapAgain: 'إذا لمست مرة أخرى، تظهر التلميحة من جديد لتعرف أن اللعبة سمِعتك.',
    whatsNewBody: '2.5.307 — إذا لمست مرة أخرى، تظهر التلميحة من جديد لتعرف أن اللعبة سمِعتك.',
  },
  'fa-AF': {
    helpTapAgain: 'اگر دوباره لمس کنی، نکته دوباره دیده می‌شود تا بدانی بازی صدایت را شنید.',
    whatsNewBody: '2.5.307 — اگر دوباره لمس کنی، نکته دوباره دیده می‌شود تا بدانی بازی صدایت را شنید.',
  },
  rw: {
    helpTapAgain: 'Nukanda nanone, inama igaruka kugira ngo umenye ko umukino wakumvise.',
    whatsNewBody: '2.5.307 — Nukanda nanone, inama igaruka kugira ngo umenye ko umukino wakumvise.',
  },
  ti: {
    helpTapAgain: 'ደጊምካ እንተ ጠዊቕካ፡ ምኽሪ ደጊሙ ይረአ እሞ ጸወታ ከም ዝሰምዓካ ትፈልጥ።',
    whatsNewBody: '2.5.307 — ደጊምካ እንተ ጠዊቕካ፡ ምኽሪ ደጊሙ ይረአ እሞ ጸወታ ከም ዝሰምዓካ ትፈልጥ።',
  },
}
for (const [lang, row] of Object.entries(FIT307)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}

const FIT316 = {
  en: {
    helpBody: 'Pick a tile. The graphics words Auto, Lite and Full are in your language.',
    whatsNewBody: '2.5.316 — The graphics words Auto, Lite and Full are in your language.',
  },
  uk: {
    helpBody: 'Обери плитку. Слова графіки Авто, Легкий і Повний написані твоєю мовою.',
    whatsNewBody: '2.5.316 — Слова графіки Авто, Легкий і Повний написані твоєю мовою.',
  },
  ru: {
    helpBody: 'Выбери плитку. Слова графики Авто, Лёгкий и Полный написаны на твоём языке.',
    whatsNewBody: '2.5.316 — Слова графики Авто, Лёгкий и Полный написаны на твоём языке.',
  },
  es: {
    helpBody: 'Elige una ficha. Las palabras de gráficos Automático, Ligero y Completo están en tu idioma.',
    whatsNewBody: '2.5.316 — Las palabras de gráficos Automático, Ligero y Completo están en tu idioma.',
  },
  ar: {
    helpBody: 'اختر بلاطة. كلمات الرسوم تلقائي وخفيف وكامل بلغتك.',
    whatsNewBody: '2.5.316 — كلمات الرسوم تلقائي وخفيف وكامل بلغتك.',
  },
  'fa-AF': {
    helpBody: 'یک خانه برگزین. واژه‌های گرافیک خودکار، سبک و کامل به زبان تو هستند.',
    whatsNewBody: '2.5.316 — واژه‌های گرافیک خودکار، سبک و کامل به زبان تو هستند.',
  },
  rw: {
    helpBody: 'Hitamo agakaro. Amagambo y\'ibisakaza Byikora, Yoroheje na Yuzuye ari mu rurimi rwawe.',
    whatsNewBody: '2.5.316 — Amagambo y\'ibisakaza Byikora, Yoroheje na Yuzuye ari mu rurimi rwawe.',
  },
  ti: {
    helpBody: 'ንጣፍ ምረጽ። ቃላት ስእሊ ብባዕሉ፡ ቀሊልን ምሉእን ብቋንቋኻ እዮም።',
    whatsNewBody: '2.5.316 — ቃላት ስእሊ ብባዕሉ፡ ቀሊልን ምሉእን ብቋንቋኻ እዮም።',
  },
}
for (const [lang, row] of Object.entries(FIT316)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}
const FIT311 = {
  en: { helpNew: 'What\'s new for you: Reloading brings you back to the same spot and time of day. The game opens in the language you picked on the Hub. Items have bigger, clearer pictures and counts. Place a rug from the wood shop. Lamps and rugs have clearer pictures. The name of what you hold sits in the top bar. The PvP switches say on and off in your language. Tap again and the hint shows again.' },
  uk: { helpNew: 'Що нового для тебе: перезавантаження повертає тебе на те саме місце і в той самий час доби. Гра відкривається мовою, яку ти обрав на Хабі. Предмети мають більші й чіткіші картинки та числа. Поклади килим з майстерні. Лампи й килими мають чіткіші картинки. Назва того, що ти тримаєш, стоїть у верхній панелі. Перемикачі PvP пишуть увімкнено й вимкнено твоєю мовою. Торкнись ще раз, і підказка з’явиться знову.' },
  ru: { helpNew: 'Что нового для тебя: перезагрузка возвращает тебя на то же место и в то же время суток. Игра открывается на языке, который ты выбрал в Хабе. У предметов больше и чётче картинки и числа. Положи ковёр из мастерской. У ламп и ковров картинки чётче. Название того, что ты держишь, стоит в верхней панели. Переключатели PvP пишут включено и выключено на твоём языке. Нажми ещё раз, и подсказка появится снова.' },
  es: { helpNew: 'Qué hay de nuevo: Recargar te devuelve al mismo sitio y a la misma hora del día. El juego se abre en el idioma que elegiste en el Hub. Los objetos tienen dibujos y números más grandes y claros. Pon una alfombra desde el taller. Las lámparas y las alfombras tienen dibujos más claros. El nombre de lo que sostienes está en la barra de arriba. Los interruptores de PvP dicen encendido y apagado en tu idioma. Toca otra vez y el aviso vuelve.' },
  ar: { helpNew: 'ما الجديد لك: إعادة التحميل تعيدك إلى نفس المكان ونفس وقت اليوم. تفتح اللعبة باللغة التي اخترتها في المركز. للأغراض صور وأرقام أكبر وأوضح. ضع سجادة من الورشة. المصابيح والسجاد لها صور أوضح. اسم ما تمسكه يظهر في الشريط العلوي. مفاتيح PvP تقول تشغيل وإيقاف بلغتك. المس مرة أخرى فتظهر التلميحة من جديد.' },
  'fa-AF': { helpNew: 'چه برای تو تازه است: بار دوباره تو را به همان جا و همان وقت روز برمی‌گرداند. بازی به زبانی باز می‌شود که در هاب برگزیدی. اشیا تصویر و شمار بزرگ‌تر و واضح‌تر دارند. یک قالین از کارگاه بگذار. چراغ‌ها و قالین‌ها تصویر واضح‌تر دارند. نام چیزی که نگه می‌داری در نوار بالا است. دکمه‌های PvP روشن و خاموش را به زبان تو می‌گویند. دوباره لمس کن تا نکته دوباره دیده شود.' },
  rw: { helpNew: 'Ibishya kuri wowe: Kongera gutangiza kugusubiza ahantu hamwe n\'isaha y\'umunsi. Umukino ufunguka mu rurimi wahisemo kuri Hub. Ibintu bifite amashusho n\'imibare binini kandi bisobanutse. Shyira itapi uva muri Ububaji. Amatara n\'itapi bifite amashusho asobanutse. Izina ry\'icyo ufite riri mu murongo wo hejuru. Ibikoresho bya PvP bivuga birakora na birazimye mu rurimi rwawe. Kanda nanone inama igaruka.' },
  ti: { helpNew: 'ሓድሽ ንዓኻ፡ ምጽዓን ናብ ተመሳሳሊ ቦታን ናይ መዓልቲ ሰዓትን የምለስካ። ጸወታ ብቋንቋ ኣብ ሃብ ዝመረጽካዮ ይኽፈት። ኣቑሑት ዓቢን ንጹርን ስእልን ቁጽርን ኣለዎም። ምንጻፍ ካብ ቤት ዕዮ ዕንጨይቲ ኣቐምጥ። መብራህትን ምንጻፍን ንጹር ስእሊ ኣለዎም። ስም ናይቲ እተሕዝዎ ኣብ ላዕለዋይ መስመር ይርአ። መቐየሪ PvP ብቋንቋኻ ክፉትን ዕጹውን ይብል። ደጊምካ ጠውቕ እሞ ምኽሪ ይረአ።' },
}
for (const [lang, row] of Object.entries(FIT311)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}

const HELP318 = {
  en: {
    helpUse: 'Near a door, chair, bed, oven or sewing table, a Use button shows. Tap it (or press E) to use it. At the Foundry Console outside town, the button says Press: tap it while holding an Override Key to summon the Overseer.',
  },
  simple: {
    helpUse: 'Near a door, bed or oven, a Use button shows. Tap it (or press E). At the Foundry Console, the button says Press: tap it with an Override Key to call the Overseer.',
  },
  uk: {
    helpUse: 'Біля дверей, стільця, ліжка, печі або швейного столу з’являється кнопка Використати. Торкнися її (або натисни клавішу), щоб використати. Біля консолі ливарні за містом кнопка каже Тисни: торкнися її з ключем перевизначення, щоб викликати наглядача.',
  },
  ru: {
    helpUse: 'Возле двери, стула, кровати, печи или швейного стола появляется кнопка Использовать. Коснись её (или нажми клавишу), чтобы использовать. У консоли литейной за городом кнопка говорит Жми: коснись её с ключом переопределения, чтобы вызвать надзирателя.',
  },
  es: {
    helpUse: 'Cerca de una puerta, silla, cama, horno o mesa de coser, aparece un botón Usar. Tócalo (o pulsa E) para usarlo. En la Consola de la Fundición, fuera del pueblo, el botón dice Pulsar: tócalo con una Llave de anulación para invocar al Supervisor.',
  },
  ar: {
    helpUse: 'قرب باب أو كرسي أو سرير أو فرن أو طاولة خياطة، يظهر زر استخدام. اضغطه لاستخدامه. عند وحدة التحكم بالمسبك خارج البلدة يظهر زر اضغط: اضغطه وأنت تحمل مفتاح التجاوز لاستدعاء المشرف.',
  },
  'fa-AF': {
    helpUse: 'نزدیک در، چوکی، بستر، تنور یا میز خیاطی، دکمه استفاده دیده می‌شود. آن را لمس کن تا استفاده کنی. کنار کنسول ریخته‌گری بیرون شهر، دکمه بفشار دیده می‌شود: با کلید لغو آن را لمس کن تا ناظر را فرا بخوانی.',
  },
  rw: {
    helpUse: 'Hafi y\'urugi, intebe, uburiri, ibumba cyangwa ameza yo kudoda, haboneka buto ya Koresha. Kanda (cyangwa kanda E) kugira ngo uyikoreshe. Kuri Console yo Foundry hanze y\'umujyi, buto ivuga Kanda: yikande ufite Urufunguzo kugira ngo uhamagare Umugenzuzi.',
  },
  ti: {
    helpUse: 'ኣብ ጥቓ ማዕጾ፡ ኩርሲ፡ ዓራት፡ ታንዱር ወይ ጠረጴዛ ስፌት፡ መቐየሪ ተጠቐም ይረአ። ጠውቕ ንምጥቃም። ኣብ ፋውንድሪ ኮንሶል ካብ ከተማ ወጻኢ፡ መቐየሪ ጠውቕ ይብል፤ ኦቨርራይድ ኪ ሒዝካ ጠውቕ ነቲ ተቖጻጻሪ ንምጽዋዕ።',
  },
}
for (const [lang, row] of Object.entries(HELP318)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}

// 2.5.300 C6 teacher combat rows
const C6 = {
  en: {
    c6Combat: 'Combat', c6Creatures: 'Creatures', c6Damage: 'Damage', c6Boss: 'Boss',
    c6Off: 'Off', c6On: 'On', c6Calm: 'Calm', c6Normal: 'Normal', c6Gentle: 'Gentle', c6Real: 'Real',
    c6NotePvp: 'PvP: opt-in only', c6NoteKeep: 'Keep my stuff: ON in main world',
  },
  simple: {
    c6Combat: 'Fighting', c6Creatures: 'Animals', c6Damage: 'Hurt', c6Boss: 'Boss',
    c6Off: 'Off', c6On: 'On', c6Calm: 'Calm', c6Normal: 'Normal', c6Gentle: 'Gentle', c6Real: 'Real',
    c6NotePvp: 'Fight each other: only if both say yes', c6NoteKeep: 'Keep my things: ON in the main world',
  },
  uk: {
    c6Combat: 'Бій', c6Creatures: 'Істоти', c6Damage: 'Шкода', c6Boss: 'Бос',
    c6Off: 'Вимк', c6On: 'Увімк', c6Calm: 'Спокійно', c6Normal: 'Нормально', c6Gentle: 'М’яко', c6Real: 'Реально',
    c6NotePvp: 'PvP: лише за згодою', c6NoteKeep: 'Зберігати речі: УВІМК у головному світі',
  },
  ru: {
    c6Combat: 'Бой', c6Creatures: 'Существа', c6Damage: 'Урон', c6Boss: 'Босс',
    c6Off: 'Выкл', c6On: 'Вкл', c6Calm: 'Спокойно', c6Normal: 'Нормально', c6Gentle: 'Мягко', c6Real: 'Реально',
    c6NotePvp: 'PvP: только по согласию', c6NoteKeep: 'Сохранять вещи: ВКЛ в главном мире',
  },
  es: {
    c6Combat: 'Combate', c6Creatures: 'Criaturas', c6Damage: 'Daño', c6Boss: 'Jefe',
    c6Off: 'Apagado', c6On: 'Encendido', c6Calm: 'Calmo', c6Normal: 'Normal', c6Gentle: 'Suave', c6Real: 'Real',
    c6NotePvp: 'PvP: solo si ambos aceptan', c6NoteKeep: 'Guardar mis cosas: ENCENDIDO en el mundo principal',
  },
  ar: {
    c6Combat: 'قتال', c6Creatures: 'مخلوقات', c6Damage: 'ضرر', c6Boss: 'زعيم',
    c6Off: 'إيقاف', c6On: 'تشغيل', c6Calm: 'هادئ', c6Normal: 'عادي', c6Gentle: 'لطيف', c6Real: 'حقيقي',
    c6NotePvp: 'PvP: فقط إذا وافق الاثنان', c6NoteKeep: 'احتفظ بأغراضي: تشغيل في العالم الرئيسي',
  },
  'fa-AF': {
    c6Combat: 'جنگ', c6Creatures: 'مخلوقات', c6Damage: 'آسیب', c6Boss: 'رئیس',
    c6Off: 'خاموش', c6On: 'روشن', c6Calm: 'آرام', c6Normal: 'عادی', c6Gentle: 'ملایم', c6Real: 'واقعی',
    c6NotePvp: 'PvP: فقط اگر هر دو بگویند بله', c6NoteKeep: 'چیزهایم را نگه دار: روشن در دنیای اصلی',
  },
  rw: {
    c6Combat: 'Intambara', c6Creatures: 'Ibiremwa', c6Damage: 'Ibyangiza', c6Boss: 'Boss',
    c6Off: 'Kuzimya', c6On: 'Gukora', c6Calm: 'Uhoraho', c6Normal: 'Bisanzwe', c6Gentle: 'Buhoro', c6Real: 'Nyabyo',
    c6NotePvp: 'PvP: gusa iyo bombi bemeye', c6NoteKeep: 'Kubika ibintu byanjye: BIRAKORA mu isi nyamukuru',
  },
  ti: {
    c6Combat: 'ውግእ', c6Creatures: 'ፍጥረታት', c6Damage: 'ጉድኣት', c6Boss: 'ቦስ',
    c6Off: 'ዕጹው', c6On: 'ክፉት', c6Calm: 'ሰላማዊ', c6Normal: 'ንቡር', c6Gentle: 'ለውሒ', c6Real: 'ርእሰኛ',
    c6NotePvp: 'PvP: ጥራይ እንተ ክልቲኦም ሰማምዑ', c6NoteKeep: 'ንኣቕሑተይ ሓዝ: ክፉት ኣብ ዋና ዓለም',
  },
}
for (const [lang, row] of Object.entries(C6)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}

const NAMES319 = {
  en: {
    energyN: 'Energy {n}',
    hotbarName: 'Blocks',
    moveName: 'Move',
    modeName: 'Mode',
  },
  uk: {
    energyN: 'Енергія {n}',
    hotbarName: 'Блоки',
    moveName: 'Рух',
    modeName: 'Режим',
  },
  ru: {
    energyN: 'Энергия {n}',
    hotbarName: 'Блоки',
    moveName: 'Движение',
    modeName: 'Режим',
  },
  es: {
    energyN: 'Energía {n}',
    hotbarName: 'Bloques',
    moveName: 'Mover',
    modeName: 'Modo',
  },
  ar: {
    energyN: 'طاقة {n}',
    hotbarName: 'كتل',
    moveName: 'تحرك',
    modeName: 'وضع',
  },
  'fa-AF': {
    energyN: 'انرژی {n}',
    hotbarName: 'بلوک‌ها',
    moveName: 'حرکت',
    modeName: 'حالت',
  },
  rw: {
    energyN: 'Ingufu {n}',
    hotbarName: 'Ibikoresho',
    moveName: 'Kwimura',
    modeName: 'Uburyo',
  },
  ti: {
    energyN: 'ሓይሊ {n}',
    hotbarName: 'ኣቑሑት',
    moveName: 'ንቅስቓስ',
    modeName: 'ኩነታት',
  },
}
for (const [lang, row] of Object.entries(NAMES319)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}

// 2.5.296 C2 — Scrapper + Sparkbug. rw, ti, and Dari are machine drafts.
const C2 = {
  en: {
    c2Scrapper: 'Scrapper',
    c2Sparkbug: 'Sparkbug',
    c2Grabs: 'grabs',
    c2Zap: 'Zap!',
    c2Took: 'A Scrapper took 1 {item} and ran.',
    c2Back: 'Reboot gave your {item} back, plus parts.',
  },
  simple: {
    c2Scrapper: 'Scrap-bot',
    c2Sparkbug: 'Spark-bug',
    c2Grabs: 'snatches',
    c2Zap: 'Spark!',
    c2Took: 'A scrap-bot snatched 1 {item} and ran off.',
    c2Back: 'A reboot handed your {item} back, with a spare part.',
  },
  uk: {
    c2Scrapper: 'Збирач',
    c2Sparkbug: 'Іскрожук',
    c2Grabs: 'хапає',
    c2Zap: 'Блиск!',
    c2Took: 'Збирач узяв 1 {item} і втік.',
    c2Back: 'Перезапуск повернув {item} і деталі.',
  },
  ru: {
    c2Scrapper: 'Сборщик',
    c2Sparkbug: 'Искрожук',
    c2Grabs: 'хватает',
    c2Zap: 'Искра!',
    c2Took: 'Сборщик забрал 1 {item} и убежал.',
    c2Back: 'Перезапуск вернул {item} и детали.',
  },
  es: {
    c2Scrapper: 'Recolector',
    c2Sparkbug: 'Chispabicho',
    c2Grabs: 'agarra',
    c2Zap: '¡Chispa!',
    c2Took: 'Un recolector tomó 1 {item} y huyó.',
    c2Back: 'El reinicio devolvió tu {item} y unas piezas.',
  },
  ar: {
    c2Scrapper: 'جامع',
    c2Sparkbug: 'حشرة الشرارة',
    c2Grabs: 'يخطف',
    c2Zap: 'وميض!',
    c2Took: 'أخذ الجامع 1 {item} وركض.',
    c2Back: 'أعادت إعادة التشغيل {item} وقطعا.',
  },
  'fa-AF': {
    c2Scrapper: 'جمع‌کننده',
    c2Sparkbug: 'جرقه‌حشره',
    c2Grabs: 'می‌قاپد',
    c2Zap: 'جرقه!',
    c2Took: 'جمع‌کننده ۱ {item} را برداشت و دوید.',
    c2Back: 'راه‌اندازی دوباره {item} و تکه‌ها را برگرداند.',
  },
  rw: {
    c2Scrapper: 'Usakuza',
    c2Sparkbug: 'Akanyamaswa',
    c2Grabs: 'afata',
    c2Zap: 'Umuhunda!',
    c2Took: 'Usakuza yafashe 1 {item} hanyuma yirukana.',
    c2Back: 'Gutangiza nanone kugaruye {item} n ibice.',
  },
  ti: {
    c2Scrapper: 'ኣከባቢ',
    c2Sparkbug: 'ኣንበጣ ብልጭታ',
    c2Grabs: 'ይጨብጥ',
    c2Zap: 'ብልጭታ!',
    c2Took: 'ኣከባቢ 1 {item} ወሲዱ ሃደመ።',
    c2Back: 'ዳግመ ምጅማር {item}ን ክፋላትን መለሰ።',
  },
}
for (const [lang, row] of Object.entries(C2)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}

// 2.5.296 help + what's new. rw, ti, and Dari are machine drafts.
const C2HELP = {
  en: {
    c2Help: 'Scrappers and Sparkbugs come out at night and in caves, never in Bertyville. Bertyville is a safe zone. Reboot a Scrapper to get your item back, plus parts.',
    whatsNewBody: '2.5.296 — Scrappers and Sparkbugs come out at night and in caves, never in Bertyville.',
  },
  simple: {
    c2Help: 'Scrap-bots and spark-bugs come out at night and in caves, not in town. Town is a safe place. Reboot a scrap-bot and your thing comes back, with a spare part.',
    whatsNewBody: '2.5.296 — Scrap-bots and spark-bugs come out at night and in caves, not in town.',
  },
  uk: {
    c2Help: 'Збирачі та іскрожуки виходять уночі й у печерах, ніколи в Bertyville. Bertyville — безпечна зона. Перезапусти збирача, і річ повернеться разом із деталями.',
    whatsNewBody: '2.5.296 — Збирачі та іскрожуки виходять уночі й у печерах, ніколи в Bertyville.',
  },
  ru: {
    c2Help: 'Сборщики и искрожуки выходят ночью и в пещерах, никогда в Bertyville. Bertyville — безопасная зона. Перезапусти сборщика, и вещь вернётся вместе с деталями.',
    whatsNewBody: '2.5.296 — Сборщики и искрожуки выходят ночью и в пещерах, никогда в Bertyville.',
  },
  es: {
    c2Help: 'Los recolectores y los chispabichos salen de noche y en las cuevas, nunca en Bertyville. Bertyville es una zona segura. Reinicia un recolector para recuperar tu objeto y unas piezas.',
    whatsNewBody: '2.5.296 — Los recolectores y los chispabichos salen de noche y en cuevas, nunca en Bertyville.',
  },
  ar: {
    c2Help: 'يخرج الجامعون وحشرات الشرارة ليلاً وفي الكهوف، وليس أبداً في Bertyville. Bertyville منطقة آمنة. أعد تشغيل الجامع لترجع أغراضك والقطع.',
    whatsNewBody: '2.5.296 — الجامعون وحشرات الشرارة يخرجون ليلاً وفي الكهوف، أبداً ليس في Bertyville.',
  },
  'fa-AF': {
    c2Help: 'جمع‌کننده‌ها و جرقه‌حشره‌ها شب و در غار بیرون می‌آیند، هرگز در Bertyville. Bertyville جای امن است. جمع‌کننده را دوباره راه بینداز تا چیزت و تکه‌ها برگردند.',
    whatsNewBody: '2.5.296 — جمع‌کننده‌ها و جرقه‌حشره‌ها شب و در غار بیرون می‌آیند، هرگز در Bertyville.',
  },
  rw: {
    c2Help: 'Abasakuza n akanyamaswa basohoka nijoro no mu bikombe, ntibigeze mu Bertyville. Bertyville ni ahantu hatekanye. Tangiza nanone usakuza, ikintu cyawe kigaruka hamwe n ibice.',
    whatsNewBody: '2.5.296 — Abasakuza n akanyamaswa basohoka nijoro no mu bikombe, ntibigeze mu Bertyville.',
  },
  ti: {
    c2Help: 'ኣከባቢታትን ኣንበጣ ብልጭታን ኣብ ለይትን ኣብ ጕድጓድን ይወጹ፡ ኣብ Bertyville ኣይኣትዉን። Bertyville ውሑስ ቦታ እዩ። ኣከባቢ ዳግመ ምጅማር ግበር እሞ ንብረትካን ክፋላትን ይምለሱ።',
    whatsNewBody: '2.5.296 — ኣከባቢታትን ኣንበጣ ብልጭታን ኣብ ለይትን ኣብ ጕድጓድን ይወጹ፡ ኣብ Bertyville ኣይኣትዉን።',
  },
}
for (const [lang, row] of Object.entries(C2HELP)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}

// 2.5.297 C3 crew credit. rw, ti, and Dari are machine drafts.
const C3 = {
  en: { c3Crew: 'Crew bonus', c3Trail: 'Spark trail', c3You: 'You' },
  simple: { c3Crew: 'Team extra', c3Trail: 'Spark path', c3You: 'Me' },
  uk: { c3Crew: 'Бонус команди', c3Trail: 'Іскровий слід', c3You: 'Ти' },
  ru: { c3Crew: 'Бонус команды', c3Trail: 'Искровый след', c3You: 'Ты' },
  es: { c3Crew: 'Bono del equipo', c3Trail: 'Estela de chispa', c3You: 'Tú' },
  ar: { c3Crew: 'مكافأة الفريق', c3Trail: 'أثر الشرارة', c3You: 'أنت' },
  'fa-AF': { c3Crew: 'پاداش گروه', c3Trail: 'رد جرقه', c3You: 'تو' },
  rw: { c3Crew: 'Inyongera yitsinda', c3Trail: 'Umuyoboro wumuriro', c3You: 'Wowe' },
  ti: { c3Crew: 'ሽልማት ጉጅለ', c3Trail: 'መንገዲ ብልጭታ', c3You: 'ንስኻ' },
}
for (const [lang, row] of Object.entries(C3)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}

// 2.5.297 C3 help-up. rw, ti, and Dari are machine drafts.
const C3B = {
  en: {
    c3HelpUp: 'Help up',
    c3Helping: 'Helping up…',
    c3Helped: '{alias} helped you up',
    c3Refuse: 'Wait a moment before helping again',
  },
  simple: {
    c3HelpUp: 'Lift up',
    c3Helping: 'Lifting…',
    c3Helped: '{alias} got you back up',
    c3Refuse: 'Not yet. Wait a little.',
  },
  uk: {
    c3HelpUp: 'Допомогти встати',
    c3Helping: 'Допомагаю встати…',
    c3Helped: '{alias} допоміг тобі встати',
    c3Refuse: 'Зачекай трохи, перш ніж допомогти знову',
  },
  ru: {
    c3HelpUp: 'Помочь встать',
    c3Helping: 'Помогаю встать…',
    c3Helped: '{alias} помог тебе встать',
    c3Refuse: 'Подожди немного, прежде чем помочь снова',
  },
  es: {
    c3HelpUp: 'Ayudar a levantarse',
    c3Helping: 'Ayudando a levantarse…',
    c3Helped: '{alias} te ayudó a levantarte',
    c3Refuse: 'Espera un momento antes de ayudar otra vez',
  },
  ar: {
    c3HelpUp: 'ساعد على النهوض',
    c3Helping: 'المساعدة على النهوض…',
    c3Helped: '{alias} ساعدك على النهوض',
    c3Refuse: 'انتظر قليلاً قبل المساعدة مرة أخرى',
  },
  'fa-AF': {
    c3HelpUp: 'کمک به برخاستن',
    c3Helping: 'در حال کمک…',
    c3Helped: '{alias} کمک کرد بلند شوی',
    c3Refuse: 'کمی صبر کن پیش از کمک دوباره',
  },
  rw: {
    c3HelpUp: 'Fasha guhagarara',
    c3Helping: 'Ndafasha guhagarara…',
    c3Helped: '{alias} yagufashije guhagarara',
    c3Refuse: 'Tegereza akanya mbere yo gufasha nanone',
  },
  ti: {
    c3HelpUp: 'ሓግዝ ንምትካል',
    c3Helping: 'እሓግዝ ኣለኹ…',
    c3Helped: '{alias} ንምትካል ሓጊዙካ',
    c3Refuse: 'ቅድሚ ዳግማይ ሓገዝ ቁሩብ ተጸበ',
  },
}
for (const [lang, row] of Object.entries(C3B)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}

// 2.5.323 drawer name. rw, ti, and Dari are machine drafts. simple falls back to English.
const MENU323 = {
  en: { drawerName: 'Bertopia menu' },
  uk: { drawerName: 'Меню Bertopia' },
  ru: { drawerName: 'Меню Bertopia' },
  es: { drawerName: 'Menú Bertopia' },
  ar: { drawerName: 'قائمة Bertopia' },
  'fa-AF': { drawerName: 'فهرست Bertopia' },
  rw: { drawerName: 'Imenu ya Bertopia' },
  ti: { drawerName: 'ዝርዝር Bertopia' },
}
for (const [lang, row] of Object.entries(MENU323)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}

// 2.5.322 picker names. rw, ti, and Dari are machine drafts; native check later.
const FIT322 = {
  en: { whatsNewBody: '2.5.322 — Settings picker groups are read out in your language.' },
  simple: { whatsNewBody: '2.5.322 — Settings picker groups are read out in your language.' },
  uk: { whatsNewBody: '2.5.322 — Групи вибору в Налаштуваннях озвучуються твоєю мовою.' },
  ru: { whatsNewBody: '2.5.322 — Группы выбора в Настройках читаются на твоём языке.' },
  es: { whatsNewBody: '2.5.322 — Los grupos de ajustes se leen en tu idioma.' },
  ar: { whatsNewBody: '2.5.322 — مجموعات الاختيار في الإعدادات تُقرأ بلغتك.' },
  'fa-AF': { whatsNewBody: '2.5.322 — گروه‌های انتخاب در تنظیمات به زبان شما خوانده می‌شوند.' },
  rw: { whatsNewBody: '2.5.322 — Amatsinda yo guhitamo mu igenamiterere asomwa mu rurimi rwawe.' },
  ti: { whatsNewBody: '2.5.322 — ጉጅለታት ምረጽ ኣብ ቅንብራት ብቋንቋኻ ይንበቡ።' },
}
for (const [lang, row] of Object.entries(FIT322)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}

// 2.5.297 help + what's new. rw, ti, and Dari are machine drafts — a native check is still needed.
const C3HELP = {
  en: {
    c3Help: 'Crew bonus: everyone who helps reboot a bot gets the full drop. Help up: hold the button a moment beside a friend whose Suit is low.',
    whatsNewBody: '2.5.297 — Everyone who helps reboot a bot gets the full drop, and you can help friends up.',
  },
  simple: {
    c3Help: 'Team extra: each friend who reboots a bot gets the whole pile. Lift up: hold the button a little next to a friend with a low suit.',
    whatsNewBody: '2.5.297 — Friends who reboot a bot each get the full pile, and you can help a friend up.',
  },
  uk: {
    c3Help: 'Бонус команди: кожен, хто допомагає перезапустити робота, отримує повну частку. Допомога встати: потримай кнопку мить біля друга з низьким костюмом.',
    whatsNewBody: '2.5.297 — Кожен, хто допомагає перезапустити робота, отримує повну частку, і ти можеш підняти друзів.',
  },
  ru: {
    c3Help: 'Бонус команды: каждый, кто помогает перезапустить робота, получает полную долю. Помощь встать: подержи кнопку мгновение рядом с другом с низким костюмом.',
    whatsNewBody: '2.5.297 — Каждый, кто помогает перезапустить робота, получает полную долю, и ты можешь поднять друзей.',
  },
  es: {
    c3Help: 'Bono del equipo: quien ayuda a reiniciar un robot recibe el lote completo. Ayuda a levantarse: mantén el botón un momento junto a un amigo con el traje bajo.',
    whatsNewBody: '2.5.297 — Quien ayuda a reiniciar un robot recibe el lote completo, y puedes ayudar a tus amigos a levantarse.',
  },
  ar: {
    c3Help: 'مكافأة الفريق: كل من يساعد في إعادة تشغيل الروبوت يحصل على الحصة كاملة. المساعدة على النهوض: أبقِ الزر لحظة بجانب صديق ببدلة منخفضة.',
    whatsNewBody: '2.5.297 — كل من يساعد في إعادة تشغيل الروبوت يحصل على الحصة كاملة، ويمكنك مساعدة الأصدقاء على النهوض.',
  },
  'fa-AF': {
    c3Help: 'پاداش گروه: هر کس که در راه‌اندازی دوباره ربات کمک کند سهم کامل می‌گیرد. کمک به برخاستن: دکمه را یک لحظه کنار دوستی با لباس کم نگه دار.',
    whatsNewBody: '2.5.297 — هر کس که در راه‌اندازی دوباره ربات کمک کند سهم کامل می‌گیرد، و می‌توانی به دوستان کمک کنی بلند شوند.',
  },
  rw: {
    c3Help: 'Inyongera yitsinda: uwafasha gutangiza nanone robot abona igice cyuzuye. Fasha guhagarara: fatira buto akanya hafi y\'inshuti ifite imyenda nke.',
    whatsNewBody: '2.5.297 — Uwafasha gutangiza nanone robot abona igice cyuzuye, kandi ushobora gufasha inshuti guhagarara.',
  },
  ti: {
    c3Help: 'ሽልማት ጉጅለ፡ ነፍሲ ወከፍ ንዳግመ ምጅማር ዝሓገዘ ምሉእ ዕድል ይረክብ። ሓገዝ ምትካል፡ መጠወቒ ንእዋት ሓዝ ኣብ ጥቃ ኣዕሩኽ ዝወሓደ ክዳን።',
    whatsNewBody: '2.5.297 — ነፍሲ ወከፍ ንዳግመ ምጅማር ዝሓገዘ ምሉእ ዕድል ይረክብ፡ ንኣዕሩኽትካ ድማ ክትሕግዝ ትኽእል።',
  },
}
for (const [lang, row] of Object.entries(C3HELP)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}

// 2.5.323 what's new + help. rw, ti, and Dari are machine drafts.
const NEWS323 = {
  en: {
    whatsNewBody: '2.5.323 — The menu header and side menu use your language.',
    helpMenuLang: 'The menu header and side menu use your language.',
  },
  simple: {
    whatsNewBody: '2.5.323 — The menu header and side menu use your language.',
    helpMenuLang: 'The menu header and side menu use your language.',
  },
  uk: {
    whatsNewBody: '2.5.323 — Заголовок меню і бічне меню твоєю мовою.',
    helpMenuLang: 'Заголовок меню і бічне меню твоєю мовою.',
  },
  ru: {
    whatsNewBody: '2.5.323 — Заголовок меню и боковое меню на твоём языке.',
    helpMenuLang: 'Заголовок меню и боковое меню на твоём языке.',
  },
  es: {
    whatsNewBody: '2.5.323 — El encabezado del menú y el menú lateral usan tu idioma.',
    helpMenuLang: 'El encabezado del menú y el menú lateral usan tu idioma.',
  },
  ar: {
    whatsNewBody: '2.5.323 — عنوان القائمة والقائمة الجانبية بلغتك.',
    helpMenuLang: 'عنوان القائمة والقائمة الجانبية بلغتك.',
  },
  'fa-AF': {
    whatsNewBody: '2.5.323 — سربرگ فهرست و فهرست کناری به زبان تو است.',
    helpMenuLang: 'سربرگ فهرست و فهرست کناری به زبان تو است.',
  },
  rw: {
    whatsNewBody: '2.5.323 — Umutwe w\'imenyu n\'imenyu y\'uruhande bikoresha ururimi rwawe.',
    helpMenuLang: 'Umutwe w\'imenyu n\'imenyu y\'uruhande bikoresha ururimi rwawe.',
  },
  ti: {
    whatsNewBody: '2.5.323 — ርእሲ ዝርዝርን ጎናዊ ዝርዝርን ብቋንቋኻ ይጥቀሙ።',
    helpMenuLang: 'ርእሲ ዝርዝርን ጎናዊ ዝርዝርን ብቋንቋኻ ይጥቀሙ።',
  },
}
for (const [lang, row] of Object.entries(NEWS323)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}

const C4 = {
  en: { c4RustFact: 'Rustbot: rust is iron + oxygen + water', c4KeeperFact: 'Keeper: slam opens a weak point', c4DexClose: 'Close', c4BadgeMedic: 'Crew Medic', c4BadgeFlanker: 'Flanker', c4FlankTip: 'Hit the back for ×2', c4SlamTip: 'Keeper slams after 1 s' },
  uk: { c4RustFact: 'Рустбот: іржа — залізо + кисень + вода', c4KeeperFact: 'Кіпер: удар відкриває слабку точку', c4DexClose: 'Закрити', c4BadgeMedic: 'Медик екіпажу', c4BadgeFlanker: 'Фланкер', c4FlankTip: 'Удар у спину ×2', c4SlamTip: 'Кіпер б\'є після 1 с' },
  ru: { c4RustFact: 'Растбот: ржавчина — железо + кислород + вода', c4KeeperFact: 'Кипер: удар открывает слабую точку', c4DexClose: 'Закрыть', c4BadgeMedic: 'Медик команды', c4BadgeFlanker: 'Фланкер', c4FlankTip: 'Удар в спину ×2', c4SlamTip: 'Кипер бьёт после 1 с' },
  es: { c4RustFact: 'Rustbot: el óxido es hierro + oxígeno + agua', c4KeeperFact: 'Keeper: el golpe abre un punto débil', c4DexClose: 'Cerrar', c4BadgeMedic: 'Médico de equipo', c4BadgeFlanker: 'Flanqueador', c4FlankTip: 'Golpe por la espalda ×2', c4SlamTip: 'Keeper golpea tras 1 s' },
  ar: { c4RustFact: 'روستبوت: الصدأ حديد + أكسجين + ماء', c4KeeperFact: 'كيبر: الضربة تفتح نقطة ضعف', c4DexClose: 'إغلاق', c4BadgeMedic: 'طبيب الطاقم', c4BadgeFlanker: 'مهاجم جانبي', c4FlankTip: 'ضربة من الخلف ×2', c4SlamTip: 'كيبر يضرب بعد 1 ث' },
  'fa-AF': { c4RustFact: 'روستبات: زنگ آهن + اکسیجن + آب است', c4KeeperFact: 'کیپر: ضربه نقطه ضعیف را باز می‌کند', c4DexClose: 'بستن', c4BadgeMedic: 'طبیب خدمه', c4BadgeFlanker: 'پهلوگیر', c4FlankTip: 'ضربه از پشت ×2', c4SlamTip: 'کیپر بعد از 1 ث ضربه می‌زند' },
  rw: { c4RustFact: 'Rustbot: irushe ni iron + oxygen + water', c4KeeperFact: 'Keeper: ihita ifungura weak point', c4DexClose: 'Funga', c4BadgeMedic: 'Umuganga w\'itsinda', c4BadgeFlanker: 'Umufasha winyuma', c4FlankTip: 'Kanda inyuma ×2', c4SlamTip: 'Keeper ihita nyuma y\'isegonda 1' },
  ti: { c4RustFact: 'ሩስትቦት፦ ዝገት ብረት + ኦክስጅን + ማይ', c4KeeperFact: 'ኪፐር፦ ምውቃዕ ድኹም ነጥቢ ይኸፍት', c4DexClose: 'ዕጹው', c4BadgeMedic: 'ሕክምና ጋንታ', c4BadgeFlanker: 'ፍላንከር', c4FlankTip: 'ምት ንድሕሪት ×2', c4SlamTip: 'ኪፐር ድሕሪ 1 ሰከንድ ይወቅዕ' },
  simple: { c4RustFact: 'Rustbot: rust is iron + air + water', c4KeeperFact: 'Keeper: slam opens weak spot', c4DexClose: 'Close', c4BadgeMedic: 'Crew Medic', c4BadgeFlanker: 'Umufasha winyuma', c4FlankTip: 'Hit the back for double', c4SlamTip: 'Keeper waits then slams' },
}
for (const [lang, row] of Object.entries(C4)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}

const BONKHELP = {
  en: { helpBonk: 'Bonk: aim at a bot and tap Mine (it says Bonk). Your Suit takes hits. No bonking in Bertyville.' },
  uk: { helpBonk: 'Бонк: наведи на бота і торкнися Ламати (там написано Бонк). Костюм бере удари. У Bertyville бонкати не можна.' },
  ru: { helpBonk: 'Бонк: наведи на бота и коснись Ломать (там написано Бонк). Костюм принимает удары. В Bertyville бонкать нельзя.' },
  es: { helpBonk: 'Bonk: apunta a un bot y toca Romper (dice Bonk). Tu Traje recibe los golpes. No se puede bonkear en Bertyville.' },
  ar: { helpBonk: 'بونك: صوّب على روبوت واضغط كسر (يظهر بونك). البدلة تأخذ الضربات. لا بونك في Bertyville.' },
  'fa-AF': { helpBonk: 'بونک: به ربات نشانه بگیر و شکستن را بزن (بونک می‌نویسد). لباس ضربه‌ها را می‌گیرد. در Bertyville بونک نمی‌شود.' },
  rw: { helpBonk: 'Bonk: tera kuri robot kandi ukande Vunika (ivuga Bonk). Impuzu yawe ifata ingumi. Nta bonk muri Bertyville.' },
  ti: { helpBonk: 'ቦንክ፡ ናብ ቦት ኣመልክት እሞ ሰብር ንካእ (ቦንክ ይብል)። ልብስካ ምትሕትና ይወስድ። ኣብ Bertyville ቦንክ ኣይግበርን።' },
}
for (const [lang, row] of Object.entries(BONKHELP)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}

// 2.5.330 c4Help + c3Help wording fix. rw/ti/fa-AF machine drafts, need native check.
const C4FIX = {
  en: {
    c4Help: 'Rustbot rusts your tools; Keeper slams — wait for the marker, then hit its back for ×2. Your first reboot of each bot opens its Bertodex card. Badges: Crew Medic (help 10 friends up), Flanker (10 back hits).',
    c3Help: 'Crew extra: every friend who helps reboot a bot gets the whole pile. Help up: hold the button next to a friend with a low Suit.',
  },
  simple: {
    c4Help: 'Rustbot rusts tools. Keeper slams — wait for the square, then hit the back for double. First reboot opens Bertodex. Badges: Crew Medic (help 10 friends up), Flanker (10 back hits).',
    c3Help: 'Crew extra: every friend who helps reboot a bot gets the whole pile. Help up: hold the button next to a friend with a low Suit.',
  },
  uk: {
    c4Help: 'Рустбот іржавіє інструменти; Кіпер б\'є — чекайте маркер, потім удар у спину ×2. Перше перезавантаження відкриває картку. Значки: Медик екіпажу (допоможіть 10), Фланкер (10 ударів у спину).',
    c3Help: 'Екіпаж: кожен хто допомагає перезавантажити отримує купу. Допомогти встати: тримайте кнопку біля друга з низьким костюмом.',
  },
  ru: {
    c4Help: 'Растбот ржавеет инструменты; Кипер бьёт — ждите маркер, затем удар в спину ×2. Первая перезагрузка открывает карточку. Значки: Медик команды (помогите 10), Фланкер (10 ударов в спину).',
    c3Help: 'Команда: каждый кто помогает перезагрузить получает кучу. Помочь встать: удерживайте кнопку рядом с другом с низким костюмом.',
  },
  es: {
    c4Help: 'Rustbot oxida herramientas; Keeper golpea — espera el marcador, luego golpea la espalda para ×2. Primera reinicio abre tarjeta Bertodex. Insignias: Médico de equipo (ayuda 10 amigos), Flanqueador (10 golpes por la espalda).',
    c3Help: 'Extra de equipo: cada amigo que ayuda a reiniciar obtiene toda la pila. Ayudar a levantarse: mantén el botón junto a un amigo con traje bajo.',
  },
  ar: {
    c4Help: 'روستبوت يصدأ الأدوات؛ كيبر يضرب — انتظر العلامة ثم اضرب الظهر للضعف. أول إعادة تشغيل تفتح البطاقة. الشارات: طبيب الطاقم (ساعد 10)، مهاجم جانبي (10 ضربات).',
    c3Help: 'إضافي للطاقم: كل صديق يساعد في إعادة التشغيل يحصل على الكومة. مساعدة للنهوض: امسك الزر بجانب صديق ببدلة منخفضة.',
  },
  'fa-AF': {
    c4Help: 'روستبات ابزار را زنگ می‌زند؛ کیپر ضربه می‌زند — منتظر نشانگر بمانید سپس پشت را برای دو برابر بزنید. اولین راه‌اندازی کارت را باز می‌کند. نشان‌ها: طبیب خدمه (کمک 10)، پهلوگیر (10 ضربه).',
    c3Help: 'اضافه خدمه: هر دوستی که کمک به راه‌اندازی مجدد کند کل توده را می‌گیرد. کمک برای بلند شدن: دکمه را کنار دوست با لباس پایین نگه دارید.',
  },
  rw: {
    c4Help: 'Rustbot irushe imyanya; Keeper ihita — tegereza ikimenyetso, hanyuma kanda inyuma ×2. Gusubiza ubwa mbere gufungura ikarita. Ibimenyetso: Umuganga w\'itsinda (fasha 10), Flanker (10 kanda inyuma).',
    c3Help: 'Itsinda ryiyongereye: buri inshuti ifasha gusubiza bot ibona urusenge rwose. Gufasha kumanuka: fata buto hafi y\'inshuti ifite Suit nkeya.',
  },
  ti: {
    c4Help: 'ሩስትቦት መሳርሒታት ይዝገብ፤ ኪፐር ይወቅዕ — ንምልክት ተጸበይ፣ ድሕሪኡ ንድሕሪት ምት ×2። ናይ መጀመርታ ምዝላል ካርድ ይኸፍት። ባጃት፦ ሕክምና ጋንታ (10 ሓገዝ)፣ ፍላንከር (10 ምት ንድሕሪት)።',
    c3Help: 'ጋንታ ተወሳኺ፦ ነፍሲ ወከፍ ዓርኪ ዝሕግዝ ናይ ምሉእ ዕጣ ይረክብ። ምሕጋዝ ንምትንሳእ፦ ትሕቲ ሱት ዘለዎ ዓርኪ ብዓቢ ቁልፊ ሓዝ።',
  },
}
for (const [lang, row] of Object.entries(C4FIX)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}

// s2b server sync chip + keep-both (2.5.329)
if (!EXTRA['en']) EXTRA['en'] = {}
Object.assign(EXTRA['en'], {"s2bSaved": "Saved to school", "s2bSaving": "Saving…", "s2bOffline": "Offline — saved here", "s2bNoSign": "Not signed in", "s2bKeepTitle": "Two copies found.", "s2bKeepBody": "We kept both.", "s2bHelp": "Test only: with sync on, your world can come back from school."})
if (!EXTRA['simple']) EXTRA['simple'] = {}
Object.assign(EXTRA['simple'], {"s2bSaved": "Saved to school", "s2bSaving": "Saving…", "s2bOffline": "Offline — saved here", "s2bNoSign": "Not signed in", "s2bKeepTitle": "Two copies found.", "s2bKeepBody": "We kept both.", "s2bHelp": "Test only: with sync on, your world can come back from school."})
if (!EXTRA['uk']) EXTRA['uk'] = {}
Object.assign(EXTRA['uk'], {"s2bSaved": "Збережено в школі", "s2bSaving": "Збереження…", "s2bOffline": "Офлайн — збережено тут", "s2bNoSign": "Не ввійшли", "s2bKeepTitle": "Знайдено дві копії.", "s2bKeepBody": "Ми зберегли обидві.", "s2bHelp": "Лише тест: з увімкненою синхронізацією світ може повернутися зі школи."})
if (!EXTRA['ru']) EXTRA['ru'] = {}
Object.assign(EXTRA['ru'], {"s2bSaved": "Сохранено в школе", "s2bSaving": "Сохранение…", "s2bOffline": "Офлайн — сохранено здесь", "s2bNoSign": "Не вошли", "s2bKeepTitle": "Найдены две копии.", "s2bKeepBody": "Мы сохранили обе.", "s2bHelp": "Только тест: с включённой синхронизацией мир может вернуться из школы."})
if (!EXTRA['es']) EXTRA['es'] = {}
Object.assign(EXTRA['es'], {"s2bSaved": "Guardado en la escuela", "s2bSaving": "Guardando…", "s2bOffline": "Sin conexión — guardado aquí", "s2bNoSign": "No has iniciado sesión", "s2bKeepTitle": "Se encontraron dos copias.", "s2bKeepBody": "Guardamos ambas.", "s2bHelp": "Solo prueba: con sync activado, tu mundo puede volver de la escuela."})
if (!EXTRA['ar']) EXTRA['ar'] = {}
Object.assign(EXTRA['ar'], {"s2bSaved": "محفوظ في المدرسة", "s2bSaving": "جارٍ الحفظ…", "s2bOffline": "غير متصل — محفوظ هنا", "s2bNoSign": "لم تسجل الدخول", "s2bKeepTitle": "تم العثور على نسختين.", "s2bKeepBody": "احتفظنا بكليهما.", "s2bHelp": "اختبار فقط: مع تشغيل المزامنة، يمكن أن يعود عالمك من المدرسة."})
if (!EXTRA['fa-AF']) EXTRA['fa-AF'] = {}
Object.assign(EXTRA['fa-AF'], {"s2bSaved": "در مدرسه ذخیره شد", "s2bSaving": "در حال ذخیره…", "s2bOffline": "آفلاین — اینجا ذخیره شد", "s2bNoSign": "وارد نشده‌اید", "s2bKeepTitle": "دو نسخه پیدا شد.", "s2bKeepBody": "هر دو را نگه داشتیم.", "s2bHelp": "فقط آزمایش: با فعال بودن همگام‌سازی، جهان شما می‌تواند از مدرسه برگردد."})
if (!EXTRA['rw']) EXTRA['rw'] = {}
Object.assign(EXTRA['rw'], {"s2bSaved": "Byabitswe mu ishuri", "s2bSaving": "Birabitswa…", "s2bOffline": "Nta murandasi — byabitswe hano", "s2bNoSign": "Nta winjiye", "s2bKeepTitle": "Kopi ebyiri byabonetse.", "s2bKeepBody": "Twabishyize hamwe.", "s2bHelp": "Igerageza gusa: niba sync iriho, isi yawe ishobora kugaruka ku ishuri."})
if (!EXTRA['ti']) EXTRA['ti'] = {}
Object.assign(EXTRA['ti'], {"s2bSaved": "ኣብ ቤት ትምህርቲ ተዓቂቡ", "s2bSaving": "እናተዓቐበ…", "s2bOffline": "ኦፍላይን — ኣብዚ ተዓቂቡ", "s2bNoSign": "ኣይኣተወን", "s2bKeepTitle": "ክልተ ቅዳሕ ተረኺቡ።", "s2bKeepBody": "ክልቲኦም ኣቐሚጡና።", "s2bHelp": "ፈተና ጥራይ፡ ስንክሮ እንተ ተኸፊቱ ዓለምካ ካብ ቤት ትምህርቲ ክምለስ ይኽእል።"})
Object.assign(EXTRA['ti'], {"s2bSaved": "ኣብ ቤት ትምህርቲ ተዓቂቡ", "s2bSaving": "እናተዓቐበ…", "s2bOffline": "ኦፍላይን — ኣብዚ ተዓቂቡ", "s2bNoSign": "ኣይኣተወን", "s2bKeepTitle": "ክልተ ቅዳሕ ተረኺቡ።", "s2bKeepBody": "ክልቲኦም ኣቐሚጡና።", "s2bHelp": "ፈተና ጥራይ፡ ሲንክ እንተ ተኸፊቱ ዓለምካ ካብ ቤት ትምህርቲ ክምለስ ይኽእል።"})

const C1BONK = {
  en: { c1Bonk: 'Bonk' },
  simple: { c1Bonk: 'Bonk' },
  uk: { c1Bonk: 'Бонк' },
  ru: { c1Bonk: 'Бонк' },
  es: { c1Bonk: 'Golpe' },
  ar: { c1Bonk: 'بونك' },
  'fa-AF': { c1Bonk: 'بونک' },
  rw: { c1Bonk: 'Kanda' },
  ti: { c1Bonk: 'ቦንክ' },
}
for (const [lang, row] of Object.entries(C1BONK)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}

// 2.5.299 C5 Foundry Overseer. rw/ti/fa-AF machine drafts, need native check.
const C5 = {
  en: { overrideKey: 'Override Key', c5Stamp: '⚠ Stamp!', c5Conveyor: 'Conveyor belts push to walls', c5Vent: 'Hiss! Vent cone →', c5Wipe: 'Calm. Key returned.', c5Win: 'Foundry rebooted!', c5Help: 'Craft an Override Key, place it on the Foundry Console outside town to summon the Overseer. Reboot as a team for the Foundry Crew badge and gear trim. Looks only — no extra power.' },
  simple: { overrideKey: 'Override Key', c5Stamp: '⚠ Stamp!', c5Conveyor: 'Belts push you to walls', c5Vent: 'Hiss! Hot air →', c5Wipe: 'Calm. Key back.', c5Win: 'Foundry rebooted!', c5Help: 'Make an Override Key. Put it on the Foundry Console outside town. Team up to reboot the Overseer for a badge and trim. It only changes how you look.' },
  uk: { overrideKey: 'Ключ перевизначення', c5Stamp: '⚠ Удар!', c5Conveyor: 'Конвеєри штовхають до стін', c5Vent: 'Шипіння! Вентиляція →', c5Wipe: 'Спокій. Ключ повернуто.', c5Win: 'Ливарню перезавантажено!', c5Help: 'Зробіть ключ перевизначення, покладіть на консоль ливарні поза містом. Командою перезавантажте наглядача за значок і обробку. Лише вигляд — без додаткової сили.' },
  ru: { overrideKey: 'Ключ переопределения', c5Stamp: '⚠ Удар!', c5Conveyor: 'Конвейеры толкают к стенам', c5Vent: 'Шипение! Вентиляция →', c5Wipe: 'Спокойно. Ключ возвращён.', c5Win: 'Литейную перезагрузили!', c5Help: 'Сделайте ключ переопределения, положите на консоль литейной за городом. Командой перезагрузите надзирателя за значок и отделку. Только внешний вид — без дополнительной силы.' },
  es: { overrideKey: 'Llave de anulación', c5Stamp: '⚠ ¡Sello!', c5Conveyor: 'Cintas empujan a las paredes', c5Vent: '¡Siseo! Cono de ventilación →', c5Wipe: 'Calma. Llave devuelta.', c5Win: '¡Fundición reiniciada!', c5Help: 'Fabrica una Llave de anulación, colócala en la Consola de la Fundición fuera del pueblo. Reinicia en equipo para la insignia y el borde. Solo apariencia — sin poder extra.' },
  ar: { overrideKey: 'مفتاح التجاوز', c5Stamp: '⚠ ختم!', c5Conveyor: 'الأحزمة تدفع إلى الجدران', c5Vent: 'هسهسة! مخروط التهوية →', c5Wipe: 'هدوء. المفتاح عاد.', c5Win: 'أعيد تشغيل المسبك!', c5Help: 'اصنع مفتاح التجاوز، ضعه على وحدة التحكم بالمسبك خارج البلدة. أعد التشغيل كفريق للحصول على الشارة والتشذيب. مظهر فقط — بدون قوة إضافية.' },
  'fa-AF': { overrideKey: 'کلید لغو', c5Stamp: '⚠ مهر!', c5Conveyor: 'نوارها به دیوارها هل می‌دهند', c5Vent: 'هیس! مخروط تهویه →', c5Wipe: 'آرام. کلید برگشت.', c5Win: 'ریخته‌گری راه‌اندازی مجدد شد!', c5Help: 'کلید لغو را بسازید، روی کنسول ریخته‌گری خارج شهر بگذارید. به عنوان تیم راه‌اندازی مجدد کنید برای نشان و تزئین. فقط ظاهر — بدون قدرت اضافی.' },
  rw: { overrideKey: 'Urufunguzo', c5Stamp: '⚠ Ikimenyetso!', c5Conveyor: 'Imikandara isunika ku nkuta', c5Vent: 'Hiss! Vent →', c5Wipe: 'Umutekano. Urufunguzo rugarutse.', c5Win: 'Foundry yasubijwe!', c5Help: 'Kora Urufunguzo, shyira ku Console yo Foundry hanze y umujyi. Subiza hamwe kugira ngo ubone ikimenyetso n uburyo. Isura gusa — nta bushobozi bwongera.' },
  ti: { overrideKey: 'ኦቨርራይድ ኪ', c5Stamp: '⚠ ምልክት!', c5Conveyor: 'መስመራት ናብ መናድቕ ይድፉ', c5Vent: 'ሂስ! ቬንት →', c5Wipe: 'ርግኣት። መፍትሕ ተመሊሱ።', c5Win: 'ፋውንድሪ ዳግማይ ተጀሚሩ!', c5Help: 'ኦቨርራይድ ኪ ሰርሕ፣ ኣብ ፋውንድሪ ኮንሶል ካብ ከተማ ወጻኢ ኣቐምጥ። ብቡድ ንምዝላል ንባጅን ትሪምን። ገጽታ ጥራይ — ተወሳኺ ሓይሊ የለን።' },
  
}
for (const [lang, row] of Object.entries(C5)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}

// 2.5.333 Notebook Crew + Bertodex. rw/ti/fa-AF machine drafts.
const C4T = {
  en: { c4tCrew: 'Crew badges', c4tBadgemedic: 'Crew Medic', c4tBadgeflanker: 'Flanker', c4tBadgefoundry: 'Foundry Crew', c4tDex: 'Bertodex lista: ', c4tReopen: 'Reopen', c4tHelp: 'Your crew badges and Bertodex are in the Notebook.' },
  simple: { c4tCrew: 'Crew badges', c4tBadgemedic: 'Crew Medic', c4tBadgeflanker: 'Flanker', c4tBadgefoundry: 'Foundry Crew', c4tDex: 'Bertodex lista: ', c4tReopen: 'Reopen', c4tHelp: 'Your crew badges and Bertodex are in the Notebook.' },
  uk: { c4tCrew: 'Значки екіпажу', c4tBadgemedic: 'Медик екіпажу', c4tBadgeflanker: 'Фланкер', c4tBadgefoundry: 'Екіпаж ливарні', c4tDex: 'Бертодекс: ', c4tReopen: 'Відкрити знову', c4tHelp: 'Ваші значки екіпажу та Бертодекс у Блокноті.' },
  ru: { c4tCrew: 'Значки команды', c4tBadgemedic: 'Медик команды', c4tBadgeflanker: 'Фланкер', c4tBadgefoundry: 'Команда литейной', c4tDex: 'Бертодекс: ', c4tReopen: 'Открыть снова', c4tHelp: 'Ваши значки команды и Бертодекс в Блокноте.' },
  es: { c4tDex: 'Lista Bertodex: ', c4tCrew: 'Insignias de equipo', c4tBadgemedic: 'Médico de equipo', c4tBadgeflanker: 'Flanqueador', c4tBadgefoundry: 'Equipo de Fundición', c4tReopen: 'Reabrir', c4tHelp: 'Tus insignias de equipo y Bertodex están en el Cuaderno.' },
  ar: { c4tCrew: 'شارات الطاقم', c4tBadgemedic: 'طبيب الطاقم', c4tBadgeflanker: 'مهاجم جانبي', c4tBadgefoundry: 'طاقم المسبك', c4tDex: 'بيرتودكس: ', c4tReopen: 'إعادة فتح', c4tHelp: 'شارات طاقمك وبيرتودكس في دفتر الملاحظات.' },
  'fa-AF': { c4tCrew: 'نشان‌های خدمه', c4tBadgemedic: 'طبیب خدمه', c4tBadgeflanker: 'پهلوگیر', c4tBadgefoundry: 'خدمه ریخته‌گری', c4tDex: 'برتودکس: ', c4tReopen: 'بازگشایی', c4tHelp: 'نشان‌های خدمه و برتودکس شما در دفترچه هستند.' },
  rw: { c4tCrew: 'Ibimenyetso by itsinda', c4tBadgemedic: 'Umuganga w itsinda', c4tBadgeflanker: 'Umufasha winyuma', c4tBadgefoundry: 'Itsinda rya Foundry', c4tDex: 'Bertodeksi: ', c4tReopen: 'Fungura', c4tHelp: 'Ibimenyetso byawe na Bertodeksi biri mu Notebook.' },
  ti: { c4tCrew: 'ባጃት ጋንታ', c4tBadgemedic: 'ሕክምና ጋንታ', c4tBadgeflanker: 'ፍላንከር', c4tBadgefoundry: 'ጋንታ ፋውንድሪ', c4tDex: 'በርቶዴክስ፦ ', c4tReopen: 'ዳግም ክፈት', c4tHelp: 'ባጃት ጋንታኻን በርቶዴክስን ኣብ ኖትቡክ ኣለዉ።' },
}
for (const [lang, row] of Object.entries(C4T)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}

const CHANGE334 = {
  en: { change: 'Change' },
  simple: { change: 'Change' },
  uk: { change: 'Змінити' },
  ru: { change: 'Изменить' },
  es: { change: 'Cambiar' },
  ar: { change: 'غيّر' },
  'fa-AF': { change: 'تغییر' },
  rw: { change: 'Hindura' },
  ti: { change: 'ቀይር' },
}
for (const [lang, row] of Object.entries(CHANGE334)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}

const OVKEY = {
  en: { overrideKey: 'Override Key' },
  simple: { overrideKey: 'Override Key' },
  uk: { overrideKey: 'Ключ перевизначення' },
  ru: { overrideKey: 'Ключ переопределения' },
  es: { overrideKey: 'Llave de anulación' },
  ar: { overrideKey: 'مفتاح التجاوز' },
  'fa-AF': { overrideKey: 'کلید لغو' },
  rw: { overrideKey: 'Urufunguzo' },
  ti: { overrideKey: 'መፍትሕ ኦቨርራይድ' },
}
for (const [lang, row] of Object.entries(OVKEY)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}

const ITEMNAMES = {
  en: { keeperCore: 'Keeper Core', overrideKey: 'Override Key' },
  simple: { keeperCore: 'Keeper Core', overrideKey: 'Override Key' },
  uk: { keeperCore: 'Ядро Кіпера', overrideKey: 'Ключ перевизначення' },
  ru: { keeperCore: 'Ядро Кипера', overrideKey: 'Ключ переопределения' },
  es: { keeperCore: 'Núcleo Keeper', overrideKey: 'Llave de anulación' },
  ar: { keeperCore: 'نواة كيبر', overrideKey: 'مفتاح التجاوز' },
  'fa-AF': { keeperCore: 'هسته کیپر', overrideKey: 'کلید لغو' },
  rw: { keeperCore: 'Intoki ya Keeper', overrideKey: 'Urufunguzo' },
  ti: { keeperCore: 'ኮር ኪፐር', overrideKey: 'መፍትሕ ኦቨርራይድ' },
}
for (const [lang, row] of Object.entries(ITEMNAMES)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}

// 2.5.338 test toast words. rw/ti/fa-AF machine drafts.
const C4H = {
  en: { c4hNight: 'Test: night', c4hSpawn: 'Test: bot', c4hRefuse: 'Test: refused' },
  simple: { c4hNight: 'Test: night', c4hSpawn: 'Test: bot', c4hRefuse: 'Test: refused' },
  uk: { c4hNight: 'Тест: ніч', c4hSpawn: 'Тест: бот', c4hRefuse: 'Тест: відмовлено' },
  ru: { c4hNight: 'Тест: ночь', c4hSpawn: 'Тест: бот', c4hRefuse: 'Тест: отказано' },
  es: { c4hNight: 'Prueba: noche', c4hSpawn: 'Prueba: bot', c4hRefuse: 'Prueba: rechazado' },
  ar: { c4hNight: 'اختبار: ليل', c4hSpawn: 'اختبار: روبوت', c4hRefuse: 'اختبار: مرفوض' },
  'fa-AF': { c4hNight: 'آزمایش: شب', c4hSpawn: 'آزمایش: ربات', c4hRefuse: 'آزمایش: رد شد' },
  rw: { c4hNight: 'Igerageza: ijoro', c4hSpawn: 'Igerageza: robot', c4hRefuse: 'Igerageza: kwanga' },
  ti: { c4hNight: 'ፈተና፡ ምሽት', c4hSpawn: 'ፈተና፡ ቦት', c4hRefuse: 'ፈተና፡ ተነጺጉ' },
}
for (const [lang, row] of Object.entries(C4H)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}

// 2.5.300 C6b teacher toggle toast. rw/ti/fa-AF machine drafts.
const C6B = {
  en: { c6bBossOff: 'The teacher turned the boss off' },
  simple: { c6bBossOff: 'The teacher turned the boss off' },
  uk: { c6bBossOff: 'Учитель вимкнув боса' },
  ru: { c6bBossOff: 'Учитель выключил босса' },
  es: { c6bBossOff: 'El profesor apagó el jefe' },
  ar: { c6bBossOff: 'المعلم أوقف الزعيم' },
  'fa-AF': { c6bBossOff: 'معلم رئیس را خاموش کرد' },
  rw: { c6bBossOff: 'Umwarimu yazimye boss' },
  ti: { c6bBossOff: 'መምህር ንቦስ ኣጥፊኡ' },
}
for (const [lang, row] of Object.entries(C6B)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}

const C1NOFIGHT = {
  en: { c1NoFightHere: 'No fighting here', helpSafeZone: 'Bertyville is a safe zone. You can not fight in town — the shield sign tells you.' },
  simple: { c1NoFightHere: 'No fighting here', c1SafeZone: 'Town is safe', helpSafeZone: 'No fighting in town.' },
  uk: { c1NoFightHere: 'Тут не можна битися', helpSafeZone: 'Bertyville — безпечна зона. У місті не можна битися — знак щита скаже.' },
  ru: { c1NoFightHere: 'Здесь нельзя драться', c1Bonk: 'Бонк', helpSafeZone: 'Bertyville — безопасная зона. В городе нельзя драться — знак щита скажет.' },
  es: { c1NoFightHere: 'Aquí no se pelea', helpSafeZone: 'Bertyville es una zona segura. No puedes pelear en el pueblo — el signo del escudo te lo dice.' },
  ar: { c1NoFightHere: 'لا قتال هنا', helpSafeZone: 'Bertyville منطقة آمنة. لا يمكنك القتال في المدينة — علامة الدرع تخبرك.' },
  'fa-AF': { c1NoFightHere: 'اینجا جنگ نیست', helpSafeZone: 'Bertyville منطقه امن است. در شهر نمی‌توانی بجنگید — علامت سپر می‌گوید.' },
  rw: { c1NoFightHere: 'Nta kurwana hano', helpSafeZone: 'Bertyville ni agace kwiringira. Ntushobora kurwana mu mujyi — ikimenyetso cya ngabo kivuga.' },
  ti: { c1NoFightHere: 'ኣብዚ ውግእ የለን', helpSafeZone: 'Bertyville ውሑስ ቦታ እዩ። ኣብ ከተማ ክትዋጋእ ኣይትኽእልን — ናይ ጋሻ ምልክት ይነግረካ።' },
}
for (const [lang, row] of Object.entries(C1NOFIGHT)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}

// 2.5.356 boss bar. rw/ti/fa-AF machine drafts.
const C5BAR = {
  en: { c5barName: 'Foundry Overseer', c5barWeak: 'Weak point open!', c5barCrew: 'Crew here: {n}', c5barHint: 'Bring a crewmate — it\'s a team boss.' },
  simple: { c5barName: 'Foundry Overseer', c5barWeak: 'Weak point open!', c5barCrew: 'Crew here: {n}', c5barHint: 'Bring a friend.' },
  uk: { c5barName: 'Наглядач ливарні', c5barWeak: 'Слабке місце відкрите!', c5barCrew: 'Екіпаж тут: {n}', c5barHint: 'Приведіть товариша — це командний бос.' },
  ru: { c5barName: 'Надзиратель литейной', c5barWeak: 'Слабое место открыто!', c5barCrew: 'Экипаж здесь: {n}', c5barHint: 'Приведите товарища — это командный босс.' },
  es: { c5barName: 'Supervisor de la Fundición', c5barWeak: '¡Punto débil abierto!', c5barCrew: 'Tripulación aquí: {n}', c5barHint: 'Trae un compañero — es un jefe de equipo.' },
  ar: { c5barName: 'مشرف المسبك', c5barWeak: 'النقطة الضعيفة مفتوحة!', c5barCrew: 'الطاقم هنا: {n}', c5barHint: 'أحضر رفيقًا — إنه زعيم فريق.' },
  'fa-AF': { c5barName: 'ناظر ریخته‌گری', c5barWeak: 'نقطه ضعیف باز است!', c5barCrew: 'خدمه اینجا: {n}', c5barHint: 'یک همراه بیاورید — این یک رئیس تیمی است.' },
  rw: { c5barName: 'Umuyobozi wa Foundry', c5barWeak: 'Ahantu hato hafunguye!', c5barCrew: 'Itsinda hano: {n}', c5barHint: 'Zana umunyamuryango — ni boss y itsinda.' },
  ti: { c5barName: 'ናይ ፋውንድሪ ኣመሓዳሪ', c5barWeak: 'ድኹም ነጥቢ ክፉት!', c5barCrew: 'ጋንታ ኣብዚ: {n}', c5barHint: 'ሓደ ባል ሓዊሱ — እዚ ቡድናዊ ቦስ እዩ።' },
}
for (const [lang, row] of Object.entries(C5BAR)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}

// 2.5.358 Phase 2 adds. rw/ti/fa-AF machine drafts.
const C5ADD = {
  en: { c5Spark: '⚡ Sparkbugs! One of you take them.' },
  simple: { c5Spark: '⚡ Little bots! Team up.' },
  uk: { c5Spark: '⚡ Іскромлини! Хтось з вас візьміть їх.' },
  ru: { c5Spark: '⚡ Искрожуки! Кто-то из вас займитесь ими.' },
  es: { c5Spark: '⚡ ¡Chispas! Uno de ustedes tómelos.' },
  ar: { c5Spark: '⚡ شرارات! أحدكم يأخذها.' },
  'fa-AF': { c5Spark: '⚡ جرقه‌ها! یکی از شما آن‌ها را بگیرد.' },
  rw: { c5Spark: '⚡ Sparkbugs! Umwe muri mwe abifate.' },
  ti: { c5Spark: '⚡ ስፓርክባግስ! ሓደ ካባኻትኩም ይወስዶም።' },
}
for (const [lang, row] of Object.entries(C5ADD)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}

// 2.5.359 Help: boss bar meaning. rw/ti/fa-AF machine drafts.
const C5HELP = {
  en: { helpBossBar: 'Boss bar: the number shows the Overseer\'s health. Below 60% it calls Sparkbugs (⚡). Bonk its weak point when it says "Weak point open!"' },
  simple: { helpBossBar: 'The bar shows boss health. Little bots come when it gets low. Team up!' },
  uk: { helpBossBar: 'Смуга боса: число показує здоровʼя наглядача. Нижче 60% він кличе іскромлинів (⚡). Бий слабке місце, коли написано «Слабке місце відкрите!»' },
  ru: { helpBossBar: 'Полоса босса: число показывает здоровье надзирателя. Ниже 60% он зовёт искрожуков (⚡). Бей слабое место, когда написано «Слабое место открыто!»' },
  es: { helpBossBar: 'Barra del jefe: el número muestra la salud del Supervisor. Bajo 60% llama Chispas (⚡). Golpea su punto débil cuando diga «¡Punto débil abierto!»' },
  ar: { helpBossBar: 'شريط الزعيم: الرقم يبيّن صحة المشرف. تحت 60% يستدعي الشرارات (⚡). اضرب نقطة ضعفه عندما يظهر «نقطة الضعف مفتوحة!»' },
  'fa-AF': { helpBossBar: 'نوار رئیس: عدد، سلامتی ناظر را نشان می‌دهد. زیر ۶۰٪ جرقه‌ها را فرا می‌خواند (⚡). وقتی «نقطه ضعف باز است!» آمد، به آن بزن.' },
  rw: { helpBossBar: 'Umurongo w\'umuyobozi: umubare werekana ubuzima bwe. Munsi ya 60% ahamagara Sparkbugs (⚡). Kubita ahantu hadakomeye iyo handitse "Weak point open!"' },
  ti: { helpBossBar: 'መስመር ቦስ፡ ቁጽሪ ጥዕና ኣመሓዳሪ የርኢ። ትሕቲ 60% ስፓርክባግስ ይጽውዕ (⚡)። "ድኹም ነጥቢ ክፉት!" ምስ በለ ውቕዕ።' },
}
for (const [lang, row] of Object.entries(C5HELP)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}

// 2.5.366 phase words. rw/ti/fa-AF machine drafts.
const PHASES = {
  en: { phase1: 'Stamp coming', phase2: 'Conveyor', phase3: 'Vent left' },
  simple: { phase1: 'Stamp coming', phase2: 'Conveyor', phase3: 'Vent left' },
  uk: { phase1: 'Штамп іде', phase2: 'Конвеєр', phase3: 'Вентиляція ліворуч' },
  ru: { phase1: 'Штамп идёт', phase2: 'Конвейер', phase3: 'Вентиляция слева' },
  es: { phase1: 'Sello viene', phase2: 'Cinta', phase3: 'Ventilación izquierda' },
  ar: { phase1: 'الختم قادم', phase2: 'الناقل', phase3: 'تهوية يسار' },
  'fa-AF': { phase1: 'مهر می‌آید', phase2: 'نوار نقاله', phase3: 'تهویه چپ' },
  rw: { phase1: 'Sitampu iraza', phase2: 'Konveya', phase3: 'Umuyaga ibumoso' },
  ti: { phase1: 'ስታምፕ ይመጽእ', phase2: 'ኮንቨየር', phase3: 'ቬንት ጸጋም' },
}
for (const [lang, row] of Object.entries(PHASES)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}

// 2.5.445 machines help
const MACH445 = {
  en: { helpMachines: 'Moving dashes mean the wire has power; belts stop when paused; levers show ON/OFF.' },
  simple: { helpMachines: 'Dashes move when the wire has power. Belts stop when paused. Levers show ON or OFF.' },
  uk: { helpMachines: 'Рухомі риски означають, що дріт має живлення; стрічки зупиняються, коли на паузі; важелі показують УВІМК/ВИМК.' },
  ru: { helpMachines: 'Движущиеся чёрточки значат, что провод под током; ленты останавливаются на паузе; рычаги показывают ВКЛ/ВЫКЛ.' },
  es: { helpMachines: 'Las rayas que se mueven significan que el cable tiene energía; las cintas se paran al pausar; las palancas muestran encendido o apagado.' },
  ar: { helpMachines: 'الشرطات المتحركة تعني أن السلك به طاقة؛ الأحزمة تتوقف عند الإيقاف المؤقت؛ الروافع تظهر تشغيل/إيقاف.' },
  'fa-AF': { helpMachines: 'خط‌های متحرک یعنی سیم برق دارد؛ نوارها هنگام توقف می‌ایستند؛ اهرم‌ها روشن/خاموش نشان می‌دهند.' },
  rw: { helpMachines: 'Imirongo igenda ivuga ko umugozi ufite ingufu; imikandara ihagarara iyo yahagaritswe; amaboko agaragaza KUBIKA/KUZIMYA.' },
  ti: { helpMachines: 'ዝንቀሳቐሱ መስመራት ማለት ገመድ ኤሌክትሪክ ኣለዎ፤ ቀበቶታት እንተ ደው ኢሎም ይቕመጡ፤ ሌቨራት ክፉት/ዕጹው የርእዩ።' },
}
for (const [lang, row] of Object.entries(MACH445)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}

// 2.5.446 fly brake + calmer look. rw, ti, and Dari are machine drafts.
const FLY446 = {
  en: {
    helpFlyLook: 'Flying: let go to stop. Look speed: Settings > Controls.',
    whatsNewBody: '2.5.446 — Flying stops when you let go, and look speed starts calmer.',
  },
  simple: {
    helpFlyLook: 'Flying: let go and you stop. Look speed is under Settings, then Controls.',
    whatsNewBody: '2.5.446 — Let go to stop flying. Looking starts slower.',
  },
  uk: {
    helpFlyLook: 'Політ: відпусти, щоб зупинитись. Швидкість огляду: Налаштування, потім Керування.',
    whatsNewBody: '2.5.446 — Політ зупиняється, коли відпускаєш, і швидкість огляду спочатку спокійніша.',
  },
  ru: {
    helpFlyLook: 'Полёт: отпусти, чтобы остановиться. Скорость взгляда: Настройки, затем Управление.',
    whatsNewBody: '2.5.446 — Полёт останавливается, когда отпускаешь, и скорость взгляда сначала спокойнее.',
  },
  es: {
    helpFlyLook: 'Volar: suelta para parar. Velocidad de mirada: Ajustes > Controles.',
    whatsNewBody: '2.5.446 — Volar se detiene al soltar, y la velocidad de mirada empieza más calmada.',
  },
  ar: {
    helpFlyLook: 'الطيران: اترك لتتوقف. سرعة النظر: الإعدادات ثم التحكم.',
    whatsNewBody: '2.5.446 — يتوقف الطيران حين تترك، وسرعة النظر تبدأ أهدأ.',
  },
  'fa-AF': {
    helpFlyLook: 'پرواز: رها کن تا بایستی. سرعت نگاه: تنظیمات سپس کنترل‌ها.',
    whatsNewBody: '2.5.446 — پرواز با رها کردن می‌ایستد، و سرعت نگاه آرام‌تر شروع می‌شود.',
  },
  rw: {
    helpFlyLook: 'Kuguruka: reka ubike uhagarare. Umuvuduko w\'amaso: Igenamiterere, hanyuma Igenzacyerekezo.',
    whatsNewBody: '2.5.446 — Kuguruka birahagarara iyo ubikuye, kandi umuvuduko w\'amaso utangira buhoro.',
  },
  ti: {
    helpFlyLook: 'ምንፋስ፡ ሓድግ እሞ ትቁም። ፍጥነት ምርኣይ፡ ቅንብራት ድሕሪኡ መቆጻጸሪ።',
    whatsNewBody: '2.5.446 — ምንፋስ ምስ ሓደጋኻ ይቁም፡ ፍጥነት ምርኣይ ድማ ቀስ ኢሉ ይጅምር።',
  },
}
for (const [lang, row] of Object.entries(FLY446)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}

// 2.5.448 hotbar tray + Settings > Text. simple falls back to these short English lines.
const TEXT448 = {
  en: {
    textHead: 'Text',
    allCaps: 'All caps',
    dyslexiaFont: 'Dyslexia font',
    keysChip: '? KEYS',
    keysChipHint: 'The keys chip opens this list.',
    whatsNewBody: '2.5.448 — The hotbar is one flat tray. The picked slot lifts with an orange mark, and the name sits above it once. Settings, Text: all caps or the dyslexia font.',
  },
  simple: {
    textHead: 'Text',
    allCaps: 'All caps',
    dyslexiaFont: 'Dyslexia font',
    keysChip: '? KEYS',
    keysChipHint: 'The keys chip opens this list.',
    whatsNewBody: '2.5.448 — One hotbar tray. The name sits above the picked slot. Text: big letters or a reading font.',
  },
  uk: {
    textHead: 'Текст',
    allCaps: 'Усі великі',
    dyslexiaFont: 'Шрифт для дислексії',
    keysChip: '? КЛАВІШІ',
    keysChipHint: 'Чіп клавіш відкриває цей список.',
    whatsNewBody: '2.5.448 — Панель — одна пласка таця. Обрана клітинка піднімається з помаранчевою міткою, а назва стоїть над нею один раз. У налаштуваннях, текст: великі літери або шрифт для дислексії.',
  },
  ru: {
    textHead: 'Текст',
    allCaps: 'Все заглавные',
    dyslexiaFont: 'Шрифт для дислексии',
    keysChip: '? КЛАВИШИ',
    keysChipHint: 'Чип клавиш открывает этот список.',
    whatsNewBody: '2.5.448 — Панель — один плоский поднос. Выбранная ячейка поднимается с оранжевой меткой, а название стоит над ней один раз. В настройках, текст: большие буквы или шрифт для дислексии.',
  },
  es: {
    textHead: 'Texto',
    allCaps: 'Todo en mayúsculas',
    dyslexiaFont: 'Letra para dislexia',
    keysChip: '? TECLAS',
    keysChipHint: 'La ficha de teclas abre esta lista.',
    whatsNewBody: '2.5.448 — La barra es una bandeja plana. La casilla elegida se alza con una marca naranja, y el nombre queda arriba una sola vez. En ajustes, texto: mayúsculas o la letra para dislexia.',
  },
  ar: {
    textHead: 'النص',
    allCaps: 'كل الحروف كبيرة',
    dyslexiaFont: 'خط عسر القراءة',
    keysChip: '? مفاتيح',
    keysChipHint: 'زر المفاتيح يفتح هذه القائمة.',
    whatsNewBody: '2.5.448 — الشريط صينية واحدة مسطحة. الخانة المختارة ترتفع بعلامة برتقالية، والاسم يظهر فوقها مرة واحدة. في الإعدادات، النص: حروف كبيرة أو خط عسر القراءة.',
  },
  'fa-AF': {
    textHead: 'متن',
    allCaps: 'همه حروف بزرگ',
    dyslexiaFont: 'خط نارساخوانی',
    keysChip: '? کلیدها',
    keysChipHint: 'دکمه کلیدها این فهرست را باز می‌کند.',
    whatsNewBody: '2.5.448 — نوار یک سینی تخت است. خانه برگزیده با نشان نارنجی بالا می‌رود و نام یک بار بالای آن است. در تنظیمات، متن: حروف بزرگ یا خط نارساخوانی.',
  },
  rw: {
    textHead: 'Inyandiko',
    allCaps: 'Inyuguti nkuru zose',
    dyslexiaFont: 'Imyandikire yo gusoma',
    keysChip: '? IMBOKO',
    keysChipHint: 'Akabuto k\'imfunguzo gufungura uru rutonde.',
    whatsNewBody: '2.5.448 — Umurongo ni agasanduku kamwe. Akazu gatoranyijwe kizamuka n\'ikimenyetso cy\'umuhondo, n\'izina ririmwo hejuru rimwe. Muri igenamiterere, inyandiko: inyuguti nkuru cyangwa imyandikire yo gusoma.',
  },
  ti: {
    textHead: 'ጽሑፍ',
    allCaps: 'ኩሉ ዓበይቲ ፊደላት',
    dyslexiaFont: 'ቅርጺ ፊደል ንጸገም ንባብ',
    keysChip: '? መጠወቒ',
    keysChipHint: 'መጠወቒ መጠወቒታት ነዚ ዝርዝር ይኸፍት።',
    whatsNewBody: '2.5.448 — መስመር ሓንቲ ጠፍጣፋ ትሪ እዩ። ዝተመርጸ ቦታ ብኣራንሾ ምልክት ይልዕል፡ ስም ድማ ሓንቲ ግዜ ኣብ ላዕሊ ይርአ። ኣብ መቃን፡ ጽሑፍ፡ ዓበይቲ ፊደላት ወይ ንጸገም ንባብ ቅርጺ ፊደል።',
  },
}
for (const [lang, row] of Object.entries(TEXT448)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}

// 2.5.452 menu dim. rw, ti, and Dari are machine drafts.
const DIM452 = {
  en: {
    whatsNewBody: '2.5.452 — The menu and pause dim the world a little instead of covering it in gray, with no flash.',
  },
  simple: {
    whatsNewBody: '2.5.452 — Menu keeps the world showing. No flash.',
  },
  uk: {
    whatsNewBody: '2.5.452 — Меню й пауза трохи тьмянять світ замість сірої завіси, без спалаху.',
  },
  ru: {
    whatsNewBody: '2.5.452 — Меню и пауза чуть затемняют мир вместо серой завесы, без вспышки.',
  },
  es: {
    whatsNewBody: '2.5.452 — El menú y la pausa atenúan un poco el mundo en vez de cubrirlo de gris, sin destello.',
  },
  ar: {
    whatsNewBody: '2.5.452 — القائمة والإيقاف المؤقت يخفتان العالم قليلاً بدل الغطاء الرمادي، بلا وميض.',
  },
  'fa-AF': {
    whatsNewBody: '2.5.452 — فهرست و مکث جهان را کمی تاریک می‌کنند، به‌جای پوشاندن با خاکستری، و جرقه نیست.',
  },
  rw: {
    whatsNewBody: '2.5.452 — Ibikubiyemo n\'uhagarara birabura isi gato aho kuyifukiriza icyatsi, nta kurabagirana.',
  },
  ti: {
    whatsNewBody: '2.5.452 — ምናሌን መቋረጽን ዓለም ቁሩብ የጸልምዋ፡ ብግራጫ ኣይሽፍንዋን፡ ምብራህ የለን።',
  },
}
for (const [lang, row] of Object.entries(DIM452)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}

// 2.5.450 bed card + one bench picture.
const BED450 = {
  en: {
    bedHead1: 'Bed · ★ works',
    bedHead2: 'Bed · ★★ steady',
    bedHead3: 'Bed · ★★★ best',
    bedSleep: '🛏️ Sleep · F · 🖱',
    bedHome: '🏠 Set home',
    bedPick: '✋ Pick up',
    whatsNewBody: '2.5.450 — Beds are low and two blocks long. The bed card has three big buttons: Sleep, Set home, and Pick up. The workbench uses one picture everywhere.',
  },
  simple: {
    bedHead1: 'Bed · ★ works',
    bedHead2: 'Bed · ★★ steady',
    bedHead3: 'Bed · ★★★ best',
    bedSleep: '🛏️ Sleep',
    bedHome: '🏠 Home',
    bedPick: '✋ Pick up',
    whatsNewBody: '2.5.450 — New bed. Big buttons: Sleep, Home, Pick up.',
  },
  uk: {
    bedHead1: 'Ліжко · ★ працює',
    bedHead2: 'Ліжко · ★★ рівне',
    bedHead3: 'Ліжко · ★★★ найкраще',
    bedSleep: '🛏️ Сон',
    bedHome: '🏠 Дім',
    bedPick: '✋ Забрати',
    whatsNewBody: '2.5.450 — Ліжка низькі і завдовжки два блоки. Картка ліжка має три великі кнопки: сон, дім і забрати. Верстат має одну картинку скрізь.',
  },
  ru: {
    bedHead1: 'Кровать · ★ работает',
    bedHead2: 'Кровать · ★★ ровная',
    bedHead3: 'Кровать · ★★★ лучшая',
    bedSleep: '🛏️ Сон',
    bedHome: '🏠 Дом',
    bedPick: '✋ Забрать',
    whatsNewBody: '2.5.450 — Кровати низкие и длиной в два блока. Карточка кровати имеет три большие кнопки: сон, дом и забрать. Верстак использует одну картинку везде.',
  },
  es: {
    bedHead1: 'Cama · ★ sirve',
    bedHead2: 'Cama · ★★ firme',
    bedHead3: 'Cama · ★★★ mejor',
    bedSleep: '🛏️ Dormir · F · 🖱',
    bedHome: '🏠 Poner casa',
    bedPick: '✋ Recoger',
    whatsNewBody: '2.5.450 — Las camas son bajas y miden dos bloques. La tarjeta tiene tres botones grandes: Dormir, Poner casa y Recoger. El banco usa una sola imagen en todos lados.',
  },
  ar: {
    bedHead1: 'سرير · ★ يعمل',
    bedHead2: 'سرير · ★★ ثابت',
    bedHead3: 'سرير · ★★★ الأفضل',
    bedSleep: '🛏️ نوم',
    bedHome: '🏠 بيت',
    bedPick: '✋ التقط',
    whatsNewBody: '2.5.450 — الأسرّة منخفضة وطولها مكعبان. بطاقة السرير فيها ثلاثة أزرار كبيرة: نوم، بيت، والتقط. منضدة العمل تستخدم صورة واحدة في كل مكان.',
  },
  'fa-AF': {
    bedHead1: 'تخت · ★ کار می‌کند',
    bedHead2: 'تخت · ★★ استوار',
    bedHead3: 'تخت · ★★★ بهترین',
    bedSleep: '🛏️ خواب',
    bedHome: '🏠 خانه',
    bedPick: '✋ بردار',
    whatsNewBody: '2.5.450 — تخت‌ها کوتاه و دو بلاک دراز اند. کارت تخت سه دکمه بزرگ دارد: خواب، خانه و بردار. میز کار همه جا یک تصویر دارد.',
  },
  rw: {
    bedHead1: 'Ikiriri · ★ kirakora',
    bedHead2: 'Ikiriri · ★★ cyihagaze',
    bedHead3: 'Ikiriri · ★★★ cyiza',
    bedSleep: '🛏️ Sinzira · F · 🖱',
    bedHome: '🏠 Shyira urugo',
    bedPick: '✋ Fata',
    whatsNewBody: '2.5.450 — Ibiriri biri hasi kandi bifite ibice bibiri. Ikarita ifite buto nini eshatu: Sinzira, Urugo, na Fata. Intebe ikoresha ishusho imwe hose.',
  },
  ti: {
    bedHead1: 'ዓራት · ★ ይሰርሕ',
    bedHead2: 'ዓራት · ★★ ጽኑዕ',
    bedHead3: 'ዓራት · ★★★ ዝበለጸ',
    bedSleep: '🛏️ ድቃስ',
    bedHome: '🏠 ገዛ',
    bedPick: '✋ ውሰድ',
    whatsNewBody: '2.5.450 — ዓራታት ትሑታትን ክልተ ብሎክ ነዊሕን እዮም። ካርድ ዓራት ሰለስተ ዓበይቲ መጠወቒ ኣለዋ፡ ድቃስ፡ ገዛን ውሰድን። መደብ ስራሕ ኣብ ኩሉ ቦታ ሓንቲ ስእሊ ይጥቀም።',
  },
}
for (const [lang, row] of Object.entries(BED450)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], row)
}
