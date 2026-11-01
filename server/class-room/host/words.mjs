// Display-name filter for the personal host. Deliberately small and replaceable: the list is a starting point for
// WordBot (docs/bertopia/HOME-HOST.md §3 step 5; the chat-moderation design in PR #82 owns the real list later).
// It folds leetspeak and separators, then looks for whole-word matches and a few stems that are never innocent.
// The list itself is kept out of this file so it never shows up in code review diffs: host/words.txt, one per line.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
let list = null
function load() {
  if (list) return list
  list = { words: new Set(), stems: [] }
  try {
    for (const raw of fs.readFileSync(path.join(HERE, 'words.txt'), 'utf8').split(/\r?\n/)) {
      const line = raw.trim().toLowerCase()
      if (!line || line.startsWith('#')) continue
      if (line.endsWith('*')) list.stems.push(line.slice(0, -1)); else list.words.add(line)
    }
  } catch (e) { /* no list: the filter passes everything but the reserved names (door.mjs) */ }
  return list
}
export const fold = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e').replace(/4/g, 'a').replace(/5/g, 's').replace(/7/g, 't').replace(/@/g, 'a').replace(/\$/g, 's')
  .replace(/[_\-.]/g, '').replace(/[^\p{L} ]+/gu, '').replace(/\s+/g, ' ').trim()

// true = fine
export function nameOk(name) {
  const l = load()
  const f = fold(name)
  const compact = f.replace(/\s+/g, '')
  for (const w of f.split(' ')) if (l.words.has(w)) return false
  for (const st of l.stems) if (compact.includes(st)) return false
  return true
}
