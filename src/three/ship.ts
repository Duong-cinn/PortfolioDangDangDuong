/**
 * Procedural crystal spaceship (nose → +X, normalised to length 1).
 * Detail layers: canvas-painted hull (panel lines, stripe, decals) with glowing grooves,
 * canards, intakes, dorsal spine, antennas, greebles, nozzle rings, under-wing pods,
 * blinking navigation lights and glowing edge lines.
 */
import * as THREE from "three";

export type Ship = {
  group: THREE.Group;
  exhausts: THREE.Mesh[];
  exhaustUniforms: { uTime: { value: number }; uPower: { value: number } };
  /** call every frame for blinking lights */
  tick: (time: number) => void;
};

/* ───────── painted textures ───────── */

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!] as const;
}

function rand(seed: number) {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

/** Fuselage (lathe UVs: u = around the hull, v = tail → nose; top of the ship is u ≈ 0.75). */
function hullTextures() {
  const W = 1024;
  const H = 512;
  const [c, g] = canvas(W, H);
  const [e, ge] = canvas(W, H);
  const r = rand(11);

  // base: cool silver → lilac along the length
  const base = g.createLinearGradient(0, H, 0, 0);
  base.addColorStop(0, "#c9c6ee");
  base.addColorStop(0.5, "#e6e8fb");
  base.addColorStop(1, "#f4f5ff");
  g.fillStyle = base;
  g.fillRect(0, 0, W, H);
  ge.fillStyle = "#000";
  ge.fillRect(0, 0, W, H);

  // subtle panel tint variation
  for (let i = 0; i < 70; i++) {
    g.fillStyle = `rgba(${120 + r() * 40},${110 + r() * 40},${200 + r() * 40},${0.06 + r() * 0.08})`;
    g.fillRect(r() * W, r() * H, 40 + r() * 140, 20 + r() * 60);
  }

  // panel lines: rings along the length + seams around
  g.strokeStyle = "rgba(48,40,110,0.55)";
  g.lineWidth = 2;
  const rings = [0.1, 0.2, 0.31, 0.42, 0.55, 0.66, 0.78, 0.88];
  for (const v of rings) {
    g.beginPath();
    g.moveTo(0, (1 - v) * H);
    g.lineTo(W, (1 - v) * H);
    g.stroke();
  }
  for (let i = 0; i < rings.length - 1; i++) {
    const seams = 6 + Math.floor(r() * 4);
    for (let k = 0; k < seams; k++) {
      const x = ((k + r() * 0.3) / seams) * W;
      g.beginPath();
      g.moveTo(x, (1 - rings[i]) * H);
      g.lineTo(x, (1 - rings[i + 1]) * H);
      g.stroke();
    }
  }
  // rivets
  g.fillStyle = "rgba(40,34,100,0.5)";
  for (const v of rings) for (let x = 0; x < W; x += 16) g.fillRect(x, (1 - v) * H + 4, 2, 2);

  // glowing grooves (emissive): a few panel seams + the dorsal stripe
  ge.strokeStyle = "rgba(95,227,255,0.9)";
  ge.lineWidth = 2;
  for (const v of [0.31, 0.55, 0.78]) {
    ge.beginPath();
    ge.moveTo(0, (1 - v) * H);
    ge.lineTo(W, (1 - v) * H);
    ge.stroke();
  }

  // dorsal racing stripe (top, u≈0.75) + pink pinstripe
  const stripe = (ctx: CanvasRenderingContext2D, color: string, u: number, w: number) => {
    ctx.fillStyle = color;
    ctx.fillRect(u * W - (w * W) / 2, H * 0.08, w * W, H * 0.8);
  };
  stripe(g, "#5fe3ff", 0.75, 0.035);
  stripe(g, "#ff8fd8", 0.712, 0.008);
  stripe(g, "#ff8fd8", 0.788, 0.008);
  stripe(ge, "#5fe3ff", 0.75, 0.035);
  stripe(ge, "rgba(255,143,216,0.8)", 0.712, 0.008);
  stripe(ge, "rgba(255,143,216,0.8)", 0.788, 0.008);

  // side decals: "DO-01" along the length, on both flanks (u ≈ 0 and 0.5)
  for (const u of [0.0, 0.5, 1.0]) {
    g.save();
    g.translate(u * W, H * 0.62);
    g.rotate(-Math.PI / 2);
    g.fillStyle = "rgba(30,26,90,0.85)";
    g.font = "bold 34px monospace";
    g.textAlign = "center";
    g.fillText("DO-01", 0, 12);
    g.fillStyle = "rgba(95,227,255,0.9)";
    g.fillRect(-60, 22, 120, 4);
    g.restore();
    // small glowing "windows"
    for (let k = 0; k < 4; k++) {
      ge.fillStyle = "rgba(190,245,255,0.95)";
      ge.fillRect(u * W - 3, H * (0.25 + k * 0.035), 6, 6);
    }
  }

  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  const emissive = new THREE.CanvasTexture(e);
  emissive.colorSpace = THREE.SRGBColorSpace;
  return { map, emissive };
}

/** Wings (extrude UVs = shape x/y ≈ -0.35…0.12 / 0…0.5 → repeat). */
function wingTextures() {
  const S = 512;
  const [c, g] = canvas(S, S);
  const [e, ge] = canvas(S, S);
  g.fillStyle = "#b3b6ff";
  g.fillRect(0, 0, S, S);
  ge.fillStyle = "#000";
  ge.fillRect(0, 0, S, S);
  const r = rand(5);
  for (let i = 0; i < 40; i++) {
    g.fillStyle = `rgba(${150 + r() * 50},${150 + r() * 50},255,${0.15 + r() * 0.15})`;
    g.fillRect(r() * S, r() * S, 30 + r() * 90, 30 + r() * 90);
  }
  g.strokeStyle = "rgba(40,34,110,0.5)";
  g.lineWidth = 2;
  for (let i = 0; i <= 8; i++) {
    g.beginPath();
    g.moveTo(0, (i / 8) * S);
    g.lineTo(S, (i / 8) * S);
    g.stroke();
    g.beginPath();
    g.moveTo((i / 8) * S, 0);
    g.lineTo((i / 8) * S, S);
    g.stroke();
  }
  // chevrons + glowing grooves
  ge.strokeStyle = "rgba(95,227,255,0.85)";
  ge.lineWidth = 3;
  for (let i = 0; i < 3; i++) {
    ge.beginPath();
    ge.moveTo(0, S * (0.3 + i * 0.2));
    ge.lineTo(S, S * (0.3 + i * 0.2) - S * 0.15);
    ge.stroke();
  }
  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(2.4, 2.4);
  const emissive = new THREE.CanvasTexture(e);
  emissive.colorSpace = THREE.SRGBColorSpace;
  emissive.wrapS = emissive.wrapT = THREE.RepeatWrapping;
  emissive.repeat.set(2.4, 2.4);
  return { map, emissive };
}

/* ───────── materials ───────── */

function glossy(opts: THREE.MeshPhysicalMaterialParameters) {
  return new THREE.MeshPhysicalMaterial({
    roughness: 0.14,
    metalness: 0.6,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    iridescence: 0.7,
    iridescenceIOR: 1.35,
    iridescenceThicknessRange: [200, 600],
    envMapIntensity: 1.35,
    side: THREE.DoubleSide,
    ...opts,
  });
}

const exhaustVertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const exhaustFragment = /* glsl */ `
  uniform float uTime; uniform vec3 uColor; uniform float uPower;
  varying vec2 vUv;
  void main() {
    float core = pow(vUv.y, 1.5);
    float flicker = 0.82 + 0.18 * sin(uTime * 38.0 + vUv.y * 9.0) * sin(uTime * 23.0);
    float a = core * flicker * uPower;
    gl_FragColor = vec4(mix(uColor, vec3(1.0), core * 0.6), a);
  }
`;

/* ───────── build ───────── */

export function buildShip(): Ship {
  const group = new THREE.Group();
  const hullTex = hullTextures();
  const wingTex = wingTextures();

  const hull = glossy({ map: hullTex.map, emissive: new THREE.Color(0xffffff), emissiveMap: hullTex.emissive, emissiveIntensity: 1.1, flatShading: true });
  const wingMat = glossy({ map: wingTex.map, emissive: new THREE.Color(0xffffff), emissiveMap: wingTex.emissive, emissiveIntensity: 0.9, metalness: 0.5 });
  const dark = glossy({ color: 0x2a2660, metalness: 0.8, roughness: 0.25, iridescence: 0.3 });
  const chrome = glossy({ color: 0xf0f2ff, metalness: 1, roughness: 0.08, iridescence: 0.4 });
  const glowLine = new THREE.LineBasicMaterial({ color: 0x5fe3ff, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false });

  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    group.add(m);
    return m;
  };
  const edges = (geo: THREE.BufferGeometry, ref: THREE.Object3D) => {
    const l = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 25), glowLine);
    l.position.copy(ref.position);
    l.rotation.copy(ref.rotation);
    l.scale.copy(ref.scale);
    group.add(l);
  };

  // Fuselage
  const profile = [
    [0.05, -0.5], [0.074, -0.47], [0.086, -0.4], [0.096, -0.2], [0.098, -0.05], [0.092, 0.08],
    [0.076, 0.22], [0.052, 0.35], [0.028, 0.45], [0.01, 0.51], [0.0, 0.535],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  // 8 facets → a stealth, knife-edged hull instead of a smooth tube
  const bodyGeo = new THREE.LatheGeometry(profile, 8);
  bodyGeo.rotateZ(-Math.PI / 2);
  bodyGeo.scale(1, 0.72, 1);
  add(bodyGeo, hull);

  // Nose tip (chrome) + sensor ring
  const tip = new THREE.ConeGeometry(0.012, 0.05, 24);
  tip.rotateZ(-Math.PI / 2);
  add(tip, chrome, 0.53, 0, 0);
  const ring = new THREE.TorusGeometry(0.03, 0.003, 8, 48);
  ring.rotateY(Math.PI / 2);
  const ringMesh = add(ring, new THREE.MeshBasicMaterial({ color: 0x5fe3ff }), 0.44, 0, 0);
  ringMesh.scale.set(1, 0.72, 1);

  // Mandibles: twin forward prongs alongside the nose
  const prong = new THREE.ConeGeometry(0.013, 0.26, 6);
  prong.rotateZ(-Math.PI / 2);
  for (const s of [1, -1]) {
    const m = add(prong, dark, 0.36, -0.022, 0.06 * s);
    m.rotation.y = 0.06 * s;
    const tipLight = add(new THREE.SphereGeometry(0.005, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff8fd8 }), 0.49, -0.022, 0.068 * s);
    tipLight.scale.setScalar(1);
  }

  // Chines: knife-edge blades along both flanks, nose → wing root
  const chineShape = new THREE.Shape();
  chineShape.moveTo(0.46, 0.012);
  chineShape.lineTo(-0.06, 0.095);
  chineShape.lineTo(0.0, 0.135);
  chineShape.closePath();
  const chineGeo = new THREE.ExtrudeGeometry(chineShape, { depth: 0.005, bevelEnabled: false });
  chineGeo.rotateX(Math.PI / 2);
  for (const s of [1, -1]) {
    const g = s > 0 ? chineGeo : chineGeo.clone().scale(1, 1, -1);
    const m = add(g, chrome, 0, 0.004, 0);
    edges(g, m);
  }

  // Canopy + frame
  const canopy = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2),
    glossy({ color: 0x0b1240, metalness: 0.3, roughness: 0.02, emissive: new THREE.Color(0x3fd3ff), emissiveIntensity: 0.4, envMapIntensity: 2.2, iridescence: 1 }),
  );
  canopy.scale.set(2.6, 0.95, 1);
  canopy.position.set(0.17, 0.035, 0);
  group.add(canopy);
  const frame = new THREE.TorusGeometry(0.05, 0.0035, 8, 64, Math.PI);
  const frameMesh = add(frame, chrome, 0.17, 0.035, 0);
  frameMesh.scale.set(2.6, 0.95, 1);
  frameMesh.rotation.x = 0;
  const strut = new THREE.BoxGeometry(0.004, 0.052, 0.098);
  add(strut, chrome, 0.15, 0.06, 0);

  // Dorsal spine + keel
  add(new THREE.BoxGeometry(0.38, 0.022, 0.026), dark, -0.16, 0.066, 0);
  add(new THREE.BoxGeometry(0.3, 0.012, 0.02), dark, -0.08, -0.07, 0);

  // Antennas
  const antGeo = new THREE.CylinderGeometry(0.0018, 0.0018, 0.08, 6);
  const ant1 = add(antGeo, chrome, 0.05, 0.1, 0);
  ant1.rotation.z = -0.35;
  const ant2 = add(antGeo, chrome, -0.02, 0.092, 0.012);
  ant2.rotation.z = -0.5;
  ant2.scale.y = 0.6;

  // Greebles on the rear deck
  const r = rand(3);
  for (let i = 0; i < 9; i++) {
    const w = 0.015 + r() * 0.03;
    add(new THREE.BoxGeometry(w, 0.008 + r() * 0.01, 0.01 + r() * 0.02), i % 3 ? dark : chrome, -0.22 - r() * 0.2, 0.06, (r() - 0.5) * 0.09);
  }

  // Swept wings
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0.14, 0.03);
  wingShape.lineTo(-0.22, 0.52);
  wingShape.lineTo(-0.27, 0.62); // spike tip
  wingShape.lineTo(-0.31, 0.5);
  wingShape.lineTo(-0.35, 0.45);
  wingShape.lineTo(-0.31, 0.38); // serrated trailing edge
  wingShape.lineTo(-0.38, 0.3);
  wingShape.lineTo(-0.34, 0.23);
  wingShape.lineTo(-0.41, 0.15);
  wingShape.lineTo(-0.37, 0.1);
  wingShape.lineTo(-0.43, 0.03);
  wingShape.closePath();
  const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.014, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.004, bevelSegments: 2 });
  wingGeo.rotateX(Math.PI / 2);
  wingGeo.translate(0, -0.012, 0);
  for (const s of [1, -1]) {
    const g = s > 0 ? wingGeo : wingGeo.clone().scale(1, 1, -1);
    const m = add(g, wingMat);
    edges(g, m);
    // leading-edge chrome strip
    const lead = new THREE.CylinderGeometry(0.004, 0.004, 0.6, 6);
    const lm = add(lead, chrome, -0.04, -0.005, 0.275 * s);
    lm.rotation.order = "YXZ"; // lay along Z first, then sweep back with the wing
    lm.rotation.x = Math.PI / 2;
    lm.rotation.y = -0.633 * s;
    // wingtip blade: a vertical spike above and below the wing
    const bladeShape = new THREE.Shape();
    bladeShape.moveTo(-0.17, 0);
    bladeShape.lineTo(-0.36, 0.13);
    bladeShape.lineTo(-0.33, 0);
    bladeShape.lineTo(-0.37, -0.075);
    bladeShape.closePath();
    const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, { depth: 0.006, bevelEnabled: false });
    bladeGeo.translate(0, -0.006, 0.47 * s - 0.003);
    const bm = add(bladeGeo, wingMat);
    edges(bladeGeo, bm);
    // under-wing pod
    const pod = new THREE.CylinderGeometry(0.011, 0.011, 0.2, 16);
    pod.rotateZ(Math.PI / 2);
    add(pod, dark, -0.15, -0.032, 0.3 * s);
    const podTip = new THREE.ConeGeometry(0.011, 0.04, 16);
    podTip.rotateZ(-Math.PI / 2);
    add(podTip, chrome, -0.03, -0.032, 0.3 * s);
  }

  // Canards
  const canardShape = new THREE.Shape();
  canardShape.moveTo(0.34, 0.02);
  canardShape.lineTo(0.17, 0.18);
  canardShape.lineTo(0.15, 0.15);
  canardShape.lineTo(0.19, 0.02);
  canardShape.closePath();
  const canardGeo = new THREE.ExtrudeGeometry(canardShape, { depth: 0.008, bevelEnabled: false });
  canardGeo.rotateX(Math.PI / 2);
  for (const s of [1, -1]) {
    const g = s > 0 ? canardGeo : canardGeo.clone().scale(1, 1, -1);
    const m = add(g, wingMat, 0, 0.005, 0);
    edges(g, m);
  }

  // Intakes (dark mouths)
  for (const s of [1, -1]) {
    add(new THREE.BoxGeometry(0.17, 0.05, 0.045), hull, 0.0, -0.036, 0.074 * s);
    add(new THREE.BoxGeometry(0.004, 0.038, 0.034), new THREE.MeshBasicMaterial({ color: 0x05061a }), 0.087, -0.036, 0.074 * s);
  }

  // Twin tail fins
  const finShape = new THREE.Shape();
  finShape.moveTo(-0.14, 0);
  finShape.lineTo(-0.43, 0.23);
  finShape.lineTo(-0.47, 0.23);
  finShape.lineTo(-0.42, 0.08);
  finShape.lineTo(-0.45, 0);
  finShape.closePath();
  const finGeo = new THREE.ExtrudeGeometry(finShape, { depth: 0.01, bevelEnabled: true, bevelSize: 0.002, bevelThickness: 0.002, bevelSegments: 1 });
  finGeo.translate(0, 0, -0.005);

  // Dorsal blade
  const dorsal = new THREE.Shape();
  dorsal.moveTo(-0.04, 0.07);
  dorsal.lineTo(-0.3, 0.21);
  dorsal.lineTo(-0.33, 0.2);
  dorsal.lineTo(-0.28, 0.07);
  dorsal.closePath();
  const dorsalGeo = new THREE.ExtrudeGeometry(dorsal, { depth: 0.005, bevelEnabled: false });
  dorsalGeo.translate(0, 0, -0.0025);
  edges(dorsalGeo, add(dorsalGeo, dark));

  // Navigation lights (animated in tick)
  const navRed = new THREE.MeshBasicMaterial({ color: 0xff4d6d });
  const navGreen = new THREE.MeshBasicMaterial({ color: 0x4dffb0 });
  const strobe = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true });
  const lightGeo = new THREE.SphereGeometry(0.009, 12, 8);

  for (const s of [1, -1]) {
    const fin = add(finGeo, wingMat, 0, 0.03, 0.062 * s);
    fin.rotation.x = -0.3 * s;
    edges(finGeo, fin);
    const finTip = add(lightGeo, strobe, -0.46, 0.245, 0.062 * s + 0.07 * s);
    finTip.scale.setScalar(0.7);
    add(lightGeo, s > 0 ? navGreen : navRed, -0.265, -0.012, 0.6 * s);
  }
  const topStrobe = add(lightGeo, strobe, -0.36, 0.082, 0);

  // Glowing band
  const band = new THREE.Mesh(
    new THREE.TorusGeometry(0.1, 0.0035, 4, 8),
    new THREE.MeshBasicMaterial({ color: 0x5fe3ff, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending }),
  );
  band.rotation.y = Math.PI / 2;
  band.rotation.z = 0;
  band.scale.set(1, 0.72, 1);
  band.position.x = -0.06;
  group.add(band);

  // Engines: central nozzle + two nacelles, chrome rings, dark throats, exhaust cones
  const exhaustUniforms = { uTime: { value: 0 }, uPower: { value: 1 } };
  const exhausts: THREE.Mesh[] = [];
  const nacelleGeo = new THREE.CylinderGeometry(0.033, 0.042, 0.32, 32);
  nacelleGeo.rotateZ(Math.PI / 2);
  const engines: [number, number, number, number][] = [
    [-0.5, 0, 0, 0.048],
    [-0.47, -0.026, 0.122, 0.034],
    [-0.47, -0.026, -0.122, 0.034],
  ];
  engines.forEach(([x, y, z, rad], i) => {
    if (i > 0) {
      add(nacelleGeo, hull, x + 0.16, y, z);
      // nacelle intake lip
      const lip = new THREE.TorusGeometry(0.034, 0.004, 8, 32);
      lip.rotateY(Math.PI / 2);
      add(lip, chrome, x + 0.32, y, z);
    }
    const nozzle = new THREE.TorusGeometry(rad * 0.95, rad * 0.14, 10, 40);
    nozzle.rotateY(Math.PI / 2);
    add(nozzle, chrome, x, y, z);
    const throat = new THREE.CylinderGeometry(rad * 0.85, rad * 0.7, 0.03, 32, 1, true);
    throat.rotateZ(Math.PI / 2);
    add(throat, dark, x + 0.012, y, z);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(rad * 0.75, 32), new THREE.MeshBasicMaterial({ color: 0xc6f7ff }));
    disc.rotation.y = -Math.PI / 2;
    disc.position.set(x + 0.02, y, z);
    group.add(disc);

    for (const [len, scaleR, color] of [
      [0.42, 0.9, i === 0 ? 0x5fe3ff : 0x8d94ff],
      [0.22, 0.45, 0xffffff],
    ] as const) {
      const coneGeo = new THREE.ConeGeometry(rad * scaleR, len, 24, 1, true);
      coneGeo.rotateZ(Math.PI / 2);
      coneGeo.translate(-len / 2, 0, 0);
      const cone = new THREE.Mesh(
        coneGeo,
        new THREE.ShaderMaterial({
          uniforms: { ...exhaustUniforms, uColor: { value: new THREE.Color(color) } },
          vertexShader: exhaustVertex,
          fragmentShader: exhaustFragment,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
        }),
      );
      cone.position.set(x, y, z);
      exhausts.push(cone);
      group.add(cone);
    }
  });

  // Normalise: centre and scale so the length (x extent, exhaust excluded) is 1.
  const box = new THREE.Box3();
  group.children.filter((c) => !exhausts.includes(c as THREE.Mesh)).forEach((c) => box.expandByObject(c));
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const inner = new THREE.Group();
  while (group.children.length) inner.add(group.children[0]);
  inner.position.sub(center);
  group.add(inner);
  group.scale.setScalar(1 / size.x);

  const tick = (t: number) => {
    // strobes: double flash every 1.6 s; nav lights steady with a soft pulse
    const phase = t % 1.6;
    strobe.opacity = phase < 0.06 || (phase > 0.16 && phase < 0.22) ? 1 : 0.08;
    topStrobe.scale.setScalar(strobe.opacity > 0.5 ? 1.4 : 0.8);
    const pulse = 0.75 + 0.25 * Math.sin(t * 3);
    navRed.color.setRGB(1, 0.3 * pulse, 0.43 * pulse);
    navGreen.color.setRGB(0.3 * pulse, 1, 0.69 * pulse);
  };

  return { group, exhausts, exhaustUniforms, tick };
}

/**
 * Studio environment for reflections: dark sky gradient + coloured softboxes,
 * so the glossy hull picks up cyan / pink / violet highlights instead of grey.
 */
export function studioEnvironment(renderer: THREE.WebGLRenderer) {
  const scene = new THREE.Scene();
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(10, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `varying vec3 vP; void main(){
        float y = vP.y;
        vec3 top = vec3(0.10,0.08,0.32), mid = vec3(0.22,0.55,0.75), bot = vec3(0.03,0.04,0.12);
        vec3 c = y > 0.0 ? mix(mid, top, smoothstep(0.0, 0.7, y)) : mix(mid, bot, smoothstep(0.0, 0.5, -y));
        gl_FragColor = vec4(c, 1.0);
      }`,
    }),
  );
  scene.add(sky);
  const box = (color: number, intensity: number, w: number, h: number, pos: [number, number, number]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }));
    m.position.set(...pos);
    m.lookAt(0, 0, 0);
    scene.add(m);
  };
  box(0xffffff, 6, 6, 2, [0, 7, 2]); // key softbox overhead
  box(0x5fe3ff, 4, 2.5, 5, [-7, 1, 3]); // cyan strip left
  box(0xff8fd8, 3.5, 2.5, 5, [7, 0, -2]); // pink strip right
  box(0x8d94ff, 3, 8, 1.2, [0, -2, -7]); // violet floor bounce
  const pmrem = new THREE.PMREMGenerator(renderer);
  const tex = pmrem.fromScene(scene, 0.02).texture;
  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    m.geometry?.dispose();
    (m.material as THREE.Material | undefined)?.dispose();
  });
  return { texture: tex, dispose: () => (tex.dispose(), pmrem.dispose()) };
}
