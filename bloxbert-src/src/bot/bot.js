import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder'
import { CreateTorus } from '@babylonjs/core/Meshes/Builders/torusBuilder'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { BOT_TAB } from '../items.js'
import { FROZEN } from '../data/ids.js'
import { readProgram, prefillSteps, createCursor, pullStep, countActions } from './program.js'
import { openCodePanel, closeCodePanel, codePanelOpen } from './code-panel.js'

const PLANK = FROZEN.planks

function dye(scene, name, hex, glow) {
  const mat = new StandardMaterial(name, scene)
  const n = parseInt(hex.slice(1), 16)
  const color = new Color3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
  mat.diffuseColor = color
  mat.emissiveColor = color.scale(glow == null ? 0.35 : glow)
  mat.specularColor = new Color3(0.05, 0.05, 0.05)
  return mat
}

function reduceMotion() {
  return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
}

function wonAlready() {
  try { return localStorage.getItem('bloxbert-bot-win') === '1' } catch (e) { return false }
}

function markWon() {
  try { localStorage.setItem('bloxbert-bot-win', '1') } catch (e) {}
}

function offered() {
  try { return localStorage.getItem('bloxbert-bot-offer') === '1' } catch (e) { return false }
}

function markOffer() {
  try { localStorage.setItem('bloxbert-bot-offer', '1') } catch (e) {}
}

function facing(yaw) {
  let a = Math.round(yaw / (Math.PI / 2))
  a = ((a % 4) + 4) % 4
  return [[0, 1], [1, 0], [0, -1], [-1, 0]][a]
}

export function initBot(ctx) {
  const bots = []
  let armed = false
  let seq = 1
  let panel = null
  let active = null
  const scene = ctx.noa.rendering.getScene()
  const teal = dye(scene, 'bot-teal', '#2DD4BF')
  const blue = dye(scene, 'bot-blue', '#3B82F6')
  const orange = dye(scene, 'bot-orange', '#FF8A1F')
  const ringMat = dye(scene, 'bot-ring', '#22D3EE', 0.9)

  function meshFor(bot) {
    const root = new Mesh('berty-bot-' + bot.id, scene)
    root.metadata = { botId: bot.id }
    const body = CreateBox('bot-body-' + bot.id, { width: 0.46, height: 0.46, depth: 0.3 }, scene)
    body.material = teal
    body.parent = root
    body.position.y = 0.4
    body.metadata = { botId: bot.id }
    const head = CreateBox('bot-head-' + bot.id, { width: 0.36, height: 0.28, depth: 0.28 }, scene)
    head.material = blue
    head.parent = root
    head.position.y = 0.78
    head.metadata = { botId: bot.id }
    const eye = CreateBox('bot-eye-' + bot.id, { width: 0.22, height: 0.08, depth: 0.04 }, scene)
    eye.material = orange
    eye.parent = root
    eye.position.set(0, 0.8, 0.16)
    eye.metadata = { botId: bot.id }
    const ring = CreateTorus('bot-ring-' + bot.id, { diameter: 0.78, thickness: 0.045, tessellation: 16 }, scene)
    ring.material = ringMat
    ring.parent = root
    ring.position.y = 0.06
    ring.isPickable = false
    ring.setEnabled(false)
    bot.ring = ring
    root.isPickable = true
    for (const part of [root, body, head, eye]) {
      part.isPickable = true
      if (ctx.noa.rendering.addMeshToScene) ctx.noa.rendering.addMeshToScene(part, false)
    }
    if (ctx.noa.rendering.addMeshToScene) ctx.noa.rendering.addMeshToScene(ring, false)
    bot.mesh = root
    return root
  }

  function dropMesh(bot) {
    if (bot.timer) clearTimeout(bot.timer)
    bot.token = (bot.token || 0) + 1
    if (!bot.mesh) return
    bot.mesh.getChildMeshes().forEach((m) => m.dispose())
    bot.mesh.dispose()
    bot.mesh = null
    bot.ring = null
  }

  function sync() {
    const now = performance.now()
    for (const bot of bots) {
      if (!bot.mesh) continue
      const lp = ctx.noa.globalToLocal([bot.x + 0.5, bot.y + 1, bot.z + 0.5], null, [0, 0, 0])
      let ox = 0
      if (bot.shakeUntil && now < bot.shakeUntil) ox = (bot.shakeUntil - now) > 90 ? 0.14 : -0.1
      bot.mesh.position.set(lp[0] + ox, lp[1], lp[2])
      bot.mesh.rotation.y = bot.yaw
      if (bot.ring) bot.ring.setEnabled(!!bot.running)
    }
  }

  function placeAt(x, y, z) {
    if (bots.length) {
      ctx.toast(ctx.t('botHave'))
      return false
    }
    const pos = ctx.noa.entities.getPosition(ctx.noa.playerEntity)
    const dx = (x + 0.5) - pos[0]
    const dz = (z + 0.5) - pos[2]
    const yaw = Math.atan2(dx, dz)
    const bot = { id: 'bot' + (seq++), x, y, z, yaw, program: readProgram(null), planks: 16, running: false, token: 0, runLog: null }
    bots.push(bot)
    meshFor(bot)
    sync()
    armed = false
    if (ctx.markDirty) ctx.markDirty()
    if (ctx.close) ctx.close()
    return true
  }

  function tryPlace(block) {
    if (!block || !block.position) return false
    const x = Math.round(block.position[0])
    const y = Math.round(block.position[1])
    const z = Math.round(block.position[2])
    if (!ctx.getVoxel(x, y, z)) return false
    if (ctx.getVoxel(x, y + 1, z)) return false
    return placeAt(x, y, z)
  }

  function findBot(id) {
    return bots.find((b) => b.id === id) || null
  }

  function copyProgram(program) {
    return { v: 1, steps: program.steps.map((s) => ({ id: s.id, n: s.n, dir: s.dir })) }
  }

  function ensurePrefill(bot) {
    if (wonAlready()) return
    if (bot.program.steps.length) { markOffer(); return }
    if (offered()) return
    bot.program.steps = prefillSteps()
    markOffer()
    if (ctx.markDirty) ctx.markDirty()
  }

  function bindPanel(bot) {
    panel = openCodePanel({
      t: ctx.t,
      program: bot.program,
      reduce: reduceMotion,
      challenge: () => !wonAlready(),
      running: () => bot.running,
      canUndo: () => !!(bot.runLog && bot.runLog.undo),
      onChange: () => { if (ctx.markDirty) ctx.markDirty(); if (panel) panel.keys() },
      onRun: () => startRun(bot),
      onStop: () => stopRun(bot),
      onUndo: () => undoRun(bot),
      onClear: () => {
        if (bot.running) return
        bot.program.steps.length = 0
        if (ctx.markDirty) ctx.markDirty()
      },
      onClose: () => { panel = null },
    })
    active = bot
    if (bot.running && panel) {
      panel.strip(true)
      panel.mark(bot.stepIndex == null ? -1 : bot.stepIndex, 'on')
    }
  }

  function openFor(bot) {
    if (!bot) return
    if (ctx.botOn && !ctx.botOn()) return
    ensurePrefill(bot)
    bindPanel(bot)
  }

  function stepDelay() { return reduceMotion() ? 0 : 500 }

  function say(bot, n, total) {
    if (!panel || active !== bot) return
    const line = ctx.t('botStep').replace('{n}', String(n)).replace('{m}', String(total))
    panel.say(line)
  }

  function finish(bot, kind) {
    bot.running = false
    bot.token += 1
    if (bot.timer) clearTimeout(bot.timer)
    bot.timer = 0
    if (panel && active === bot) {
      panel.strip(false)
      if (kind === 'cap') panel.note('cap')
      else if (kind === 'win') panel.note('win')
      else panel.note('')
      if (kind === 'blocked') panel.mark(bot.stepIndex == null ? -1 : bot.stepIndex, 'bad')
      else panel.mark(-1, '')
      panel.keys()
    }
    if (kind === 'blocked' || kind === 'done' || kind === 'win') say(bot, bot.stepN || 0, bot.stepTotal || 0)
    if (ctx.markDirty) ctx.markDirty()
    if (ctx.noteEdit && bot.runLog && bot.runLog.touched) ctx.noteEdit()
    if (ctx.saveNow) ctx.saveNow()
    sync()
  }

  function worldStep(bot, step) {
    const face = facing(bot.yaw)
    if (step.id === 'turn') {
      bot.yaw += (step.dir === 'l' ? -1 : 1) * (Math.PI / 2)
      return ''
    }
    if (step.id === 'forward') {
      const nx = bot.x + face[0]
      const nz = bot.z + face[1]
      if (ctx.kept && ctx.kept(nx, bot.y + 1, nz)) return 'kept'
      if (ctx.getVoxel(nx, bot.y + 1, nz)) return 'wall'
      bot.x = nx
      bot.z = nz
      return ''
    }
    if (step.id === 'dig') {
      let x = bot.x + face[0]
      let y = bot.y + 1
      let z = bot.z + face[1]
      if (!ctx.getVoxel(x, y, z)) y = bot.y
      if (ctx.kept && ctx.kept(x, y, z)) return 'kept'
      if (!ctx.getVoxel(x, y, z)) return 'wall'
      return writeCell(bot, x, y, z, 0)
    }
    if (step.id === 'place') {
      const right = [face[1], -face[0]]
      let x = bot.x + right[0]
      let y = bot.y + 1
      let z = bot.z + right[1]
      if (ctx.getVoxel(x, y, z)) {
        x = bot.x + face[0]
        z = bot.z + face[1]
      }
      if (ctx.kept && ctx.kept(x, y, z)) return 'kept'
      if (ctx.getVoxel(x, y, z)) return 'wall'
      const held = ctx.heldBlock ? (ctx.heldBlock() || 0) : 0
      let id = 0
      let from = ''
      if (held) {
        const key = ctx.takeHeld ? ctx.takeHeld() : ''
        if (key === false) return 'empty'
        id = held
        from = key || ''
      } else if (bot.planks > 0) {
        bot.planks -= 1
        id = PLANK
        from = 'planks'
      } else return 'empty'
      const why = writeCell(bot, x, y, z, id)
      if (why) {
        if (from === 'planks') bot.planks += 1
        else if (from && ctx.giveItem) ctx.giveItem(from, 1)
        return why
      }
      bot.runLog.placed += 1
      if (from === 'planks') bot.runLog.planks += 1
      else if (from) bot.runLog.items.push(from)
      return ''
    }
    return ''
  }

  function writeCell(bot, x, y, z, v) {
    if (!ctx.applyEdit) return 'wall'
    const group = ctx.applyEdit([[x, y, z, v]], { source: 'bot', by: 'bot', cause: 'program', join: true, runId: bot.runLog.runId, label: 'program' })
    if (!group) return 'wall'
    bot.runLog.touched = true
    bot.runLog.undo = true
    return ''
  }

  function tick(bot) {
    if (!bot.running) return
    const hit = pullStep(bot.program.steps, bot.cursor)
    if (hit.kind === 'cap') { finish(bot, 'cap'); return }
    if (hit.kind === 'done') {
      const win = !wonAlready() && bot.runLog.placed >= 3
      if (win) markWon()
      finish(bot, win ? 'win' : 'done')
      return
    }
    if (hit.kind === 'blocked') {
      bot.stepIndex = hit.index
      bot.stepN = bot.cursor.actions
      if (!reduceMotion()) bot.shakeUntil = performance.now() + 180
      finish(bot, 'blocked')
      return
    }
    bot.stepIndex = hit.index
    bot.stepN = hit.n
    if (panel && active === bot) panel.mark(hit.index, 'on')
    const why = worldStep(bot, hit.step)
    if (why) {
      if (!reduceMotion()) bot.shakeUntil = performance.now() + 180
      finish(bot, 'blocked')
      return
    }
    sync()
    const token = bot.token
    bot.timer = setTimeout(() => { if (bot.token === token) tick(bot) }, stepDelay())
  }

  function startRun(bot) {
    if (!bot || bot.running) return
    if (!bot.program.steps.length) return
    bot.running = true
    if (ctx.onBotRun) ctx.onBotRun()
    bot.token += 1
    bot.stepIndex = -1
    bot.stepN = 0
    bot.stepTotal = countActions(bot.program.steps)
    bot.cursor = createCursor()
    bot.runLog = { runId: 'run' + bot.token + '-' + Date.now(), placed: 0, planks: 0, items: [], undo: true, touched: false, pose: { x: bot.x, y: bot.y, z: bot.z, yaw: bot.yaw, planks: bot.planks } }
    if (panel && active === bot) {
      panel.note('')
      panel.strip(true)
      panel.keys()
    }
    const token = bot.token
    bot.timer = setTimeout(() => { if (bot.token === token) tick(bot) }, stepDelay())
  }

  function stopRun(bot) {
    if (!bot || !bot.running) return
    bot.token += 1
    if (bot.timer) clearTimeout(bot.timer)
    bot.running = false
    if (panel && active === bot) {
      panel.strip(false)
      panel.mark(-1, '')
      panel.keys()
    }
    if (ctx.noteEdit && bot.runLog && bot.runLog.touched) ctx.noteEdit()
    if (ctx.markDirty) ctx.markDirty()
    sync()
  }

  function undoRun(bot) {
    if (!bot || bot.running || !bot.runLog || !bot.runLog.undo) return
    const log = bot.runLog
    if (ctx.undoRun) ctx.undoRun(log.runId)
    else {
      const top = ctx.peekEdit ? ctx.peekEdit() : null
      if (top && top.source === 'bot' && top.runId === log.runId && ctx.undoEdit) ctx.undoEdit()
    }
    const pose = log.pose
    if (pose) {
      bot.x = pose.x
      bot.y = pose.y
      bot.z = pose.z
      bot.yaw = pose.yaw
      bot.planks = pose.planks
    }
    if (log.items && ctx.giveItem) for (const item of log.items) ctx.giveItem(item, 1)
    bot.runLog = null
    if (panel && active === bot) {
      panel.note('')
      panel.mark(-1, '')
      panel.keys()
    }
    if (ctx.markDirty) ctx.markDirty()
    sync()
  }

  let swallowUp = false
  let swallowUntil = 0
  function markSwallow() { swallowUntil = performance.now() + 800 }
  function swallowPlace() { return armed || performance.now() < swallowUntil }
  function onDown(e) {
    if (e.button != null && e.button !== 0 && e.button !== 2) return
    if (codePanelOpen()) return
    const ui = e.target && e.target.closest && e.target.closest('#sheet, #bot-code, button, a, input')
    if (ui) return
    const bot = pick(e)
    if (bot) {
      if (e.button != null && e.button !== 0) return
      e.preventDefault()
      e.stopPropagation()
      swallowUp = true
      openFor(bot)
      return
    }
    if (!armed) return
    markSwallow()
    if (e.cancelable) e.preventDefault()
    e.stopPropagation()
    swallowUp = true
    const block = ctx.noa.targetedBlock
    if (block) tryPlace(block)
  }
  function onUp(e) {
    if (!swallowUp) return
    swallowUp = false
    e.preventDefault()
    e.stopPropagation()
  }

  function pick(e) {
    const canvas = e.target && e.target.tagName === 'CANVAS' ? e.target : scene.getEngine().getRenderingCanvas()
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const ray = scene.createPickingRay(x, y, null, scene.activeCamera)
    const hit = scene.pickWithRay(ray, (m) => !!(m && m.metadata && m.metadata.botId))
    if (!hit || !hit.hit) return null
    return findBot(hit.pickedMesh.metadata.botId)
  }

  document.addEventListener('pointerdown', onDown, true)
  document.addEventListener('pointerup', onUp, true)
  document.addEventListener('pointercancel', onUp, true)
  if (ctx.noa.on) ctx.noa.on('tick', sync)
  else requestAnimationFrame(function loop() { sync(); requestAnimationFrame(loop) })

  const orig = ctx.session && ctx.session.paintBag
  if (orig) {
    ctx.session.paintBag = function (host) {
      orig(host)
      if (ctx.botOn && !ctx.botOn()) return
      const tab = document.createElement('div')
      tab.className = 'crate-tab'
      tab.dataset.botTab = '1'
      tab.textContent = ctx.t(BOT_TAB.label)
      const wells = document.createElement('div')
      wells.className = 'wells'
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'well gtile'
      b.dataset.bot = BOT_TAB.item
      const pic = document.createElement('canvas')
      pic.width = 32
      pic.height = 32
      pic.className = 'gic'
      const pen = pic.getContext('2d')
      pen.fillStyle = '#2DD4BF'
      pen.fillRect(6, 12, 20, 16)
      pen.fillStyle = '#3B82F6'
      pen.fillRect(8, 4, 16, 10)
      pen.fillStyle = '#FF8A1F'
      pen.fillRect(10, 7, 12, 3)
      b.style.minWidth = '72px'
      b.style.minHeight = '44px'
      const lab = document.createElement('span')
      lab.className = 'bot-name'
      lab.textContent = ctx.t('botTab')
      lab.style.cssText = 'display:block;font-size:12px;font-weight:800;line-height:1.2;color:#E6EEF2;pointer-events:none;'
      b.append(pic, lab)
      b.setAttribute('aria-label', ctx.t('botTab'))
      b.title = ctx.t('botTab')
      b.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (bots.length) {
          ctx.toast(ctx.t('botHave'))
          return
        }
        armed = true
        ctx.toast(ctx.t('bertyBot'))
        if (ctx.close) ctx.close()
      })
      wells.className = 'wells bot-pin'
      wells.append(b)
      host.prepend(tab, wells)
    }
  }

  document.addEventListener('keydown', (e) => {
    if (!codePanelOpen()) return
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      const bot = active
      if (bot && bot.running) stopRun(bot)
      else { closeCodePanel(); panel = null }
      return
    }
    if (e.key === 'Enter' && e.target && e.target.classList && e.target.classList.contains('bot-run')) {
      e.preventDefault()
      if (active && !active.running) startRun(active)
    }
  }, true)

  const api = {
    dump() {
      return bots.map((b) => ({
        id: b.id, x: b.x, y: b.y, z: b.z, yaw: b.yaw, planks: b.planks,
        program: copyProgram(b.program),
      }))
    },
    load(list) {
      closeCodePanel()
      panel = null
      active = null
      while (bots.length) dropMesh(bots.pop())
      const src = Array.isArray(list) ? list : []
      for (const raw of src) {
        if (!raw || !Number.isFinite(+raw.x)) continue
        const bot = {
          id: String(raw.id || ('bot' + (seq++))),
          x: raw.x | 0, y: raw.y | 0, z: raw.z | 0,
          yaw: Number.isFinite(+raw.yaw) ? +raw.yaw : 0,
          planks: Number.isFinite(+raw.planks) ? Math.max(0, raw.planks | 0) : 16,
          program: readProgram(raw.program),
          running: false, token: 0, runLog: null,
        }
        bots.push(bot)
        meshFor(bot)
      }
      sync()
      armed = false
    },
    placeAt,
    arm() { armed = true },
    swallowPlace,
    tryArmed() {
      if (!armed) return false
      markSwallow()
      const block = ctx.noa.targetedBlock
      if (block) tryPlace(block)
      return true
    },
    openFirst() { if (bots[0]) openFor(bots[0]) },
    start() { if (bots[0]) startRun(bots[0]) },
    stop() { if (active) stopRun(active); else if (bots[0]) stopRun(bots[0]) },
    undo() { const b = active || bots[0]; if (b) undoRun(b) },
    face(yaw) {
      const b = bots[0]
      if (!b || !Number.isFinite(+yaw)) return null
      b.yaw = +yaw
      sync()
      return api.pose()
    },
    program(steps) {
      const b = bots[0]
      if (!b || b.running) return null
      b.program = readProgram({ v: 1, steps: steps || [] })
      if (panel && active === b) panel.repaint()
      if (ctx.markDirty) ctx.markDirty()
      return api.pose()
    },
    pose() {
      const b = bots[0]
      if (!b) return null
      return { x: b.x, y: b.y, z: b.z, yaw: b.yaw, planks: b.planks, running: b.running, ring: !!(b.ring && b.ring.isEnabled()), placed: b.runLog ? b.runLog.placed : 0, steps: b.program.steps.map((s) => s.id + (s.n ? ':' + s.n : '') + (s.dir ? ':' + s.dir : '')) }
    },
  }
  if (location.search.includes('smoke=1')) window.__bot = api
  return api
}
