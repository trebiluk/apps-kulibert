// 2.5.561 in-engine repro paths for the unstick fix. Needs playwright and a built blocks-test (it has __blocks.basics and __blocks.unstick).
// node tools/unstick-scenes.cjs <url of the blocks-test folder, e.g. http://127.0.0.1:8101/blocks-test> <label> <width> <height>
// For each of Survival and Creative it runs: a block put back on the player by Redo (at the feet, at the waist, in a sealed 1x1 room),
// a sapling growing under or beside the player, and a slide door auto-closing in the doorway. It prints whether the player ends up
// inside a solid block, bobbing, or unable to walk. After the fix every path should print trapped:false.
// It then loads ?use=chair&brief=1 and runs three held states: seated on a chair, asleep in a bed, and at the Build Table.
// In each, an undo puts a block where the player is; the player must not move while held, and after stand / wake / close
// they must end trapped:false. Set CHROME=/path/to/chrome to use a system browser instead of the playwright one.
const {chromium}=require('playwright')
const [,, base, label, vw, vh] = process.argv
const W=+vw,H=+vh,touch=W<=915
;(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME||undefined,args:['--no-sandbox','--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-dev-shm-usage']})
 const ctx=await b.newContext({viewport:{width:W,height:H},hasTouch:touch,isMobile:touch})
 const p=await ctx.newPage()
 const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/404/.test(m.text()))errs.push('console:'+m.text().slice(0,160))})
 await p.goto(base+'/?smoke=1',{waitUntil:'domcontentloaded',timeout:60000})
 await p.waitForFunction(()=>window.__blocks&&window.__bloxReady&&window.__blocks.basics,{timeout:120000})
 await p.waitForTimeout(4000)
 // independent test-side helpers
 await p.evaluate(()=>{
  const B=window.__blocks,noa=B.noa
  window.T={
   overlap(px,py,pz){const w=0.6,h=1.8,e=0.02;let hit=false
    for(let x=Math.floor(px-w/2+e);x<=Math.floor(px+w/2-e);x++)for(let y=Math.floor(py+e);y<=Math.floor(py+h-e);y++)for(let z=Math.floor(pz-w/2+e);z<=Math.floor(pz+w/2-e);z++){const id=B.getVoxel(x,y,z);if(id&&noa.registry.getBlockSolidity(id))hit=true}
    return hit},
   pos(){const p=noa.entities.getPosition(noa.playerEntity);return [p[0],p[1],p[2]]},
   clear(x0,x1,y0,y1,z0,z1){for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++)for(let z=z0;z<=z1;z++)B.setVoxel(x,y,z,0)},
   platform(){for(let x=292;x<=310;x++)for(let z=292;z<=310;z++)B.setVoxel(x,20,z,3)},
   stand(x,y,z){const body=noa.ents.getPhysicsBody(noa.playerEntity);body.gravityMultiplier=3.2;body.velocity[0]=body.velocity[1]=body.velocity[2]=0;B.tp(x,y,z);noa.camera.heading=0;noa.camera.pitch=0},
   hover(x,y,z){const body=noa.ents.getPhysicsBody(noa.playerEntity);body.gravityMultiplier=0;body.velocity[0]=body.velocity[1]=body.velocity[2]=0;B.tp(x,y,z)},
  }
  window.T.platform()
 })
 await p.waitForTimeout(1500)
 const sleep=ms=>p.waitForTimeout(ms)
 const pos=()=>p.evaluate(()=>window.T.pos())
 // can the player walk? hold forward for 1.2s and measure
 async function walk(){const a=await pos();await p.evaluate(()=>{window.__blocks.noa.inputs.state.forward=true});await sleep(1200);await p.evaluate(()=>{window.__blocks.noa.inputs.state.forward=false});const c=await pos();return Math.hypot(c[0]-a[0],c[2]-a[2])}
 async function verdict(){
  await sleep(700)
  const first=await pos();const inside0=await p.evaluate(([x,y,z])=>window.T.overlap(x,y,z),first)
  let insideN=0,ymin=1e9,ymax=-1e9,xzmax=0,n=0
  for(let i=0;i<10;i++){const q=await pos();n++;if(await p.evaluate(([x,y,z])=>window.T.overlap(x,y,z),q))insideN++;ymin=Math.min(ymin,q[1]);ymax=Math.max(ymax,q[1]);xzmax=Math.max(xzmax,Math.hypot(q[0]-first[0],q[2]-first[2]));await sleep(150)}
  const q=await pos();const insideEnd=await p.evaluate(([x,y,z])=>window.T.overlap(x,y,z),q)
  const moved=await walk()
  const bad=inside0||insideEnd||insideN>2||(ymax-ymin)>0.35||moved<1
  return {pos:q.map(n=>+n.toFixed(2)),inside:insideEnd,insideSamples:insideN+'/'+n,ySpan:+(ymax-ymin).toFixed(2),drift:+xzmax.toFixed(2),walked:+moved.toFixed(2),trapped:bad}}
 const results={}
 for(const mode of ['survival','creative']){
  await p.evaluate((m)=>window.__blocks.mode(m),mode)
  await sleep(700)
  const R={}
  // S1 block at the feet: place away, undo, step in, redo
  await p.evaluate(()=>{const T=window.T,B=window.__blocks;T.clear(298,304,21,30,298,304);T.stand(304.5,21,301.5)})
  await sleep(1200)
  await p.evaluate(()=>{window.__blocks.applyEdit([[301,21,301,3]])})
  await sleep(300)
  await p.evaluate(()=>window.__blocks.undo())
  await sleep(300)
  await p.evaluate(()=>window.T.stand(301.5,21,301.5))
  await sleep(1200)
  await p.evaluate(()=>window.__blocks.redo())
  R.undoRedoFeet=await verdict()
  // S2 block at the waist
  await p.evaluate(()=>{const T=window.T;T.clear(298,304,21,30,298,304);T.stand(304.5,21,301.5)})
  await sleep(1200)
  await p.evaluate(()=>{window.__blocks.applyEdit([[301,22,301,3]])})
  await sleep(300)
  await p.evaluate(()=>window.__blocks.undo())
  await sleep(300)
  await p.evaluate(()=>window.T.stand(301.5,21,301.5))
  await sleep(1200)
  await p.evaluate(()=>window.__blocks.redo())
  R.undoRedoWaist=await verdict()
   // S6 sealed 1x1 room: walls, roof, then redo puts a block at the waist
  await p.evaluate(()=>{const T=window.T,B=window.__blocks;T.clear(296,306,21,30,296,306);for(let y=21;y<=23;y++)for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]])B.setVoxel(301+dx,y,301+dz,3);for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)B.setVoxel(301+dx,24,301+dz,3);T.stand(301.5,21,301.5)})
  await sleep(1200)
  await p.evaluate(()=>{window.__blocks.applyEdit([[301,22,301,3]])})
  await sleep(300)
  await p.evaluate(()=>window.__blocks.undo())
  await sleep(300)
  await p.evaluate(()=>window.T.stand(301.5,21,301.5))
  await sleep(1200)
  await p.evaluate(()=>window.__blocks.redo())
  R.sealedRoomWaist=await verdict()
  await p.evaluate(()=>{window.T.clear(296,306,21,30,296,306)})
  // S3 the player stands on top of a sapling when it grows (the sapling is solid, so this is the real way to be in the trunk)
  await p.evaluate(()=>{const T=window.T,B=window.__blocks;T.clear(296,306,21,30,296,306);B.setVoxel(301,21,301,185);B.basics.saw(301,21,301,185);T.stand(301.5,22,301.5)})
  await sleep(1200)
  await p.evaluate(()=>window.__blocks.basics.clock(9*60*1000))
  const waiting3=await p.evaluate(()=>window.__blocks.getVoxel(301,21,301)===185)
  R.treeTrunk=await verdict()
  R.treeTrunk.treeWaitedForPlayer=waiting3
  // step away, let it grow
  await p.evaluate(()=>window.T.stand(306.5,21,306.5))
  await sleep(800)
  await p.evaluate(()=>window.__blocks.basics.clock(1000))
  R.treeTrunk.grewAfterStepAway=await p.evaluate(()=>window.__blocks.getVoxel(301,22,301)===11&&window.__blocks.getVoxel(301,21,301)===11)
  // S4 the player is in the air where leaves would grow (a jump, or flying): held there by the test while the tree grows
  await p.evaluate(()=>{const T=window.T,B=window.__blocks;T.clear(296,306,21,30,296,306);B.setVoxel(301,21,301,185);B.basics.saw(301,21,301,185);window.__hold=setInterval(()=>T.hover(302.5,24.0,301.5),25)})
  await sleep(900)
  await p.evaluate(()=>window.__blocks.basics.clock(9*60*1000))
  await sleep(300)
  const l=await p.evaluate(()=>{const q=window.T.pos();return {inside:window.T.overlap(q[0],q[1],q[2]),waiting:window.__blocks.getVoxel(301,21,301)===185}})
  await p.evaluate(()=>{clearInterval(window.__hold);window.T.stand(306.5,21,306.5)})
  R.treeLeaves={trapped:l.inside,inside:l.inside,insideSamples:'-',ySpan:0,drift:0,walked:0,pos:[302.5,24,301.5],treeWaitedForPlayer:l.waiting}
  // S5 slide door auto-closes in the doorway
  await p.evaluate(()=>{const T=window.T,B=window.__blocks;T.clear(296,306,21,30,296,306);B.setVoxel(301,21,301,36);B.setVoxel(301,22,301,56);T.stand(303.5,21,301.5)})
  await sleep(1200)
  await p.evaluate(()=>window.__blocks.basics.use(301,21,301))
  await sleep(300)
  await p.evaluate(()=>window.T.stand(301.5,21,301.5))
  await sleep(1200)
  await p.evaluate(()=>window.__blocks.basics.clock(3500))
  const open6=await p.evaluate(()=>window.__blocks.getVoxel(301,21,301)===37)
  R.doorAutoClose=await verdict()
  R.doorAutoClose.doorWaitedForPlayer=open6
  await p.evaluate(()=>window.T.stand(306.5,21,306.5))
  await sleep(800)
  await p.evaluate(()=>window.__blocks.basics.clock(600))
  R.doorAutoClose.closedAfterStepAway=await p.evaluate(()=>window.__blocks.getVoxel(301,21,301)===36)
  results[mode]=R
 }
 // held states: seated, asleep, Build Table. Fresh page with the ?use= and ?brief= test hooks.
 const q=await ctx.newPage()
 q.on('pageerror',e=>errs.push('held:'+e.message))
 await q.goto(base+'/?smoke=1&use=chair&brief=1',{waitUntil:'domcontentloaded',timeout:60000})
 await q.waitForFunction(()=>window.__blocks&&window.__bloxReady&&window.__useReady&&window.__use&&window.__brief,{timeout:120000})
 await q.waitForTimeout(2500)
 await q.evaluate(()=>{const B=window.__blocks,noa=B.noa
  window.T={
   overlap(px,py,pz){const w=0.6,h=1.8,e=0.02;let hit=false
    for(let x=Math.floor(px-w/2+e);x<=Math.floor(px+w/2-e);x++)for(let y=Math.floor(py+e);y<=Math.floor(py+h-e);y++)for(let z=Math.floor(pz-w/2+e);z<=Math.floor(pz+w/2-e);z++){const id=B.getVoxel(x,y,z);if(id&&noa.registry.getBlockSolidity(id))hit=true}
    return hit},
   pos(){const p=noa.entities.getPosition(noa.playerEntity);return [p[0],p[1],p[2]]},
   // an undo-able edit: put the blocks, then take them away; the next undo puts them back
   arm(cells){B.applyEdit(cells.map(c=>[c[0],c[1],c[2],3]));B.applyEdit(cells.map(c=>[c[0],c[1],c[2],0]))},
   drop(cells){for(const c of cells)B.setVoxel(c[0],c[1],c[2],0)},
  }})
 const qs=ms=>q.waitForTimeout(ms)
 const qpos=()=>q.evaluate(()=>window.T.pos())
 async function qwalk(){const a=await qpos();await q.evaluate(()=>{window.__blocks.noa.inputs.state.forward=true});await qs(1200);await q.evaluate(()=>{window.__blocks.noa.inputs.state.forward=false});const c=await qpos();return Math.hypot(c[0]-a[0],c[2]-a[2])}
 async function qverdict(){
  await qs(700)
  const first=await qpos();const inside0=await q.evaluate(([x,y,z])=>window.T.overlap(x,y,z),first)
  let insideN=0,ymin=1e9,ymax=-1e9,n=0
  for(let i=0;i<10;i++){const r=await qpos();n++;if(await q.evaluate(([x,y,z])=>window.T.overlap(x,y,z),r))insideN++;ymin=Math.min(ymin,r[1]);ymax=Math.max(ymax,r[1]);await qs(150)}
  const r=await qpos();const insideEnd=await q.evaluate(([x,y,z])=>window.T.overlap(x,y,z),r)
  const moved=await qwalk()
  return {pos:r.map(n=>+n.toFixed(2)),inside:insideEnd,insideSamples:insideN+'/'+n,ySpan:+(ymax-ymin).toFixed(2),walked:+moved.toFixed(2),trapped:inside0||insideEnd||insideN>2||(ymax-ymin)>0.35||moved<1}}
 const same=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2])<0.05
 const held={}
 // H1 seated on the chair the ?use=chair hook places at 2,6,4. Undo puts blocks at the waist and where standing up lands (heading PI, so z-0.85).
 {
  const cells=[[2,7,4],[2,6,3],[2,7,3]]
  await q.evaluate(()=>{const B=window.__blocks;for(let x=1;x<=3;x++)for(let z=1;z<=3;z++)B.setVoxel(x,5,z,3)})
  await q.evaluate((c)=>window.T.arm(c),cells)
  const sat=await q.evaluate(()=>{window.__use.press();return window.__use.sit()})
  await qs(500)
  const a=await qpos()
  const undid=await q.evaluate(()=>window.__blocks.undo())
  await qs(800)
  const b2=await qpos()
  const stillSeated=!!(await q.evaluate(()=>window.__use.sit()))
  const blockOn=await q.evaluate(([x,y,z])=>window.T.overlap(x,y,z),b2)
  await q.evaluate(()=>window.__use.stand())
  const v=await qverdict()
  held.seated={sat:!!sat,undid,blockOnPlayerWhileHeld:blockOn,heldPos:b2.map(n=>+n.toFixed(2)),notMovedWhileHeld:same(a,b2)&&stillSeated,after:v,pass:!!sat&&undid&&blockOn&&same(a,b2)&&stillSeated&&!v.trapped}
  await q.evaluate((c)=>{window.T.drop(c);window.__blocks.unstick()},cells)
 }
 // H2 asleep in a bed: a bunk at 6,6,1-2, player lying on it at night, sleep, undo while the sleep fade is up (sleepBusy), then wake.
 // The undo cells are taken from where the player actually is on the bed, one and two blocks up from the feet.
 {
  await q.evaluate(()=>{const B=window.__blocks,T=window.T;for(let x=5;x<=7;x++)for(let z=0;z<=3;z++){B.setVoxel(x,5,z,3);for(let y=6;y<=9;y++)B.setVoxel(x,y,z,0)}B.setVoxel(6,6,1,26);B.setVoxel(6,6,2,26)})
  await q.evaluate(()=>{const n=window.__blocks.noa,body=n.ents.getPhysicsBody(n.playerEntity);body.velocity[0]=body.velocity[1]=body.velocity[2]=0;window.__blocks.tp(6.5,6.6,1.5)})
  await qs(600)
  const a=await qpos()
  const bedUnder=await q.evaluate(([x,y,z])=>window.__blocks.getVoxel(Math.floor(x),Math.floor(y),Math.floor(z))===26,a)
  const fx=Math.floor(a[0]),fy=Math.floor(a[1]),fz=Math.floor(a[2])
  const cells=[[fx,fy+1,fz],[fx,fy+2,fz]]
  await q.evaluate((c)=>window.T.arm(c),cells)
  await q.evaluate(()=>window.__use.night())
  await qs(200)
  const a2=await qpos()
  const slept=await q.evaluate(()=>window.__use.sleep())
  await qs(100)
  const undid=await q.evaluate(()=>window.__blocks.undo())
  await qs(300)
  const b2=await qpos()
  const blockOn=await q.evaluate(([x,y,z])=>window.T.overlap(x,y,z),b2)
  await qs(1200) // wake fires at 700ms
  const v=await qverdict()
  held.asleep={bedUnder,slept,undid,blockOnPlayerWhileHeld:blockOn,heldPos:b2.map(n=>+n.toFixed(2)),notMovedWhileHeld:same(a2,b2),after:v,pass:bedUnder&&slept==='night'&&undid&&blockOn&&same(a2,b2)&&!v.trapped}
  await q.evaluate((c)=>{window.T.drop(c);window.__blocks.unstick();window.__use.morning()},cells)
 }
 // H3 Build Table open: setMode(true) parks the player at 8.5,12,8.5. Undo puts blocks there; then the table is closed.
 {
  const cells=[[8,12,8],[8,13,8]]
  await q.evaluate(()=>{const B=window.__blocks;for(let x=7;x<=9;x++)for(let z=7;z<=9;z++)for(let y=12;y<=14;y++)B.setVoxel(x,y,z,0)})
  await q.evaluate((c)=>window.T.arm(c),cells)
  await q.evaluate(()=>document.getElementById('m-table').click())
  await qs(600)
  const open=await q.evaluate(()=>document.body.classList.contains('table'))
  const a=await qpos()
  const undid=await q.evaluate(()=>window.__blocks.undo())
  await qs(800)
  const b2=await qpos()
  const blockOn=await q.evaluate(([x,y,z])=>window.T.overlap(x,y,z),b2)
  const stillOpen=await q.evaluate(()=>document.body.classList.contains('table'))
  await q.evaluate(()=>document.getElementById('m-survival').click())
  await qs(600)
  const closed=await q.evaluate(()=>!document.body.classList.contains('table'))
  const v=await qverdict()
  held.buildTable={open,undid,blockOnPlayerWhileHeld:blockOn,heldPos:b2.map(n=>+n.toFixed(2)),notMovedWhileHeld:same(a,b2)&&stillOpen,closed,after:v,pass:open&&undid&&blockOn&&same(a,b2)&&stillOpen&&closed&&!v.trapped}
 }
 results.held=held
 console.log(JSON.stringify({label,size:`${W}x${H}`,results,errs}))
 await b.close()
})()
