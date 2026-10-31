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
    part: mat(0xc5ceda, 0, 0.55)
  };

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
    var ordered = labelQueue.filter(function (q) { return q.chip; }).concat(labelQueue.filter(function (q) { return !q.chip; }));
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
        span.lastChild.textContent = item.text;
        if (item.title) span.title = item.title;
      } else span.textContent = item.text;
      span.style.left = x + "px";
      span.style.top = y + "px";
      layer.appendChild(span);
      box = span.getBoundingClientRect();
      var bw = box.width;
      var bh = box.height;
      ok = false;
      var cx = x;
      var cy = y;
      for (k = 0; k < 16 && !ok; k++) {
        rad = k === 0 ? 0 : 8 + k * 12;
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
    var table = new THREE.Mesh(new THREE.CircleGeometry(300, 48), MATS.table);
    table.receiveShadow = true;
    table.rotation.x = -Math.PI / 2;
    table.position.y = 0;
    scene.add(table);
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
    var gridLight = new THREE.GridHelper(640, 32, 0x111111, 0x111111);
    var gridDark = new THREE.GridHelper(640, 32, 0x555555, 0x555555);
    linearGrid(gridLight);
    linearGrid(gridDark);
    gridLight.position.y = 0.6;
    gridDark.position.y = 0.6;
    scene.add(gridLight);
    scene.add(gridDark);
    var dyn = new THREE.Group();
    scene.add(dyn);

    var sharedGeo = {};
    function disposeTree(node) {
      if (node.geometry && !sharedGeo[node.geometry.uuid]) node.geometry.dispose();
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
    function frameCamera() {
      camera.fov = 38;
      camera.aspect = Math.max(0.2, (canvas.clientWidth || 1) / (canvas.clientHeight || 1));
      if (!rimPts) {
        rimPts = [];
        var i, a;
        for (i = 0; i < 20; i++) {
          a = (i / 20) * Math.PI * 2;
          rimPts.push(new THREE.Vector3(Math.cos(a) * 300, 1, Math.sin(a) * 300));
        }
        rimPts.push(new THREE.Vector3(0, 280, 20));
        rimPts.push(new THREE.Vector3(0, 100, 230));
        rimPts.push(new THREE.Vector3(160, 80, 80));
        rimPts.push(new THREE.Vector3(-160, 80, 80));
      }
      var target = new THREE.Vector3(0, 48, 16);
      var dir = new THREE.Vector3(0.82, 0.58, 0.9).normalize();
      var lo = 420;
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
          if (ax > 0.94 || ay > 0.94 || projected.z > 1) fit = false;
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
      jaw: new THREE.BoxGeometry(7, 22, 5),
      pad: new THREE.BoxGeometry(4.2, 14, 1.3)
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
        g.add(pad);
        g.userData.pad = pad;
      }
      return g;
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
        for (i = 0; i < 6; i++) {
          var servo = makeServo(hornMat);
          servos.push(servo);
          rootG.add(servo);
        }
      }
      var jaws = [makeJaw(ghost), makeJaw(ghost)];
      rootG.add(jaws[0]);
      rootG.add(jaws[1]);
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
      return { root: rootG, links: links, servos: servos, jaws: jaws };
    }
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
      var rollDir = new THREE.Vector3().subVectors(grip, wrist);
      if (rollDir.lengthSq() < 1) rollDir.copy(up);
      if (rig.servos.length) {
        var spots = [
          [new THREE.Vector3(0, 16, 0), up],
          [shoulder, yawAxis],
          [elbow, yawAxis],
          [wrist, yawAxis],
          [wrist.clone().lerp(grip, 0.45), rollDir],
          [grip, yawAxis]
        ];
        var s;
        for (s = 0; s < rig.servos.length; s++) {
          rig.servos[s].position.copy(spots[s][0]);
          aim(rig.servos[s], spots[s][1]);
        }
      }
      var yawRad = yaw * Math.PI / 180;
      var along = new THREE.Vector3(Math.sin(yawRad) * pose.px, pose.py, Math.cos(yawRad) * pose.px);
      var side = new THREE.Vector3(Math.sin(yawRad) * pose.nx, pose.ny, Math.cos(yawRad) * pose.nx);
      if (along.lengthSq() < 0.01) along.set(0, -1, 0);
      if (side.lengthSq() < 0.01) side.set(1, 0, 0);
      along.normalize();
      side.normalize();
      var offsets = [-5, Math.max(6, pose.gap * 0.55)];
      var j;
      for (j = 0; j < 2; j++) {
        var a = grip.clone().addScaledVector(side, offsets[j]);
        var b = a.clone().addScaledVector(along, 22);
        var jaw = rig.jaws[j];
        if (jaw.parent !== rig.root) rig.root.attach(jaw);
        jaw.position.copy(a).lerp(b, 0.5);
        aim(jaw, along);
        jaw.userData.finger.scale.z = Math.abs(offsets[j]) > 8 ? 0.7 : 1;
        if (jaw.userData.pad) {
          jaw.userData.pad.position.set(offsets[j] > 0 ? -3.1 : 3.1, 0, 0);
        }
        if (!rig.servos.length) rig.links[3].attach(jaw);
      }
    }

    function optsHot(state, name) {
      return false;
    }

    function render(state, level, opts) {
      if (!state || !root.PINCHY) return;
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
      srgbColor(MATS.part.color, 0xc5ceda);
      hemi.intensity = darkTheme ? 0.45 : 0.6;
      var clear = darkTheme ? 0x2a2723 : 0xfbf8f1;
      srgbColor(scene.background, clear);
      renderer.setClearColor(scene.background, 1);
      gridLight.visible = !darkTheme;
      gridDark.visible = darkTheme;
      if (opts && opts.world) buildWorld(dyn, state, level);
      if (ghostRig.root.visible) {
        var code = document.documentElement.lang || "en";
        var targetWord = root.PINCHY && root.PINCHY.uiText ? root.PINCHY.uiText(code, "Target") : "Target";
        addLabel(ghostRig.root, "\u25CC " + targetWord, new THREE.Vector3(0, 28, 36));
      }
      var lang = document.documentElement.lang || "en";
      var T = root.PINCHY.uiText;
      var dof = T(lang, "dof");
      var dofTitle = T(lang, "dofTitle");
      var bx = root.PINCHY.LAYOUT.bizzyX || 190;
      addChip("berty", T(lang, "nameBerty") + " \u00b7 " + dof, dofTitle, new THREE.Vector3(0, 150, 0));
      addChip("bizzy", T(lang, "nameBizzy") + " \u00b7 " + dof, dofTitle, new THREE.Vector3(bx, 150, 0));
      placeLabels(canvas, camera);
      renderer.render(scene, camera);
    }

    return { render: render, resize: resize };
  }

  function buildWorld(parent, state, level) {
    var G = root.PINCHY;
    if (!G || !level) return;
    var cols = G.COLS;
    var rows = G.ROWS;
    var c, r, spot, mesh, name, here, marked;
    here = level.kind === "spot" ? level.spot : "";
    for (c = 0; c < cols.length; c++) {
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
        addLabel(parent, name, spot.clone().setY(11), 22, 6);
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
      wall = new THREE.Mesh(new THREE.BoxGeometry(4, bin.h, bin.half), MATS.joint);
      wall.position.set(-bin.half, bin.h / 2, 0);
      group.add(wall);
      wall = new THREE.Mesh(new THREE.BoxGeometry(4, bin.h, bin.half), MATS.joint);
      wall.position.set(bin.half, bin.h / 2, 0);
      group.add(wall);
      wall = new THREE.Mesh(new THREE.BoxGeometry(bin.half * 2, bin.h, 4), MATS.joint);
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
      var zwall = new THREE.Mesh(new THREE.BoxGeometry(4, bz.h, bz.half), MATS.joint);
      zwall.position.set(-bz.half, bz.h / 2, 0);
      zgroup.add(zwall);
      zwall = new THREE.Mesh(new THREE.BoxGeometry(4, bz.h, bz.half), MATS.joint);
      zwall.position.set(bz.half, bz.h / 2, 0);
      zgroup.add(zwall);
      zwall = new THREE.Mesh(new THREE.BoxGeometry(bz.half * 2, bz.h, 4), MATS.joint);
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
      var slab = new THREE.Mesh(new THREE.BoxGeometry(34, 3, ph.belt.r1 - ph.belt.r0), MATS.table);
      slab.position.set(0, ph.belt.top - 1.5, (ph.belt.r0 + ph.belt.r1) / 2);
      rig.add(slab);
      var stopper = new THREE.Mesh(new THREE.BoxGeometry(34, ph.stop.top - ph.belt.top + 3, ph.stop.hw * 2), MATS.joint);
      stopper.position.set(0, (ph.stop.top + ph.belt.top - 3) / 2, ph.stop.r);
      rig.add(stopper);
      parent.add(rig);
      addLabel(parent, "Belt \u2192", vec((ph.belt.r0 + ph.belt.r1) / 2 - 40, ph.belt.top + 22, ph.belt.base), 36, 8);
      if (ph.target) {
        var tg = ph.target;
        var tm = new THREE.Mesh(new THREE.BoxGeometry(tg.hw * 2, tg.hh * 2, tg.hw * 2), MATS.part);
        tm.position.copy(vec(tg.r, tg.hh, tg.base));
        tm.rotation.y = tg.base * Math.PI / 180;
        parent.add(tm);
      }
    }
    function addPart(part) {
      if (!part) return;
      var y = part.inBin ? part.hh : part.y;
      var pos = vec(part.r, y, part.base);
      var colorMat = part.color === "red" ? MATS.red : (part.color === "blue" ? MATS.blue : MATS.part);
      var mesh;
      if (part.shape === "circle") {
        mesh = new THREE.Mesh(new THREE.CylinderGeometry(part.hw, part.hw, part.hh * 2, 16), colorMat);
      } else {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(part.hw * 2, part.hh * 2, part.hw * 2), colorMat);
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
    frame: function (canvas, state, level, opts) {
      var view = mount(canvas);
      if (!view || view.failed) return false;
      view.render(state, level, opts || {});
      return true;
    }
  };
})(typeof window !== "undefined" ? window : this);
