// Icon contact sheet entry. Bundled to blocks/icons-test.js. Does not import main.js.
import { ITEMS } from './data/items.js'
import { BLOCKS } from './data/blocks-list.js'
import { packItems } from './packs/registry.js'
import { slotArt, blockIcon } from './icons.js'

const grid = document.getElementById('grid')
const countEl = document.getElementById('count')
const blankEl = document.getElementById('blank')
let wraps = 0, fallbacks = 0, blanks = 0

function isFallback(el) {
  if (!el) return true
  if (el.dataset && (el.dataset.kind === 'wrap' || el.dataset.wrap)) return false
  if (el.dataset && el.dataset.letter) return true
  if (el.tagName === 'CANVAS' && el.dataset && el.dataset.kind !== 'wrap') return true
  return true
}

function paintedPixels(canvas) {
  if (!canvas || canvas.tagName !== 'CANVAS') return 1
  try {
    const g = canvas.getContext('2d', { willReadFrequently: true })
    const data = g.getImageData(0, 0, canvas.width, canvas.height).data
    let n = 0
    for (let i = 3; i < data.length; i += 4) if (data[i] > 10) n++
    return n
  } catch (e) {
    return 1
  }
}

function drawScaled(src, size) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')
  g.imageSmoothingEnabled = false
  if (src && src.tagName === 'CANVAS') {
    g.drawImage(src, 0, 0, size, size)
  } else if (src && src.tagName === 'SPAN') {
    // svg fallback — leave empty canvas; count as non-blank only if we can't measure
    return c
  } else {
    g.fillStyle = '#333'
    g.fillRect(0, 0, size, size)
  }
  return c
}

function addCard(key, el, kind) {
  const card = document.createElement('div')
  card.className = 'card'
  const icons = document.createElement('div')
  icons.className = 'icons'
  const a = drawScaled(el, 48)
  icons.appendChild(a)
  const b = drawScaled(el, 96)
  icons.appendChild(b)
  card.appendChild(icons)
  const name = document.createElement('div')
  name.className = 'name'
  name.textContent = key
  card.appendChild(name)
  const id = document.createElement('div')
  id.className = 'id'
  id.textContent = kind + ' ' + (el && el.dataset ? (el.dataset.item || el.dataset.block || el.dataset.wrap || '') : '')
  card.appendChild(id)
  if (isFallback(el)) {
    card.classList.add('fallback')
    fallbacks++
  } else wraps++
  if (paintedPixels(a) === 0 || paintedPixels(b) === 0) blanks++
  grid.appendChild(card)
}

const itemKeys = Object.keys(ITEMS)
const seenItems = new Set(itemKeys)
for (const it of packItems()) {
  if (it && it.key && !seenItems.has(it.key)) {
    seenItems.add(it.key)
    itemKeys.push(it.key)
  }
}
for (const key of itemKeys) {
  const el = slotArt(key)
  addCard(key, el, 'item')
}

const seen = new Set()
for (const b of BLOCKS) {
  const name = b[1]
  if (seen.has(name)) continue
  seen.add(name)
  const el = blockIcon(b)
  addCard(name, el, 'block')
}

if (countEl) countEl.textContent = `${wraps} wraps / ${fallbacks} fallbacks`
if (blankEl) blankEl.textContent = `blank: ${blanks}`
