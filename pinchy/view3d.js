/* Pinchy 3D view. Three.js r149 is vendored in vendor/three.min.js. No network. */
(function (root) {
  "use strict";
  if (!root.THREE) return;
  var THREE = root.THREE;
  var CLEAR = 0x06122b;
  var views = {};

  function mat(color, opacity) {
    var m = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.62,
      metalness: 0.08
    });
    if (opacity != null && opacity < 1) {
      m.transparent = true;
      m.opacity = opacity;
      m.depthWrite = false;
    }
    return m;
  }

  var MATS = {
    post: mat(0x7e868e),
    upper: mat(0xa8aeb6),
    fore: mat(0x8e949c),
    wrist: mat(0x9aa1a8),
    joint: mat(0x3e4650),
    hot: mat(0x22d3ee),
    claw: mat(0x22d3ee),
    table: mat(0x0b1a40),
    ghost: mat(0xc5ceda, 0.35),
    grid: mat(0x132a5c),
    gridOn: mat(0x22d3ee),
    red: mat(0xc45a4a),
    blue: mat(0x3b82f6),
    part: mat(0xc5ceda)
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
    for (i = 0; i < labelQueue.length; i++) {
      item = labelQueue[i];
      p = item.position.clone().project(camera);
      if (p.z < -1 || p.z > 1) continue;
      x = (p.x * 0.5 + 0.5) * w;
      y = (-p.y * 0.5 + 0.5) * h;
      span = document.createElement("span");
      span.textContent = item.text;
      layer.appendChild(span);
      ok = false;
      for (k = 0; k < 28 && !ok; k++) {
        rad = k === 0 ? 0 : 6 + k * 11;
        ang = k * 2.4;
        dx = Math.cos(ang) * rad;
        dy = Math.sin(ang) * rad * 0.72;
        span.style.left = (x + dx) + "px";
        span.style.top = (y + dy) + "px";
        box = span.getBoundingClientRect();
        if (box.left < host.left + 1 || box.right > host.right - 1 || box.top < host.top + 1 || box.bottom > host.bottom - 1) continue;
        ok = true;
        for (j = 0; j < placed.length; j++) {
          other = placed[j];
          if (box.left < other.right + 3 && box.right > other.left - 3 && box.top < other.bottom + 3 && box.bottom > other.top - 3) ok = false;
        }
      }
      if (!ok) span.remove();
      else placed.push(span.getBoundingClientRect());
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
    canvas.style.width = "";
    canvas.style.height = "";
    var scene = new THREE.Scene();
    scene.background = new THREE.Color(CLEAR);
    var camera = new THREE.PerspectiveCamera(34, 1, 1, 4000);
    camera.position.set(340, 230, 320);
    camera.lookAt(0, 78, 70);
    scene.add(new THREE.AmbientLight(0xb7c4ea, 0.62));
    var key = new THREE.DirectionalLight(0xf7f9ff, 0.78);
    key.position.set(120, 260, 160);
    scene.add(key);
    var rim = new THREE.DirectionalLight(0x22d3ee, 0.28);
    rim.position.set(-180, 90, -80);
    scene.add(rim);
    var table = new THREE.Mesh(new THREE.CircleGeometry(300, 48), MATS.table);
    table.rotation.x = -Math.PI / 2;
    table.position.y = 0;
    scene.add(table);
    var ring = new THREE.Mesh(
      new THREE.RingGeometry(26, 34, 40),
      new THREE.MeshBasicMaterial({ color: 0x22d3ee, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 1.2;
    scene.add(ring);
    var dyn = new THREE.Group();
    scene.add(dyn);

    function disposeTree(node) {
      if (node.geometry) node.geometry.dispose();
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
        rimPts.push(new THREE.Vector3(0, 200, 40));
        rimPts.push(new THREE.Vector3(40, 160, 160));
      }
      var target = new THREE.Vector3(0, 24, 16);
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
      renderer.setPixelRatio(Math.min(root.devicePixelRatio || 1, 1.5));
      renderer.setSize(w, h, false);
      canvas.style.width = "";
      canvas.style.height = "";
      frameCamera();
    }

    function arm(parent, state, ghost) {
      var layout = root.PINCHY.LAYOUT;
      var pose = root.PINCHY.pose(state);
      var yaw = state.base || 0;
      var upperMat = ghost ? MATS.ghost : MATS.upper;
      var foreMat = ghost ? MATS.ghost : MATS.fore;
      var wristMat = ghost ? MATS.ghost : MATS.wrist;
      var shoulder = vec(0, layout.sy, yaw);
      var elbow = vec(pose.ex, pose.ey, yaw);
      var wrist = vec(pose.wx, pose.wy, yaw);
      var grip = vec(pose.gx, pose.gy, yaw);
      var tip = vec(pose.cx, pose.cy, yaw);
      if (!ghost) {
        var post = new THREE.Mesh(new THREE.CylinderGeometry(16, 22, layout.sy, 16), MATS.post);
        post.position.y = layout.sy / 2;
        parent.add(post);
        var nub = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 22), MATS.hot);
        var ang = yaw * Math.PI / 180;
        nub.position.set(Math.sin(ang) * 28, 2.4, Math.cos(ang) * 28);
        nub.rotation.y = ang;
        parent.add(nub);
      }
      addBone(parent, shoulder, elbow, ghost ? 5 : 8, upperMat);
      addBone(parent, elbow, wrist, ghost ? 4 : 6.2, foreMat);
      addBone(parent, wrist, grip, ghost ? 3 : 4.6, wristMat);
      addJoint(parent, shoulder, ghost ? 4 : 7.5, !ghost && (optsHot(state, "shoulder")));
      addJoint(parent, elbow, ghost ? 3.5 : 6.2, !ghost && optsHot(state, "elbow"));
      addJoint(parent, wrist, ghost ? 3 : 5.2, !ghost && optsHot(state, "wrist"));
      addJoint(parent, grip, ghost ? 2.6 : 4.4, !ghost && optsHot(state, "claw"));
      var half = pose.gap / 2;
      var sign, x1, y1, x2, y2;
      var clawMat = ghost ? MATS.ghost : MATS.claw;
      for (sign = -1; sign <= 1; sign += 2) {
        x1 = pose.gx + pose.nx * sign * half * 0.42;
        y1 = pose.gy + pose.ny * sign * half * 0.42;
        x2 = pose.gx + pose.nx * sign * half + pose.px * layout.jaw;
        y2 = pose.gy + pose.ny * sign * half + pose.py * layout.jaw;
        addBone(parent, grip, vec(x1, y1, yaw), ghost ? 1.4 : 2.4, clawMat);
        addBone(parent, vec(x1, y1, yaw), vec(x2, y2, yaw), ghost ? 1.6 : 2.8, clawMat);
      }
      if (!ghost) {
        var forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        var right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
        var beside = function (point, side, up) {
          return point.clone().addScaledVector(right, side).add(new THREE.Vector3(0, up, 0));
        };
        addLabel(parent, "Base " + Math.round(yaw) + "\u00b0", beside(new THREE.Vector3(0, 14, 0), 78, 0));
        addLabel(parent, "Shoulder " + Math.round(state.shoulder) + "\u00b0", beside(shoulder, 42, 4));
        addLabel(parent, "Elbow " + Math.round(state.elbow) + "\u00b0", beside(elbow, 46, 6));
        addLabel(parent, "Wrist " + Math.round(state.wrist || 0) + "\u00b0", beside(wrist, 40, -20));
        addLabel(parent, "Claw", beside(tip, -22, 28));
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
        arm(dyn, {
          base: level.target.base,
          shoulder: level.target.shoulder,
          elbow: level.target.elbow,
          wrist: 0,
          open: true,
          gap: root.PINCHY.LAYOUT.gapOpen
        }, true);
      }
      arm(dyn, state, false);
      if (opts && opts.world) buildWorld(dyn, state, level);
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
