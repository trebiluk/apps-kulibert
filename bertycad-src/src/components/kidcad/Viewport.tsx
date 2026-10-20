import { useEffect, useRef, useState, type ReactNode } from "react";
import { Box, ChevronRight, Copy, Maximize2, Move, Redo2, RotateCw, Trash2, Undo2 } from "lucide-react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import { STLExporter } from "three/addons/exporters/STLExporter.js";
import { bakeBoolean } from "@/lib/kidcad/csg";
import { applyTransform, clampWorldPos, holeMaterial, makeGeometry, round1, solidMaterial, WORLD_LIMIT } from "@/lib/kidcad/geometry";
import { useKid } from "@/lib/kidcad/store";
import type { Part } from "@/lib/kidcad/types";
import { APP_VERSION } from "@/lib/kidcad/types";
import { useT } from "@/lib/kidcad/i18n";
import { registerBaker, registerExporter, registerFrame, registerHome, registerView, runFrame } from "@/lib/kidcad/viewport-api";

function bakedGeo(part: Part) {
  if (!part.baked) return new THREE.BoxGeometry(10, 10, 10);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(part.baked.pos, 3));
  if (part.baked.nrm) geo.setAttribute("normal", new THREE.Float32BufferAttribute(part.baked.nrm, 3));
  else geo.computeVertexNormals();
  if (part.baked.index) geo.setIndex(part.baked.index);
  return geo;
}

function shapeSig(part: Part) {
  const p = part.params;
  return [part.type, part.hole ? 1 : 0, part.color, p.w ?? "", p.h ?? "", p.d ?? "", p.r ?? "", p.r2 ?? "", p.tube ?? "", part.baked?.pos.length ?? 0].join("|");
}

export function Viewport({ compact = false, onOpenGallery }: { compact?: boolean; onOpenGallery?: () => void }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paintRef = useRef<() => void>(() => {});
  const threeRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    transform: TransformControls;
    partGroup: THREE.Group;
    meshes: Map<string, THREE.Mesh>;
    dragging: boolean;
    plane: THREE.Mesh;
  } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const nav = navigator as Navigator & { deviceMemory?: number };
    const low = (nav.deviceMemory ?? 8) <= 4 || (navigator.hardwareConcurrency ?? 8) <= 4;
    let renderer: THREE.WebGLRenderer;
    const attempts: WebGLContextAttributes[] = [
      { antialias: !low, powerPreference: low ? "low-power" : "high-performance" },
      { antialias: false, powerPreference: "low-power" },
      { antialias: false },
    ];
    try {
      let made: THREE.WebGLRenderer | null = null;
      let last: unknown;
      for (const attrs of attempts) {
        try {
          made = new THREE.WebGLRenderer({ canvas, ...attrs });
          break;
        } catch (err) {
          last = err;
        }
      }
      if (!made) throw last;
      renderer = made;
    } catch {
      wrap.replaceChildren();
      const note = document.createElement("div");
      note.className = "grid h-full place-items-center bg-studio p-6 text-center text-ink";
      note.innerHTML =
        "<p class='max-w-sm text-sm font-semibold'>This Chromebook cannot start the 3D view. Turn on hardware acceleration, then reload.</p>";
      wrap.appendChild(note);
      return;
    }
    renderer.setPixelRatio(low ? 1 : Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0xd5dee6, 1);
    renderer.shadowMap.enabled = !low;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xd5dee6, 280, 640);

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 2000);
    camera.position.set(70, 55, 90);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 8, 0);
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.minDistance = 24;
    controls.maxDistance = 260;
    controls.rotateSpeed = 0.85;
    controls.zoomSpeed = 1.15;
    controls.panSpeed = 0.7;
    controls.addEventListener("change", () => {
      controls.target.x = THREE.MathUtils.clamp(controls.target.x, -WORLD_LIMIT, WORLD_LIMIT);
      controls.target.y = THREE.MathUtils.clamp(controls.target.y, 0, 80);
      controls.target.z = THREE.MathUtils.clamp(controls.target.z, -WORLD_LIMIT, WORLD_LIMIT);
    });
    controls.touches.ONE = THREE.TOUCH.ROTATE;
    controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
    renderer.domElement.style.touchAction = "none";

    scene.add(new THREE.HemisphereLight(0xffffff, 0xb8c4b0, 1.05));
    const key = new THREE.DirectionalLight(0xffffff, 1.15);
    key.position.set(40, 80, 30);
    key.castShadow = !low;
    scene.add(key);
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));

    const grid = new THREE.GridHelper(200, 40, 0x2e86ab, 0xc5d0d8);
    grid.position.y = 0.01;
    scene.add(grid);
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshStandardMaterial({ color: 0xe8e4dc, roughness: 1, metalness: 0 }),
    );
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    scene.add(plane);
    scene.add(new THREE.AxesHelper(24));

    const partGroup = new THREE.Group();
    scene.add(partGroup);

    const transform = new TransformControls(camera, renderer.domElement);
    transform.setSize(window.matchMedia("(pointer: coarse)").matches ? 1.2 : 0.85);
    const lastLeader = new THREE.Vector3();
    transform.addEventListener("dragging-changed", (e) => {
      const dragging = Boolean((e as { value: boolean }).value);
      controls.enabled = !dragging;
      const api = threeRef.current;
      if (api) api.dragging = dragging;
      const obj = transform.object;
      if (dragging) {
        useKid.getState().beginTransform();
        if (obj) lastLeader.copy(obj.position);
      } else {
        pullAll();
        if (useKid.getState().lowFrustration) useKid.getState().sitOnFloor();
        useKid.getState().persistNow();
      }
    });
    transform.addEventListener("objectChange", () => {
      const obj = transform.object;
      if (!obj) return;
      const mode = transform.mode;
      if (mode === "translate") {
        const dx = obj.position.x - lastLeader.x;
        const dy = obj.position.y - lastLeader.y;
        const dz = obj.position.z - lastLeader.z;
        lastLeader.copy(obj.position);
        const leaderId = (obj as THREE.Mesh).userData.partId as string | undefined;
        useKid.getState().selected.forEach((id) => {
          if (id === leaderId) return;
          const m = meshes.get(id);
          if (!m) return;
          m.position.x += dx;
          m.position.y += dy;
          m.position.z += dz;
          const c = clampWorldPos([m.position.x, m.position.y, m.position.z]);
          m.position.set(c[0], c[1], c[2]);
        });
        const lc = clampWorldPos([obj.position.x, obj.position.y, obj.position.z]);
        if (lc[0] !== obj.position.x || lc[1] !== obj.position.y || lc[2] !== obj.position.z) {
          obj.position.set(lc[0], lc[1], lc[2]);
          lastLeader.copy(obj.position);
        }
      }
      pullAll(false);
    });
    scene.add(transform.getHelper());

    const meshes = new Map<string, THREE.Mesh>();
    threeRef.current = { renderer, scene, camera, controls, transform, partGroup, meshes, dragging: false, plane };

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const host = wrap;
    let dirty = true;
    function resize() {
      const w = host.clientWidth || 800;
      const h = host.clientHeight || 500;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      dirty = true;
    }
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();
    requestAnimationFrame(resize);

    let raf = 0;
    let paused = false;
    paintRef.current = () => {
      dirty = true;
    };
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (paused) return;
      if (controls.update()) dirty = true;
      if (threeRef.current?.dragging) dirty = true;
      if (!dirty) return;
      renderer.render(scene, camera);
      dirty = false;
    };
    loop();
    const onVis = () => {
      paused = document.hidden;
      if (!document.hidden) dirty = true;
    };
    document.addEventListener("visibilitychange", onVis);

    const onLost = (ev: Event) => {
      ev.preventDefault();
      paused = true;
      useKid.getState().showToast("3D view paused. Reload if the workplane stays blank.");
    };
    const onRestored = () => {
      paused = false;
      dirty = true;
      resize();
    };
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);

    function pullOne(id: string, pushHist = false) {
      const api = threeRef.current;
      if (!api) return;
      const mesh = api.meshes.get(id);
      const part = useKid.getState().project.parts.find((p) => p.id === id);
      if (!mesh || !part) return;
      const pos: [number, number, number] = clampWorldPos([mesh.position.x, mesh.position.y, mesh.position.z]);
      mesh.position.set(pos[0], pos[1], pos[2]);
      const rot: [number, number, number] = [
        round1(THREE.MathUtils.radToDeg(mesh.rotation.x)),
        round1(THREE.MathUtils.radToDeg(mesh.rotation.y)),
        round1(THREE.MathUtils.radToDeg(mesh.rotation.z)),
      ];
      let params = part.params;
      const sx = mesh.scale.x,
        sy = mesh.scale.y,
        sz = mesh.scale.z;
      if (part.type !== "baked" && (Math.abs(sx - 1) > 0.02 || Math.abs(sy - 1) > 0.02 || Math.abs(sz - 1) > 0.02)) {
        params = { ...part.params };
        if (params.w) params.w = Math.max(0.5, round1(params.w * sx));
        if (params.h) params.h = Math.max(0.5, round1(params.h * sy));
        if (params.d) params.d = Math.max(0.5, round1(params.d * sz));
        if (params.r && part.type !== "roundbox") params.r = Math.max(0.5, round1(params.r * Math.max(sx, sz)));
        if (params.r2) params.r2 = Math.max(0.4, round1(params.r2 * Math.max(sx, sz)));
        if (params.tube) params.tube = Math.max(0.4, round1(params.tube * Math.max(sy, 0.5)));
        mesh.scale.set(1, 1, 1);
        mesh.geometry.dispose();
        mesh.geometry = makeGeometry({ ...part, params });
      }
      void pushHist;
      useKid.getState().applyTransformLive(part.id, pos, rot, params);
    }

    function pullAll(pushHist = true) {
      const ids = useKid.getState().selected;
      if (!ids.length) return;
      if (ids.length === 1) {
        pullOne(ids[0], pushHist);
        return;
      }
      const rows = ids
        .map((id) => {
          const mesh = meshes.get(id);
          if (!mesh) return null;
          const pos = clampWorldPos([mesh.position.x, mesh.position.y, mesh.position.z]);
          mesh.position.set(pos[0], pos[1], pos[2]);
          return {
            id,
            pos,
            rot: [
              round1(THREE.MathUtils.radToDeg(mesh.rotation.x)),
              round1(THREE.MathUtils.radToDeg(mesh.rotation.y)),
              round1(THREE.MathUtils.radToDeg(mesh.rotation.z)),
            ] as [number, number, number],
          };
        })
        .filter((r): r is { id: string; pos: [number, number, number]; rot: [number, number, number] } => Boolean(r));
      useKid.getState().applyManyLive(rows);
    }

    function pull(pushHist = true) {
      pullAll(pushHist);
    }

    let tapX = 0;
    let tapY = 0;
    let tapId = -1;
    const onPointerDown = (ev: PointerEvent) => {
      tapX = ev.clientX;
      tapY = ev.clientY;
      tapId = ev.pointerId;
    };
    const onPointerUp = (ev: PointerEvent) => {
      if (ev.pointerId !== tapId) return;
      const dx = ev.clientX - tapX;
      const dy = ev.clientY - tapY;
      if (dx * dx + dy * dy > (ev.pointerType === "touch" ? 400 : 64)) return;
      const api = threeRef.current;
      if (!api || api.dragging) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const kid = useKid.getState();
      if (kid.tool === "voxel") {
        const meshHits = raycaster.intersectObjects(partGroup.children, false);
        const ground = raycaster.intersectObject(api.plane);
        if (kid.voxelBreak || ev.altKey) {
          const id = meshHits[0]?.object.userData.partId as string | undefined;
          if (id) kid.breakPart(id);
          return;
        }
        const s = kid.voxelSize;
        const hit = meshHits[0];
        if (hit?.face) {
          const n = hit.face.normal.clone();
          n.transformDirection(hit.object.matrixWorld);
          n.x = Math.round(n.x);
          n.y = Math.round(n.y);
          n.z = Math.round(n.z);
          const p = hit.point.clone().add(n.multiplyScalar(s * 0.55));
          kid.placeVoxel(p.x, p.y, p.z);
        } else if (ground[0]) {
          kid.placeVoxel(ground[0].point.x, 0, ground[0].point.z);
        }
        return;
      }
      const hits = raycaster.intersectObjects(partGroup.children, false);
      if (hits.length) {
        const id = hits[0].object.userData.partId as string;
        const add = ev.shiftKey || useKid.getState().multiPick;
        useKid.getState().select([id], add);
      } else if (!ev.shiftKey && !useKid.getState().multiPick) {
        useKid.getState().select([]);
      }
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("contextmenu", (e) => e.preventDefault());

    registerBaker((ids) => {
      const solids: THREE.Mesh[] = [];
      const holes: THREE.Mesh[] = [];
      ids.forEach((id) => {
        const p = useKid.getState().project.parts.find((x) => x.id === id);
        const m = meshes.get(id);
        if (!p || !m) return;
        m.updateMatrixWorld(true);
        if (p.hole) holes.push(m);
        else solids.push(m);
      });
      if (!solids.length) return "Need at least one solid shape.";
      try {
        const geo = bakeBoolean(solids, holes) as THREE.BufferGeometry;
        const pos = Array.from(geo.attributes.position.array as Float32Array);
        const nrm = geo.attributes.normal ? Array.from(geo.attributes.normal.array as Float32Array) : null;
        const baked: Part = {
          id: "p" + Math.random().toString(36).slice(2, 9),
          name: "Combined",
          type: "baked",
          params: {},
          pos: [0, 0, 0],
          rot: [0, 0, 0],
          color: solids[0]
            ? (useKid.getState().project.parts.find((p) => p.id === solids[0].userData.partId)?.color ?? "#f4b942")
            : "#f4b942",
          hole: false,
          visible: true,
          baked: { pos, nrm, index: null },
        };
        return baked;
      } catch (err) {
        return err instanceof Error ? err.message : "Could not combine those shapes.";
      }
    });

    registerExporter(() => {
      const group = new THREE.Group();
      useKid.getState().project.parts.forEach((p) => {
        if (p.hole || !p.visible) return;
        const m = meshes.get(p.id);
        if (m) group.add(m.clone());
      });
      if (!group.children.length) return null;
      group.updateMatrixWorld(true);
      return new STLExporter().parse(group);
    });

    registerView((name) => {
      const t = controls.target.clone();
      if (name === "top") camera.position.set(t.x, t.y + 140, t.z + 0.01);
      if (name === "front") camera.position.set(t.x, t.y + 20, t.z + 140);
      if (name === "right") camera.position.set(t.x + 140, t.y + 20, t.z);
      if (name === "iso") camera.position.set(t.x + 70, t.y + 55, t.z + 90);
      controls.update();
      dirty = true;
    });
    registerHome(() => {
      controls.target.set(0, 8, 0);
      camera.position.set(70, 55, 90);
      const box = new THREE.Box3();
      let any = false;
      meshes.forEach((m) => {
        if (!m.visible) return;
        box.expandByObject(m);
        any = true;
      });
      if (any && !box.isEmpty()) {
        box.expandByPoint(new THREE.Vector3(0, 0, 0));
        const c = new THREE.Vector3();
        const size = new THREE.Vector3();
        box.getCenter(c);
        box.getSize(size);
        const dist = Math.min(220, Math.max(90, size.length() * 1.5));
        controls.target.set(c.x, Math.max(8, c.y), c.z);
        camera.position.set(c.x + dist * 0.65, c.y + dist * 0.45, c.z + dist * 0.8);
      }
      controls.update();
      dirty = true;
    });
    registerFrame(() => {
      const ids = useKid.getState().selected;
      const box = new THREE.Box3();
      let any = false;
      ids.forEach((id) => {
        const m = meshes.get(id);
        if (!m) return;
        box.expandByObject(m);
        any = true;
      });
      if (!any || box.isEmpty()) return;
      const c = new THREE.Vector3();
      const size = new THREE.Vector3();
      box.getCenter(c);
      box.getSize(size);
      const dist = Math.max(70, size.length() * 1.7);
      const sheet = document.querySelector(".kidcad-gallery-pocket");
      const sheetBox = sheet?.getBoundingClientRect();
      const bias = sheetBox && sheetBox.width > 24 ? dist * 0.42 : 0;
      controls.target.copy(c);
      camera.position.set(c.x + dist * 0.65 - bias, c.y + dist * 0.5, c.z + dist * 0.8);
      controls.update();
      dirty = true;
    });

    return () => {
      paintRef.current = () => {};
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      registerBaker(null);
      registerExporter(null);
      registerView(null);
      registerFrame(null);
      registerHome(null);
      renderer.dispose();
      threeRef.current = null;
    };
  }, []);

  const parts = useKid((s) => s.project.parts);
  const selected = useKid((s) => s.selected);
  const tool = useKid((s) => s.tool);
  const snap = useKid((s) => s.snap);
  const lfm = useKid((s) => s.lowFrustration);
  const canUndo = useKid((s) => s.history.length > 0);
  const canRedo = useKid((s) => s.future.length > 0);
  const focusTick = useKid((s) => s.focusTick);

  useEffect(() => {
    const api = threeRef.current;
    if (!api) return;
    const live = new Set(parts.map((p) => p.id));
    api.meshes.forEach((mesh, id) => {
      if (!live.has(id)) {
        api.partGroup.remove(mesh);
        mesh.geometry.dispose();
        const mat = mesh.material;
        if (mat instanceof THREE.Material) mat.dispose();
        api.meshes.delete(id);
      }
    });
    parts.forEach((part) => {
      let mesh = api.meshes.get(part.id);
      const sig = shapeSig(part);
      if (!mesh) {
        const geo = part.type === "baked" ? bakedGeo(part) : makeGeometry(part);
        mesh = new THREE.Mesh(geo, part.hole ? holeMaterial(part.color) : solidMaterial(part.color));
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.partId = part.id;
        mesh.userData.sig = sig;
        api.partGroup.add(mesh);
        api.meshes.set(part.id, mesh);
      } else if (!api.dragging && mesh.userData.sig !== sig) {
        mesh.geometry.dispose();
        const mat = mesh.material;
        if (mat instanceof THREE.Material) mat.dispose();
        mesh.geometry = part.type === "baked" ? bakedGeo(part) : makeGeometry(part);
        mesh.material = part.hole ? holeMaterial(part.color) : solidMaterial(part.color);
        mesh.userData.sig = sig;
      }
      mesh.visible = part.visible;
      if (!api.dragging) applyTransform(mesh, part);
    });
    paintRef.current();
  }, [parts]);

  useEffect(() => {
    if (!focusTick) return;
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => runFrame());
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [focusTick, parts]);

  useEffect(() => {
    const api = threeRef.current;
    if (!api) return;
    if (tool === "select" || tool === "voxel" || selected.length === 0) {
      api.transform.detach();
      return;
    }
    const mesh = api.meshes.get(selected[0]);
    if (!mesh) {
      api.transform.detach();
      return;
    }
    api.transform.attach(mesh);
    api.transform.setMode(tool);
    api.transform.setTranslationSnap(snap);
    api.transform.setRotationSnap(THREE.MathUtils.degToRad(15));
    api.transform.setScaleSnap(0.1);
    const fat = lfm || window.matchMedia("(pointer: coarse)").matches;
    api.transform.setSize(fat ? 1.35 : 0.85);
    paintRef.current();
  }, [selected, tool, snap, parts, lfm]);

  const toast = useKid((s) => s.toast);
  const [chipsOpen, setChipsOpen] = useState(true);
  const [pocketWords, setPocketWords] = useState(true);
  const [coachOn, setCoachOn] = useState(true);
  const t = useT();
  const prevParts = useRef(0);
  useEffect(() => {
    if (prevParts.current === 0 && parts.length > 0) setChipsOpen(false);
    if (parts.length === 0) setChipsOpen(true);
    prevParts.current = parts.length;
  }, [parts.length]);
  useEffect(() => {
    try {
      if (localStorage.getItem(COACH_STRIP_KEY) === "off") setCoachOn(false);
    } catch {
      /* ignore */
    }
  }, []);
  const [viewName, setViewName] = useState<"iso" | "top" | "front" | "right">("iso");
  const cycleView = () => {
    const order = ["iso", "top", "front", "right"] as const;
    const next = order[(order.indexOf(viewName) + 1) % order.length];
    setViewName(next);
    useKid.getState().setView(next);
  };

  return (
    <div
      ref={wrapRef}
      className="relative h-full min-h-0 min-w-0 overflow-hidden bg-studio"
      data-testid="viewport"
      style={{ minHeight: "50dvh", height: "100%", background: "#d5dee6" }}
    >
      <canvas ref={canvasRef} role="img" aria-label="BertyCAD 3D view" aria-describedby="bertycad-view-summary" className="block h-full w-full touch-none" style={{ display: "block", width: "100%", height: "100%" }} />
      <p id="bertycad-view-summary" style={{ position: "absolute", width: 1, height: 1, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)" }}>
        {selected.length ? selected.length + " selected" : "No part selected"}
      </p>
      <span
        className="kidcad-rev"
        data-testid="rev-chip"
        data-rev={APP_VERSION}
        style={{
          position: "absolute",
          right: 8,
          bottom: coachOn ? 52 : 8,
          zIndex: 12,
          pointerEvents: "none",
          background: "#f5f4ef",
          color: "#0b3a66",
          border: "1px solid #d4cfc4",
          borderRadius: 999,
          padding: "2px 8px",
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        BC {APP_VERSION}
      </span>
      {toast ? (
        <div className={`pointer-events-none absolute left-1/2 z-10 max-w-[80%] -translate-x-1/2 rounded-full border border-line bg-paper px-4 py-2 text-center text-sm text-ink ${coachOn ? "bottom-14" : "bottom-2"}`} role="status">
          {toast.text}
        </div>
      ) : null}
      <div className="kidcad-view-chips absolute left-14 top-2 z-10 flex max-w-[calc(100%-8rem)] items-center gap-1" data-testid="view-chips">
        <button
          type="button"
          className="inline-flex h-11 shrink-0 items-center gap-1 rounded-lg border border-line bg-paper px-2 text-sm font-semibold text-ink"
          aria-label={t("Shapes")}
          aria-expanded={chipsOpen}
          onClick={() => setChipsOpen((v) => !v)}
        >
          <Box className="size-5" />
          {t("Shapes")}
        </button>
        <button
          type="button"
          className="h-11 min-w-11 shrink-0 rounded-lg bg-gold px-3 text-sm font-semibold text-ink"
          onClick={() => useKid.getState().goHome()}
          aria-label={t("Home")}
        >
          {t("Home")}
        </button>
        {chipsOpen ? (
          <>
        {compact ? (
          <button
            type="button"
            className="h-11 min-w-11 shrink-0 rounded-lg border border-line bg-paper px-3 text-sm font-semibold capitalize text-ink"
            onClick={cycleView}
            aria-label="Change view"
          >
            {t(viewName)}
          </button>
        ) : (
          (["iso", "top", "front", "right"] as const).map((v) => (
            <button
              key={v}
              type="button"
              className="h-11 min-w-11 shrink-0 rounded-lg border border-line bg-paper px-3 text-sm font-semibold capitalize text-ink"
              onClick={() => {
                setViewName(v);
                useKid.getState().setView(v);
              }}
            >
              {t(v)}
            </button>
          ))
        )}
        <span className="kidcad-chip-gap" aria-hidden />
        <div className="kidcad-shape-rail flex items-center gap-1" data-testid="shape-rail" role="group" aria-label="Shapes">
          {SHAPE_RAIL.map((shape) => (
            <button
              key={shape.type}
              type="button"
              className={`kidcad-shape-chip ${parts.length === 0 && shape.type === "box" ? "bg-gold" : ""}`}
              data-testid={`shape-rail-${shape.type}`}
              onClick={() => useKid.getState().addShape(shape.type)}
            >
              {t(shape.label)}
            </button>
          ))}
        </div>
          </>
        ) : null}
      </div>
      <div className={`kidcad-edge-pocket kidcad-xform ${pocketWords ? "" : "is-icon"}`} data-testid="edge-pocket" role="group" aria-label="Move tools">
        <button
          type="button"
          className="kidcad-shape-chip"
          aria-label={pocketWords ? t("Hide words") : t("Show words")}
          aria-expanded={pocketWords}
          onClick={() => setPocketWords((v) => !v)}
        >
          <ChevronRight className={`size-5 ${pocketWords ? "rotate-90" : ""}`} />
          <span className="kidcad-xform-word">{t("Words")}</span>
        </button>
        <PocketBtn testid="xform-translate" on={tool === "translate"} label={t("Move")} onClick={() => useKid.getState().setTool("translate")}>
          <Move className="size-5" aria-hidden />
        </PocketBtn>
        <PocketBtn testid="xform-rotate" on={tool === "rotate"} label={t("Rotate")} onClick={() => useKid.getState().setTool("rotate")}>
          <RotateCw className="size-5" aria-hidden />
        </PocketBtn>
        <PocketBtn testid="xform-scale" on={tool === "scale"} label={t("Scale")} onClick={() => useKid.getState().setTool("scale")}>
          <Maximize2 className="size-5" aria-hidden />
        </PocketBtn>
        <PocketBtn testid="xform-duplicate" label={t("Duplicate")} onClick={() => useKid.getState().duplicateSelected()}>
          <Copy className="size-5" aria-hidden />
        </PocketBtn>
        <PocketBtn testid="xform-delete" label={t("Delete")} onClick={() => useKid.getState().deleteSelected()}>
          <Trash2 className="size-5" aria-hidden />
        </PocketBtn>
        <div className="kidcad-xform-pair">
          <PocketBtn testid="xform-undo" label={t("Undo")} quiet={!canUndo} onClick={() => useKid.getState().undo()}>
            <Undo2 className="size-5" aria-hidden />
          </PocketBtn>
          <PocketBtn testid="xform-redo" label={t("Redo")} quiet={!canRedo} onClick={() => useKid.getState().redo()}>
            <Redo2 className="size-5" aria-hidden />
          </PocketBtn>
        </div>
      </div>
      <div className="kidcad-edge-secondary" data-testid="edge-save-gallery">
        <button
          type="button"
          className="kidcad-shape-chip bg-gold"
          data-testid="viewport-save"
          onClick={() => void useKid.getState().save(false)}
        >
          {t("Save")}
        </button>
        <button
          type="button"
          className="kidcad-shape-chip"
          data-testid="edge-gallery"
          onClick={() => onOpenGallery?.()}
        >
          {t("Gallery")}
        </button>
      </div>
      {coachOn ? (
        <div className="kidcad-coach-strip" data-testid="coach-strip" role="status">
          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{t("coach")}</p>
          <button
            type="button"
            className="h-11 shrink-0 rounded-full bg-navy px-3 text-xs font-semibold text-paper"
            data-testid="coach-strip-dismiss"
            onClick={() => {
              try {
                localStorage.setItem(COACH_STRIP_KEY, "off");
              } catch {
                /* ignore */
              }
              setCoachOn(false);
            }}
          >
            {t("Got it")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

const COACH_STRIP_KEY = "bertycad-coach-20";

const SHAPE_RAIL = [
  { type: "box" as const, label: "Cube" },
  { type: "sphere" as const, label: "Sphere" },
  { type: "cyl" as const, label: "Cylinder" },
];

function PocketBtn({
  children,
  label,
  onClick,
  testid,
  on = false,
  quiet = false,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  testid: string;
  on?: boolean;
  quiet?: boolean;
}) {
  return (
    <button
      type="button"
      className={`${on ? "is-on" : ""} ${quiet ? "is-quiet" : ""}`.trim()}
      data-testid={testid}
      aria-label={label}
      onClick={onClick}
    >
      {children}
      <span className="kidcad-xform-word">{label}</span>
    </button>
  );
}
