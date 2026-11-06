/**
 * DIGITAL ORBIT — hero scene (vanilla three.js, lazy-loaded chunk).
 *
 * Mapping to content (see src/data/config.ts):
 *   core        → main specialty (Frontend × AI); the geodesic cage = the "AI inside"
 *   rings       → skill groups (innermost first), nodes on a ring → skills of that group
 *   satellites  → featured projects (0 while projects[] is empty)
 *   comet       → experience (one pass on load)
 *   particles   → ambient field, brightest around the object, fading toward the text
 *
 * Budget: ~10 draw calls, < 8k tris desktop. One render loop, paused off-screen / tab hidden.
 */
import {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  CustomBlending,
  OneFactor,
  ZeroFactor,
  DirectionalLight,
  EdgesGeometry,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  Line,
  LineBasicMaterial,
  LineSegments,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  Object3D,
  OctahedronGeometry,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Points,
  PointsMaterial,
  Raycaster,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  Texture,
  TorusGeometry,
  Vector2,
  WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export type Tone = "cyan" | "violet" | "gray" | "dotted";
export type OrbitGroup = { id: string; tone: Tone; count: number; clickable: boolean };

export type OrbitOptions = {
  canvas: HTMLCanvasElement;
  /** Element that receives pointer events and defines the canvas box (the hero section). */
  host: HTMLElement;
  /** DOM box the object must fit into (same box as the SVG fallback). */
  slot: HTMLElement;
  groups: OrbitGroup[];
  satellites: number;
  comet: boolean;
  onReady: () => void;
  onFail: () => void;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
};

export type OrbitController = {
  setActive: (id: string | null) => void;
  /** 0 = hero fully in view, 1 = hero scrolled out. */
  setScroll: (p: number) => void;
  dispose: () => void;
};

/* ───────── constants ───────── */

const FOV = 35;
const CAM_Z = 10;
const FIT_R = 2.4; // object radius (world units) that must fit inside the slot
const RING_R = [1.2, 1.5, 1.8, 2.12];
const RING_TILT: [number, number, number][] = [
  [1.22, 0.18, -0.32],
  [1.05, -0.5, 0.48],
  [1.26, 0.55, -0.9],
  [1.12, -0.1, 0.14],
];
const RING_SPEED = [0.22, -0.16, 0.12, -0.06];
const FOLLOW = 0.21; // ≈ 12°
const MAX_SEGMENTS = 320;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOutExpo = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const damp = (a: number, b: number, lambda: number, dt: number) => a + (b - a) * (1 - Math.exp(-lambda * dt));

/**
 * Additive blending that leaves the canvas alpha untouched (premultiplied canvas):
 * light is added on top of the page instead of painting opaque dark pixels.
 */
function additive<M extends Material>(m: M): M {
  m.blending = CustomBlending;
  m.blendSrc = OneFactor;
  m.blendDst = OneFactor;
  m.blendSrcAlpha = ZeroFactor;
  m.blendDstAlpha = OneFactor;
  m.premultipliedAlpha = true;
  m.transparent = true;
  m.depthWrite = false;
  return m;
}

function cssColor(name: string) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
  const [r, g, b] = raw.split(/\s+/).map(Number);
  return new Color().setRGB((r || 0) / 255, (g || 0) / 255, (b || 0) / 255, SRGBColorSpace);
}

/** Torus whose index buffer runs along the ring, so drawRange can "draw" the arc in. */
function arcTorus(radius: number, tube: number, radial: number, tubular: number) {
  const g = new TorusGeometry(radius, tube, radial, tubular);
  const idx: number[] = [];
  for (let i = 1; i <= tubular; i++) {
    for (let j = 1; j <= radial; j++) {
      const a = (tubular + 1) * j + i - 1;
      const b = (tubular + 1) * (j - 1) + i - 1;
      const c = (tubular + 1) * (j - 1) + i;
      const d = (tubular + 1) * j + i;
      idx.push(a, b, d, b, c, d);
    }
  }
  g.setIndex(idx);
  return { geometry: g, perSegment: radial * 6, total: idx.length };
}

function radialTexture(inner: string, size = 128) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, inner);
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

/* ───────── scene ───────── */

export function createOrbitScene(opts: OrbitOptions): OrbitController {
  const { canvas, host, slot, groups } = opts;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const width0 = host.clientWidth;
  const quality = width0 < 768 || coarse ? 0 : width0 < 1024 ? 1 : 2; // 0 mobile · 1 tablet · 2 desktop

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);
  let dprCap = coarse ? 1.5 : 2;

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 50);
  camera.position.set(0, 0, CAM_Z);

  const colors = {
    cyan: cssColor("cyan"),
    violet: cssColor("violet"),
    gray: cssColor("ink-2"),
    dotted: cssColor("ink-3"),
    ink: cssColor("ink-1"),
    metal: cssColor("metal-1"),
  };

  // Environment for the metal core only (generated once, no HDR download).
  const pmrem = new PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const disposables: { dispose: () => void }[] = [envTex, pmrem];
  const track = <T extends { dispose: () => void }>(x: T) => (disposables.push(x), x);

  /* rig = follows layout/pointer/scroll; system = the object itself */
  const rig = new Group();
  const system = new Group();
  system.rotation.set(0.12, -0.2, 0);
  rig.add(system);
  scene.add(rig);

  // lights (only the physical core reacts)
  const key = new DirectionalLight(0xffffff, 1.4);
  key.position.set(3, 4, 5);
  const rim = new DirectionalLight(colors.cyan, 2.2);
  rim.position.set(-4, 1, -3);
  scene.add(key, rim);

  /* ── core ── */
  const coreGeo = track(new IcosahedronGeometry(0.62, quality === 0 ? 8 : 16));
  const coreMat = track(
    new MeshPhysicalMaterial({
      color: colors.metal,
      metalness: 0.9,
      roughness: 0.2,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
      iridescence: 0.25,
      iridescenceIOR: 1.4,
      envMap: envTex,
      envMapIntensity: 1.1,
    }),
  );
  const core = new Mesh(coreGeo, coreMat);
  system.add(core);

  const rimMat = track(
    new ShaderMaterial({
      uniforms: { uColor: { value: colors.cyan }, uIntensity: { value: 0.7 } },
      vertexShader: /* glsl */ `
        varying vec3 vN; varying vec3 vV;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vN = normalize(normalMatrix * normal);
          vV = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor; uniform float uIntensity;
        varying vec3 vN; varying vec3 vV;
        void main() {
          float f = pow(1.0 - max(dot(vN, vV), 0.0), 3.0) * uIntensity;
          gl_FragColor = vec4(uColor * f, f);
          #include <colorspace_fragment>
        }`,
    }),
  );
  additive(rimMat);
  const rimMesh = new Mesh(coreGeo, rimMat);
  rimMesh.scale.setScalar(1.035);
  system.add(rimMesh);

  // geodesic cage = "the AI inside the interface"
  const cageSrc = new IcosahedronGeometry(0.82, 1);
  const cageGeo = track(new EdgesGeometry(cageSrc));
  cageSrc.dispose();
  const cageMat = track(
    new LineBasicMaterial({ color: colors.violet, transparent: true, opacity: 0.28, depthWrite: false }),
  );
  const cage = new LineSegments(cageGeo, cageMat);
  system.add(cage);

  // soft violet halo behind the core — analytic gradient (no texture → no edge artifacts)
  const haloMat = track(
    additive(
      new ShaderMaterial({
        uniforms: { uColor: { value: colors.violet }, uOpacity: { value: 0 } },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor; uniform float uOpacity; varying vec2 vUv;
          void main() {
            float d = length(vUv - 0.5) * 2.0;
            float a = pow(max(1.0 - d, 0.0), 2.4) * uOpacity;
            gl_FragColor = vec4(uColor * a, a);
            #include <colorspace_fragment>
          }`,
      }),
    ),
  );
  const halo = new Mesh(track(new PlaneGeometry(1, 1)), haloMat);
  halo.scale.setScalar(4.2);
  halo.position.z = -1.2;
  halo.renderOrder = -1;
  rig.add(halo);

  /* ── rings ── */
  const dotTex = track(radialTexture("rgba(255,255,255,1)", 32));

  type RingRuntime = {
    id: string;
    clickable: boolean;
    spin: Group;
    speed: number;
    base: number;
    mats: (MeshBasicMaterial | PointsMaterial)[];
    draw: (k: number) => void;
    nodes: InstancedMesh | null;
    nodeScale: number;
    nodeAngles: number[];
    radius: number;
    lastK: number;
    hit: Mesh;
  };
  const rings: RingRuntime[] = [];
  const hitMeshes: Mesh[] = [];
  const dummy = new Object3D();

  groups.forEach((g, i) => {
    const r = RING_R[i % RING_R.length] + Math.floor(i / RING_R.length) * 0.3;
    const tilt = new Group();
    tilt.rotation.set(...RING_TILT[i % RING_TILT.length]);
    const spin = new Group();
    tilt.add(spin);
    system.add(tilt);

    const color = colors[g.tone];
    const mats: RingRuntime["mats"] = [];
    let draw: (k: number) => void;
    const base = g.tone === "dotted" ? 0.6 : 0.55;

    if (g.tone === "dotted") {
      const n = 120;
      const pos = new Float32Array(n * 3);
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2;
        pos[k * 3] = Math.cos(a) * r;
        pos[k * 3 + 1] = Math.sin(a) * r;
      }
      const geo = track(new BufferGeometry());
      geo.setAttribute("position", new BufferAttribute(pos, 3));
      const mat = track(
        new PointsMaterial({
          color,
          size: 2.2 * Math.min(window.devicePixelRatio, dprCap),
          sizeAttenuation: false,
          map: dotTex,
          transparent: true,
          depthWrite: false,
          opacity: 0,
        }),
      );
      spin.add(new Points(geo, mat));
      mats.push(mat);
      draw = (k) => geo.setDrawRange(0, Math.ceil(n * k));
    } else {
      const { geometry, perSegment, total } = arcTorus(r, 0.011, 4, 220);
      track(geometry);
      const mat = track(new MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false }));
      spin.add(new Mesh(geometry, mat));
      mats.push(mat);
      draw = (k) => geometry.setDrawRange(0, Math.min(total, Math.ceil((total / perSegment) * k) * perSegment));
    }

    // nodes = skills in this group
    let nodes: InstancedMesh | null = null;
    const nodeAngles: number[] = [];
    if (g.count > 0) {
      const nGeo = track(new SphereGeometry(0.038, 12, 8));
      const nMat = track(new MeshBasicMaterial({ color, transparent: true, opacity: 0 }));
      nodes = new InstancedMesh(nGeo, nMat, g.count);
      for (let k = 0; k < g.count; k++) nodeAngles.push(i * 0.9 + (k / g.count) * Math.PI * 2);
      spin.add(nodes);
      mats.push(nMat);
    }

    // invisible, fatter hit area for hover (fine pointers only)
    const hitGeo = track(new TorusGeometry(r, 0.09, 4, 72));
    const hitMat = track(new MeshBasicMaterial({ visible: false }));
    const hit = new Mesh(hitGeo, hitMat);
    hit.userData.id = g.id;
    spin.add(hit);
    hitMeshes.push(hit);

    rings.push({ id: g.id, clickable: g.clickable, spin, speed: RING_SPEED[i % RING_SPEED.length], base, mats, draw, nodes, nodeScale: 0, nodeAngles, radius: r, lastK: -1, hit });
    if (nodes) placeNodes(rings[rings.length - 1], 0);
    draw(0);
  });

  function placeNodes(r: RingRuntime, scale: number) {
    if (!r.nodes) return;
    const sc = Math.max(0.0001, scale);
    r.nodeAngles.forEach((a, k) => {
      dummy.position.set(Math.cos(a) * r.radius, Math.sin(a) * r.radius, 0);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(sc);
      dummy.updateMatrix();
      r.nodes!.setMatrixAt(k, dummy.matrix);
    });
    r.nodes.instanceMatrix.needsUpdate = true;
  }

  /* ── satellites = projects ── */
  let satellites: InstancedMesh | null = null;
  const satTilt = new Group();
  satTilt.rotation.set(1.3, 0.4, 0.2);
  system.add(satTilt);
  if (opts.satellites > 0) {
    const sGeo = track(new OctahedronGeometry(0.07));
    const sMat = track(new MeshBasicMaterial({ color: colors.ink, transparent: true, opacity: 0 }));
    satellites = new InstancedMesh(sGeo, sMat, opts.satellites);
    satTilt.add(satellites);
  }

  /* ── comet = experience (one pass) ── */
  const COMET_N = 28;
  let comet: Line | null = null;
  const cometPos = new Float32Array(COMET_N * 3);
  const cometCol = new Float32Array(COMET_N * 3);
  if (opts.comet) {
    const geo = track(new BufferGeometry());
    geo.setAttribute("position", new BufferAttribute(cometPos, 3));
    geo.setAttribute("color", new BufferAttribute(cometCol, 3));
    const mat = track(additive(new LineBasicMaterial({ vertexColors: true })));
    comet = new Line(geo, mat);
    comet.visible = false;
    const cometTilt = new Group();
    cometTilt.rotation.set(1.1, -0.6, 0.5);
    cometTilt.add(comet);
    system.add(cometTilt);
  }

  /* ── particles (world space, whole hero) ── */
  const P_MAX = quality === 0 ? 40 : quality === 1 ? 70 : 110;
  let pCount = P_MAX;
  let linesOn = quality > 0;
  const pU = new Float32Array(P_MAX * 2); // normalized position in [-0.5, 0.5]
  const pV = new Float32Array(P_MAX * 2); // velocity (normalized units / s)
  const pBase = new Float32Array(P_MAX * 2);
  const pZ = new Float32Array(P_MAX);
  for (let k = 0; k < P_MAX; k++) {
    pU[k * 2] = Math.random() - 0.5;
    pU[k * 2 + 1] = Math.random() - 0.5;
    const a = Math.random() * Math.PI * 2;
    const s = 0.004 + Math.random() * 0.008;
    pBase[k * 2] = pV[k * 2] = Math.cos(a) * s;
    pBase[k * 2 + 1] = pV[k * 2 + 1] = Math.sin(a) * s;
    pZ[k] = -1.6 + Math.random() * 1.8;
  }
  const pPos = new Float32Array(P_MAX * 3);
  const pCol = new Float32Array(P_MAX * 3);
  const pGeo = track(new BufferGeometry());
  pGeo.setAttribute("position", new BufferAttribute(pPos, 3));
  pGeo.setAttribute("color", new BufferAttribute(pCol, 3));
  const pMat = track(
    additive(
      new PointsMaterial({
        size: 2.4 * Math.min(window.devicePixelRatio, dprCap),
        sizeAttenuation: false,
        vertexColors: true,
        map: dotTex,
      }),
    ),
  );
  const particles = new Points(pGeo, pMat);
  particles.renderOrder = -2;
  scene.add(particles);

  const lPos = new Float32Array(MAX_SEGMENTS * 6);
  const lCol = new Float32Array(MAX_SEGMENTS * 6);
  const lGeo = track(new BufferGeometry());
  lGeo.setAttribute("position", new BufferAttribute(lPos, 3));
  lGeo.setAttribute("color", new BufferAttribute(lCol, 3));
  const lMat = track(additive(new LineBasicMaterial({ vertexColors: true })));
  const lines = new LineSegments(lGeo, lMat);
  lines.renderOrder = -2;
  lines.visible = linesOn;
  scene.add(lines);

  /* ───────── layout ───────── */
  const view = { w: 1, h: 1, vw: 1, vh: 1, cx: 0, cy: 0, scale: 1 };

  function layout() {
    const w = Math.max(1, host.clientWidth);
    const h = Math.max(1, host.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, dprCap));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const vh = 2 * Math.tan((FOV * Math.PI) / 360) * CAM_Z;
    const vw = vh * camera.aspect;
    const hostRect = host.getBoundingClientRect();
    const s = slot.getBoundingClientRect();
    const sx = s.left - hostRect.left + s.width / 2;
    const sy = s.top - hostRect.top + s.height / 2;
    Object.assign(view, {
      w,
      h,
      vw,
      vh,
      cx: (sx / w - 0.5) * vw,
      cy: -(sy / h - 0.5) * vh,
      scale: ((s.width / 2 / w) * vw) / FIT_R,
    });
  }
  layout();
  const ro = new ResizeObserver(layout);
  ro.observe(host);
  ro.observe(slot);
  document.fonts?.ready.then(layout).catch(() => {});

  /* ───────── input ───────── */
  const pointer = new Vector2(0, 0); // NDC
  const pointerTarget = new Vector2(0, 0);
  let pointerInside = false;
  let pointerDirty = false;
  const raycaster = new Raycaster();
  let hoverId: string | null = null;
  let activeId: string | null = null;

  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const r = canvas.getBoundingClientRect();
    pointerTarget.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    pointerInside = true;
    pointerDirty = true;
  };
  const onLeave = () => {
    pointerInside = false;
    pointerTarget.set(0, 0);
    setHover(null);
  };
  const onClick = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest("a,button,input,textarea,select,label")) return;
    const ring = rings.find((r) => r.id === hoverId);
    if (ring?.clickable) opts.onSelect(ring.id);
  };
  function setHover(id: string | null) {
    if (id === hoverId) return;
    hoverId = id;
    const ring = rings.find((r) => r.id === id);
    host.style.cursor = ring?.clickable ? "pointer" : "";
    opts.onHover(id);
  }
  if (!coarse) {
    host.addEventListener("pointermove", onMove, { passive: true });
    host.addEventListener("pointerleave", onLeave);
    host.addEventListener("click", onClick);
  }

  /* ───────── run state ───────── */
  let inView = true;
  let running = false;
  const io = new IntersectionObserver(([e]) => {
    inView = e.isIntersecting;
    updateRunning();
  });
  io.observe(host);
  const onVis = () => updateRunning();
  document.addEventListener("visibilitychange", onVis);

  const onLost = (e: Event) => {
    e.preventDefault();
    fail();
  };
  canvas.addEventListener("webglcontextlost", onLost);

  let last = 0;
  function updateRunning() {
    const next = inView && document.visibilityState === "visible" && !disposed;
    if (next === running) return;
    running = next;
    if (running) {
      last = performance.now();
      perfStart = 0;
    }
    renderer.setAnimationLoop(running ? tick : null);
  }

  /* ───────── perf tiering ───────── */
  const forceHQ = new URLSearchParams(window.location.search).has("hq");
  let tier = 0;
  let perfStart = 0;
  let perfFrames = 0;
  function applyTier() {
    if (tier >= 1) {
      linesOn = false;
      lines.visible = false;
      pCount = Math.ceil(P_MAX * 0.6);
    }
    if (tier >= 2) {
      pCount = Math.ceil(P_MAX * 0.4);
      dprCap = 1;
      layout();
    }
    pGeo.setDrawRange(0, pCount);
  }

  /* ───────── frame ───────── */
  let t0: number | null = null;
  let readyFired = false;
  let scroll = 0;
  let rotX = 0;
  let rotY = 0;
  let auto = 0;
  let frame = 0;

  function tick(now: number) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (t0 === null) t0 = now;
    const t = (now - t0) / 1000;
    frame++;

    // intro
    const coreK = easeOutExpo(clamp01(t / 0.9));
    const introScale = 0.88 + 0.12 * coreK;
    const particlesK = clamp01((t - 0.6) / 0.8);

    // pointer → damped follow (mouse only); touch → slow auto-rotate
    pointer.x = damp(pointer.x, pointerTarget.x, 6, dt);
    pointer.y = damp(pointer.y, pointerTarget.y, 6, dt);
    if (coarse) auto += 0.05 * dt;
    rotX = damp(rotX, -pointer.y * FOLLOW, 3.5, dt);
    rotY = damp(rotY, pointer.x * FOLLOW, 3.5, dt);

    const s = view.scale * introScale * (1 - 0.1 * scroll);
    rig.position.set(view.cx, view.cy + Math.sin(t * 1.05) * 0.08 * view.scale, 0);
    rig.rotation.set(rotX, rotY + auto + scroll * 0.44, 0);
    rig.scale.setScalar(s);

    core.rotation.y += dt * 0.08;
    cage.rotation.y -= dt * 0.12;
    cage.rotation.x += dt * 0.05;

    // rings: draw-in, spin, isolate
    const focus = activeId ?? hoverId;
    rings.forEach((r, i) => {
      const k = easeInOutCubic(clamp01((t - 0.15 - 0.12 * i) / 1.1));
      if (k !== r.lastK) {
        r.draw(k);
        r.lastK = k;
      }
      r.spin.rotation.z += r.speed * dt;
      const target = (focus === null ? r.base : focus === r.id ? 1 : 0.12) * clamp01(k * 3);
      for (const m of r.mats) m.opacity = damp(m.opacity, target, 8, dt);
      if (r.nodes) {
        const nk = clamp01((t - 0.75 - 0.12 * i) / 0.4) * (focus === r.id ? 1.35 : 1);
        const next = damp(r.nodeScale, nk, 10, dt);
        if (Math.abs(next - r.nodeScale) > 0.001) placeNodes(r, next);
        r.nodeScale = next;
      }
    });
    haloMat.uniforms.uOpacity.value = 0.32 * coreK;

    // satellites
    if (satellites) {
      const n = satellites.count;
      for (let k = 0; k < n; k++) {
        const a = t * 0.12 + (k / n) * Math.PI * 2;
        dummy.position.set(Math.cos(a) * 2.42, Math.sin(a) * 2.42, 0);
        dummy.rotation.set(t * 0.6, t * 0.4, 0);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        satellites.setMatrixAt(k, dummy.matrix);
      }
      satellites.instanceMatrix.needsUpdate = true;
      (satellites.material as MeshBasicMaterial).opacity = 0.85 * clamp01((t - 1.2) / 0.6);
    }

    // comet (0.9s → 2.3s)
    if (comet) {
      const ck = (t - 0.9) / 1.4;
      comet.visible = ck > 0 && ck < 1.25;
      if (comet.visible) {
        const head = Math.PI * (1 - easeInOutCubic(clamp01(ck)));
        for (let k = 0; k < COMET_N; k++) {
          const a = head + k * 0.035;
          cometPos[k * 3] = Math.cos(a) * 2.7;
          cometPos[k * 3 + 1] = Math.sin(a) * 0.95;
          cometPos[k * 3 + 2] = 0;
          const fade = (1 - k / COMET_N) * (1 - clamp01((ck - 1) / 0.25));
          cometCol[k * 3] = colors.cyan.r * fade;
          cometCol[k * 3 + 1] = colors.cyan.g * fade;
          cometCol[k * 3 + 2] = colors.cyan.b * fade;
        }
        comet.geometry.attributes.position.needsUpdate = true;
        comet.geometry.attributes.color.needsUpdate = true;
      }
    }

    // particles
    const { vw, vh } = view;
    const px = pointer.x * 0.5;
    const py = pointer.y * 0.5;
    const repelR = 0.12;
    const sigma = (FIT_R * view.scale * 1.1) ** 2;
    for (let k = 0; k < pCount; k++) {
      let ux = pU[k * 2];
      let uy = pU[k * 2 + 1];
      if (pointerInside) {
        const dx = (ux - px) * vw;
        const dy = (uy - py) * vh;
        const d = Math.hypot(dx, dy);
        const R = repelR * Math.min(vw, vh);
        if (d < R && d > 0.0001) {
          const f = (1 - d / R) * 0.06 * dt * 60;
          pV[k * 2] += (dx / d) * f * 0.02;
          pV[k * 2 + 1] += (dy / d) * f * 0.02;
        }
      }
      pV[k * 2] = damp(pV[k * 2], pBase[k * 2], 1.5, dt);
      pV[k * 2 + 1] = damp(pV[k * 2 + 1], pBase[k * 2 + 1], 1.5, dt);
      ux += pV[k * 2] * dt;
      uy += pV[k * 2 + 1] * dt;
      if (ux < -0.55) ux += 1.1;
      else if (ux > 0.55) ux -= 1.1;
      if (uy < -0.55) uy += 1.1;
      else if (uy > 0.55) uy -= 1.1;
      pU[k * 2] = ux;
      pU[k * 2 + 1] = uy;

      const wx = ux * vw;
      const wy = uy * vh;
      pPos[k * 3] = wx;
      pPos[k * 3 + 1] = wy;
      pPos[k * 3 + 2] = pZ[k];
      const d2 = (wx - view.cx) ** 2 + (wy - view.cy) ** 2;
      const b = (0.035 + 0.5 * Math.exp(-d2 / (2 * sigma))) * particlesK;
      pCol[k * 3] = colors.ink.r * b;
      pCol[k * 3 + 1] = colors.ink.g * b;
      pCol[k * 3 + 2] = colors.ink.b * b;
    }
    pGeo.attributes.position.needsUpdate = true;
    pGeo.attributes.color.needsUpdate = true;

    // connecting lines — every 2nd frame
    if (linesOn && frame % 2 === 0) {
      const L = 0.09 * Math.min(vw, vh);
      const L2 = L * L;
      let seg = 0;
      for (let a = 0; a < pCount && seg < MAX_SEGMENTS; a++) {
        for (let b = a + 1; b < pCount && seg < MAX_SEGMENTS; b++) {
          const dx = pPos[a * 3] - pPos[b * 3];
          const dy = pPos[a * 3 + 1] - pPos[b * 3 + 1];
          const d2 = dx * dx + dy * dy;
          if (d2 > L2) continue;
          const w = (1 - Math.sqrt(d2) / L) * 0.22;
          for (let v = 0; v < 2; v++) {
            const src = (v === 0 ? a : b) * 3;
            const dst = seg * 6 + v * 3;
            lPos[dst] = pPos[src];
            lPos[dst + 1] = pPos[src + 1];
            lPos[dst + 2] = pPos[src + 2];
            lCol[dst] = pCol[src] * w;
            lCol[dst + 1] = pCol[src + 1] * w;
            lCol[dst + 2] = pCol[src + 2] * w;
          }
          seg++;
        }
      }
      lGeo.setDrawRange(0, seg * 2);
      lGeo.attributes.position.needsUpdate = true;
      lGeo.attributes.color.needsUpdate = true;
    }

    // hover raycast (only when the mouse moved)
    if (pointerDirty && !coarse) {
      pointerDirty = false;
      raycaster.setFromCamera(pointerTarget, camera);
      const hit = raycaster.intersectObjects(hitMeshes, false)[0];
      setHover(hit ? (hit.object.userData.id as string) : null);
    }

    renderer.render(scene, camera);

    if (!readyFired) {
      readyFired = true;
      opts.onReady();
    }

    // perf tiering after the intro settles (`?hq` disables it — QA only)
    if (t > 2.5 && !forceHQ) {
      if (!perfStart) {
        perfStart = now;
        perfFrames = 0;
      } else {
        perfFrames++;
        const span = now - perfStart;
        if (span > 2000) {
          const fps = (perfFrames * 1000) / span;
          if (fps < 22 && tier >= 2) return fail();
          if (fps < 45 && tier < 2) {
            tier++;
            applyTier();
          }
          perfStart = now;
          perfFrames = 0;
        }
      }
    }
  }

  /* ───────── lifecycle ───────── */
  let disposed = false;

  function fail() {
    if (disposed) return;
    queueMicrotask(() => {
      dispose();
      opts.onFail();
    });
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    renderer.setAnimationLoop(null);
    ro.disconnect();
    io.disconnect();
    document.removeEventListener("visibilitychange", onVis);
    canvas.removeEventListener("webglcontextlost", onLost);
    host.removeEventListener("pointermove", onMove);
    host.removeEventListener("pointerleave", onLeave);
    host.removeEventListener("click", onClick);
    host.style.cursor = "";
    scene.traverse((o) => {
      const m = o as Mesh;
      m.geometry?.dispose?.();
      const mat = m.material as Material | Material[] | undefined;
      (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => x.dispose());
    });
    disposables.forEach((d) => d.dispose());
    (envTex as Texture).dispose();
    renderer.dispose();
  }

  updateRunning();

  return {
    setActive(id) {
      activeId = id;
    },
    setScroll(p) {
      scroll = clamp01(p);
    },
    dispose,
  };
}
