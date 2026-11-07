/**
 * Background solar system: procedural planets (fbm shaders, terminator, atmosphere rim, rings),
 * a rising sun at the data-sea horizon, and a moon for the night chapter.
 * Planets drift up with scroll at ~45% of content speed (parallax), each one centred
 * at its own point of the page, and are positioned in viewport fractions so phones work too.
 */
import * as THREE from "three";

type Kind = 0 | 1 | 2; // 0 gas bands, 1 rocky + clouds, 2 cratered moon

type PlanetDef = {
  kind: Kind;
  colors: [number, number, number];
  atmo: number;
  /** radius as a share of the half-viewport height at its depth */
  r: number;
  /** position: x / y as fractions of the half-viewport at its depth, z = depth */
  fx: number;
  fy: number;
  z: number;
  /** page progress (0..1) at which the planet sits at fy */
  at: number;
  ring?: { inner: number; outer: number; tilt: number; color: number };
  /** portrait screens (aspect < 0.8) override */
  phone?: { fx: number; fy: number; r: number };
  spin: number;
  tilt: number;
};

const PLANETS: PlanetDef[] = [
  // hero: ringed gas giant top-left, small blue world top-right
  { kind: 0, colors: [0xf2c9a0, 0x9a7cff, 0xfff1d6], atmo: 0xffc8a0, r: 0.36, fx: -0.86, fy: 0.62, z: -50, at: 0, spin: 0.02, tilt: 0.35, phone: { fx: -1.25, fy: 0.78, r: 0.24 }, ring: { inner: 1.45, outer: 2.35, tilt: 1.15, color: 0xe9d6ff } },
  { kind: 1, colors: [0x1c47c8, 0x3fd6a8, 0xffffff], atmo: 0x5fe3ff, r: 0.1, fx: 0.3, fy: 0.74, z: -40, at: 0.02, spin: 0.05, tilt: 0.4, phone: { fx: 0.72, fy: 0.9, r: 0.05 } },
  // reading sections
  { kind: 1, colors: [0x7a2a3e, 0xe07a4f, 0xffd9c0], atmo: 0xff8fd8, r: 0.16, fx: -0.9, fy: 0.1, z: -45, at: 0.3, spin: 0.04, tilt: 0.2 },
  { kind: 0, colors: [0x5fe3ff, 0x3550d0, 0xd9fbff], atmo: 0x8fe9ff, r: 0.26, fx: 0.92, fy: -0.1, z: -55, at: 0.55, spin: 0.03, tilt: -0.3, ring: { inner: 1.6, outer: 1.95, tilt: 1.35, color: 0xbff4ff } },
  // night: the moon over the karst
  { kind: 2, colors: [0x8e8cae, 0xeceaff, 0x5a5878], atmo: 0xa9b0ff, r: 0.2, fx: 0.7, fy: 0.45, z: -45, at: 0.93, spin: 0.01, tilt: 0 },
];

const NOISE = /* glsl */ `
  float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float noise(vec3 x) {
    vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * noise(p); p = p * 2.03 + 11.7; a *= 0.5; } return s; }
`;

const planetVertex = /* glsl */ `
  varying vec3 vObj; varying vec3 vN; varying vec3 vW;
  void main() {
    vObj = position;
    vN = normalize(mat3(modelMatrix) * normal);
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

const planetFragment = /* glsl */ `
  uniform int uKind; uniform vec3 uA; uniform vec3 uB; uniform vec3 uC; uniform vec3 uAtmo;
  uniform vec3 uSun; uniform float uTime; uniform float uDim;
  varying vec3 vObj; varying vec3 vN; varying vec3 vW;
  ${NOISE}
  void main() {
    vec3 p = normalize(vObj);
    vec3 col;
    if (uKind == 0) {
      float warp = fbm(p * 2.2 + vec3(0.0, uTime * 0.015, 0.0));
      float b = p.y * 9.0 + warp * 2.4;
      col = mix(uA, uB, 0.5 + 0.5 * sin(b));
      col = mix(col, uC, smoothstep(0.55, 0.85, fbm(p * 5.0 + warp)) * 0.7);
      // storm spot
      float spot = smoothstep(0.16, 0.0, length(p.xy - vec2(0.35, -0.2)) + (warp - 0.5) * 0.08) * step(0.0, p.z);
      col = mix(col, uC * 1.1, spot * 0.8);
    } else if (uKind == 1) {
      float n = fbm(p * 2.6);
      float land = smoothstep(0.47, 0.53, n);
      col = mix(uA, uB, land);
      col = mix(col, uB * 1.25, smoothstep(0.62, 0.75, n) * 0.6);
      float clouds = smoothstep(0.52, 0.78, fbm(p * 4.5 + vec3(uTime * 0.01, 0.0, 0.0)));
      col = mix(col, uC, clouds * 0.75);
    } else {
      float n = fbm(p * 3.5);
      col = mix(uC, uB, n);
      float cr = fbm(p * 11.0);
      col *= 0.72 + 0.5 * smoothstep(0.35, 0.7, cr);
      col = mix(col, uC * 0.8, smoothstep(0.6, 0.66, fbm(p * 6.0 + 3.0)));
    }
    vec3 N = normalize(vN);
    vec3 L = normalize(uSun - vW);
    vec3 V = normalize(cameraPosition - vW);
    float d = dot(N, L);
    float lit = smoothstep(-0.2, 0.55, d);
    col *= 0.05 + lit * 1.15;
    float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
    col += uAtmo * fres * (0.15 + lit * 0.9);
    gl_FragColor = vec4(col * uDim, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const haloFragment = /* glsl */ `
  uniform vec3 uAtmo; uniform vec3 uSun; uniform float uDim;
  varying vec3 vObj; varying vec3 vN; varying vec3 vW;
  void main() {
    vec3 N = normalize(vN);
    vec3 V = normalize(cameraPosition - vW);
    float edge = pow(clamp(1.0 - abs(dot(N, V)), 0.0, 1.0), 2.5);
    float lit = 0.25 + 0.75 * smoothstep(-0.4, 0.6, dot(-N, normalize(uSun - vW)));
    float a = edge * lit * 0.85 * uDim;
    gl_FragColor = vec4(uAtmo, a);
  }
`;

const ringVertex = /* glsl */ `
  varying vec2 vL; varying vec3 vW;
  void main() { vL = position.xy; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }
`;
const ringFragment = /* glsl */ `
  uniform float uInner; uniform float uOuter; uniform vec3 uColor; uniform float uDim;
  varying vec2 vL; varying vec3 vW;
  ${NOISE}
  void main() {
    float t = (length(vL) - uInner) / (uOuter - uInner);
    float bands = 0.55 + 0.45 * sin(t * 70.0) * sin(t * 23.0 + 1.3);
    float gaps = smoothstep(0.02, 0.06, abs(t - 0.62));
    float dust = noise(vec3(t * 140.0, 0.0, 0.0));
    float a = smoothstep(0.0, 0.05, t) * smoothstep(1.0, 0.9, t) * bands * gaps * (0.45 + 0.4 * dust) * 0.75 * uDim;
    gl_FragColor = vec4(uColor * (0.7 + 0.5 * dust), a);
  }
`;

function sunTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.08, "rgba(255,240,220,0.95)");
  grd.addColorStop(0.22, "rgba(255,170,200,0.45)");
  grd.addColorStop(0.5, "rgba(140,150,255,0.14)");
  grd.addColorStop(1, "rgba(95,227,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function buildPlanets(small: boolean) {
  const group = new THREE.Group();
  const sunPos = new THREE.Vector3(6, -2.4, -95);
  const sphere = new THREE.SphereGeometry(1, small ? 48 : 72, small ? 32 : 48);

  type Live = { def: PlanetDef; body: THREE.Group; uniforms: { uTime: { value: number }; uDim: { value: number } }[] };
  const live: Live[] = [];

  for (const def of PLANETS) {
    const body = new THREE.Group();
    const shared = { uSun: { value: sunPos }, uTime: { value: 0 }, uDim: { value: 1 } };
    const surface = new THREE.Mesh(
      sphere,
      new THREE.ShaderMaterial({
        uniforms: {
          ...shared,
          uKind: { value: def.kind },
          uA: { value: new THREE.Color(def.colors[0]) },
          uB: { value: new THREE.Color(def.colors[1]) },
          uC: { value: new THREE.Color(def.colors[2]) },
          uAtmo: { value: new THREE.Color(def.atmo) },
        },
        vertexShader: planetVertex,
        fragmentShader: planetFragment,
      }),
    );
    surface.rotation.z = def.tilt;
    body.add(surface);

    const halo = new THREE.Mesh(
      sphere,
      new THREE.ShaderMaterial({
        uniforms: { ...shared, uAtmo: { value: new THREE.Color(def.atmo) } },
        vertexShader: planetVertex,
        fragmentShader: haloFragment,
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    halo.scale.setScalar(1.12);
    body.add(halo);

    if (def.ring) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(def.ring.inner, def.ring.outer, 160, 1),
        new THREE.ShaderMaterial({
          uniforms: { uInner: { value: def.ring.inner }, uOuter: { value: def.ring.outer }, uColor: { value: new THREE.Color(def.ring.color) }, uDim: shared.uDim },
          vertexShader: ringVertex,
          fragmentShader: ringFragment,
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
        }),
      );
      ring.rotation.x = def.ring.tilt;
      ring.rotation.y = def.tilt * 0.6;
      body.add(ring);
    }

    group.add(body);
    live.push({ def, body, uniforms: [shared] });
    (body.userData as { surface: THREE.Mesh }).surface = surface;
  }

  const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: sunTexture(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  sun.position.copy(sunPos);
  sun.scale.setScalar(70);
  group.add(sun);

  /**
   * @param time seconds
   * @param screens scrollY / innerHeight
   * @param totalScreens maxScroll / innerHeight
   * @param aspect camera aspect
   * @param dim 0..1 brightness (reading sections are a touch dimmer)
   */
  const update = (time: number, screens: number, totalScreens: number, aspect: number, dim: number) => {
    const tan = Math.tan(THREE.MathUtils.degToRad(15));
    for (const { def, body, uniforms } of live) {
      const halfH = tan * (10 - def.z);
      const halfW = halfH * aspect;
      const drift = (screens - def.at * totalScreens) * 0.9; // half-heights; content moves 2 per screen
      const pose = aspect < 0.8 && def.phone ? def.phone : def;
      body.position.set(pose.fx * halfW, (pose.fy + drift) * halfH, def.z);
      body.scale.setScalar(pose.r * halfH);
      (body.userData as { surface: THREE.Mesh }).surface.rotation.y = time * def.spin;
      for (const u of uniforms) {
        u.uTime.value = time;
        u.uDim.value = dim;
      }
    }
    // the sun rises slowly with the first screens, then sets behind the content
    const sunHalfH = tan * (10 - sunPos.z);
    const portrait = aspect < 0.8;
    // portrait: keep the glow low and softer so it never sits behind the name
    sun.position.y = ((portrait ? -0.5 : -0.16) + screens * 0.12) * sunHalfH;
    (sun.material as THREE.SpriteMaterial).opacity = Math.max(0, 1 - screens * 0.45) * (portrait ? 0.5 : 0.9);
  };

  const dispose = () => {
    group.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      const mat = m.material as THREE.Material & { map?: THREE.Texture };
      mat?.map?.dispose();
      mat?.dispose();
    });
  };

  return { group, update, dispose };
}
