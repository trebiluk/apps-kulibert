// Every frozen block and every wrap must have a real 64x64 face in both packs.
import { readFileSync, statSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { FROZEN } from '../src/data/ids.js'
import { BLOCK_WRAPS } from '../src/gfx/tile-wraps.js'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(HERE, '..')
const PACKS = ['classic', 'mystical']
const bad = []

function fail(key, msg) {
  bad.push(key + ': ' + msg)
}

function pngSize(buf) {
  if (buf.length < 24) return null
  if (buf[0] !== 0x89 || buf.toString('ascii', 1, 4) !== 'PNG') return null
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }
}

function checkFile(dir, file, key) {
  if (!file || typeof file !== 'string') {
    fail(key, 'missing file name')
    return
  }
  const full = path.join(dir, file)
  let buf
  try { buf = readFileSync(full) } catch (e) {
    fail(key, 'missing ' + file)
    return
  }
  const size = pngSize(buf)
  if (!size) fail(key, file + ' is not a png')
  else if (size.w !== 64 || size.h !== 64) fail(key, file + ' is ' + size.w + 'x' + size.h + ' not 64x64')
}

function needKeys() {
  const keys = []
  const seen = new Set()
  for (const key of Object.keys(FROZEN)) {
    if (key === 'missing' || seen.has(key)) continue
    seen.add(key)
    keys.push(key)
  }
  for (const key of BLOCK_WRAPS) {
    if (seen.has(key)) continue
    seen.add(key)
    keys.push(key)
  }
  return keys
}

const keys = needKeys()
for (const id of PACKS) {
  const dir = path.join(ROOT, 'assets', 'packs', id)
  let pack
  try { pack = JSON.parse(readFileSync(path.join(dir, 'pack.json'), 'utf8')) } catch (e) {
    fail(id, 'pack.json unreadable')
    continue
  }
  if (pack.format !== 'bertopia-pack') fail(id, 'format')
  if (pack.version !== 1) fail(id, 'version')
  if (pack.size !== 64) fail(id, 'size')
  if (pack.status !== 'approved') fail(id, 'status')
  const blocks = pack.blocks || {}
  for (const key of keys) {
    const ent = blocks[key]
    if (!ent) {
      fail(key, 'no face in ' + id)
      continue
    }
    if (ent.all) checkFile(dir, ent.all, key + '@' + id)
    else {
      for (const face of ['top', 'side', 'bottom']) {
        if (!ent[face]) fail(key, id + ' needs ' + face)
        else checkFile(dir, ent[face], key + '@' + id)
      }
    }
  }
}

const fixPath = path.join(ROOT, 'tools', 'fixtures', 'student-dirt.json')
let fix
try { fix = JSON.parse(readFileSync(fixPath, 'utf8')) } catch (e) {
  fail('student', 'fixture unreadable')
  fix = null
}
if (fix) {
  const bytes = statSync(fixPath).size
  if (bytes >= 20 * 1024) fail('student', 'file is ' + bytes + ' bytes')
  if (fix.format !== 'bertopia-pack') fail('student', 'format')
  if (fix.version !== 1) fail('student', 'version')
  if (fix.paletteId !== 'bertopia-32-v1') fail('student', 'paletteId')
  const name = String(fix.name || '')
  if (name.length < 1 || name.length > 24) fail('student', 'name length')
  const textures = fix.textures || {}
  const names = Object.keys(textures)
  if (names.length < 1 || names.length > 64) fail('student', 'texture count ' + names.length)
  for (const key of names) {
    const pixels = textures[key] && textures[key].pixels
    if (!Array.isArray(pixels) || pixels.length !== 256) {
      fail(key, 'student pixels must be 256 ints')
      continue
    }
    for (let i = 0; i < pixels.length; i++) {
      const n = pixels[i]
      if (!Number.isInteger(n) || n < 0 || n > 31) {
        fail(key, 'student pixel ' + i + ' is ' + n)
        break
      }
    }
  }
}

if (bad.length) {
  console.error('pack-check failed')
  for (const line of bad) console.error(' - ' + line)
  process.exit(1)
}
console.log('pack-check ok', keys.length, 'keys x', PACKS.length, 'packs')
