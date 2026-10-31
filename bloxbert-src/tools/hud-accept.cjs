// Acceptance check for the Bertopia HUD (2.5.560): every control on screen, 44px or more, and the point at its centre belongs to it; Goals and Settings open and Close is reachable.
// node tools/hud-accept.cjs <base url> <tag> <width> <height> <lang> <survival|creative>   (needs playwright + a static server over the repo root)
// Acceptance: every HUD control is on screen, >= 44px, and the point at its centre belongs to it. Settings Close reachable.
const {chromium}=require('playwright')
const [,, base, tag, vw, vh, lang, mode] = process.argv
const W=+vw,H=+vh,touch=W<=915
;(async()=>{
 const b=await chromium.launch({args:['--no-sandbox','--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-dev-shm-usage']})
 const ctx=await b.newContext({viewport:{width:W,height:H},hasTouch:touch,isMobile:touch})
 await ctx.addInitScript(l=>{try{localStorage.setItem('bloxbert-lang',l);localStorage.setItem('kulibert-prefs-v1',JSON.stringify({v:1,lang:l}))}catch(e){}},lang||'en')
 const p=await ctx.newPage()
 const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/404/.test(m.text()))errs.push('console:'+m.text().slice(0,160))})
 await p.goto(base+'/',{waitUntil:'domcontentloaded',timeout:60000})
 await p.waitForSelector('#stage canvas',{timeout:120000})
 await p.waitForTimeout(5500)
 if(mode==='creative'){await p.evaluate(()=>document.getElementById('mode-creative').click());await p.waitForTimeout(1500)}
 const res={size:`${W}x${H}`,lang:lang||'en',mode:mode||'survival'}
 res.controls=await p.evaluate(()=>{
  const sel=['.kb-bar .kb-menu','.kb-bar .kb-home','.kb-bar a,.kb-bar button','#mode-survival','#mode-creative','#day-clock','#wallet-chip','#undo-btn','#redo-btn','#save-btn','#hub-back','#goals-hud','#pause-btn','#fs-btn','#hotbar .slot','#hotbar .bag-tile']
  const out=[];const seen=new Set()
  for(const s of sel)for(const e of document.querySelectorAll(s)){
   if(seen.has(e))continue;seen.add(e)
   const cs=getComputedStyle(e);if(cs.display==='none'||cs.visibility==='hidden')continue
   const r=e.getBoundingClientRect();if(r.width<2||r.height<2)continue
   const cx=r.left+r.width/2,cy=r.top+r.height/2
   const inView=r.left>=-0.5&&r.top>=-0.5&&r.right<=innerWidth+0.5&&r.bottom<=innerHeight+0.5
   const h=document.elementFromPoint(cx,cy)
   const own=!!h&&(e===h||e.contains(h)||h.contains(e))
   const name=(e.id||e.className.toString().split(' ')[0]||e.tagName)+(e.matches('#hotbar .slot')?':'+[...e.parentElement.children].indexOf(e):'')
   out.push({name,w:Math.round(r.width),h:Math.round(r.height),inView,own,hit:own?'':((h&&(h.id||h.className.toString().split(' ')[0]||h.tagName))||'none')})
  }
  return out})
 const bad=res.controls.filter(c=>!c.inView||!c.own||c.w<44||c.h<44)
 res.nControls=res.controls.length;res.bad=bad
 // Goals really opens, then Close really closes (tap through real hit-test)
 async function tapSel(sel){const el=await p.$(sel);if(!el)return false;const bb=await el.boundingBox();if(!bb)return false;const x=bb.x+bb.width/2,y=bb.y+bb.height/2;if(touch)await p.touchscreen.tap(x,y);else await p.mouse.click(x,y);return true}
 res.goalsOpen=await tapSel('#goals-hud');await p.waitForTimeout(900)
 res.goalsPanel=await p.evaluate(()=>{const s=document.getElementById('sheet');return s&&!s.hidden?s.dataset.panel:null})
 const closeInfo=async()=>p.evaluate(()=>{const x=document.getElementById('sheet-x');if(!x)return null;const r=x.getBoundingClientRect();const h=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);const hdr=document.querySelector('header.top').getBoundingClientRect(),kb=document.querySelector('.kb-bar').getBoundingClientRect();const sh=document.getElementById('sheet').getBoundingClientRect();return {close:[Math.round(r.left),Math.round(r.top),Math.round(r.right),Math.round(r.bottom)],hit:h===x||x.contains(h),barsBottom:Math.round(Math.max(hdr.bottom,kb.bottom)),sheetTop:Math.round(sh.top),inView:r.top>=0&&r.bottom<=innerHeight}})
 res.goalsClose=await closeInfo()
 if(res.goalsPanel){await tapSel('#sheet-x');await p.waitForTimeout(700)}
 // Settings via the menu
 const kbm=await p.$('.kb-bar .kb-menu');if(kbm){const bb=await kbm.boundingBox();if(touch)await p.touchscreen.tap(bb.x+bb.width/2,bb.y+bb.height/2);else await p.mouse.click(bb.x+bb.width/2,bb.y+bb.height/2)}
 await p.waitForTimeout(1200)
 res.menuOpen=await p.evaluate(()=>{const s=document.getElementById('sheet');return s&&!s.hidden?s.dataset.panel:null})
 const clicked=await p.evaluate(()=>{const bs=[...document.querySelectorAll('#sheet button')];const hit=bs.find(b=>/^(settings|налаштування|настройки|ajustes|الإعدادات|تنظیمات|igenamiterere|ቅጥዕታት)/i.test(b.textContent.trim()));if(hit){hit.scrollIntoView({block:'center'});hit.click();return hit.textContent.trim()}return null})
 await p.waitForTimeout(1200)
 res.settings=await closeInfo()
 res.settingsPanel=await p.evaluate(()=>{const s=document.getElementById('sheet');return s&&!s.hidden?s.dataset.panel:null})
 if(res.settings){await p.screenshot({path:`./${tag}-settings.png`});await tapSel('#sheet-x');await p.waitForTimeout(700)}
 res.closedAfter=await p.evaluate(()=>{const s=document.getElementById('sheet');return !s||s.hidden})
 res.errs=errs
 console.log(JSON.stringify(res))
 await b.close()
})()
