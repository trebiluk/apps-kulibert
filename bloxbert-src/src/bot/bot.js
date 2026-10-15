import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { BOT_TAB } from '../items.js'
import { readProgram } from './program.js'
import { openCodePanel, closeCodePanel, codePanelOpen } from './code-panel.js'

function dye(scene, name, hex) {
  const mat = new StandardMaterial(name, scene)
  const n = parseInt(hex.slice(1), 16)
  const color = new Color3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
  mat.diffuseColor = color
  mat.emissiveColor = color.scale(0.35)
  mat.specularColor = new Color3(0.05, 0.05, 0.05)
  return mat
}

export function initBot(ctx) {
  const bots = []
  let armed = false
  let seq = 1
  const scene = ctx.noa.rendering.getScene()
  const teal = dye(scene, 'bot-teal', '#2DD4BF')
  const blue = dye(scene, 'bot-blue', '#3B82F6')
  const orange = dye(scene, 'bot-orange', '#FF8A1F')

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
    root.isPickable = true
    for (const part of [root, body, head, eye]) {
      part.isPickable = true
      if (ctx.noa.rendering.addMeshToScene) ctx.noa.rendering.addMeshToScene(part, false)
    }
    bot.mesh = root
    return root
  }

  function dropMesh(bot) {
    if (!bot.mesh) return
    bot.mesh.getChildMeshes().forEach((m) => m.dispose())
    bot.mesh.dispose()
    bot.mesh = null
  }

  function sync() {
    for (const bot of bots) {
      if (!bot.mesh) continue
      const lp = ctx.noa.globalToLocal([bot.x + 0.5, bot.y + 1, bot.z + 0.5], null, [0, 0, 0])
      bot.mesh.position.set(lp[0], lp[1], lp[2])
      bot.mesh.rotation.y = bot.yaw
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
    const bot = { id: 'bot' + (seq++), x, y, z, yaw, program: readProgram(null) }
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

  function openFor(bot) {
    if (!bot) return
    openCodePanel({
      t: ctx.t,
      program: bot.program,
      onChange: () => { if (ctx.markDirty) ctx.markDirty() },
    })
  }

  let swallowUp = false
  function onDown(e) {
    if (e.button != null && e.button !== 0) return
    if (codePanelOpen()) return
    const ui = e.target && e.target.closest && e.target.closest('#sheet, #bot-code, button, a, input')
    if (ui) return
    const bot = pick(e)
    if (bot) {
      e.preventDefault()
      e.stopPropagation()
      swallowUp = true
      openFor(bot)
      return
    }
    if (!armed) return
    const block = ctx.noa.targetedBlock
    if (!block || !block.position) return
    const x = Math.round(block.position[0])
    const y = Math.round(block.position[1])
    const z = Math.round(block.position[2])
    if (!ctx.getVoxel(x, y, z) || ctx.getVoxel(x, y + 1, z)) return
    e.preventDefault()
    e.stopPropagation()
    swallowUp = true
    tryPlace(block)
  }
  function onUp(e) {
    if (!swallowUp) return
    swallowUp = false
    e.preventDefault()
    e.stopPropagation()
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
      const lab = document.createElement('span')
      lab.className = 'bot-name'
      lab.textContent = ctx.t('bertyBot')
      lab.style.cssText = 'position:absolute;left:50%;top:100%;transform:translateX(-50%);font-size:12px;font-weight:800;line-height:1.2;white-space:nowrap;color:#E6EEF2;pointer-events:none;'
      b.append(pic, lab)
      b.setAttribute('aria-label', ctx.t('bertyBot'))
      b.title = ctx.t('bertyBot')
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
      wells.append(b)
      host.append(tab, wells)
    }
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && codePanelOpen()) {
      e.preventDefault()
      e.stopPropagation()
      closeCodePanel()
    }
  }, true)

  const api = {
    dump() {
      return bots.map((b) => ({ id: b.id, x: b.x, y: b.y, z: b.z, yaw: b.yaw, program: { v: 1, steps: b.program.steps.slice() } }))
    },
    load(list) {
      closeCodePanel()
      while (bots.length) dropMesh(bots.pop())
      const src = Array.isArray(list) ? list : []
      for (const raw of src) {
        if (!raw || !Number.isFinite(+raw.x)) continue
        const bot = {
          id: String(raw.id || ('bot' + (seq++))),
          x: raw.x | 0, y: raw.y | 0, z: raw.z | 0,
          yaw: Number.isFinite(+raw.yaw) ? +raw.yaw : 0,
          program: readProgram(raw.program),
        }
        bots.push(bot)
        meshFor(bot)
      }
      sync()
      armed = false
    },
    placeAt,
    arm() { armed = true },
    openFirst() { if (bots[0]) openFor(bots[0]) },
  }
  if (location.search.includes('smoke=1')) window.__bot = api
  return api
}
