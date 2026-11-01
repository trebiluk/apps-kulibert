// Layout matrix for the Bertopia HUD (2.5.560). Needs playwright + a static server over the repo root.
// node tools/hud-matrix.cjs <base url, e.g. http://127.0.0.1:8101/bertopia> <tag> <WxH,WxH,...> <lang,...> <survival,creative> [shots]
// Env: TS=l (large text), NOSHARED=1 (block /shared/ so the shared bar is missing). Prints overlaps between HUD pieces, off-screen pieces, and targets under 44px.
const {chromium}=require('playwright')
const fs=require('fs')
const base=process.argv[2], tag=process.argv[3]
const sizes=(process.argv[4]||'1366x768,412x915,412x740,360x640,915x412,915x240,740x360').split(',').map(s=>s.split('x').map(Number))
const langs=(process.argv[5]||'en').split(',')
const modes=(process.argv[6]||'survival').split(',')
const shots=process.argv[7]==='shots'
function probe(){
 const vis=e=>{const cs=getComputedStyle(e);if(cs.display==='none'||cs.visibility==='hidden'||+cs.opacity===0)return false;const r=e.getBoundingClientRect();return r.width>1&&r.height>1}
 const units='#goals-hud,#pause-btn,#fs-btn,#path-chip,#suit-bar,#play-chip,#hotbar,#stick-pad,#jump-col,#chip-lane>*,#held-chip,#save-chip,#inspect-chip,#safe-chip,#boss-bar,#use-pill,#wand-pill,#pick-chip,#size-chip,#hotbar-name,.kb-bar,header.top'
 const leafSel='.kb-bar button,.kb-bar a,header.top button,header.top a,#hotbar .slot,#path-chip button,#t-crouch,#t-jump,#jump-col button'
 const picks=new Set([...document.querySelectorAll(units),...document.querySelectorAll(leafSel)])
 const els=[...picks].filter(e=>vis(e)&&!e.closest('#sheet,#drawer,#scrim,[hidden]'))
 const info=els.map(e=>{const r=e.getBoundingClientRect();return {e,id:e.id||e.className.toString().split(' ')[0]||e.tagName,x:r.left,y:r.top,r:r.right,b:r.bottom}})
 const out={overlaps:[],offscreen:[],small:[]}
 const W=innerWidth,H=innerHeight
 const pairs=[]
 for(let i=0;i<info.length;i++)for(let j=i+1;j<info.length;j++){const a=info[i],b=info[j]
  if(a.e.contains(b.e)||b.e.contains(a.e))continue
  const ox=Math.min(a.r,b.r)-Math.max(a.x,b.x),oy=Math.min(a.b,b.b)-Math.max(a.y,b.y)
  if(ox>3&&oy>3)pairs.push(`${a.id}~${b.id} ${Math.round(ox)}x${Math.round(oy)}`)}
 out.overlaps=pairs
 for(const a of info){if(a.x<-1||a.y<-1||a.r>W+1||a.b>H+1)out.offscreen.push(`${a.id} [${Math.round(a.x)},${Math.round(a.y)},${Math.round(a.r)},${Math.round(a.b)}]`)
  if(/BUTTON|A/.test(a.e.tagName)&&(a.r-a.x<43||a.b-a.y<43)&&!/slot|bag-tile|keys|view-chip|kd-key|tl$/.test(a.id)&&a.e.matches('button,a'))out.small.push(`${a.id} ${Math.round(a.r-a.x)}x${Math.round(a.b-a.y)}`)}
 out.topH=getComputedStyle(document.documentElement).getPropertyValue('--top-h')
 out.kbH=getComputedStyle(document.documentElement).getPropertyValue('--kb-h')
 return out}
;(async()=>{
 const b=await chromium.launch({args:['--no-sandbox','--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-dev-shm-usage']})
 const res={}
 for(const [w,h] of sizes)for(const lang of langs)for(const mode of modes){
  const touch=w<=915
  const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:touch,isMobile:touch})
  await ctx.addInitScript(([l,ts])=>{try{localStorage.setItem('bloxbert-lang',l);localStorage.setItem('kulibert-prefs-v1',JSON.stringify({v:1,lang:l}));if(ts)localStorage.setItem('bloxbert-text',ts)}catch(e){}},[lang,process.env.TS||''])
  const p=await ctx.newPage()
  const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/404/.test(m.text()))errs.push('console:'+m.text().slice(0,140))})
  if(process.env.NOSHARED)await p.route('**/shared/**',r=>r.abort())
  await p.goto(base+'/',{waitUntil:'domcontentloaded',timeout:60000})
  await p.waitForSelector('#stage canvas',{timeout:120000})
  await p.waitForTimeout(5500)
  if(mode==='creative'){await p.evaluate(()=>{const c=document.getElementById('mode-creative');c&&c.click()});await p.waitForTimeout(1500)}
  const r=await p.evaluate(probe)
  r.errs=errs
  const key=`${w}x${h}-${lang}-${mode}${process.env.TS?'-ts'+process.env.TS:''}${process.env.NOSHARED?'-noshared':''}`
  res[key]=r
  console.log(key,JSON.stringify(r))
  if(shots)await p.screenshot({path:`./${tag}-${key}.png`})
  await ctx.close()
 }
 fs.writeFileSync(`./${tag}-matrix.json`,JSON.stringify(res,null,1))
 await b.close()
})()
