// Personal-host client (docs/bertopia/HOME-HOST.md). Imported from main.js ONLY inside `if (__HOME_HOST__)`, so esbuild
// drops this whole file from the student doors; tools/home-leak-check.mjs proves it. Adults 18+, non-school.
//
// What it does: before the world loads, a join screen (server address, session code, display name, one-time 18+
// confirm) asks the host for a ticket, opens the socket, and keeps it alive. An "owner" ticket (from the owner page)
// skips the screen. homeOwnerOn() is the home build's answer to teacherOn(): true only when the server's hello said
// this socket has the staff role. A version mismatch shows an Update card instead of connecting. Strings live here in
// the 9 languages the game uses (en, simple, uk, ru, es, ar, fa-AF, rw, ti); WordBot may replace them.
import { setHomeEndpoints } from '../classnet/config.js'
import { Rules } from '../rules.js'

// Two home-only rules (docs §5). Registered from here, so the student build never has them. Labels: 8 languages (drafts).
const L = (en, uk, ru, es, ar, fa, rw, ti) => ({ en, uk, ru, es, ar, 'fa-AF': fa, rw, ti })
export function registerHomeRules() {
  Rules.register({ id: 'combat.pvp', type: 'bool', def: false, group: 'combat', display: 'survival', icon: '⚔',
    label: L('Player fights', 'Бої гравців', 'Бои игроков', 'Peleas entre jugadores', 'قتال اللاعبين', 'جنگ بازیکن‌ها', 'Imirwano y’abakinnyi', 'ውግእ ተጻወቲ'),
    desc: L('Players can hit each other.', 'Гравці можуть бити один одного.', 'Игроки могут бить друг друга.', 'Los jugadores pueden golpearse.', 'يمكن للاعبين ضرب بعضهم.', 'بازیکن‌ها می‌توانند همدیگر را بزنند.', 'Abakinnyi bashobora gukubitana.', 'ተጻወቲ ንሓድሕዶም ክወቕዑ ይኽእሉ።') })
  Rules.register({ id: 'survival.keep', type: 'bool', def: true, group: 'survival', display: 'survival', icon: '🎒',
    label: L('Keep stuff', 'Зберігати речі', 'Сохранять вещи', 'Conservar cosas', 'الاحتفاظ بالأشياء', 'نگه‌داشتن وسایل', 'Kugumana ibintu', 'ንብረት ምዕቃብ'),
    desc: L('You keep your bag when you faint.', 'Сумка лишається, коли ти знепритомнієш.', 'Сумка остаётся, когда ты теряешь сознание.', 'Conservas tu bolsa al desmayarte.', 'تحتفظ بحقيبتك عند الإغماء.', 'وقتی از حال می‌روی کیفت می‌ماند.', 'Ugumana umufuka wawe iyo ugwiriwe.', 'ክትሰሓብ ከለኻ ቦርሳኻ ይተርፍ።') })
}
// The server's ruleset: applied to the game's own Rules (which already enforce locally) and announced with a calm toast.
export const RULE_TOAST = { en: 'Rules changed: {r}', simple: 'New rules: {r}', uk: 'Правила змінено: {r}', ru: 'Правила изменены: {r}', es: 'Reglas cambiadas: {r}', ar: 'تغيّرت القواعد: {r}', 'fa-AF': 'قوانین عوض شد: {r}', rw: 'Amategeko yahindutse: {r}', ti: 'ሕግታት ተቐይሮም: {r}' }
let onRules = null
export function onHomeRules(fn) { onRules = fn }
// The owner's in-game editor (rules-editor.js) calls Rules.set(); at home the server is the authority, so when the owner
// is in, every set is also sent to the host, which validates it, bumps rev and broadcasts. Players never get this hook.
let ownerApi = null   // { base, token } from the owner page (sessionStorage), present only for the owner's own session
let wrapped = false
export function armOwnerEditor() {
  if (wrapped || !homeOwnerOn()) return
  try { ownerApi = JSON.parse(sessionStorage.getItem('bt-home-owner-api') || 'null') } catch (e) {}
  if (!ownerApi || !ownerApi.token) return
  const real = Rules.set
  Rules.set = (id, v) => { const out = real(id, v); try { fetch(ownerApi.base + '/owner/rule', { method: 'POST', headers: { 'content-type': 'application/json', 'x-owner': ownerApi.token }, body: JSON.stringify({ id, v: out }) }).catch(() => {}) } catch (e) {} return out }
  wrapped = true
}
export function applyHomeRules(f, toast, lang) {
  if (!f || !f.r) return
  const r = { ...f.r }; const mode = r.mode; delete r.mode
  try { Rules.load(r) } catch (e) {}
  if (info) { info.ruleset = f.preset; info.mode = mode; info.locked = !!f.locked; info.rulesRev = f.rev }
  if (onRules) try { onRules({ preset: f.preset, mode, locked: !!f.locked, rev: f.rev, r }) } catch (e) {}
  if (toast && f.rev > 1) toast((RULE_TOAST[lang] || RULE_TOAST[(lang || '').split('-')[0]] || RULE_TOAST.en).replace('{r}', homeRuleName(f.preset)))
}
const KEY_ADULTS = 'bt-home-adults'
const KEY_LAST = 'bt-home-last'           // last server address + display name (no code, no ticket)
let sock = null, hello = null, info = null, q = 0

const S = {
  en: { title: 'Join a home server', intro: 'Run by a person you know, not by the school.', addr: 'Server address', code: 'Session code', name: 'Display name', pw: 'Password (the host set one)', adults: 'This server is for adults 18+. I confirm I am 18 or older.', join: 'Join', asking: 'Asking the host…', in: 'In world “{w}” as {n}', update: 'Your game needs an update to join this server.', updateHow: 'The server runs {s}; this game is {c}. Reload the page from the host address.', retry: 'Try again', solo: 'Play alone instead', rules: 'Rules: {r}',
    errs: { code: 'That session code is not right.', ended: 'There is no session running. Ask the host to start one.', password: 'That password is not right.', adults: 'Please confirm you are 18 or older.', name: 'Names are 2 to 20 letters, digits, spaces, _ or -.', 'name-reserved': 'That name looks like a host or owner name. Pick another.', 'name-filtered': 'That name is not allowed here. Pick another.', 'name-taken': 'That name is taken in this session.', full: 'The server is full right now.', 'too-many': 'Too many connections from your network.', banned: 'You cannot join this session.', 'slow-down': 'Too many tries. Wait a few minutes.', 'no-owner': 'The owner is not in the world yet. Ask them to press “Play as owner”.', network: 'Could not reach that server address.' } },
  simple: { title: 'Join a home server', intro: 'A person you know runs it. Not the school.', addr: 'Server address', code: 'Session code', name: 'Your name in the game', pw: 'Password', adults: 'This server is for adults 18+. I am 18 or older.', join: 'Join', asking: 'Asking the host…', in: 'In world “{w}” as {n}', update: 'Your game needs an update.', updateHow: 'Reload the page from the host address.', retry: 'Try again', solo: 'Play alone', rules: 'Rules: {r}',
    errs: { code: 'Wrong session code.', ended: 'No session is running.', password: 'Wrong password.', adults: 'Confirm you are 18 or older.', name: '2 to 20 letters, digits, spaces, _ or -.', 'name-reserved': 'Pick another name.', 'name-filtered': 'That name is not allowed. Pick another.', 'name-taken': 'That name is taken.', full: 'The server is full.', 'too-many': 'Too many connections.', banned: 'You cannot join.', 'slow-down': 'Too many tries. Wait.', 'no-owner': 'The owner is not in yet.', network: 'Cannot reach that address.' } },
  uk: { title: 'Приєднатися до домашнього сервера', intro: 'Його веде знайома людина, не школа.', addr: 'Адреса сервера', code: 'Код сесії', name: 'Ім’я в грі', pw: 'Пароль (якщо господар встановив)', adults: 'Цей сервер для дорослих 18+. Підтверджую, що мені є 18.', join: 'Приєднатися', asking: 'Запитуємо господаря…', in: 'У світі «{w}» як {n}', update: 'Гру треба оновити, щоб приєднатися.', updateHow: 'Сервер має {s}; гра — {c}. Перезавантаж сторінку з адреси господаря.', retry: 'Ще раз', solo: 'Грати самому', rules: 'Правила: {r}',
    errs: { code: 'Код сесії неправильний.', ended: 'Сесія не запущена. Попроси господаря почати.', password: 'Пароль неправильний.', adults: 'Підтвердь, що тобі є 18.', name: 'Ім’я: 2–20 літер, цифр, пробілів, _ або -.', 'name-reserved': 'Таке ім’я схоже на господаря. Обери інше.', 'name-filtered': 'Таке ім’я тут заборонене. Обери інше.', 'name-taken': 'Це ім’я вже зайняте.', full: 'Сервер зараз повний.', 'too-many': 'Забагато з’єднань з твоєї мережі.', banned: 'Ти не можеш приєднатися.', 'slow-down': 'Забагато спроб. Зачекай кілька хвилин.', 'no-owner': 'Господар ще не у світі.', network: 'Не вдалося зв’язатися з цією адресою.' } },
  ru: { title: 'Войти на домашний сервер', intro: 'Его ведёт знакомый человек, не школа.', addr: 'Адрес сервера', code: 'Код сессии', name: 'Имя в игре', pw: 'Пароль (если хозяин задал)', adults: 'Этот сервер для взрослых 18+. Подтверждаю, что мне есть 18.', join: 'Войти', asking: 'Спрашиваем хозяина…', in: 'В мире «{w}» как {n}', update: 'Игру нужно обновить, чтобы войти.', updateHow: 'На сервере {s}; игра — {c}. Перезагрузи страницу с адреса хозяина.', retry: 'Ещё раз', solo: 'Играть одному', rules: 'Правила: {r}',
    errs: { code: 'Код сессии неверный.', ended: 'Сессия не запущена. Попроси хозяина начать.', password: 'Пароль неверный.', adults: 'Подтверди, что тебе есть 18.', name: 'Имя: 2–20 букв, цифр, пробелов, _ или -.', 'name-reserved': 'Такое имя похоже на хозяина. Выбери другое.', 'name-filtered': 'Такое имя здесь запрещено. Выбери другое.', 'name-taken': 'Это имя уже занято.', full: 'Сервер сейчас полон.', 'too-many': 'Слишком много подключений из твоей сети.', banned: 'Ты не можешь войти.', 'slow-down': 'Слишком много попыток. Подожди несколько минут.', 'no-owner': 'Хозяин ещё не в мире.', network: 'Не удалось связаться с этим адресом.' } },
  es: { title: 'Unirse a un servidor casero', intro: 'Lo lleva alguien que conoces, no la escuela.', addr: 'Dirección del servidor', code: 'Código de sesión', name: 'Nombre en el juego', pw: 'Contraseña (si el anfitrión puso una)', adults: 'Este servidor es para adultos 18+. Confirmo que tengo 18 o más.', join: 'Unirse', asking: 'Preguntando al anfitrión…', in: 'En el mundo “{w}” como {n}', update: 'Tu juego necesita una actualización para unirse.', updateHow: 'El servidor tiene {s}; este juego es {c}. Recarga la página desde la dirección del anfitrión.', retry: 'Otra vez', solo: 'Jugar solo', rules: 'Reglas: {r}',
    errs: { code: 'Ese código de sesión no es correcto.', ended: 'No hay sesión. Pide al anfitrión que empiece una.', password: 'Esa contraseña no es correcta.', adults: 'Confirma que tienes 18 o más.', name: 'Nombres: 2 a 20 letras, dígitos, espacios, _ o -.', 'name-reserved': 'Ese nombre parece el del anfitrión. Elige otro.', 'name-filtered': 'Ese nombre no está permitido. Elige otro.', 'name-taken': 'Ese nombre ya está en uso.', full: 'El servidor está lleno.', 'too-many': 'Demasiadas conexiones desde tu red.', banned: 'No puedes unirte a esta sesión.', 'slow-down': 'Demasiados intentos. Espera unos minutos.', 'no-owner': 'El anfitrión aún no está en el mundo.', network: 'No se pudo llegar a esa dirección.' } },
  ar: { title: 'الانضمام إلى خادم منزلي', intro: 'يديره شخص تعرفه، وليس المدرسة.', addr: 'عنوان الخادم', code: 'رمز الجلسة', name: 'الاسم في اللعبة', pw: 'كلمة المرور (إن وضعها المضيف)', adults: 'هذا الخادم للبالغين 18+. أؤكد أن عمري 18 أو أكثر.', join: 'انضمام', asking: 'نسأل المضيف…', in: 'في العالم «{w}» باسم {n}', update: 'لعبتك تحتاج إلى تحديث للانضمام.', updateHow: 'الخادم {s} واللعبة {c}. أعد تحميل الصفحة من عنوان المضيف.', retry: 'حاول مجدداً', solo: 'العب وحدك', rules: 'القواعد: {r}',
    errs: { code: 'رمز الجلسة غير صحيح.', ended: 'لا توجد جلسة. اطلب من المضيف أن يبدأ واحدة.', password: 'كلمة المرور غير صحيحة.', adults: 'أكّد أن عمرك 18 أو أكثر.', name: 'الاسم: 2 إلى 20 حرفاً أو رقماً أو مسافة أو _ أو -.', 'name-reserved': 'هذا الاسم يشبه اسم المضيف. اختر غيره.', 'name-filtered': 'هذا الاسم غير مسموح. اختر غيره.', 'name-taken': 'هذا الاسم مستخدم.', full: 'الخادم ممتلئ الآن.', 'too-many': 'اتصالات كثيرة من شبكتك.', banned: 'لا يمكنك الانضمام.', 'slow-down': 'محاولات كثيرة. انتظر بضع دقائق.', 'no-owner': 'المضيف ليس في العالم بعد.', network: 'تعذر الوصول إلى هذا العنوان.' } },
  'fa-AF': { title: 'پیوستن به سرور خانگی', intro: 'کسی که می‌شناسی آن را اداره می‌کند، نه مکتب.', addr: 'آدرس سرور', code: 'کد جلسه', name: 'نام در بازی', pw: 'رمز (اگر میزبان گذاشته)', adults: 'این سرور برای بزرگسالان ۱۸+ است. تأیید می‌کنم ۱۸ یا بیشتر دارم.', join: 'پیوستن', asking: 'از میزبان می‌پرسیم…', in: 'در دنیای «{w}» با نام {n}', update: 'بازی‌ات برای پیوستن به‌روزرسانی لازم دارد.', updateHow: 'سرور {s} است و بازی {c}. صفحه را از آدرس میزبان دوباره باز کن.', retry: 'دوباره', solo: 'تنها بازی کن', rules: 'قوانین: {r}',
    errs: { code: 'کد جلسه درست نیست.', ended: 'جلسه‌ای در جریان نیست. از میزبان بخواه شروع کند.', password: 'رمز درست نیست.', adults: 'تأیید کن که ۱۸ یا بیشتر داری.', name: 'نام: ۲ تا ۲۰ حرف، رقم، فاصله، _ یا -.', 'name-reserved': 'این نام شبیه میزبان است. دیگری انتخاب کن.', 'name-filtered': 'این نام اینجا مجاز نیست. دیگری انتخاب کن.', 'name-taken': 'این نام گرفته شده.', full: 'سرور پر است.', 'too-many': 'اتصال‌های زیاد از شبکه‌ات.', banned: 'نمی‌توانی بپیوندی.', 'slow-down': 'تلاش زیاد. چند دقیقه صبر کن.', 'no-owner': 'میزبان هنوز در دنیا نیست.', network: 'به این آدرس نرسیدیم.' } },
  rw: { title: 'Injira kuri seriveri yo mu rugo', intro: 'Iyoborwa n’umuntu uzi, si ishuri.', addr: 'Aderesi ya seriveri', code: 'Kode y’igihe', name: 'Izina mu mukino', pw: 'Ijambobanga (niba nyir’urugo yarishyizeho)', adults: 'Iyi seriveri ni iy’abakuze 18+. Ndemeza ko mfite imyaka 18 cyangwa irenga.', join: 'Injira', asking: 'Turabaza nyir’urugo…', in: 'Mu isi «{w}» nka {n}', update: 'Umukino wawe ukeneye kuvugururwa kugira ngo winjire.', updateHow: 'Seriveri ifite {s}; umukino ni {c}. Ongera ufungure urupapuro uhereye kuri aderesi ya nyir’urugo.', retry: 'Ongera ugerageze', solo: 'Kina wenyine', rules: 'Amategeko: {r}',
    errs: { code: 'Iyo kode si yo.', ended: 'Nta gihe gikomeje. Saba nyir’urugo gutangira.', password: 'Ijambobanga si ryo.', adults: 'Emeza ko ufite imyaka 18 cyangwa irenga.', name: 'Izina: inyuguti 2 kugeza 20, imibare, umwanya, _ cyangwa -.', 'name-reserved': 'Iryo zina risa n’irya nyir’urugo. Hitamo irindi.', 'name-filtered': 'Iryo zina ntiryemewe hano. Hitamo irindi.', 'name-taken': 'Iryo zina ryamaze gufatwa.', full: 'Seriveri yuzuye.', 'too-many': 'Ihuza nyinshi ziva kuri murandasi yawe.', banned: 'Ntushobora kwinjira.', 'slow-down': 'Wagerageje cyane. Tegereza iminota mike.', 'no-owner': 'Nyir’urugo ntari mu isi.', network: 'Ntitwageze kuri iyo aderesi.' } },
  ti: { title: 'ናብ ናይ ገዛ ሰርቨር ምጽንባር', intro: 'ዝፈልጦ ሰብ እዩ ዘመሓድሮ፡ ቤት ትምህርቲ ኣይኮነን።', addr: 'ኣድራሻ ሰርቨር', code: 'ኮድ ክፍለ ግዜ', name: 'ስም ኣብ ጸወታ', pw: 'መሕለፊ ቃል (ኣአንጋዲ እንተ ኣቐሚጡ)', adults: 'እዚ ሰርቨር ንዓበይቲ 18+ እዩ። 18 ወይ ልዕሊኡ ምዃነይ የረጋግጽ።', join: 'ተጸንበር', asking: 'ንኣአንጋዲ ንሓትት ኣለና…', in: 'ኣብ ዓለም «{w}» ከም {n}', update: 'ጸወታኻ ንምጽንባር ምሕዳስ የድልዮ።', updateHow: 'ሰርቨር {s} እዩ፡ ጸወታ {c}። ገጽ ካብ ኣድራሻ ኣአንጋዲ ዳግም ጽዓኖ።', retry: 'ዳግም ፈትን', solo: 'በይንኻ ተጻወት', rules: 'ሕግታት: {r}',
    errs: { code: 'እቲ ኮድ ቅኑዕ ኣይኮነን።', ended: 'ክፍለ ግዜ የለን። ኣአንጋዲ ክጅምር ሕተቶ።', password: 'መሕለፊ ቃል ቅኑዕ ኣይኮነን።', adults: '18 ወይ ልዕሊኡ ምዃንካ ኣረጋግጽ።', name: 'ስም: 2 ክሳብ 20 ፊደላት፡ ቁጽርታት፡ ክፍተት፡ _ ወይ -።', 'name-reserved': 'እዚ ስም ከም ናይ ኣአንጋዲ ይመስል። ካልእ ምረጽ።', 'name-filtered': 'እዚ ስም ኣብዚ ኣይፍቀድን። ካልእ ምረጽ።', 'name-taken': 'እዚ ስም ተታሒዙ እዩ።', full: 'ሰርቨር መሊኡ እዩ።', 'too-many': 'ካብ መርበብካ ብዙሕ ምትእስሳር።', banned: 'ክትጽንበር ኣይትኽእልን።', 'slow-down': 'ብዙሕ ፈተነ። ቁሩብ ደቓይቕ ተጸበ።', 'no-owner': 'ኣአንጋዲ ገና ኣብ ዓለም የለን።', network: 'ናብዚ ኣድራሻ ክንበጽሕ ኣይከኣልናን።' } },
}
const RULE_NAMES = { 'home-school': 'Same as school', 'home-survival': 'Survival', 'home-creative': 'Creative', 'home-peaceful': 'Peaceful', 'home-pvp': 'PvP on', 'home-hardcore': 'Hardcore' }
const str = (lang) => ({ ...(S[lang] || S[(lang || '').split('-')[0]] || S.en), lang })
const fill = (s, m) => s.replace(/\{(\w)\}/g, (_, k) => m[k])

export const isHomePage = () => typeof document !== 'undefined' && !!document.querySelector('meta[name="bertopia-home"]')
export const homeOwnerOn = () => !!(hello && hello.role !== 'k')
export const homeInfo = () => info
export const homeSocket = () => sock

// ws:// is accepted only for this machine and private networks; anything else must be wss:// (README: TLS proxy).
export function homeWsOk(u) {
  let url; try { url = new URL(u) } catch (e) { return false }
  if (url.protocol === 'wss:') return true
  if (url.protocol !== 'ws:') return false
  const h = url.hostname
  return h === 'localhost' || h === '127.0.0.1' || /^10\./.test(h) || /^192\.168\./.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h) || /^\[?fe80:/i.test(h) || /^\[?::1\]?$/.test(h)
}

function card(html) {
  let root = document.getElementById('home-join')
  if (!root) {
    root = document.createElement('div'); root.id = 'home-join'
    root.style.cssText = 'position:fixed;inset:0;z-index:95;display:flex;align-items:center;justify-content:center;background:#0b1220;color:#f8fafc;font:17px/1.5 system-ui,sans-serif'
    document.body.appendChild(root)
  }
  root.innerHTML = html
  return root
}
const css = `<style>#home-join .hc{background:#111a2e;border:1px solid #22304d;border-radius:16px;padding:22px 24px;width:min(92vw,440px)}
#home-join h1{font-size:20px;margin:0 0 6px}#home-join p,#home-join label{color:#94a3b8;margin:6px 0;display:block}
#home-join input[type=text],#home-join input[type=password]{width:100%;min-height:48px;font:18px system-ui;background:#0b1220;color:#f8fafc;border:1px solid #475569;border-radius:12px;padding:0 12px;margin:4px 0 10px;box-sizing:border-box}
#home-join #hj-code{font-size:24px;letter-spacing:4px;text-transform:uppercase;text-align:center}
#home-join .ad{display:flex;gap:10px;align-items:flex-start;background:#0b1220;border:1px solid #475569;border-radius:12px;padding:10px 12px;margin:6px 0 12px;color:#f8fafc}#home-join .ad input{width:24px;height:24px;margin:2px 0 0;flex:0 0 24px}
#home-join button{width:100%;min-height:52px;font:inherit;font-weight:600;background:#134e4a;color:#f8fafc;border:1px solid #2dd4bf;border-radius:12px;cursor:pointer;margin-top:6px}#home-join button.alt{background:#1e293b;border-color:#475569}
#home-join button:focus-visible,#home-join input:focus-visible{outline:3px solid #2dd4bf;outline-offset:2px}#home-join .out{margin-top:12px;min-height:1.5em}#home-join .bad{color:#f87171}#home-join .ok{color:#4ade80}
@media (prefers-reduced-motion:no-preference){#home-join button:active{transform:scale(.99)}}</style>`

// Resolves to { ticket, ws, name, world, ruleset, version } once in, or null if the player chose solo play.
export function homeJoinScreen({ lang = 'en', version = '' } = {}) {
  const T = str(lang)
  const rtl = /^(ar|fa)/.test(lang)
  let last = {}; try { last = JSON.parse(localStorage.getItem(KEY_LAST) || '{}') } catch (e) {}
  const owner = (() => { try { const o = JSON.parse(sessionStorage.getItem('bt-home-owner-ticket') || 'null'); sessionStorage.removeItem('bt-home-owner-ticket'); return o } catch (e) { return null } })()
  return new Promise((resolve) => {
    if (owner && owner.ticket) { connect(owner, T, version, resolve); return }
    const root = card(css + `<div class="hc" dir="${rtl ? 'rtl' : 'ltr'}"><h1>${T.title}</h1><p>${T.intro}</p>
      <label for="hj-addr">${T.addr}</label><input type="text" id="hj-addr" autocomplete="off" spellcheck="false" value="${(last.addr || location.origin).replace(/"/g, '')}">
      <label for="hj-code">${T.code}</label><input type="text" id="hj-code" maxlength="9" autocomplete="off" autocapitalize="characters" placeholder="ABCD EFGH">
      <label for="hj-name">${T.name}</label><input type="text" id="hj-name" maxlength="20" autocomplete="off" value="${(last.name || '').replace(/"/g, '')}">
      <div id="hj-pwrow" hidden><label for="hj-pw">${T.pw}</label><input type="password" id="hj-pw" autocomplete="off"></div>
      <label class="ad"><input type="checkbox" id="hj-adults"><span>${T.adults}</span></label>
      <button id="hj-go">${T.join}</button><button id="hj-solo" class="alt">${T.solo}</button><div class="out" id="hj-out" aria-live="polite"></div></div>`)
    const $ = (id) => root.querySelector('#' + id)
    try { if (sessionStorage.getItem(KEY_ADULTS) === '1') $('hj-adults').checked = true } catch (e) {}
    $('hj-solo').onclick = () => { root.remove(); resolve(null) }
    $('hj-code').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('hj-go').click() })
    $('hj-go').onclick = async () => {
      const base = $('hj-addr').value.trim().replace(/\/+$/, '')
      const body = { code: $('hj-code').value.trim().replace(/\s|-/g, '').toUpperCase(), name: $('hj-name').value, password: $('hj-pw').value || undefined, adults: $('hj-adults').checked }
      if (!/^https?:\/\//.test(base)) { $('hj-out').innerHTML = '<span class="bad">http:// …</span>'; return }
      $('hj-out').textContent = T.asking
      let j
      try { j = await (await fetch(base + '/join', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })).json() } catch (e) { j = { error: 'network' } }
      if (j.error) { if (j.error === 'password') $('hj-pwrow').hidden = false; $('hj-out').innerHTML = '<span class="bad">' + (T.errs[j.error] || j.error) + (j.wait ? ' (' + j.wait + ' s)' : '') + '</span>'; return }
      if (version && j.version && j.version !== version) { updateCard(root, T, j.version, version, () => location.reload()); return }
      try { sessionStorage.setItem(KEY_ADULTS, '1'); localStorage.setItem(KEY_LAST, JSON.stringify({ addr: base, name: j.name })) } catch (e) {}
      connect(j, T, version, resolve, root)
    }
  })
}

function updateCard(root, T, server, client, retry) {
  root.innerHTML = css + `<div class="hc"><h1>⟳ ${T.update}</h1><p>${fill(T.updateHow, { s: server, c: client })}</p><button id="hj-retry">${T.retry}</button></div>`
  root.querySelector('#hj-retry').onclick = retry
}

let toastFn = null
export function setHomeToast(fn) { toastFn = fn }
function connect(j, T, version, resolve, root) {
  if (!homeWsOk(j.ws)) { (root || card(css)).querySelector('.out, .hc').innerHTML += '<span class="bad">ws:// is only for this machine or a home network.</span>'; return }
  if (sock) try { sock.close() } catch (e) {}
  hello = null; info = { name: j.name, world: j.world, ruleset: j.ruleset, ws: j.ws, server: j.version }
  setHomeEndpoints({ ws: j.ws, join: j.ws.replace(/^ws/, 'http').replace(/\/rt\/ws$/, '/join') })
  sock = new WebSocket(j.ws, ['bt-room.v0', j.ticket])
  sock.onmessage = (m) => { let f; try { f = JSON.parse(m.data) } catch (e) { return } if (f.t === 'hello') { hello = f; if (root) root.remove(); resolve({ ...j, hello: f }) } else if (f.t === 'frz') { info.frozen = !!f.on } else if (f.t === 'rules') { applyHomeRules(f, toastFn, T.lang) } }
  sock.onclose = (e) => { if (!hello && root) root.querySelector('#hj-out') && (root.querySelector('#hj-out').innerHTML = '<span class="bad">' + (T.errs[e.reason] || e.reason || T.errs.network) + '</span>'); hello = null }
  sock.onerror = () => {}
  const beat = setInterval(() => { if (!sock || sock.readyState !== 1) return clearInterval(beat); try { sock.send(JSON.stringify({ v: 0, t: 'ping', n: ++q })) } catch (e) {} }, 10000)
}

// The game calls these from its own loops when it has something to send (positions, edits); part 3/4 extend the set.
export function homeSend(frame) { if (sock && sock.readyState === 1) sock.send(JSON.stringify({ v: 0, ...frame })) }
export function homeLeave() { if (sock) try { sock.close(1000, 'bye') } catch (e) {} sock = null; hello = null; info = null }
export const homeRuleName = (id, lang) => (RULE_NAMES[id] || id || '').replace('home-', '')
export const homeStrings = S
