/**
 * Living sky around the hero ship:
 *  - Escorts: spherical recon drones ("robot eyes") that fly in from random screen edges once you leave the hero,
 *    then hold a slowly rotating formation around the ship (each on its own lagging spring).
 *  - Traffic: distant ships crossing the sky with engine trails, sometimes in convoys;
 *    a warp jump launches a few more. They drift with scroll like the planets.
 */
import * as THREE from "three";

const rand = (a: number, b: number) => a + Math.random() * (b - a);

/* ───────── shared assets ───────── */

function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, "rgba(255,255,255,1)");
  r.addColorStop(0.25, "rgba(160,240,255,0.8)");
  r.addColorStop(1, "rgba(95,227,255,0)");
  g.fillStyle = r;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const trailVertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const trailFragment = /* glsl */ `
  uniform vec3 uColor; uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    float along = pow(vUv.x, 2.2);                  // bright at the engine (uv.x = 1)
    float across = 1.0 - abs(vUv.y - 0.5) * 2.0;
    float a = along * pow(across, 1.6) * uOpacity;
    gl_FragColor = vec4(mix(uColor, vec3(1.0), along * 0.5), a);
  }
`;

/* ───────── escorts ───────── */

type Escort = {
  obj: THREE.Group;
  shellA: THREE.Group;
  shellB: THREE.Group;
  pupil: THREE.MeshBasicMaterial;
  beam: THREE.Mesh;
  beamMat: THREE.ShaderMaterial;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  home: THREE.Vector3; // off-screen spawn / exit point
  phase: number;
  radius: number;
  lift: number;
  seed: number;
};

const beamFragment = /* glsl */ `
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    float a = pow(vUv.y, 1.5) * uOpacity;             // cone tip (uv.y = 1) sits at the eye → bright there
    gl_FragColor = vec4(vec3(1.0, 0.36, 0.45), a);
  }
`;

/**
 * Recon drone: polished chrome core, two counter-rotating armour shells made of spherical
 * plates with gaps, an equatorial band with lit slots, and a lens "eye" (glass, cyan iris,
 * pulsing red pupil) on +Z that is turned toward the ship each frame.
 */
function buildEyeDrone(glowTex: THREE.Texture) {
  const g = new THREE.Group();
  const chrome = new THREE.MeshPhysicalMaterial({ color: 0xe9ecf8, metalness: 1, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.6 });
  const plate = new THREE.MeshPhysicalMaterial({ color: 0xc7cbe0, metalness: 1, roughness: 0.22, clearcoat: 0.8, envMapIntensity: 1.3, side: THREE.DoubleSide });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1b1d33, metalness: 0.8, roughness: 0.35 });
  const glowSlot = new THREE.MeshBasicMaterial({ color: 0x5fe3ff });

  // core
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.42, 40, 28), chrome));

  // armour shells: 4 plates each (phi segments with gaps), latitude-limited so the eye stays clear
  const shell = (radius: number, thetaStart: number, thetaLen: number) => {
    const s = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const geo = new THREE.SphereGeometry(radius, 20, 10, (i * Math.PI) / 2 + 0.12, Math.PI / 2 - 0.24, thetaStart, thetaLen);
      s.add(new THREE.Mesh(geo, plate));
    }
    return s;
  };
  const shellA = shell(0.5, 0.18, 0.95); // upper cap plates
  const shellB = shell(0.5, Math.PI - 1.13, 0.95); // lower cap plates
  g.add(shellA, shellB);

  // equatorial band with lit slots + latitude rings
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.09, 48, 1, true), dark);
  g.add(band);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.022, 0.01), glowSlot);
    slot.position.set(Math.sin(a) * 0.525, 0, Math.cos(a) * 0.525);
    slot.rotation.y = a;
    g.add(slot);
  }
  for (const y of [-0.3, 0.3]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(Math.sqrt(0.53 * 0.53 - y * y), 0.008, 6, 48), chrome);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    g.add(ring);
  }

  // eye on +Z: socket, dark glass, iris ring, pupil
  const socket = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.035, 12, 40), chrome);
  socket.position.z = 0.47;
  g.add(socket);
  const glass = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshPhysicalMaterial({ color: 0x05060f, metalness: 0.2, roughness: 0.02, clearcoat: 1, envMapIntensity: 2.2 }),
  );
  glass.rotation.x = Math.PI / 2;
  glass.scale.set(1, 0.45, 1);
  glass.position.z = 0.45;
  g.add(glass);
  const iris = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.014, 8, 40), new THREE.MeshBasicMaterial({ color: 0x5fe3ff }));
  iris.position.z = 0.54;
  g.add(iris);
  const pupil = new THREE.MeshBasicMaterial({ color: 0xff3d5e });
  const pupilMesh = new THREE.Mesh(new THREE.CircleGeometry(0.06, 24), pupil);
  pupilMesh.position.z = 0.545;
  g.add(pupilMesh);
  const eyeGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xff6b7a, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  eyeGlow.position.z = 0.6;
  eyeGlow.scale.setScalar(0.45);
  g.add(eyeGlow);

  // antennae + rear thruster
  for (const s of [1, -1]) {
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, 0.32, 6), chrome);
    ant.position.y = 0.62 * s;
    g.add(ant);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), glowSlot);
    tip.position.y = 0.79 * s;
    g.add(tip);
  }
  const thruster = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0x9fefff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  thruster.position.z = -0.6;
  thruster.scale.setScalar(0.5);
  g.add(thruster);

  // scanning beam: a thin cone from the eye along +Z, length set per frame
  const beamMat = new THREE.ShaderMaterial({
    uniforms: { uOpacity: { value: 0 } },
    vertexShader: trailVertex,
    fragmentShader: beamFragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const beamGeo = new THREE.ConeGeometry(0.22, 1, 24, 1, true);
  beamGeo.rotateX(-Math.PI / 2); // tip at the eye (−Z), base toward +Z
  beamGeo.translate(0, 0, 0.5);
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.position.z = 0.55;
  g.add(beam);

  return { g, shellA, shellB, pupil, beam, beamMat };
}

export function buildEscorts(small: boolean) {
  const group = new THREE.Group();
  const glowTex = glowTexture();
  const count = small ? 3 : 4;
  const escorts: Escort[] = [];
  for (let i = 0; i < count; i++) {
    const d = buildEyeDrone(glowTex);
    d.g.visible = false;
    group.add(d.g);
    escorts.push({
      obj: d.g,
      shellA: d.shellA,
      shellB: d.shellB,
      pupil: d.pupil,
      beam: d.beam,
      beamMat: d.beamMat,
      pos: new THREE.Vector3(),
      vel: new THREE.Vector3(),
      home: new THREE.Vector3(),
      phase: (i / count) * Math.PI * 2 + rand(-0.25, 0.25),
      radius: rand(0.6, 0.8),
      lift: rand(-0.2, 0.2),
      seed: rand(0, 10),
    });
  }

  let active = false;
  let placed = false;
  const target = new THREE.Vector3();
  const look = new THREE.Vector3();

  /** pick a random point just outside one of the four screen edges (at the ship's depth) */
  const offscreen = (out: THREE.Vector3, fw: number, fh: number) => {
    const edge = Math.floor(Math.random() * 4);
    const m = 1.4;
    if (edge === 0) out.set(-fw / 2 - m, rand(-fh / 2, fh / 2), rand(-2, 1));
    else if (edge === 1) out.set(fw / 2 + m, rand(-fh / 2, fh / 2), rand(-2, 1));
    else if (edge === 2) out.set(rand(-fw / 2, fw / 2), fh / 2 + m, rand(-2, 1));
    else out.set(rand(-fw / 2, fw / 2), -fh / 2 - m, rand(-2, 1));
    return out;
  };

  /**
   * @param ship world position of the ship rig
   * @param len ship length in world units
   * @param want escorts should be on screen (left the hero)
   */
  const update = (dt: number, time: number, ship: THREE.Vector3, len: number, want: boolean, fw: number, fh: number) => {
    if (!placed) {
      for (const e of escorts) e.pos.copy(offscreen(e.home, fw, fh));
      placed = true;
    }
    if (want !== active) {
      active = want;
      for (const e of escorts) {
        offscreen(e.home, fw, fh);
        if (active) e.pos.copy(e.home);
      }
    }
    const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
    const h = dt / steps;
    const size = len * 0.085; // kept small so the drones never compete with the content
    for (const e of escorts) {
      if (active) {
        const a = e.phase + time * 0.4;
        target.set(
          ship.x + Math.cos(a) * len * e.radius,
          ship.y + Math.sin(a) * len * e.radius * 0.55 + e.lift * len,
          ship.z + Math.sin(a * 0.7) * len * 0.5,
        );
      } else target.copy(e.home);
      // soft while flying in from the edge, stiff once in formation → no visible lag behind the ship
      const dist = e.pos.distanceTo(target);
      const near = active ? THREE.MathUtils.clamp(1 - dist / (len * 2.5), 0, 1) : 0;
      const k = THREE.MathUtils.lerp(10, 48, near);
      const c = 2 * Math.sqrt(k);
      for (let n = 0; n < steps; n++) {
        e.vel.x += (k * (target.x - e.pos.x) - c * e.vel.x) * h;
        e.vel.y += (k * (target.y - e.pos.y) - c * e.vel.y) * h;
        e.vel.z += (k * (target.z - e.pos.z) - c * e.vel.z) * h;
        e.pos.addScaledVector(e.vel, h);
      }
      const onScreen = Math.abs(e.pos.x) < fw / 2 + 1.2 && Math.abs(e.pos.y) < fh / 2 + 1.2;
      e.obj.visible = active || onScreen;
      e.obj.position.copy(e.pos);
      e.obj.scale.setScalar(size);
      // the eye watches the ship (with a little nervous jitter)
      look.set(ship.x + Math.sin(time * 1.7 + e.seed) * len * 0.08, ship.y + Math.cos(time * 1.3 + e.seed) * len * 0.05, ship.z);
      e.obj.lookAt(look);
      e.shellA.rotation.y = time * 0.6 + e.seed;
      e.shellB.rotation.y = -time * 0.45 - e.seed;
      const pulse = 0.65 + 0.35 * Math.sin(time * 4 + e.seed);
      e.pupil.color.setRGB(1, 0.24 * pulse, 0.37 * pulse);
      // scanning beam reaches the ship; flickers like a sweep
      const toShip = e.pos.distanceTo(ship);
      e.beam.scale.set(1, 1, Math.max(0.01, (toShip - len * 0.25) / size));
      e.beamMat.uniforms.uOpacity.value = near * (0.1 + 0.08 * Math.sin(time * 9 + e.seed * 3)) * (Math.sin(time * 0.8 + e.seed) > -0.2 ? 1 : 0.2);
    }
  };

  const dispose = () => {
    group.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      (m.material as THREE.Material | undefined)?.dispose();
    });
    glowTex.dispose();
  };

  return { group, update, dispose };
}

/* ───────── distant traffic ───────── */

type Craft = {
  obj: THREE.Group;
  trail: THREE.ShaderMaterial;
  live: boolean;
  dir: 1 | -1;
  speed: number;
  x: number;
  fy: number; // vertical position as a fraction of the half-viewport
  z: number;
  screens0: number; // scroll position at launch (for parallax)
  size: number;
};

function buildCraft(glowTex: THREE.Texture, color: number) {
  const g = new THREE.Group();
  const hull = new THREE.MeshStandardMaterial({ color: 0x8b8fc8, metalness: 0.9, roughness: 0.3, emissive: new THREE.Color(0x1a1650), emissiveIntensity: 0.6 });
  const body = new THREE.Mesh(new THREE.ConeGeometry(0.12, 1, 6), hull);
  body.rotation.z = -Math.PI / 2;
  g.add(body);
  const wing = new THREE.Shape();
  wing.moveTo(0.1, 0);
  wing.lineTo(-0.35, 0.42);
  wing.lineTo(-0.45, 0.42);
  wing.lineTo(-0.4, 0);
  wing.lineTo(-0.45, -0.42);
  wing.lineTo(-0.35, -0.42);
  wing.closePath();
  const wingGeo = new THREE.ShapeGeometry(wing);
  wingGeo.rotateX(Math.PI / 2);
  g.add(new THREE.Mesh(wingGeo, new THREE.MeshStandardMaterial({ color: 0x6d72b8, metalness: 0.8, roughness: 0.35, side: THREE.DoubleSide })));
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  glow.position.x = -0.5;
  glow.scale.setScalar(0.7);
  g.add(glow);
  const trailMat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uOpacity: { value: 0.9 } },
    vertexShader: trailVertex,
    fragmentShader: trailFragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const trailGeo = new THREE.PlaneGeometry(5, 0.14);
  trailGeo.translate(-3, 0, 0);
  g.add(new THREE.Mesh(trailGeo, trailMat));
  g.visible = false;
  return { g, trailMat };
}

export function buildTraffic(small: boolean) {
  const group = new THREE.Group();
  const glowTex = glowTexture();
  const colors = [0x5fe3ff, 0xff8fd8, 0x8d94ff, 0xffc27a];
  const pool: Craft[] = Array.from({ length: small ? 4 : 8 }, (_, i) => {
    const { g, trailMat } = buildCraft(glowTex, colors[i % colors.length]);
    group.add(g);
    return { obj: g, trail: trailMat, live: false, dir: 1, speed: 1, x: 0, fy: 0, z: -30, screens0: 0, size: 1 };
  });

  let next = 1; // first crossing soon after load
  let queued = 0;
  const tan = Math.tan(THREE.MathUtils.degToRad(15));

  const launch = (screens: number, convoyOf?: Craft) => {
    const c = pool.find((p) => !p.live);
    if (!c) return null;
    c.live = true;
    c.obj.visible = true;
    if (convoyOf) {
      c.dir = convoyOf.dir;
      c.z = convoyOf.z + rand(-1.5, 1.5);
      c.fy = convoyOf.fy + rand(-0.12, 0.12);
      c.speed = convoyOf.speed;
      c.size = convoyOf.size * rand(0.75, 0.95);
      c.x = convoyOf.x - convoyOf.dir * rand(1.4, 2.4);
    } else {
      c.dir = Math.random() < 0.5 ? 1 : -1;
      c.z = rand(-48, -24);
      c.fy = rand(-0.55, 0.75);
      c.speed = rand(2.2, 4.2);
      c.size = rand(0.7, 1.15);
      c.x = Number.NaN; // placed on first update (needs the viewport width)
    }
    c.screens0 = screens;
    return c;
  };

  const warpBurst = () => (queued += 2);

  const update = (dt: number, screens: number, aspect: number) => {
    next -= dt;
    if (next <= 0 || queued > 0) {
      if (queued > 0) queued--;
      next = rand(2.5, 6);
      const lead = launch(screens);
      if (lead && Math.random() < 0.3) {
        launch(screens, lead);
        if (Math.random() < 0.5) launch(screens, lead);
      }
    }
    for (const c of pool) {
      if (!c.live) continue;
      const halfH = tan * (10 - c.z);
      const halfW = halfH * aspect;
      if (Number.isNaN(c.x)) c.x = -c.dir * (halfW + 4);
      c.x += c.dir * c.speed * dt * (halfH / 12);
      const drift = (screens - c.screens0) * 0.9; // scrolls up with the page, slower than content
      c.obj.position.set(c.x, (c.fy + drift) * halfH, c.z);
      c.obj.rotation.set(0, c.dir > 0 ? 0 : Math.PI, Math.sin(c.x * 0.3) * 0.08);
      c.obj.scale.setScalar(c.size * (halfH / 9));
      if (c.dir * c.x > halfW + 8 || Math.abs(c.fy + drift) > 1.6) {
        c.live = false;
        c.obj.visible = false;
      }
    }
  };

  const dispose = () => {
    group.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      (m.material as THREE.Material | undefined)?.dispose();
    });
    glowTex.dispose();
  };

  return { group, update, warpBurst, dispose };
}
