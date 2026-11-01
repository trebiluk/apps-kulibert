/* Pinchy 3D view. Three.js r149 is vendored in vendor/three.min.js. No network. */
(function (root) {
  "use strict";
  if (!root.THREE) return;
  var THREE = root.THREE;
  var CLEAR = 0x06122b;
  var views = {};

  function srgbColor(color, hex) {
    color.setHex(hex).convertSRGBToLinear();
    return color;
  }

  function mat(color, metal, rough, opacity) {
    if (rough < 0.3) rough = 0.3;
    var m = new THREE.MeshStandardMaterial({
      color: color,
      metalness: metal,
      roughness: rough,
      envMapIntensity: 1
    });
    if (opacity != null && opacity < 1) {
      m.transparent = true;
      m.opacity = opacity;
      m.depthWrite = false;
    }
    return m;
  }

  var MATS = {
    link: mat(0x2b2824, 0, 0.32),
    pocket: mat(0x1a1816, 0, 0.5),
    servo: mat(0x1f2226, 0.15, 0.35),
    horn: mat(0xe8b400, 0.3, 0.38),
    hornB: mat(0x2f8f8a, 0.3, 0.38),
    screw: mat(0x9a958c, 0.85, 0.3),
    pad: mat(0x3a3f45, 0, 0.85),
    table: mat(0xc9d3db, 0, 0.9),
    ghost: mat(0xc5ceda, 0, 0.6, 0.35),
    grid: mat(0x132a5c, 0, 0.8),
    gridOn: mat(0x22d3ee, 0.1, 0.45),
    red: mat(0xc45a4a, 0, 0.55),
    blue: mat(0x3b82f6, 0, 0.5),
    part: mat(0xf0a830, 0, 0.5),
    partB: mat(0x7d8fa3, 0, 0.55),
    bin: mat(0x4f7392, 0, 0.6),
    stop: mat(0x3a3f45, 0, 0.7),
    belt: mat(0x2f3338, 0, 0.85),
    hot: mat(0xe8b400, 0.2, 0.4)
  };
  // 1.7.x graphics pass: bins, stops and joints had no material (they drew flat white). Give them real ones.
  MATS.joint = MATS.bin;
  MATS.edge = new THREE.LineBasicMaterial({ color: 0x1d1b18 });
  var EDGE_GEO = {};
  function edgesFor(geo, key) {
    if (!EDGE_GEO[key]) EDGE_GEO[key] = new THREE.EdgesGeometry(geo);
    return EDGE_GEO[key];
  }
  var BOX_GEO = {};
  function boxGeo(w, h, d) {
    var key = w + "x" + h + "x" + d;
    if (!BOX_GEO[key]) BOX_GEO[key] = new THREE.BoxGeometry(w, h, d);
    return BOX_GEO[key];
  }
  function outlined(geo, material, key) {
    var m = new THREE.Mesh(geo, material);
    var line = new THREE.LineSegments(edgesFor(geo, key), MATS.edge);
    line.userData.sharedGeo = true;
    m.userData.sharedGeo = true;
    m.add(line);
    return m;
  }
  // A soft round shadow drawn once to a canvas: cheap contact shadows while real shadows stay off.
  var BLOB = null;
  function blobTexture() {
    if (BLOB) return BLOB;
    var cv = document.createElement("canvas");
    cv.width = cv.height = 64;
    var ctx = cv.getContext("2d");
    var g = ctx.createRadialGradient(32, 32, 2, 32, 32, 31);
    g.addColorStop(0, "rgba(0,0,0,0.45)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    BLOB = new THREE.CanvasTexture(cv);
    return BLOB;
  }
  var BLOB_MAT = null;
  function blob(size) {
    if (!BLOB_MAT) BLOB_MAT = new THREE.MeshBasicMaterial({ map: blobTexture(), transparent: true, depthWrite: false });
    var m = new THREE.Mesh(planeGeo(), BLOB_MAT);
    m.userData.sharedGeo = true;
    m.rotation.x = -Math.PI / 2;
    m.scale.set(size, size, 1);
    m.position.y = 0.9;
    return m;
  }
  var PLANE = null;
  function planeGeo() {
    if (!PLANE) PLANE = new THREE.PlaneGeometry(1, 1);
    return PLANE;
  }

  function vec(reach, height, yawDeg) {
    var a = (yawDeg || 0) * Math.PI / 180;
    return new THREE.Vector3(Math.sin(a) * reach, height, Math.cos(a) * reach);
  }

  function addBone(parent, a, b, radius, material) {
    var dir = new THREE.Vector3().subVectors(b, a);
    var len = Math.max(0.2, dir.length());
    var mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 0.9, len, 10), material);
    mesh.position.copy(a).lerp(b, 0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    parent.add(mesh);
    return mesh;
  }

  function addJoint(parent, p, radius, hot) {
    var mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 14, 12), hot ? MATS.hot : MATS.joint);
    mesh.position.copy(p);
    parent.add(mesh);
  }

  var labelQueue = [];
  function addLabel(parent, text, position) {
    labelQueue.push({ text: text, position: position.clone() });
  }
  // 0055: the place to go ("thick mark") has a label that pulses gently (CSS; still when reduced motion is on).
  function addMark(text, position) {
    labelQueue.push({ text: text, position: position.clone(), mark: true });
  }
  // 0055: a thick dashed ring on the floor marks the target by shape, not only by colour.
  var RING_MAT = null;
  function dashedRing(radius, thick) {
    if (!RING_MAT) RING_MAT = new THREE.MeshBasicMaterial({ color: 0x1d1b18, side: THREE.DoubleSide });
    var g = new THREE.Group();
    var n = 14;
    var step = Math.PI * 2 / n;
    for (var k = 0; k < n; k++) {
      var seg = new THREE.Mesh(new THREE.RingGeometry(radius - thick / 2, radius + thick / 2, 6, 1, k * step, step * 0.6), RING_MAT);
      seg.rotation.x = -Math.PI / 2;
      g.add(seg);
    }
    return g;
  }
  // Two small line icons, one per arm, so the chips tell the arms apart without colour.
  var CHIP_ICON = {
    berty: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path d="M4 20h7M7 20V11l8-5 4 5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="7" cy="11" r="1.6" fill="currentColor"/><circle cx="15" cy="6" r="1.6" fill="currentColor"/></svg>',
    bizzy: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path d="M13 20h7M17 20V11L9 6 5 11" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="17" cy="11" r="1.6" fill="currentColor"/><circle cx="9" cy="6" r="1.6" fill="currentColor"/></svg>'
  };
  function addChip(who, text, title, position) {
    labelQueue.push({ chip: who, text: text, title: title, position: position.clone() });
  }

  function labelLayer(canvas) {
    var layer = canvas._labels;
    if (layer && layer.isConnected) return layer;
    var wrap = canvas.parentNode;
    if (!wrap) return null;
    layer = document.createElement("div");
    layer.className = "scene-labels";
    layer.setAttribute("aria-hidden", "true");
    wrap.appendChild(layer);
    canvas._labels = layer;
    return layer;
  }

  function placeLabels(canvas, camera) {
    var layer = labelLayer(canvas);
    if (!layer) return;
    var w = canvas.clientWidth || 0;
    var h = canvas.clientHeight || 0;
    layer.replaceChildren();
    if (w < 2 || h < 2) return;
    var host = layer.getBoundingClientRect();
    var placed = [];
    var i, item, p, x, y, span, box, k, dx, dy, ang, rad, ok, j, other;
    // The two arm chips are placed first, so a crowded view never drops them.
    // The target's label goes right after them (0055), so a small view keeps the place to go.
    var ordered = labelQueue.filter(function (q) { return q.chip; })
      .concat(labelQueue.filter(function (q) { return !q.chip && q.mark; }))
      .concat(labelQueue.filter(function (q) { return !q.chip && !q.mark; }));
    for (i = 0; i < ordered.length; i++) {
      item = ordered[i];
      p = item.position.clone().project(camera);
      if (p.z < -1 || p.z > 1) continue;
      x = (p.x * 0.5 + 0.5) * w;
      y = (-p.y * 0.5 + 0.5) * h;
      span = document.createElement("span");
      if (item.chip) {
        span.className = "chip3d";
        span.innerHTML = CHIP_ICON[item.chip] + "<b></b>";
        // On a small view the arm tags show only the name, so they cover less of the arms.
        span.lastChild.textContent = h < 170 ? String(item.text).split(" \u00b7 ")[0] : item.text;
        if (item.title) span.title = item.title;
      } else {
        span.textContent = item.text;
        if (item.mark) span.className = "is-mark";
      }
      span.style.left = x + "px";
      span.style.top = y + "px";
      layer.appendChild(span);
      box = span.getBoundingClientRect();
      var bw = box.width;
      var bh = box.height;
      ok = false;
      var cx = x;
      var cy = y;
      for (k = 0; k < 30 && !ok; k++) {
        rad = k === 0 ? 0 : 8 + k * 9;
        ang = k * 2.4;
        dx = Math.cos(ang) * rad;
        dy = Math.sin(ang) * rad * 0.7;
        cx = x + dx;
        cy = y + dy;
        var left = host.left + cx - bw / 2;
        var top = host.top + cy - bh / 2;
        if (left < host.left + 1 || left + bw > host.right - 1 || top < host.top + 1 || top + bh > host.bottom - 1) continue;
        ok = true;
        for (j = 0; j < placed.length; j++) {
          other = placed[j];
          if (left < other.right + 3 && left + bw > other.left - 3 && top < other.bottom + 3 && top + bh > other.top - 3) ok = false;
        }
        if (ok) placed.push({ left: left, right: left + bw, top: top, bottom: top + bh });
      }
      if (!ok) span.remove();
      else {
        span.style.left = cx + "px";
        span.style.top = cy + "px";
      }
    }
  }

  function create(canvas) {
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: false,
        powerPreference: "low-power",
        preserveDrawingBuffer: true
      });
    } catch (err) {
      return { render: function () {}, resize: function () {}, failed: true };
    }
    renderer.setClearColor(CLEAR, 1);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.enabled = false;
    canvas.style.width = "";
    canvas.style.height = "";
    var scene = new THREE.Scene();
    scene.background = new THREE.Color(CLEAR);
    scene.environmentIntensity = 0.5;
    var camera = new THREE.PerspectiveCamera(34, 1, 1, 4000);
    camera.position.set(340, 230, 320);
    camera.lookAt(0, 78, 70);
    var hemi = new THREE.HemisphereLight(0xf4f0e6, 0x8c8273, 0.6);
    scene.add(hemi);
    var key = new THREE.DirectionalLight(0xfff6e8, 2.2);
    var keyDir = new THREE.Vector3(-3, 5, 4).normalize();
    key.position.copy(keyDir).multiplyScalar(480);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.bias = -0.0004;
    key.shadow.camera.near = 20;
    key.shadow.camera.far = 980;
    key.shadow.camera.left = -220;
    key.shadow.camera.right = 220;
    key.shadow.camera.top = 220;
    key.shadow.camera.bottom = -220;
    scene.add(key);
    scene.add(key.target);
    try {
      var room = new THREE.Scene();
      var boxGeo = new THREE.BoxGeometry();
      boxGeo.deleteAttribute("uv");
      var roomMat = new THREE.MeshStandardMaterial({ side: THREE.BackSide, roughness: 0.8, metalness: 0 });
      var boxMat = new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0 });
      var roomMesh = new THREE.Mesh(boxGeo, roomMat);
      roomMesh.position.set(-0.757, 13.219, 0.717);
      roomMesh.scale.set(31.713, 28.305, 28.591);
      room.add(roomMesh);
      var boxes = [
        [-10.906, 2.009, 1.846, 0, -0.195, 2.328, 7.905, 4.651],
        [-5.607, -0.754, -0.758, 0, 0.994, 1.97, 1.534, 3.955],
        [6.167, 0.857, 7.803, 0, 0.561, 3.927, 6.285, 3.687],
        [-2.017, 0.018, 6.124, 0, 0.333, 2.002, 4.566, 2.064],
        [2.291, -0.756, -2.621, 0, -0.286, 1.546, 1.552, 1.496],
        [-2.193, -0.369, -5.547, 0, 0.516, 3.875, 3.487, 2.986]
      ];
      var bi;
      for (bi = 0; bi < boxes.length; bi++) {
        var bd = boxes[bi];
        var wall = new THREE.Mesh(boxGeo, boxMat);
        wall.position.set(bd[0], bd[1], bd[2]);
        wall.rotation.set(bd[3], bd[4], 0);
        wall.scale.set(bd[5], bd[6], bd[7]);
        room.add(wall);
      }
      function areaLight(intensity, x, y, z, sx, sy, sz) {
        var lite = new THREE.MeshBasicMaterial();
        lite.color.setScalar(intensity);
        var pane = new THREE.Mesh(boxGeo, lite);
        pane.position.set(x, y, z);
        pane.scale.set(sx, sy, sz);
        room.add(pane);
      }
      areaLight(50, -16.116, 14.37, 8.208, 0.1, 2.428, 2.739);
      areaLight(50, -16.109, 18.021, -8.207, 0.1, 2.425, 2.751);
      areaLight(17, 14.904, 12.198, -1.832, 0.15, 4.265, 6.331);
      areaLight(43, -0.462, 8.89, 14.52, 4.38, 5.441, 0.088);
      areaLight(20, 3.235, 11.486, -12.541, 2.5, 2, 0.1);
      areaLight(100, 0, 20, 0, 1, 0.1, 1);
      var roomLamp = new THREE.PointLight(0xffffff, 5, 28, 2);
      roomLamp.position.set(0.418, 16.199, 0.3);
      room.add(roomLamp);
      var pmrem = new THREE.PMREMGenerator(renderer);
      var envTex = pmrem.fromScene(room, 0.04).texture;
      scene.environmentIntensity = 0.5;
      var reflective = [MATS.link, MATS.servo, MATS.horn, MATS.hornB, MATS.screw];
      var ri;
      for (ri = 0; ri < reflective.length; ri++) {
        reflective[ri].envMap = envTex;
        reflective[ri].envMapIntensity = 1;
      }
      pmrem.dispose();
    } catch (envErr) {}
    // A round workbench with a little thickness, so the floor reads as a table and not as an endless plane.
    var table = new THREE.Mesh(new THREE.CylinderGeometry(300, 300, 10, 72), MATS.table);
    table.receiveShadow = true;
    table.position.y = -5;
    scene.add(table);
    var benchRim = new THREE.Mesh(new THREE.TorusGeometry(300, 2.2, 6, 96), MATS.stop);
    benchRim.rotation.x = Math.PI / 2;
    benchRim.position.y = -0.5;
    scene.add(benchRim);
    function linearGrid(grid) {
      var attr = grid.geometry.getAttribute("color");
      if (!attr) return;
      var c = new THREE.Color();
      var i;
      for (i = 0; i < attr.count; i++) {
        c.setRGB(attr.getX(i), attr.getY(i), attr.getZ(i)).convertSRGBToLinear();
        attr.setXYZ(i, c.r, c.g, c.b);
      }
      attr.needsUpdate = true;
    }
    // Softer lines that stay inside the round table (420 x 420 fits in the 300 radius).
    var gridLight = new THREE.GridHelper(420, 21, 0x8f9aa4, 0xa9b3bb);
    var gridDark = new THREE.GridHelper(420, 21, 0x66707a, 0x515a63);
    linearGrid(gridLight);
    linearGrid(gridDark);
    gridLight.position.y = 0.6;
    gridDark.position.y = 0.6;
    scene.add(gridLight);
    scene.add(gridDark);
    var dyn = new THREE.Group();
    scene.add(dyn);
    var stat = new THREE.Group();
    scene.add(stat);
    var statKey = null;
    var statLabels = [];

    var sharedGeo = {};
    function disposeTree(node) {
      if (node.geometry && !sharedGeo[node.geometry.uuid] && !node.userData.sharedGeo) node.geometry.dispose();
      var kids = node.children;
      if (!kids) return;
      for (var k = kids.length - 1; k >= 0; k--) disposeTree(kids[k]);
    }

    function clearDyn() {
      var i, child;
      for (i = dyn.children.length - 1; i >= 0; i--) {
        child = dyn.children[i];
        disposeTree(child);
        dyn.remove(child);
      }
    }

    var rimPts = null;
    var orbit = { yaw: 0, pitch: 0 };
    var lastArgs = null;
    function turn(dYaw, dPitch) {
      orbit.yaw += dYaw;
      orbit.pitch = Math.max(-0.2, Math.min(0.9, orbit.pitch + (dPitch || 0)));
      frameCamera();
      if (lastArgs) render(lastArgs[0], lastArgs[1], lastArgs[2]);
    }
    function resetTurn() { orbit.yaw = 0; orbit.pitch = 0; turn(0, 0); }
    if (canvas.id === "view") {
      var drag = null;
      canvas.style.touchAction = "none";
      canvas.addEventListener("pointerdown", function (e) { drag = { x: e.clientX, y: e.clientY, id: e.pointerId }; try { canvas.setPointerCapture(e.pointerId); } catch (er) {} });
      canvas.addEventListener("pointermove", function (e) {
        if (!drag || e.pointerId !== drag.id) return;
        var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        drag.x = e.clientX; drag.y = e.clientY;
        turn(-dx * 0.01, dy * 0.006);
      });
      var end = function () { drag = null; };
      canvas.addEventListener("pointerup", end);
      canvas.addEventListener("pointercancel", end);
    }
    function frameCamera() {
      camera.fov = 38;
      camera.aspect = Math.max(0.2, (canvas.clientWidth || 1) / (canvas.clientHeight || 1));
      // Frame the work area (both arms, the bins and the parts), not the whole table, so the arms fill the view.
      var bx = (root.PINCHY && root.PINCHY.LAYOUT.bizzyX) || 190;
      if (!rimPts) {
        rimPts = [];
        // 1.8.2: frame the arms and their reach, not the whole round table (less empty floor).
        var xs = [-70, bx + 50];
        var zs = [-10, 140];
        var ys = [0, 215];
        xs.forEach(function (x) { zs.forEach(function (z) { ys.forEach(function (y) { rimPts.push(new THREE.Vector3(x, y, z)); }); }); });
      }
      var target = new THREE.Vector3(bx * 0.42, 70, 60);
      // 1.8.1: the view can be turned (drag it, or the turn buttons). Yaw spins around the work area; pitch tilts.
      var baseDir = new THREE.Vector3(0.3, 0.35, 1).normalize();
      var flat = Math.atan2(baseDir.x, baseDir.z) + orbit.yaw;
      var elev = Math.max(0.12, Math.min(1.25, Math.asin(baseDir.y) + orbit.pitch));
      var dir = new THREE.Vector3(Math.sin(flat) * Math.cos(elev), Math.sin(elev), Math.cos(flat) * Math.cos(elev));
      var lo = 200;
      var hi = 2000;
      var best = hi;
      var step, mid, fit, s, projected, ax, ay;
      for (step = 0; step < 16; step++) {
        mid = (lo + hi) / 2;
        camera.position.copy(target).addScaledVector(dir, mid);
        camera.lookAt(target);
        camera.updateProjectionMatrix();
        fit = true;
        for (s = 0; s < rimPts.length; s++) {
          projected = rimPts[s].clone().project(camera);
          ax = Math.abs(projected.x);
          ay = Math.abs(projected.y);
          if (ax > 0.97 || ay > 0.95 || projected.z > 1) fit = false;
        }
        if (fit) { best = mid; hi = mid; }
        else lo = mid;
      }
      camera.position.copy(target).addScaledVector(dir, best);
      camera.lookAt(target);
      camera.updateProjectionMatrix();
    }

    function resize() {
      var w = canvas.clientWidth || canvas._cssW || 1;
      var h = canvas.clientHeight || canvas._cssH || 1;
      if (w < 2 || h < 2) return;
      if (canvas._glW === w && canvas._glH === h) return;
      canvas._glW = w;
      canvas._glH = h;
      renderer.setPixelRatio(1);
      renderer.setSize(w, h, false);
      canvas.style.width = "";
      canvas.style.height = "";
      frameCamera();
    }

    var GEO = {
      link: new THREE.BoxGeometry(16, 1, 11),
      cap: new THREE.CylinderGeometry(9.2, 9.2, 7, 16),
      pocket: new THREE.BoxGeometry(9, 1, 1.1),
      screw: new THREE.CylinderGeometry(1.05, 1.05, 1.3, 8),
      servo: new THREE.BoxGeometry(16, 8, 12.8),
      horn: new THREE.CylinderGeometry(5.2, 5.2, 1.6, 16),
      capHorn: new THREE.CylinderGeometry(3.4, 3.4, 1.5, 16),
      cable: new THREE.BoxGeometry(2.2, 2.2, 5),
      foot: new THREE.BoxGeometry(8, 4, 8),
      base: new THREE.BoxGeometry(48, 14, 42),
      // Parallel gripper (mechanically joined): a palm bar on the end of the wrist link, and two fingers that
      // slide along it, the same length as the engine's jaws. x = across the gap, y = along the fingers, z = depth.
      jaw: new THREE.BoxGeometry(5, root.PINCHY.LAYOUT.jaw, 8),
      pad: new THREE.BoxGeometry(1.4, root.PINCHY.LAYOUT.jaw - 8, 6.5),
      palm: new THREE.BoxGeometry(root.PINCHY.LAYOUT.gapOpen + 14, 5, 11),
      rail: new THREE.BoxGeometry(root.PINCHY.LAYOUT.gapOpen + 10, 1.6, 2.2)
    };
    Object.keys(GEO).forEach(function (k) { sharedGeo[GEO[k].uuid] = true; });
    function aim(obj, dir) {
      obj.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    }
    function mesh(geo, material, cast) {
      var m = new THREE.Mesh(geo, material);
      if (cast && renderer.shadowMap.enabled) m.castShadow = true;
      if (material === MATS.ghost) {
        m.castShadow = false;
        m.receiveShadow = false;
      }
      return m;
    }
    function makeLink(ghost) {
      var g = new THREE.Group();
      var shell = mesh(GEO.link, ghost ? MATS.ghost : MATS.link, !ghost);
      g.add(shell);
      g.userData.shell = shell;
      if (!ghost) {
        var capA = mesh(GEO.cap, MATS.link, false);
        var capB = mesh(GEO.cap, MATS.link, false);
        var pocket = mesh(GEO.pocket, MATS.pocket, false);
        var pocket2 = mesh(GEO.pocket, MATS.pocket, false);
        pocket.position.z = 5.6;
        pocket2.position.z = -5.6;
        g.add(capA); g.add(capB); g.add(pocket); g.add(pocket2);
        g.userData.capA = capA;
        g.userData.capB = capB;
        g.userData.pocket = pocket;
        g.userData.pocket2 = pocket2;
        g.userData.screws = [];
        var s;
        for (s = 0; s < 4; s++) {
          var screw = mesh(GEO.screw, MATS.screw, false);
          screw.rotation.x = Math.PI / 2;
          g.add(screw);
          g.userData.screws.push(screw);
        }
      }
      return g;
    }
    function placeLink(g, a, b) {
      var delta = new THREE.Vector3().subVectors(b, a);
      var len = Math.max(8, delta.length());
      g.position.copy(a).lerp(b, 0.5);
      aim(g, delta);
      g.userData.shell.scale.y = Math.max(4, len - 12);
      if (g.userData.capA) {
        g.userData.capA.position.y = len / 2 - 3;
        g.userData.capB.position.y = -len / 2 + 3;
        g.userData.pocket.scale.y = Math.max(2, len - 28);
        g.userData.pocket2.scale.y = g.userData.pocket.scale.y;
        var screws = g.userData.screws;
        screws[0].position.set(4.2, len * 0.22, 5.7);
        screws[1].position.set(4.2, -len * 0.22, 5.7);
        screws[2].position.set(-4.2, len * 0.22, -5.7);
        screws[3].position.set(-4.2, -len * 0.22, -5.7);
      }
    }
    function makeServo(hornMat) {
      var g = new THREE.Group();
      g.add(mesh(GEO.servo, MATS.servo, false));
      var horn = mesh(GEO.horn, MATS.servo, false);
      horn.position.y = 4.6;
      g.add(horn);
      var cap = mesh(GEO.capHorn, hornMat || MATS.horn, false);
      cap.position.y = 5.8;
      g.add(cap);
      var cable = mesh(GEO.cable, MATS.servo, true);
      cable.position.set(0, 0, -8);
      g.add(cable);
      return g;
    }
    function makeJaw(ghost) {
      var g = new THREE.Group();
      var finger = mesh(GEO.jaw, ghost ? MATS.ghost : MATS.link, !ghost);
      g.add(finger);
      g.userData.finger = finger;
      if (!ghost) {
        var pad = mesh(GEO.pad, MATS.pad, false);
        pad.position.y = 2;
        g.add(pad);
        g.userData.pad = pad;
      }
      return g;
    }
    function makePalm(ghost) {
      var g = new THREE.Group();
      g.add(mesh(GEO.palm, ghost ? MATS.ghost : MATS.link, !ghost));
      if (!ghost) {
        var rail = mesh(GEO.rail, MATS.screw, false);
        rail.position.set(0, 3.3, 3.6);
        g.add(rail);
      }
      return g;
    }
    // Rotation whose x axis is `side`, y axis is `along`, z axis is their cross product.
    var BASIS = new THREE.Matrix4();
    function orient(obj, side, along) {
      var z = new THREE.Vector3().crossVectors(side, along).normalize();
      var x = new THREE.Vector3().crossVectors(along, z).normalize();
      BASIS.makeBasis(x, along, z);
      obj.quaternion.setFromRotationMatrix(BASIS);
    }
    // 1.8.2: protractor dials on the base and on each joint, so students can read every angle on the robot.
    var dialTex = null;
    function protractorTexture(mirror) {
      var cv = document.createElement("canvas");
      cv.width = cv.height = 256;
      var c = cv.getContext("2d"), R = 120, i;
      c.translate(128, 128);
      if (mirror) c.scale(-1, 1);
      c.fillStyle = "rgba(255,250,235,0.9)";
      c.beginPath(); c.arc(0, 0, R, 0, Math.PI * 2); c.fill();
      c.strokeStyle = "#1d1b18"; c.lineWidth = 4; c.stroke();
      for (i = -165; i <= 180; i += 15) {
        var a = -i * Math.PI / 180, big = i % 45 === 0;
        c.lineWidth = big ? 5 : 2.5;
        c.beginPath();
        c.moveTo(Math.cos(a) * (R - (big ? 26 : 14)), Math.sin(a) * (R - (big ? 26 : 14)));
        c.lineTo(Math.cos(a) * R, Math.sin(a) * R);
        c.stroke();
        if (big) {
          c.save();
          c.translate(Math.cos(a) * (R - 46), Math.sin(a) * (R - 46));
          if (mirror) c.scale(-1, 1);
          c.fillStyle = i === 0 ? "#b3261e" : "#1d1b18";
          c.font = "bold 22px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
          c.fillText(String(i), 0, 0);
          c.restore();
        }
      }
      var t = new THREE.CanvasTexture(cv);
      return t;
    }
    function makeDial(radius) {
      if (!dialTex) dialTex = [protractorTexture(false), protractorTexture(true)];
      var g = new THREE.Group();
      var geo = new THREE.CircleGeometry(radius, 48);
      var front = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: dialTex[0], transparent: true, side: THREE.FrontSide }));
      var back = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: dialTex[1], transparent: true, side: THREE.FrontSide }));
      back.rotation.y = Math.PI;
      g.add(front); g.add(back);
      var needle = new THREE.Group();
      var bar = new THREE.Mesh(new THREE.BoxGeometry(radius * 0.92, 1.4, 1.2), new THREE.MeshBasicMaterial({ color: 0xb3261e }));
      bar.position.x = radius * 0.46;
      needle.add(bar);
      g.add(needle);
      g.userData.needle = needle;
      return g;
    }
    var dialM = new THREE.Matrix4();
    function setDial(dial, at, x, y, needleRad) {
      var z = new THREE.Vector3().crossVectors(x, y).normalize();
      dialM.makeBasis(x, y, z);
      dial.quaternion.setFromRotationMatrix(dialM);
      dial.position.copy(at);
      dial.userData.needle.rotation.z = needleRad;
    }
    function buildRig(ghost, hornMat, offsetX) {
      var rootG = new THREE.Group();
      var links = [makeLink(ghost), makeLink(ghost), makeLink(ghost), makeLink(ghost)];
      var i;
      for (i = 0; i < links.length; i++) rootG.add(links[i]);
      var servos = [];
      if (!ghost) {
        var base = new THREE.Group();
        var block = mesh(GEO.base, MATS.link, false);
        block.position.y = 8;
        base.add(block);
        var fx, fz;
        for (fx = -1; fx <= 1; fx += 2) {
          for (fz = -1; fz <= 1; fz += 2) {
            var foot = mesh(GEO.foot, MATS.link, false);
            foot.position.set(fx * 18, 2, fz * 14);
            base.add(foot);
          }
        }
        rootG.add(base);
        var dials = [makeDial(25), makeDial(16), makeDial(15), makeDial(12)];
        for (i = 0; i < dials.length; i++) rootG.add(dials[i]);
        // Five servos for five joints: base, shoulder, elbow, wrist, gripper (no extra roll servo).
        for (i = 0; i < 5; i++) {
          var servo = makeServo(hornMat);
          servos.push(servo);
          rootG.add(servo);
        }
      }
      var jaws = [makeJaw(ghost), makeJaw(ghost)];
      rootG.add(jaws[0]);
      rootG.add(jaws[1]);
      var palm = makePalm(ghost);
      rootG.add(palm);
      if (ghost) {
        var ghostBase = new THREE.Group();
        var ghostBlock = mesh(GEO.base, MATS.ghost, false);
        ghostBlock.position.y = 8;
        ghostBase.add(ghostBlock);
        rootG.add(ghostBase);
      }
      scene.add(rootG);
      rootG.position.x = offsetX || 0;
      rootG.visible = !ghost;
      return { root: rootG, links: links, servos: servos, jaws: jaws, palm: palm, dials: ghost ? null : dials };
    }
    var bertyBlob = blob(78);
    scene.add(bertyBlob);
    var bizzyBlob = blob(78);
    bizzyBlob.position.x = root.PINCHY.LAYOUT.bizzyX || 190;
    scene.add(bizzyBlob);
    var solidRig = buildRig(false);
    var bizzyRig = buildRig(false, MATS.hornB, root.PINCHY.LAYOUT.bizzyX || 190);
    var ghostRig = buildRig(true);
    ghostRig.root.visible = false;
    ghostRig.root.position.set(0, 0, 0);
    function poseRig(rig, state) {
      var layout = root.PINCHY.LAYOUT;
      var pose = root.PINCHY.pose(state);
      var yaw = state.base || 0;
      var shoulder = vec(0, layout.sy, yaw);
      var elbow = vec(pose.ex, pose.ey, yaw);
      var wrist = vec(pose.wx, pose.wy, yaw);
      var grip = vec(pose.gx, pose.gy, yaw);
      var up = new THREE.Vector3(0, 1, 0);
      placeLink(rig.links[0], new THREE.Vector3(0, 22, 0), shoulder);
      placeLink(rig.links[1], shoulder, elbow);
      placeLink(rig.links[2], elbow, wrist);
      placeLink(rig.links[3], wrist, grip);
      var yawAxis = new THREE.Vector3(Math.cos(yaw * Math.PI / 180), 0, -Math.sin(yaw * Math.PI / 180));
      var yawRad = yaw * Math.PI / 180;
      var along = new THREE.Vector3(Math.sin(yawRad) * pose.px, pose.py, Math.cos(yawRad) * pose.px);
      var side = new THREE.Vector3(Math.sin(yawRad) * pose.nx, pose.ny, Math.cos(yawRad) * pose.nx);
      if (along.lengthSq() < 0.01) along.set(0, -1, 0);
      if (side.lengthSq() < 0.01) side.set(1, 0, 0);
      along.normalize();
      side.normalize();
      // The gripper servo sits on the back of the palm; the palm bolts to the end of the wrist link.
      var palmAt = grip.clone().addScaledVector(along, -2.5);
      if (rig.servos.length) {
        var spots = [
          [new THREE.Vector3(0, 16, 0), up],
          [shoulder, yawAxis],
          [elbow, yawAxis],
          [wrist, yawAxis]
        ];
        var s;
        for (s = 0; s < 4; s++) {
          rig.servos[s].position.copy(spots[s][0]);
          aim(rig.servos[s], spots[s][1]);
        }
        var clawServo = rig.servos[4];
        clawServo.position.copy(palmAt).addScaledVector(along, -6.5).addScaledVector(side, 9);
        orient(clawServo, along.clone().negate(), side);
      }
      if (rig.dials) {
        // Base dial lies flat on the base: 0 points straight ahead, + turns toward Berty's right.
        setDial(rig.dials[0], new THREE.Vector3(0, 15.4, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0), yawRad);
        // Joint dials stand beside each joint, lined up with the link before it, so they read that joint's own angle.
        var out = new THREE.Vector3(Math.sin(yawRad), 0, Math.cos(yawRad));
        var chain = [[shoulder, out, elbow], [elbow, null, wrist], [wrist, null, grip]];
        var prev = out, k;
        for (k = 0; k < 3; k++) {
          var at = chain[k][0], nxt = chain[k][2];
          var dx = prev.clone().normalize();
          var dy = new THREE.Vector3().crossVectors(dx, yawAxis).normalize();
          var child = nxt.clone().sub(at);
          var ang = Math.atan2(child.dot(dy), child.dot(dx));
          var dz = new THREE.Vector3().crossVectors(dx, dy).normalize();
          setDial(rig.dials[k + 1], at.clone().addScaledVector(dz, 10.5), dx, dy, ang);
          prev = child.lengthSq() > 0.01 ? child : prev;
        }
      }
      rig.palm.position.copy(palmAt);
      orient(rig.palm, side, along);
      // Fingers: same length as the engine's jaws, one on each side of the gap, both riding the palm's rail.
      var jawLen = layout.jaw;
      // A held part stops the fingers at its sides (they never pass through it).
      var gapNow = Math.max(pose.gap, 0);
      if (state.holding && state.part && state.part.hw) gapNow = Math.max(gapNow, state.part.hw * 2);
      var half = gapNow / 2 + 2.5;
      var j;
      for (j = 0; j < 2; j++) {
        var sign = j === 0 ? -1 : 1;
        var jaw = rig.jaws[j];
        if (jaw.parent !== rig.root) rig.root.attach(jaw);
        jaw.position.copy(grip).addScaledVector(side, sign * half).addScaledVector(along, jawLen / 2);
        orient(jaw, side, along);
        if (jaw.userData.pad) jaw.userData.pad.position.x = -sign * 3.2;
      }
    }

    function optsHot(state, name) {
      return false;
    }

    function render(state, level, opts) {
      if (!state || !root.PINCHY) return;
      lastArgs = [state, level, opts];
      labelQueue = [];
      resize();
      clearDyn();
      var cmd = (opts && opts.cmd) || "";
      optsHot = function (s, name) { return cmd.indexOf(name) === 0; };
      if (level && level.kind === "match" && level.target) {
        ghostRig.root.visible = true;
        ghostRig.root.position.set(0, 0, 0);
        poseRig(ghostRig, {
          base: level.target.base,
          shoulder: level.target.shoulder,
          elbow: level.target.elbow,
          wrist: level.target.wrist || 0,
          open: level.target.open !== false,
          gap: root.PINCHY.LAYOUT.gapOpen
        });
      } else ghostRig.root.visible = false;
      poseRig(solidRig, state);
      var parked = root.PINCHY.PARKED;
      var bz = state.bizzy || { base: parked.base, shoulder: parked.shoulder, elbow: parked.elbow, wrist: parked.wrist, open: true, gap: root.PINCHY.LAYOUT.gapOpen };
      poseRig(bizzyRig, bz);
      var darkTheme = document.documentElement.getAttribute("data-theme") === "dark";
      MATS.link.color.setHex(darkTheme ? 0xe9e4da : 0x2b2824).convertSRGBToLinear();
      MATS.link.metalness = 0;
      MATS.link.roughness = 0.32;
      srgbColor(MATS.table.color, darkTheme ? 0x3f4850 : 0xc9d3db);
      MATS.table.roughness = 0.9;
      MATS.table.metalness = 0;
      srgbColor(MATS.ghost.color, 0xc5ceda);
      srgbColor(MATS.grid.color, 0x132a5c);
      srgbColor(MATS.gridOn.color, 0x22d3ee);
      srgbColor(MATS.red.color, 0xc45a4a);
      srgbColor(MATS.blue.color, 0x3b82f6);
      srgbColor(MATS.part.color, 0xf0a830);
      srgbColor(MATS.bin.color, darkTheme ? 0x6f93b3 : 0x4f7392);
      srgbColor(MATS.partB.color, 0x7d8fa3);
      srgbColor(MATS.stop.color, 0x3a3f45);
      srgbColor(MATS.belt.color, 0x2f3338);
      srgbColor(MATS.hot.color, 0xe8b400);
      MATS.edge.color.setHex(darkTheme ? 0x0b0a09 : 0x1d1b18).convertSRGBToLinear();
      hemi.intensity = darkTheme ? 0.45 : 0.6;
      var clear = darkTheme ? 0x2a2723 : 0xfbf8f1;
      srgbColor(scene.background, clear);
      renderer.setClearColor(scene.background, 1);
      gridLight.visible = !darkTheme;
      gridDark.visible = darkTheme;
      if (opts && opts.world) {
        // The level's fixed things (spots, bins, belt) are built once per level and reused; only parts are rebuilt per frame.
        var key = level ? level.id : "";
        if (key !== statKey) {
          var si;
          for (si = stat.children.length - 1; si >= 0; si--) { disposeTree(stat.children[si]); stat.remove(stat.children[si]); }
          var keep = labelQueue;
          labelQueue = [];
          if (level) buildStatic(stat, level);
          statLabels = labelQueue;
          labelQueue = keep;
          statKey = key;
        }
        stat.visible = true;
        for (var li = 0; li < statLabels.length; li++) labelQueue.push(statLabels[li]);
        buildParts(dyn, state, level);
      } else stat.visible = false;
      if (ghostRig.root.visible) {
        var code = document.documentElement.lang || "en";
        var targetWord = root.PINCHY && root.PINCHY.uiText ? root.PINCHY.uiText(code, "Target") : "Target";
        // 0055: the Target label sits at the ghost claw, over the dashed ring on the floor below it.
        var gt = level.target;
        var gp = root.PINCHY.pose({ base: gt.base, shoulder: gt.shoulder, elbow: gt.elbow, wrist: gt.wrist || 0, open: gt.open !== false, gap: root.PINCHY.LAYOUT.gapOpen });
        addMark("\u25CC " + targetWord, vec(gp.cx, gp.cy + 18, gt.base));
      }
      var lang = document.documentElement.lang || "en";
      var T = root.PINCHY.uiText;
      var dof = T(lang, "dof");
      var dofTitle = T(lang, "dofTitle");
      var bx = root.PINCHY.LAYOUT.bizzyX || 190;
      // 0054: each tag floats just above the highest point of its own arm, so it never sits on the arm.
      var tagAbove = function (st, offsetX) {
        var L = root.PINCHY.LAYOUT;
        var pp = root.PINCHY.pose(st);
        var pts = [[0, L.sy], [pp.ex, pp.ey], [pp.wx, pp.wy], [pp.gx, pp.gy]];
        var top = pts[0];
        for (var ti = 1; ti < pts.length; ti++) if (pts[ti][1] > top[1]) top = pts[ti];
        var v = vec(top[0], top[1] + 34, st.base || 0);
        v.x += offsetX;
        return v;
      };
      var joints = T(lang, "joints5");
      addChip("berty", T(lang, "nameBerty") + " \u00b7 " + joints, dofTitle, tagAbove(state, 0));
      addChip("bizzy", T(lang, "nameBizzy") + " \u00b7 " + joints, dofTitle, tagAbove(bz, bx));
      placeLabels(canvas, camera);
      renderer.render(scene, camera);
    }

    return { render: render, resize: resize, turn: turn, resetTurn: resetTurn };
  }

  function buildStatic(parent, level) {
    var G = root.PINCHY;
    if (!G || !level) return;
    var cols = G.COLS;
    var rows = G.ROWS;
    var c, r, spot, mesh, name, here, marked;
    here = level.kind === "spot" ? level.spot : "";
    // 1.8.1: the A1-C3 spots only appear on a level that uses them; other floors stay clear.
    for (c = 0; c < (level.kind === "spot" ? cols.length : 0); c++) {
      for (r = 0; r < rows.length; r++) {
        name = cols[c][0] + rows[r][0];
        spot = vec(rows[r][1], 1.4, cols[c][1]);
        marked = name === here;
        mesh = new THREE.Mesh(
          new THREE.BoxGeometry(22, 0.8, 18),
          marked ? MATS.gridOn : MATS.grid
        );
        mesh.position.copy(spot);
        parent.add(mesh);
        if (marked) {
          var spotRing = dashedRing(19, 4);
          spotRing.position.copy(spot).setY(1.9);
          parent.add(spotRing);
          addMark(name, spot.clone().setY(11));
        } else addLabel(parent, name, spot.clone().setY(11), 22, 6);
      }
    }
    var bins = G.binsOf(level);
    var i, bin, group, wall, yaw, hx, hz;
    for (i = 0; i < bins.length; i++) {
      bin = bins[i];
      yaw = bin.base * Math.PI / 180;
      hx = Math.sin(yaw) * bin.r;
      hz = Math.cos(yaw) * bin.r;
      group = new THREE.Group();
      group.position.set(hx, 0, hz);
      group.rotation.y = yaw;
      wall = outlined(boxGeo(4, bin.h, bin.half), MATS.bin, "w" + bin.h + "x" + bin.half);
      wall.position.set(-bin.half, bin.h / 2, 0);
      group.add(wall);
      wall = outlined(boxGeo(4, bin.h, bin.half), MATS.bin, "w" + bin.h + "x" + bin.half);
      wall.position.set(bin.half, bin.h / 2, 0);
      group.add(wall);
      wall = outlined(boxGeo(bin.half * 2, bin.h, 4), MATS.bin, "b" + bin.h + "x" + bin.half);
      wall.position.set(0, bin.h / 2, bin.half * 0.35);
      group.add(wall);
      parent.add(group);
      addLabel(parent, bin.id ? "Bin " + bin.id + (bin.mark ? " " + bin.mark : "") : "Bin", new THREE.Vector3(hx - 30, bin.h + 24, hz + 18), 36, 8);
    }
    if (level.binZ) {
      var bz = level.binZ;
      var zyaw = bz.base * Math.PI / 180;
      var zx = (G.BIZZY_X || 190) + Math.sin(zyaw) * bz.r;
      var zz = Math.cos(zyaw) * bz.r;
      var zgroup = new THREE.Group();
      zgroup.position.set(zx, 0, zz);
      zgroup.rotation.y = zyaw;
      var zwall = outlined(boxGeo(4, bz.h, bz.half), MATS.bin, "w" + bz.h + "x" + bz.half);
      zwall.position.set(-bz.half, bz.h / 2, 0);
      zgroup.add(zwall);
      zwall = outlined(boxGeo(4, bz.h, bz.half), MATS.bin, "w" + bz.h + "x" + bz.half);
      zwall.position.set(bz.half, bz.h / 2, 0);
      zgroup.add(zwall);
      zwall = outlined(boxGeo(bz.half * 2, bz.h, 4), MATS.bin, "b" + bz.h + "x" + bz.half);
      zwall.position.set(0, bz.h / 2, bz.half * 0.35);
      zgroup.add(zwall);
      parent.add(zgroup);
      addLabel(parent, "Bin", new THREE.Vector3(zx - 30, bz.h + 24, zz + 18), 36, 8);
    }
    if (level.physics) {
      var ph = level.physics;
      var byaw = ph.belt.base * Math.PI / 180;
      var rig = new THREE.Group();
      rig.rotation.y = byaw;
      var slab = new THREE.Mesh(new THREE.BoxGeometry(34, 3, ph.belt.r1 - ph.belt.r0), MATS.belt);
      slab.position.set(0, ph.belt.top - 1.5, (ph.belt.r0 + ph.belt.r1) / 2);
      rig.add(slab);
      var stopper = new THREE.Mesh(new THREE.BoxGeometry(34, ph.stop.top - ph.belt.top + 3, ph.stop.hw * 2), MATS.stop);
      stopper.position.set(0, (ph.stop.top + ph.belt.top - 3) / 2, ph.stop.r);
      rig.add(stopper);
      parent.add(rig);
      addLabel(parent, "Belt \u2192", vec((ph.belt.r0 + ph.belt.r1) / 2 - 40, ph.belt.top + 22, ph.belt.base), 36, 8);
      if (ph.target) {
        var tg = ph.target;
        var tm = outlined(boxGeo(tg.hw * 2, tg.hh * 2, tg.hw * 2), MATS.partB, "box" + tg.hw + "x" + tg.hh);
        tm.position.copy(vec(tg.r, tg.hh, tg.base));
        tm.rotation.y = tg.base * Math.PI / 180;
        parent.add(tm);
      }
    }
  }

  function buildParts(parent, state, level) {
    var G = root.PINCHY;
    if (!G || !level) return;
    var i;
    function addPart(part) {
      if (!part) return;
      var y = part.inBin ? part.hh : part.y;
      var pos = vec(part.r, y, part.base);
      var colorMat = part.color === "red" ? MATS.red : (part.color === "blue" ? MATS.blue : MATS.part);
      var mesh;
      if (part.shape === "circle") {
        var ckey = "cyl" + part.hw + "x" + part.hh;
        if (!BOX_GEO[ckey]) BOX_GEO[ckey] = new THREE.CylinderGeometry(part.hw, part.hw, part.hh * 2, 20);
        mesh = outlined(BOX_GEO[ckey], colorMat, ckey);
      } else {
        mesh = outlined(boxGeo(part.hw * 2, part.hh * 2, part.hw * 2), colorMat, "box" + part.hw + "x" + part.hh);
      }
      if (y < part.hh + 30) {
        var shade = blob(part.hw * 4.2);
        var foot = vec(part.r, 0, part.base);
        shade.position.x = foot.x;
        shade.position.z = foot.z;
        parent.add(shade);
      }
      mesh.position.copy(pos);
      if (part.ang) { mesh.rotation.order = "YXZ"; mesh.rotation.y = part.base * Math.PI / 180; mesh.rotation.x = -part.ang; }
      parent.add(mesh);
      var tagAt = pos.clone().add(new THREE.Vector3(-28, 22, 16));
      if (part.shape === "square" && part.color === "red") addLabel(parent, "Red square \u25a0", tagAt, 40, 9);
      else if (part.shape === "circle" && part.color === "blue") addLabel(parent, "Blue circle \u25cf", tagAt, 40, 9);
      else addLabel(parent, "Part", tagAt, 28, 8);
    }
    addPart(state.part);
    var q = state.queue || [];
    for (i = 0; i < q.length; i++) {
      var extra = q[i];
      if (!extra) continue;
      var ghost = {
        base: extra.base, r: extra.r + 10 + i * 6, y: extra.hh, hw: extra.hw, hh: extra.hh,
        shape: extra.shape, color: extra.color, inBin: false
      };
      addPart(ghost);
    }
    var done = state.binned || [];
    for (i = 0; i < done.length; i++) addPart(done[i]);
  }

  function mount(canvas) {
    if (!canvas) return null;
    var id = canvas.id || "view";
    if (!views[id]) views[id] = create(canvas);
    return views[id];
  }

  root.PINCHY_VIEW = {
    mount: mount,
    turn: function (canvas, dYaw, dPitch) { var v = mount(canvas); if (v && v.turn) v.turn(dYaw, dPitch || 0); },
    resetTurn: function (canvas) { var v = mount(canvas); if (v && v.resetTurn) v.resetTurn(); },
    frame: function (canvas, state, level, opts) {
      var view = mount(canvas);
      if (!view || view.failed) return false;
      view.render(state, level, opts || {});
      return true;
    }
  };
})(typeof window !== "undefined" ? window : this);
