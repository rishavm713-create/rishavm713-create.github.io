// Hero 3D: the editor (photo monitor, clips, captions, audio, playhead) as a scene in depth.
// Loaded by app.js only when WebGL works, motion is allowed and the device is not low-power.
// Until the first frame renders, the flat CSS editor stays on screen as the still fallback.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';

const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export default function start(editor) {
  const phone = matchMedia('(max-width: 899px)').matches;
  const canvas = document.createElement('canvas');
  canvas.className = 'gl';
  canvas.setAttribute('aria-hidden', 'true');

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !phone, alpha: true, powerPreference: 'low-power' });
  } catch (e) {
    return;
  }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  editor.appendChild(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
  camera.position.set(0, 0, 10);

  // lit like his studio backdrop: violet fill from above, warm key from the front
  scene.add(new THREE.HemisphereLight(new THREE.Color(css('--accent-soft')), new THREE.Color(css('--bg')), 1.5));
  const sun = new THREE.DirectionalLight(new THREE.Color(css('--fg')), 1.5);
  sun.position.set(3, 5, 6);
  scene.add(sun);

  const rig = new THREE.Group();
  scene.add(rig);
  const lambert = (c) => new THREE.MeshLambertMaterial({ color: new THREE.Color(c) });

  // program monitor: bezel, photo, REC light
  const monitor = new THREE.Group();
  monitor.position.set(0, 0.95, 0);
  rig.add(monitor);
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(3.3, 3.3, 0.14), lambert(css('--bg3')));
  bezel.position.z = -0.08;
  monitor.add(bezel);
  const tex = new THREE.TextureLoader().load(editor.querySelector('.monitor img').currentSrc || 'img/rishav.webp', () => draw());
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  monitor.add(new THREE.Mesh(new THREE.PlaneGeometry(3.1, 3.1), new THREE.MeshBasicMaterial({ map: tex })));
  const recMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(css('--rec')) });
  const rec = new THREE.Mesh(new THREE.CircleGeometry(0.07, 20), recMat);
  rec.position.set(-1.32, 1.32, 0.02);
  monitor.add(rec);

  // timeline tracks, each a step further back so the edit reads in depth
  const W = 3.3, x0 = -W / 2;
  const tracks = [
    { y: -1.05, z: 0.7, h: 0.2, clips: [[8, 14], [44, 10], [74, 16]], color: '--gfx' },
    { y: -1.37, z: 0.42, h: 0.22, clips: [[0, 22], [23, 17], [41, 24], [66, 14], [81, 19]], color: ['--clip2', '--clip'] },
    { y: -1.66, z: 0.14, h: 0.12, clips: [[2, 9], [12, 12], [26, 8], [36, 11], [49, 9], [60, 13], [75, 8], [85, 11]], color: '--cc' },
  ];
  const lane = lambert(css('--bg2'));
  tracks.forEach((t) => {
    const bed = new THREE.Mesh(new THREE.BoxGeometry(W, t.h + 0.1, 0.04), lane);
    bed.position.set(0, t.y, t.z - 0.06);
    rig.add(bed);
    t.clips.forEach(([l, w], i) => {
      const col = Array.isArray(t.color) ? t.color[i % 2] : t.color;
      const m = new THREE.Mesh(new THREE.BoxGeometry((W * w) / 100 - 0.03, t.h, 0.1), lambert(css(col)));
      m.position.set(x0 + (W * (l + w / 2)) / 100, t.y, t.z);
      rig.add(m);
    });
  });

  // audio track: instanced bars that move like a meter
  const nBars = phone ? 22 : 44;
  const bars = new THREE.InstancedMesh(new THREE.BoxGeometry(W / nBars - 0.02, 1, 0.06), lambert(css('--fg3')), nBars);
  const bed = new THREE.Mesh(new THREE.BoxGeometry(W, 0.32, 0.04), lane);
  bed.position.set(0, -1.98, -0.2);
  rig.add(bed, bars);
  const dummy = new THREE.Object3D();
  const seeds = Array.from({ length: nBars }, (_, i) => 0.4 + 0.6 * Math.abs(Math.sin(i * 1.7)));
  const setBars = (t) => {
    for (let i = 0; i < nBars; i++) {
      const h = 0.05 + 0.22 * seeds[i] * (0.55 + 0.45 * Math.sin(t * 5 + i * 0.9));
      dummy.position.set(x0 + (W * (i + 0.5)) / nBars, -1.98, -0.15);
      dummy.scale.set(1, h, 1);
      dummy.updateMatrix();
      bars.setMatrixAt(i, dummy.matrix);
    }
    bars.instanceMatrix.needsUpdate = true;
  };

  // playhead through every track
  const playhead = new THREE.Group();
  const red = new THREE.MeshBasicMaterial({ color: new THREE.Color(css('--rec')) });
  const stem = new THREE.Mesh(new THREE.BoxGeometry(0.035, 1.25, 0.035), red);
  stem.position.set(0, -1.5, 0.75);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.16, 3), red);
  cap.rotation.z = Math.PI;
  cap.position.set(0, -0.82, 0.75);
  playhead.add(stem, cap);
  rig.add(playhead);

  // sizing: CSS owns the box, the drawing buffer follows it (DPR capped)
  const ratio = Math.min(devicePixelRatio || 1, phone ? 1.5 : 2);
  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setPixelRatio(ratio);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // keep the whole rig in frame on narrow boxes
    camera.position.z = Math.max(10, 4.6 / camera.aspect / (2 * Math.tan(THREE.MathUtils.degToRad(17))));
    camera.updateProjectionMatrix();
    draw();
  };
  new ResizeObserver(resize).observe(canvas);

  // one damped pointer target; scroll adds a tilt as the hero leaves
  const target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
  if (!phone && matchMedia('(hover: hover)').matches) addEventListener('pointermove', (e) => {
    target.x = (e.clientX / innerWidth) * 2 - 1;
    target.y = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });

  let last = performance.now(), t = 0, raf = 0, shown = false, visible = true, dead = false;
  function draw(now = performance.now()) {
    const dt = Math.min(1 / 30, (now - last) / 1000);
    last = now;
    t += dt;
    const k = 1 - Math.exp(-dt * 4);
    cur.x += (target.x - cur.x) * k;
    cur.y += (target.y - cur.y) * k;
    const s = Math.min(1, scrollY / Math.max(1, innerHeight));
    // one motion at a time: the pointer tilt where there is a mouse, a slow sway on touch
    const sway = target.x || target.y ? 0 : Math.sin(t * 0.4) * 0.03;
    rig.rotation.y = -0.32 + cur.x * 0.22 + sway;
    rig.rotation.x = 0.1 + cur.y * 0.12 + s * 0.25;
    rig.position.y = s * 0.6;
    camera.position.x = cur.x * 0.4;
    camera.lookAt(0, -0.2, 0);
    playhead.position.x = x0 + W * ((t / 6) % 1);
    rec.visible = Math.floor(t / 0.8) % 2 === 0;
    setBars(t);
    renderer.render(scene, camera);
    if (!shown && tex.image) {
      shown = true;
      editor.classList.add('is3d');
    }
  }
  const loop = (now) => {
    draw(now);
    raf = !dead && visible && !document.hidden ? requestAnimationFrame(loop) : 0;
  };
  const wake = () => {
    if (!raf && !dead && visible && !document.hidden) {
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }
  };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; wake(); }).observe(editor);
  document.addEventListener('visibilitychange', wake);
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    cancelAnimationFrame(raf);
    raf = 0;
    dead = true;
    editor.classList.remove('is3d');
  });
  canvas.addEventListener('webglcontextrestored', () => {
    dead = false;
    shown = false;
    wake();
  });
  resize();
  wake();
}
