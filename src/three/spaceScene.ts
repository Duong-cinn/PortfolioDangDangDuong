/**
 * Fixed full-viewport WebGL scene shared by the whole page (one renderer, one loop):
 *  - a procedural crystal spaceship that flies between per-section poses as you scroll,
 *  - a perspective "data sea" of points (waves; the pointer leaves ripples, a click sends a big wave),
 *  - a drifting star field whose stars stretch into warp streaks while you scroll fast.
 * Loaded lazily (dynamic import) after first paint; the CSS backdrop is the fallback.
 */
import * as THREE from "three";
import { chapterMix } from "@/lib/chapters";
import { WARP_EVENT } from "@/lib/warp";
import { buildPlanets } from "./planets";
import { buildShip, studioEnvironment } from "./ship";
import { buildEscorts, buildTraffic } from "./traffic";

export type Pose = { x: number; y: number; s: number; yaw: number; pitch: number; roll: number };
export type PoseStop = { at: number; pose: Pose };

export type SpaceOptions = {
  canvas: HTMLCanvasElement;
  /** Page-absolute pose stops (sorted) + the top of the closing section. Re-read on resize. */
  measure: () => { stops: PoseStop[]; endTop: number };
  onReady: () => void;
  /** WebGL failed or the device is too slow → caller shows the CSS backdrop only. */
  onFail: () => void;
};

export type SpaceController = { dispose: () => void; remeasure: () => void };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const POSE_KEYS = ["x", "y", "s", "yaw", "pitch", "roll"] as const;
/** spring stiffness / damping (critically damped: c = 2·√k) — ~0.6 s to settle */
const SPRING_K = 22;
const SPRING_C = 2 * Math.sqrt(SPRING_K);
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* ───────────────────────── data sea ───────────────────────── */

const RIPPLES = 10;

const seaVertex = /* glsl */ `
  uniform float uTime; uniform float uPR; uniform vec4 uRipples[${RIPPLES}];
  uniform vec3 uColA; uniform vec3 uColB; uniform vec3 uColHot; uniform float uOpacity;
  varying vec3 vColor; varying float vAlpha;
  void main() {
    vec3 p = position;
    float t = uTime;
    float h = sin(p.x * 0.32 + t * 0.55) * 0.22
            + sin(p.z * 0.45 - t * 0.75) * 0.18
            + sin((p.x + p.z) * 0.16 + t * 0.35) * 0.34;
    float hot = 0.0;
    for (int i = 0; i < ${RIPPLES}; i++) {
      vec4 r = uRipples[i];
      float age = t - r.z;
      if (r.w <= 0.0 || age < 0.0 || age > 7.0) continue;
      float d = distance(p.xz, r.xy);
      float front = age * 4.2;
      float band = exp(-pow((d - front) * 0.75, 2.0));
      float w = band * exp(-age * 0.55) * r.w;
      h += sin((d - front) * 2.6) * w * 0.55;
      hot += w;
    }
    p.y += h;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp((2.6 + hot * 3.5) * uPR * (16.0 / -mv.z), 1.25 * uPR, 9.0 * uPR);
    vColor = mix(uColB, uColA, smoothstep(-0.55, 0.55, h)) + uColHot * clamp(hot, 0.0, 1.0);
    float fade = smoothstep(-40.0, -12.0, p.z) * smoothstep(9.6, 6.5, p.z);
    vAlpha = fade * uOpacity * (0.55 + 0.6 * smoothstep(-0.4, 0.6, h) + hot * 0.9);
  }
`;
const pointFragment = /* glsl */ `
  varying vec3 vColor; varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.08, d) * vAlpha;
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColor, a);
  }
`;

function buildSea(cols: number, rows: number) {
  const W = 46;
  const Z0 = -40;
  const Z1 = 8;
  const pos = new Float32Array(cols * rows * 3);
  let k = 0;
  for (let j = 0; j < rows; j++) {
    // denser rows near the camera so spacing looks even in perspective
    const f = j / (rows - 1);
    const z = lerp(Z0, Z1, Math.pow(f, 1.35));
    for (let i = 0; i < cols; i++) {
      pos[k++] = (i / (cols - 1) - 0.5) * W;
      pos[k++] = 0;
      pos[k++] = z;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const uniforms = {
    uTime: { value: 0 },
    uPR: { value: 1 },
    uOpacity: { value: 1 },
    uRipples: { value: Array.from({ length: RIPPLES }, () => new THREE.Vector4(0, 0, -99, 0)) },
    uColA: { value: new THREE.Color(0x3aa9cc) },
    uColB: { value: new THREE.Color(0x3a32a0) },
    uColHot: { value: new THREE.Color(0xff8fd8) },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: seaVertex,
    fragmentShader: pointFragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return { points, uniforms };
}

/* ───────────────────────── stars + warp streaks ───────────────────────── */

const DEPTH = 92;
const starVertex = /* glsl */ `
  uniform float uTime; uniform float uTravel; uniform float uPR; uniform float uOpacity;
  attribute float aSize; attribute float aSeed;
  varying vec3 vColor; varying float vAlpha;
  void main() {
    vec3 p = position;
    p.z = mod(p.z + uTravel, ${DEPTH.toFixed(1)}) - ${(DEPTH - 6).toFixed(1)};
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = max(1.1 * uPR, aSize * uPR * (70.0 / -mv.z));
    float tw = 0.65 + 0.35 * sin(uTime * (0.8 + aSeed * 2.2) + aSeed * 40.0);
    vColor = mix(vec3(0.75, 0.85, 1.0), vec3(1.0, 0.75, 0.95), step(0.85, aSeed));
    vAlpha = tw * uOpacity * smoothstep(-${(DEPTH - 6).toFixed(1)}, -70.0, p.z) * smoothstep(6.0, 0.0, p.z);
  }
`;
const streakVertex = /* glsl */ `
  uniform float uTravel; uniform float uStretch; uniform float uOpacity;
  attribute float aEnd;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    p.z = mod(p.z + uTravel, ${DEPTH.toFixed(1)}) - ${(DEPTH - 6).toFixed(1)};
    p.z -= aEnd * uStretch;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    vAlpha = uOpacity * (1.0 - aEnd) * smoothstep(-80.0, -40.0, p.z);
  }
`;
const streakFragment = /* glsl */ `
  varying float vAlpha;
  void main() { gl_FragColor = vec4(vec3(0.62, 0.9, 1.0), vAlpha); }
`;

function buildStars(count: number, streaks: number) {
  const rand = mulberry(7);
  const pos = new Float32Array(count * 3);
  const size = new Float32Array(count);
  const seed = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (rand() - 0.5) * 70;
    pos[i * 3 + 1] = (rand() - 0.5) * 44;
    pos[i * 3 + 2] = rand() * DEPTH;
    size[i] = 0.6 + Math.pow(rand(), 3) * 2.4;
    seed[i] = rand();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  const uniforms = { uTime: { value: 0 }, uTravel: { value: 0 }, uPR: { value: 1 }, uOpacity: { value: 1 }, uStretch: { value: 0 } };
  const stars = new THREE.Points(
    geo,
    new THREE.ShaderMaterial({ uniforms, vertexShader: starVertex, fragmentShader: pointFragment, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  stars.frustumCulled = false;

  // streaks reuse the first `streaks` star positions, two vertices each
  const sPos = new Float32Array(streaks * 6);
  const sEnd = new Float32Array(streaks * 2);
  for (let i = 0; i < streaks; i++) {
    for (let e = 0; e < 2; e++) {
      sPos.set([pos[i * 3] * 0.8, pos[i * 3 + 1] * 0.8, pos[i * 3 + 2]], (i * 2 + e) * 3);
      sEnd[i * 2 + e] = e;
    }
  }
  const sGeo = new THREE.BufferGeometry();
  sGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3));
  sGeo.setAttribute("aEnd", new THREE.BufferAttribute(sEnd, 1));
  const streakUniforms = { uTravel: uniforms.uTravel, uStretch: uniforms.uStretch, uOpacity: { value: 0 } };
  const lines = new THREE.LineSegments(
    sGeo,
    new THREE.ShaderMaterial({ uniforms: streakUniforms, vertexShader: streakVertex, fragmentShader: streakFragment, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  lines.frustumCulled = false;
  return { stars, lines, uniforms, streakUniforms };
}

function mulberry(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ───────────────────────── scene ───────────────────────── */

export function createSpaceScene({ canvas, measure, onReady, onFail }: SpaceOptions): SpaceController | null {
  const small = window.matchMedia("(max-width: 820px)").matches;
  // `?keep3d` disables the low-fps fallback (screenshots on software GL)
  const keep3d = new URLSearchParams(window.location.search).has("keep3d");

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !small, powerPreference: "high-performance" });
  } catch {
    onFail();
    return null;
  }
  let maxDpr = small ? 1.5 : 1.75;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDpr));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const env = studioEnvironment(renderer);
  scene.environment = env.texture;

  scene.add(new THREE.HemisphereLight(0xbfd8ff, 0x1a1060, 0.75));
  const key = new THREE.DirectionalLight(0xffd0f0, 1.6);
  key.position.set(3, 5, 6);
  const rim = new THREE.DirectionalLight(0x5fe3ff, 2.6);
  rim.position.set(-5, -1, -4);
  const fill = new THREE.DirectionalLight(0x8d94ff, 1.1);
  fill.position.set(0, -4, 3);
  scene.add(key, rim, fill);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 120);
  camera.position.set(0, 0, 10);

  const { stars, lines, uniforms: starU, streakUniforms } = buildStars(small ? 700 : 1600, small ? 120 : 260);
  scene.add(stars, lines);

  const planets = buildPlanets(small);
  scene.add(planets.group);
  const traffic = buildTraffic(small);
  scene.add(traffic.group);
  const escorts = buildEscorts(small);
  scene.add(escorts.group);

  const sea = buildSea(small ? 96 : 170, small ? 62 : 104);
  const seaGroup = new THREE.Group();
  seaGroup.add(sea.points);
  scene.add(seaGroup);

  const ship = buildShip();
  const rig = new THREE.Group();
  const body = new THREE.Group();
  body.add(ship.group);
  rig.add(body);
  rig.rotation.order = "XYZ";
  body.rotation.order = "YXZ";
  scene.add(rig);

  /* layout */
  let W = 0;
  let H = 0;
  let fh = 1;
  let fw = 1;
  let stops: PoseStop[] = [];
  let endTop = Infinity;
  const remeasure = () => {
    const m = measure();
    stops = m.stops;
    endTop = m.endTop;
  };
  const resize = () => {
    W = document.documentElement.clientWidth;
    H = window.innerHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    fh = 2 * Math.tan(THREE.MathUtils.degToRad(15)) * 10;
    fw = fh * camera.aspect;
    const pr = renderer.getPixelRatio();
    sea.uniforms.uPR.value = pr;
    starU.uPR.value = pr;
    remeasure();
  };
  resize();

  const poseAt = (y: number): Pose => {
    if (!stops.length) return { x: 0, y: 0, s: 0.5, yaw: 0, pitch: 0, roll: 0 };
    if (y <= stops[0].at) return stops[0].pose;
    for (let i = 0; i < stops.length - 1; i++) {
      const a = stops[i];
      const b = stops[i + 1];
      if (y <= b.at) {
        const t = easeInOutCubic(clamp01((y - a.at) / Math.max(1, b.at - a.at)));
        const p = {} as Pose;
        (Object.keys(a.pose) as (keyof Pose)[]).forEach((k) => (p[k] = lerp(a.pose[k], b.pose[k], t)));
        return p;
      }
    }
    return stops[stops.length - 1].pose;
  };

  /* pointer */
  const pointer = { u: 0.5, v: 0.5, tx: 0, ty: 0, inside: false };
  const ndc = new THREE.Vector2();
  const ray = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hit = new THREE.Vector3();
  let rippleIndex = 0;
  let lastRipple = { x: 1e9, z: 1e9, t: -1 };
  let time = 0;

  const spawnRipple = (clientX: number, clientY: number, strength: number) => {
    ndc.set((clientX / W) * 2 - 1, -(clientY / H) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    plane.constant = -seaGroup.position.y;
    if (!ray.ray.intersectPlane(plane, hit)) return;
    if (hit.z < -38 || hit.z > 8) return;
    const moved = Math.hypot(hit.x - lastRipple.x, hit.z - lastRipple.z);
    if (strength < 1 && (moved < 1.6 || time - lastRipple.t < 0.09)) return;
    lastRipple = { x: hit.x, z: hit.z, t: time };
    sea.uniforms.uRipples.value[rippleIndex].set(hit.x, hit.z, time, strength);
    rippleIndex = (rippleIndex + 1) % RIPPLES;
  };
  /* drag-to-rotate: grab the ship with the mouse and spin it 360° to inspect it */
  const html = document.documentElement;
  const spin = { yaw: 0, pitch: 0 };
  const spinV = { yaw: 0, pitch: 0 };
  const drag = { active: false, x: 0, y: 0, t: 0 };
  let releasedAt = -10;
  let hoverCheck: { x: number; y: number } | null = null;
  const overShip = (clientX: number, clientY: number) => {
    ndc.set((clientX / W) * 2 - 1, -(clientY / H) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    return ray.intersectObject(ship.group, true).length > 0;
  };
  const SPIN = 0.011; // radians per pixel

  const onMove = (e: PointerEvent) => {
    pointer.u = e.clientX / W;
    pointer.v = e.clientY / H;
    pointer.tx = pointer.u * 2 - 1;
    pointer.ty = pointer.v * 2 - 1;
    pointer.inside = true;
    if (drag.active) {
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      const now = performance.now();
      const dts = Math.max(0.008, (now - drag.t) / 1000);
      spin.yaw += dx * SPIN;
      spin.pitch += dy * SPIN;
      spinV.yaw = (dx * SPIN) / dts;
      spinV.pitch = (dy * SPIN) / dts;
      drag.x = e.clientX;
      drag.y = e.clientY;
      drag.t = now;
      return;
    }
    if (e.pointerType === "mouse") {
      hoverCheck = { x: e.clientX, y: e.clientY }; // resolved once per frame
      spawnRipple(e.clientX, e.clientY, 0.45);
    }
  };
  const onDown = (e: PointerEvent) => {
    // don't steal clicks meant for UI; only waves from the backdrop / non-interactive areas
    const t = e.target as HTMLElement | null;
    if (t?.closest("a,button,input,[role=option],.glass,.console,.hud,.launch")) return;
    if (e.pointerType !== "touch" && e.button === 0 && overShip(e.clientX, e.clientY)) {
      drag.active = true;
      drag.x = e.clientX;
      drag.y = e.clientY;
      drag.t = performance.now();
      spinV.yaw = spinV.pitch = 0;
      html.classList.add("ship-dragging");
      return;
    }
    spawnRipple(e.clientX, e.clientY, 1.5);
  };
  const onUp = () => {
    if (!drag.active) return;
    drag.active = false;
    releasedAt = time;
    html.classList.remove("ship-dragging");
    // a release after holding still shouldn't fling
    if (performance.now() - drag.t > 90) spinV.yaw = spinV.pitch = 0;
  };
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
  const onLeave = () => {
    pointer.inside = false;
    pointer.tx = 0;
    pointer.ty = 0;
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerdown", onDown, { passive: true });
  document.documentElement.addEventListener("pointerleave", onLeave);

  let roTimer = 0;
  const ro = new ResizeObserver(() => {
    window.clearTimeout(roTimer);
    roTimer = window.setTimeout(remeasure, 120);
  });
  ro.observe(document.body);
  window.addEventListener("resize", resize);

  /* loop */
  const cur: Pose = { ...poseAt(window.scrollY) };
  const curV: Pose = { x: 0, y: 0, s: 0, yaw: 0, pitch: 0, roll: 0 };
  let last = performance.now();
  let lastY = window.scrollY;
  let vel = 0;
  let speedUp = 0;
  let stretch = 0;
  let bank = 0;
  let travel = 0;
  let raf = 0;
  let ready = false;
  let disposed = false;
  let slowFrames = 0;
  let warpBoost = 0;
  const onWarp = () => {
    warpBoost = 1.8;
    traffic.warpBurst();
  };
  window.addEventListener(WARP_EVENT, onWarp);
  let sampled = 0;

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    time += dt;

    // adaptive quality: sustained low fps → lower DPR once, then give up
    if (ready && sampled < 240 && !keep3d) {
      sampled++;
      if (dt > 1 / 32) slowFrames++;
      if (sampled === 120 && slowFrames > 70) {
        maxDpr = 1;
        renderer.setPixelRatio(1);
        resize();
        slowFrames = 0;
      } else if (sampled === 240 && slowFrames > 90 && maxDpr === 1) {
        onFail();
        dispose();
        return;
      }
    }

    // scroll velocity
    const y = window.scrollY;
    const inst = dt > 0 ? (y - lastY) / dt : 0;
    lastY = y;
    vel += (inst - vel) * (1 - Math.exp(-6 * dt));
    warpBoost *= Math.exp(-1.4 * dt);
    const targetSpeed = Math.max(Math.min(Math.abs(vel) / 1800, 1.4), warpBoost);
    speedUp += (targetSpeed - speedUp) * (1 - Math.exp(-6 * dt));

    // chapters (same formula as the CSS backdrop)
    const { toViolet, toNight } = chapterMix(y, H, endTop);

    // stars: drift toward camera, faster + streaks while scrolling
    travel += dt * (0.8 + speedUp * 16);
    starU.uTravel.value = travel;
    starU.uTime.value = time;
    stretch += (speedUp * 7 - stretch) * (1 - Math.exp(-8 * dt));
    starU.uStretch.value = stretch;
    streakUniforms.uOpacity.value = Math.min(1, speedUp * 1.3) * 0.85;
    starU.uOpacity.value = 0.75 + toNight * 0.25;

    // sea: sinks and fades in the middle chapters, comes back (pink) at night
    sea.uniforms.uTime.value = time;
    seaGroup.position.y = -1.55 - toViolet * 2.2 * (1 - toNight) - toNight * 0.5;
    sea.uniforms.uOpacity.value = ((1 - toViolet * 0.7) * (1 - toNight) + toNight * 0.75) * 0.8;
    sea.uniforms.uColA.value.setHex(0x3aa9cc).lerp(new THREE.Color(0xd16cb4), toNight * 0.7);

    // planets drift with scroll (parallax), slightly dimmed behind the reading sections
    const screens = y / Math.max(1, H);
    const total = Math.max(1, (document.documentElement.scrollHeight - H) / Math.max(1, H));
    planets.update(time, screens, total, camera.aspect, 1 - toViolet * (1 - toNight) * 0.25);

    // ship pose
    // critically damped spring per pose value: eases in AND out, so stopping the wheel
    // never leaves the ship with a hard halt (semi-implicit Euler, sub-stepped for stability)
    const target = poseAt(y);
    const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
    const h = dt / steps;
    for (let n = 0; n < steps; n++) {
      for (const key of POSE_KEYS) {
        const a = SPRING_K * (target[key] - cur[key]) - SPRING_C * curV[key];
        curV[key] += a * h;
        cur[key] += curV[key] * h;
      }
    }
    bank += (Math.max(-0.5, Math.min(0.5, vel / 2800)) - bank) * (1 - Math.exp(-2.6 * dt));
    const heroLook = 1 - toViolet;
    const bob = Math.sin(time * 0.9) * 0.02;
    rig.position.set((cur.x * fw) / 2, ((cur.y + bob) * fh) / 2, 0);
    rig.rotation.set(
      cur.roll + Math.sin(time * 0.7) * 0.05 - bank,
      cur.yaw + Math.sin(time * 0.5) * 0.05 + pointer.tx * 0.18 * heroLook,
      cur.pitch - bank * 0.25 - pointer.ty * 0.12 * heroLook,
    );
    body.scale.setScalar(cur.s * fh);

    // inspect spin: free while dragging, inertia after release, then glide home to the flight pose
    if (hoverCheck && !drag.active) {
      html.classList.toggle("ship-grab", overShip(hoverCheck.x, hoverCheck.y));
      hoverCheck = null;
    }
    if (!drag.active) {
      spin.yaw += spinV.yaw * dt;
      spin.pitch += spinV.pitch * dt;
      const damp = Math.exp(-3 * dt);
      spinV.yaw *= damp;
      spinV.pitch *= damp;
      if (time - releasedAt > 1.5) {
        // shortest way back
        spin.yaw = Math.atan2(Math.sin(spin.yaw), Math.cos(spin.yaw));
        spin.pitch = Math.atan2(Math.sin(spin.pitch), Math.cos(spin.pitch));
        const k = 1 - Math.exp(-2.2 * dt);
        spin.yaw -= spin.yaw * k;
        spin.pitch -= spin.pitch * k;
      }
    }
    body.rotation.set(spin.pitch, spin.yaw, 0);
    // escorts join once you leave the hero; distant traffic crosses the sky
    escorts.update(dt, time, rig.position, cur.s * fh, y > 0.3 * H, fw, fh);
    traffic.update(dt, screens, camera.aspect);

    ship.exhaustUniforms.uTime.value = time;
    ship.tick(time);
    const power = 0.65 + speedUp * 0.9;
    ship.exhaustUniforms.uPower.value = power;
    for (const ex of ship.exhausts) ex.scale.set(0.7 + speedUp * 1.6 + Math.sin(time * 30) * 0.04, 1, 1);

    // camera: 1° tilt + a little parallax toward the pointer
    const kc = 1 - Math.exp(-dt / 0.12);
    camera.rotation.y += (-pointer.tx * 0.01745 - camera.rotation.y) * kc;
    camera.rotation.x += (pointer.ty * 0.01745 - camera.rotation.x) * kc;
    camera.position.x += (pointer.tx * 0.18 - camera.position.x) * kc;

    renderer.render(scene, camera);
    if (!ready) {
      ready = true;
      onReady();
    }
  };

  const onVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else if (!raf && !disposed) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  };
  document.addEventListener("visibilitychange", onVisibility);

  const onLost = (e: Event) => {
    e.preventDefault();
    onFail();
    dispose();
  };
  canvas.addEventListener("webglcontextlost", onLost);

  raf = requestAnimationFrame(frame);

  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(raf);
    window.clearTimeout(roTimer);
    ro.disconnect();
    window.removeEventListener("resize", resize);
    window.removeEventListener(WARP_EVENT, onWarp);
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerdown", onDown);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);
    html.classList.remove("ship-dragging", "ship-grab");
    document.documentElement.removeEventListener("pointerleave", onLeave);
    document.removeEventListener("visibilitychange", onVisibility);
    canvas.removeEventListener("webglcontextlost", onLost);
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
      mats.forEach((mat) => mat.dispose());
    });
    planets.dispose();
    escorts.dispose();
    traffic.dispose();
    env.dispose();
    renderer.dispose();
  }

  return { dispose, remeasure };
}
