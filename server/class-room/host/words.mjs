// Name folding for the personal host: lower-case, accents off, look-alike digits as letters, separators dropped. Used to
// spot "owner"/"host" impersonation (door.mjs RESERVED) and to match bans by name. There is NO word filter: the
// personal host is for adults 18+ (names and chat are not filtered; docs/bertopia/HOME-HOST.md §6, Diego Nov 1).
export const fold = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e').replace(/4/g, 'a').replace(/5/g, 's').replace(/7/g, 't').replace(/@/g, 'a').replace(/\$/g, 's')
  .replace(/[_\-.]/g, '').replace(/[^\p{L} ]+/gu, '').replace(/\s+/g, ' ').trim()
