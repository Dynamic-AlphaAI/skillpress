import * as T from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { RoomShelf } from "@/lib/roomShelves";
import type { Book } from "@/lib/types";
import { playSound } from "./sound";

type SceneEvents = { open: (id: string) => void; hover: (title: string) => void; lost: () => void };
type Flight = { from: T.Vector3; to: T.Vector3; yaw: number; turn: number; pitch: number; targetPitch: number; elapsed: number };

function paintTexture(w: number, h: number, paint: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  paint(canvas.getContext("2d")!);
  const tex = new T.CanvasTexture(canvas);
  tex.colorSpace = T.SRGBColorSpace;
  return tex;
}

function woodGrain() {
  return paintTexture(256, 512, (ctx) => {
    ctx.fillStyle = "#896447";
    ctx.fillRect(0, 0, 256, 512);
    for (let i = 0; i < 920; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 512;
      ctx.strokeStyle = i % 4 ? "#301b101c" : "#edc59126";
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + 1, y + 20, x - 3, y + 60, x + 2, y + 140);
      ctx.stroke();
    }
  });
}

/** A single material per spine preserves its catalogue typography and publisher colours. */
function spineTexture(book: Book) {
  return paintTexture(128, 512, (ctx) => {
    const d = book.design;
    ctx.fillStyle = d.bg;
    ctx.fillRect(0, 0, 128, 512);
    for (let i = 0; i < 128; i += 2) {
      ctx.fillStyle = i % 4 ? "#ffffff0b" : "#0000000a";
      ctx.fillRect(i, 0, 1, 512);
    }
    const light = ctx.createLinearGradient(0, 0, 128, 0);
    light.addColorStop(0, "#0007");
    light.addColorStop(0.22, "#fff2");
    light.addColorStop(0.63, "#fff0");
    light.addColorStop(1, "#0005");
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, 128, 512);
    ctx.fillStyle = d.accent;
    for (const y of [38, 43, 467, 471]) ctx.fillRect(7, y, 114, 2);
    ctx.fillStyle = d.ink;
    ctx.textAlign = "center";
    ctx.font = "22px Georgia";
    ctx.fillText(String(book.rank).padStart(2, "0"), 64, 30);
    ctx.save();
    ctx.translate(64, 254);
    ctx.rotate(Math.PI / 2);
    ctx.font = "bold 34px Georgia";
    ctx.textBaseline = "middle";
    ctx.fillText(d.title, 0, 0, 390);
    ctx.restore();
    ctx.font = "25px Georgia";
    ctx.fillText("§", 64, 501);
  });
}

function jacketTexture(book: Book, art: SVGSVGElement, ready: () => void) {
  const d = book.design;
  const texture = paintTexture(256, 384, (ctx) => {
    ctx.scale(2 / 3, 2 / 3);
    ctx.fillStyle = d.bg;
    ctx.fillRect(0, 0, 384, 576);
  });
  const canvas = texture.image as HTMLCanvasElement;
  const ctx = canvas.getContext("2d")!;
  const copy = art.cloneNode(true) as SVGElement;
  copy.setAttribute("width", "384");
  copy.setAttribute("height", "576");
  const url = URL.createObjectURL(
    new Blob([new XMLSerializer().serializeToString(copy)], { type: "image/svg+xml" }),
  );
  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, 0, 0, 384, 576);
    URL.revokeObjectURL(url);
    const top = d.titleAt === "top" ? 44 : 393;
    if (d.motif === "marble") {
      ctx.fillStyle = "#eee3d0";
      ctx.fillRect(20, top - 19, 344, 166);
    }
    ctx.fillStyle = d.ink;
    ctx.font = "20px Georgia";
    ctx.fillText(book.source.author, 32, top + 9, 290);
    ctx.fillRect(32, top + 24, 48, 2);
    ctx.font = "42px Georgia";
    ctx.textBaseline = "top";
    let y = top + 37,
      line = "";
    for (const word of d.title.split(" ")) {
      const next = line ? line + " " + word : word;
      if (line && ctx.measureText(next).width > 306) {
        ctx.fillText(line, 32, y, 310);
        line = word;
        y += 40;
      } else line = next;
    }
    ctx.fillText(line, 32, y, 310);
    ctx.font = "22px Georgia";
    ctx.fillText("§", 340, 20);
    const hinge = ctx.createLinearGradient(0, 0, 23, 0);
    hinge.addColorStop(0, "#0005");
    hinge.addColorStop(0.3, "#fff2");
    hinge.addColorStop(0.55, "#0003");
    hinge.addColorStop(1, "transparent");
    ctx.fillStyle = hinge;
    ctx.fillRect(0, 0, 23, 576);
    texture.needsUpdate = true;
    ready();
  };
  img.onerror = () => URL.revokeObjectURL(url);
  img.src = url;
  return texture;
}

/** Local-space bookcases face the centre aisle. Camera coordinates are in metres. */
export function createRoom(
  canvas: HTMLCanvasElement,
  shelves: RoomShelf[],
  jackets: HTMLDivElement,
  events: SceneEvents,
) {
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
  renderer.outputColorSpace = T.SRGBColorSpace;
  const scene = new T.Scene();
  scene.background = new T.Color("#78654d");
  scene.fog = new T.FogExp2("#a48d70", 0.026);
  const camera = new T.PerspectiveCamera(61, 1, 0.055, 65);
  camera.rotation.order = "YXZ";
  const stride = 3.8;
  const cases = Math.ceil(shelves.length / 4);
  const rows = Math.ceil(cases / 2);
  const rear = -rows * stride + 1;
  const front = 5.4;
  const depth = front - rear;
  const middle = (front + rear) / 2;
  const entry = new T.Vector3(0, 1.63, front - 1.2);
  camera.position.copy(entry);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const textures = new Set<T.Texture>();
  const materials = new Set<T.Material>();
  const geometries = new Set<T.BufferGeometry>();
  const buckets = new Map<T.Material, T.BufferGeometry[]>();
  const unit = new T.BoxGeometry();
  geometries.add(unit);
  const scratch = new T.Object3D();
  const rotation = new T.Quaternion();
  const boxMatrix = new T.Matrix4();
  let dead = false;
  let paused = false;
  let frame = 0;
  let last = 0;
  let flight: Flight | null = {
    from: new T.Vector3(0, 1.63, front - 0.4),
    to: entry,
    yaw: -0.045,
    turn: 0.045,
    pitch: -0.03,
    targetPitch: -0.03,
    elapsed: 0,
  };
  let yaw = 0;
  let pitch = -0.03;
  const keys = new Set<string>();
  const register = <M extends T.Material>(material: M) => {
    materials.add(material);
    return material;
  };
  const surface = (color: string, map?: T.Texture) =>
    register(new T.MeshStandardMaterial({ color, map: map ?? null, roughness: 0.8 }));
  const grain = woodGrain();
  textures.add(grain);
  const walnut = surface("#a6866c", grain);
  const dark = surface("#66513f", grain);
  const panel = surface("#a18b70", grain);
  const green = surface("#435349");
  const plaster = surface("#b7a88a");
  const brass = register(new T.MeshStandardMaterial({ color: "#b4904f", metalness: 0.4, roughness: 0.34 }));
  function block(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    material: T.Material,
    parent?: T.Matrix4,
  ) {
    boxMatrix.compose(scratch.position.set(x, y, z), rotation, scratch.scale.set(w, h, d));
    if (parent) boxMatrix.premultiply(parent);
    const part = unit.clone().applyMatrix4(boxMatrix);
    const items = buckets.get(material);
    if (items) items.push(part);
    else buckets.set(material, [part]);
  }

  scene.add(new T.HemisphereLight("#ffecd1", "#a98d73", 1.75));
  const sun = new T.DirectionalLight("#ffe5b5", 2.25);
  sun.position.set(3, 6, rear + 2);
  scene.add(sun);
  const fill = new T.DirectionalLight("#d4dcca", 0.65);
  fill.position.set(-3, 2, front);
  scene.add(fill);
  const floorTex = paintTexture(512, 512, (ctx) => {
    ctx.fillStyle = "#71523c";
    ctx.fillRect(0, 0, 512, 512);
    for (let col = 0; col < 8; col++) {
      for (let row = -1; row < 3; row++) {
        const top = row * 256 + (col % 2) * 128;
        const lightness = 27 + (Math.sin(col * 38 + row * 78) + 1) * 4;
        ctx.fillStyle = `hsl(28 30% ${lightness}%)`;
        ctx.fillRect(col * 64 + 1, top + 1, 63, 254);
        for (let j = 0; j < 70; j++) {
          ctx.fillStyle = j % 3 ? "#361e1318" : "#e4bc8222";
          ctx.fillRect(col * 64 + Math.random() * 62, top + Math.random() * 256, 0.6, Math.random() * 70);
        }
      }
    }
  });
  floorTex.wrapS = floorTex.wrapT = T.RepeatWrapping;
  floorTex.repeat.set(3, depth / 3);
  textures.add(floorTex);
  block(0, -0.09, middle, 8, 0.16, depth, surface("#f0d5ac", floorTex));
  block(0, 4.15, middle, 8, 0.15, depth, plaster);
  block(0, 2.05, rear, 8, 4.1, 0.2, green);
  block(0, 2.05, front, 8, 4.1, 0.2, green);
  block(-3.93, 2.05, middle, 0.17, 4.1, depth, green);
  block(3.93, 2.05, middle, 0.17, 4.1, depth, green);
  const rugTexture = paintTexture(256, 256, (ctx) => {
    ctx.fillStyle = "#414a3d";
    ctx.fillRect(0, 0, 256, 256);
    for (let x = 0; x < 256; x += 3) {
      ctx.fillStyle = "#c3ad7b16";
      ctx.fillRect(x, 0, 1, 256);
      ctx.fillRect(0, x, 256, 1);
    }
    ctx.strokeStyle = "#aa966d";
    ctx.lineWidth = 1.25;
    for (const x of [8, 15, 22, 234, 241, 248]) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 256);
      ctx.stroke();
    }
    for (let y = -32; y < 288; y += 32)
      for (let x = 0; x < 256; x += 32) {
        const offset = y % 64 === 0 ? 0 : 16;
        ctx.strokeStyle = x < 24 || x > 230 ? "#bdac80" : "#67705b";
        ctx.beginPath();
        ctx.moveTo(x + offset, y - 5);
        ctx.lineTo(x + offset + 4, y);
        ctx.lineTo(x + offset, y + 5);
        ctx.lineTo(x + offset - 4, y);
        ctx.closePath();
        ctx.stroke();
      }
  });
  rugTexture.wrapT = T.RepeatWrapping;
  rugTexture.repeat.y = depth / 1.83;
  textures.add(rugTexture);
  block(0, 0.008, middle, 1.83, 0.018, depth - 0.75, surface("#e3d8be", rugTexture));
  const endWall = new T.TextureLoader().load("/paneled-window.webp", redraw);
  endWall.colorSpace = T.SRGBColorSpace;
  textures.add(endWall);
  const endMaterial = register(new T.MeshBasicMaterial({ map: endWall, color: "#ead9be" }));
  const endGeometry = new T.PlaneGeometry(7.68, 4.06);
  geometries.add(endGeometry);
  for (const end of [rear, front]) {
    const wall = new T.Mesh(endGeometry, endMaterial);
    wall.rotation.y = end === rear ? 0 : Math.PI;
    wall.position.set(0, 2.03, end + (end === rear ? 0.12 : -0.12));
    scene.add(wall);
  }
  const lightGlass = register(new T.MeshBasicMaterial({ color: "#ffe4a8" }));
  const lampGlobe = new T.SphereGeometry(0.115, 16, 12);
  geometries.add(lampGlobe);
  const lampShade = new T.ConeGeometry(0.3, 0.15, 32, 1, true);
  geometries.add(lampShade);
  const shadeMaterial = register(
    new T.MeshStandardMaterial({ color: "#576954", metalness: 0.25, roughness: 0.35, side: T.DoubleSide }),
  );
  for (let row = 0; row < rows; row++) {
    const z = -stride * row;
    block(0, 3.78, z, 0.022, 0.49, 0.022, brass);
    const bulb = new T.Mesh(lampGlobe, lightGlass);
    bulb.position.set(0, 3.43, z);
    scene.add(bulb);
    const shade = new T.Mesh(lampShade, shadeMaterial);
    shade.position.set(0, 3.52, z);
    scene.add(shade);
  }
  // Bake the angled pool of window light and its mullions onto the floor.
  const sunlight = paintTexture(512, 512, (ctx) => {
    ctx.translate(256, 256);
    ctx.transform(1, 0, -0.3, 1, 0, 0);
    const light = ctx.createRadialGradient(0, 10, 12, 0, 10, 203);
    light.addColorStop(0, "#ffde9c9c");
    light.addColorStop(0.64, "#ffd99b81");
    light.addColorStop(1, "#ffe7b000");
    ctx.fillStyle = light;
    ctx.fillRect(-215, -185, 430, 370);
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "#000b";
    for (let i = -160; i <= 160; i += 80) ctx.fillRect(i, -205, 5, 415);
    for (let j = -130; j <= 170; j += 95) ctx.fillRect(-230, j, 460, 5);
  });
  textures.add(sunlight);
  const sunGeo = new T.PlaneGeometry(6, 5.5);
  geometries.add(sunGeo);
  const sunPatch = new T.Mesh(
    sunGeo,
    register(new T.MeshBasicMaterial({ map: sunlight, transparent: true, depthWrite: false })),
  );
  sunPatch.rotation.x = -Math.PI / 2;
  sunPatch.position.set(0.32, 0.031, rear + 3.3);
  scene.add(sunPatch);
  // A writing table beneath the window and a brass reading lamp.
  block(0, 0.78, rear + 0.94, 2.45, 0.09, 0.8, walnut);
  for (const x of [-1.04, 1.04])
    for (const z of [0.64, 1.24]) block(x, 0.38, rear + z, 0.095, 0.76, 0.095, dark);
  block(0.48, 0.86, rear + 0.9, 0.29, 0.055, 0.18, brass);
  block(0.48, 1.07, rear + 0.9, 0.035, 0.42, 0.035, brass);
  block(0.48, 1.27, rear + 0.9, 0.46, 0.12, 0.2, green);
  for (let r = 0; r <= rows; r++) {
    const z = 2.05 - r * stride;
    block(0, 3.96, z, 7.9, 0.23, 0.22, dark);
    for (const x of [-2.1, 0, 2.1]) block(x, 4.03, z - stride / 2, 0.1, 0.1, stride, panel);
  }

  const pickable: T.Mesh[] = [];
  const shelfPositions: { side: number; z: number; height: number }[] = [];
  const paper = surface("#e4d6b8");
  const boards = new Map<string, T.Material>();
  const hitMaterial = register(new T.MeshBasicMaterial());
  for (let i = 0; i < cases; i++) {
    const start = Math.floor((i * shelves.length) / cases);
    const stack = shelves.slice(start, Math.floor(((i + 1) * shelves.length) / cases));
    const side = i % 2 ? 1 : -1;
    const z = -Math.floor(i / 2) * stride;
    const base = new T.Matrix4().makeRotationY((-side * Math.PI) / 2).setPosition(side * 3.78, 0, z);
    const timber = (x: number, y: number, distance: number, w: number, h: number, d: number, m: T.Material) =>
      block(x, y, distance, w, h, d, m, base);
    const bottom = stack.length === 1 ? 1.14 : 0.61;
    const step = 0.76;
    const top = bottom + stack.length * step;
    timber(0, top / 2, 0.07, 3.69, top, 0.18, dark);
    for (const x of [-1.78, 1.78]) {
      timber(x, top / 2, 0.26, 0.13, top, 0.39, walnut);
      timber(x, top / 2, 0.47, 0.05, top, 0.03, panel);
    }
    for (const x of [-1.27, -0.43, 0.43, 1.27]) {
      timber(x, bottom / 2, 0.33, 0.82, bottom - 0.06, 0.22, walnut);
      timber(x, bottom / 2, 0.45, 0.67, bottom - 0.19, 0.035, panel);
      timber(x + 0.25, bottom * 0.68, 0.49, 0.04, 0.04, 0.04, brass);
    }
    timber(0, top, 0.31, 3.8, 0.12, 0.54, panel);
    stack.forEach((shelf, row) => {
      const deck = bottom + step * row;
      shelfPositions.push({ side, z, height: deck + 0.35 });
      timber(0, deck, 0.29, 3.68, 0.095, 0.48, walnut);
      timber(0, deck - 0.004, 0.54, 1.43, 0.104, 0.035, brass);
      const plaqueTexture = paintTexture(512, 48, (ctx) => {
        ctx.fillStyle = "#ad915c";
        ctx.fillRect(0, 0, 512, 48);
        ctx.fillStyle = "#28251e";
        ctx.font = "32px Georgia";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(shelf.label, 256, 25, 490);
      });
      textures.add(plaqueTexture);
      timber(0, deck - 0.004, 0.563, 1.4, 0.1, 0.012, surface("#ffffff", plaqueTexture));
      const widths = shelf.books.map((b, j) => j < shelf.faceOutCount ? 0.46 : 0.15 + Math.min(b.words / 22000, 0.065));
      const totalWidth = widths.reduce((a, b) => a + b, 0);
      const gap = Math.min(0.13, (3.37 - totalWidth) / Math.max(1, widths.length - 1));
      let cursor = -(totalWidth + (widths.length - 1) * gap) / 2;
      shelf.books.forEach((book, column) => {
        const faceOut = column < shelf.faceOutCount;
        const w = widths[column],
          h = faceOut ? 0.635 : 0.5 + (book.rank % 6) * 0.021;
        const x = cursor + w / 2,
          y = deck + 0.05 + h / 2;
        cursor += w + gap;
        let board = boards.get(book.design.bg);
        if (!board) {
          board = surface(book.design.bg);
          boards.set(book.design.bg, board);
        }
        const d = faceOut ? 0.093 : 0.3;
        const front = 0.495;
        const center = front - d / 2;
        if (faceOut) {
          timber(x, y, center, w - 0.012, h - 0.016, d - 0.015, paper);
          timber(x, y, front - 0.006, w, h, 0.012, board);
          timber(x, y, front - d + 0.006, w, h, 0.012, board);
          timber(x - w / 2 + 0.009, y, center, 0.018, h, d, board);
        } else {
          timber(x, y, center, w - 0.014, h - 0.012, d - 0.016, paper);
          for (const sign of [-1, 1]) timber(x + sign * (w / 2 - 0.004), y, center, 0.008, h, d, board);
        }
        const artwork = jackets.querySelector<SVGSVGElement>(`[data-jacket="${CSS.escape(book.id)}"] svg`);
        const map =
          faceOut && artwork
            ? jacketTexture(book, artwork, () => {
                if (!dead) redraw();
              })
            : spineTexture(book);
        textures.add(map);
        map.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
        const geo = new T.PlaneGeometry(w, h);
        geometries.add(geo);
        const binding = new T.Mesh(geo, surface("#fff5e3", map));
        binding.position.set(x, y, front + 0.002);
        binding.applyMatrix4(base);
        scene.add(binding);
        // The sides, page block and cover all open the same edition.
        const hitBox = new T.Mesh(unit, hitMaterial);
        hitBox.position.set(x, y, center);
        hitBox.scale.set(w, h, d + 0.005);
        hitBox.applyMatrix4(base);
        hitBox.updateMatrixWorld();
        hitBox.userData.book = book;
        pickable.push(hitBox);
      });
    });
  }
  // Combine fixed joinery by material so the renderer does not draw each moulding individually.
  for (const [material, parts] of buckets) {
    const geometry = mergeGeometries(parts)!;
    geometries.add(geometry);
    scene.add(new T.Mesh(geometry, material));
    parts.forEach((g) => g.dispose());
  }
  buckets.clear();

  const ray = new T.Raycaster();
  const pointer = new T.Vector2();
  const forward = new T.Vector3();
  const right = new T.Vector3();
  const move = new T.Vector3();
  let pointerStart: { id: number; x: number; y: number; yaw: number; pitch: number; drag: boolean } | null =
    null;
  let walked = 0;
  let scrollRemaining = 0; // Metres of wheel travel waiting to be drawn.
  function hit(e: PointerEvent) {
    const r = canvas.getBoundingClientRect();
    pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, (-(e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(pointer, camera);
    return ray.intersectObjects(pickable, false)[0]?.object.userData.book as Book | undefined;
  }
  function redraw() {
    if (!frame && !dead && !paused) {
      last = performance.now();
      frame = requestAnimationFrame(render);
    }
  }
  function moveCamera(dt: number, scrollStep = 0) {
    const f = Number(keys.has("w") || keys.has("arrowup")) - Number(keys.has("s") || keys.has("arrowdown"));
    const strafe = Number(keys.has("d")) - Number(keys.has("a"));
    yaw += (Number(keys.has("arrowleft")) - Number(keys.has("arrowright"))) * dt * 1.6;
    forward.set(-Math.sin(yaw), 0, -Math.cos(yaw));
    right.set(Math.cos(yaw), 0, -Math.sin(yaw));
    move
      .copy(forward)
      .multiplyScalar(f)
      .addScaledVector(right, strafe)
      .clampLength(0, 1)
      .multiplyScalar(dt * 2.8)
      .addScaledVector(forward, scrollStep);
    const prevX = camera.position.x,
      prevZ = camera.position.z;
    camera.position.add(move);
    camera.position.x = T.MathUtils.clamp(camera.position.x, -2.93, 2.93);
    camera.position.z = T.MathUtils.clamp(camera.position.z, rear + 1.6, front - 0.45);
    walked += Math.hypot(camera.position.x - prevX, camera.position.z - prevZ);
    if (walked > 0.78) {
      playSound("step");
      walked = 0;
    }
  }
  function render(now: number) {
    frame = 0;
    if (dead || paused) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (flight) {
      flight.elapsed += dt;
      const t = reduce.matches ? 1 : Math.min(flight.elapsed / 1.05, 1);
      const ease = t * t * (3 - 2 * t);
      camera.position.lerpVectors(flight.from, flight.to, ease);
      yaw = flight.yaw + flight.turn * ease;
      pitch = flight.pitch * (1 - ease) + flight.targetPitch * ease;
      if (t === 1) flight = null;
    } else if (keys.size || scrollRemaining) {
      const scrollStep = reduce.matches ? scrollRemaining : T.MathUtils.clamp(scrollRemaining, -4 * dt, 4 * dt);
      scrollRemaining -= scrollStep;
      moveCamera(dt, scrollStep);
    }
    camera.rotation.set(pitch, yaw, 0, "YXZ");
    renderer.render(scene, camera);
    if (flight || keys.size || scrollRemaining) frame = requestAnimationFrame(render);
  }
  function stop() {
    keys.clear();
    scrollRemaining = 0;
    pointerStart = null;
  }
  function visit(index: number) {
    const bay = shelfPositions[index];
    const to = bay ? new T.Vector3(bay.side * 1.03, 1.64, bay.z) : entry;
    // Facing left is positive yaw, facing right is negative yaw.
    const targetYaw = bay ? (-bay.side * Math.PI) / 2 : 0;
    flight = {
      from: camera.position.clone(),
      to,
      yaw,
      turn: Math.atan2(Math.sin(targetYaw - yaw), Math.cos(targetYaw - yaw)),
      pitch,
      targetPitch: bay ? Math.atan2(bay.height - to.y, 2.3) : -0.03,
      elapsed: 0,
    };
    stop();
    playSound("step");
    redraw();
  }
  function resize() {
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    redraw();
  }
  function setKey(key: string, down: boolean) {
    if (paused) return;
    if (down) {
      flight = null;
      keys.add(key);
      redraw();
    } else keys.delete(key);
  }
  const controls = new Set(["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"]);
  function keyDown(e: KeyboardEvent) {
    const k = e.key.toLowerCase();
    if (!e.ctrlKey && !e.metaKey && controls.has(k)) {
      e.preventDefault();
      setKey(k, true);
    }
  }
  function keyUp(e: KeyboardEvent) {
    setKey(e.key.toLowerCase(), false);
  }
  function wheel(e: WheelEvent) {
    if (paused || e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
    const mode = e.deltaMode;
    if (!e.deltaY || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    e.preventDefault();
    let pixels = e.deltaY;
    if (mode === WheelEvent.DOM_DELTA_LINE) pixels *= 16;
    if (mode === WheelEvent.DOM_DELTA_PAGE) pixels *= canvas.clientHeight;
    const distance = -pixels * 0.006;
    if (distance * scrollRemaining < 0) scrollRemaining = 0;
    scrollRemaining = T.MathUtils.clamp(scrollRemaining + distance, -1.2, 1.2);
    flight = null;
    events.hover("");
    if (!pointerStart) canvas.style.cursor = "grab";
    redraw();
  }
  function press(e: PointerEvent) {
    if (e.button !== 0 || paused) return;
    canvas.focus({ preventScroll: true });
    canvas.setPointerCapture(e.pointerId);
    pointerStart = { id: e.pointerId, x: e.clientX, y: e.clientY, yaw, pitch, drag: false };
  }
  function point(e: PointerEvent) {
    if (paused) return;
    if (!pointerStart) {
      const book = hit(e);
      events.hover(book?.design.title ?? "");
      canvas.style.cursor = book ? "pointer" : "grab";
      return;
    }
    if (e.pointerId !== pointerStart.id) return;
    const dx = e.clientX - pointerStart.x,
      dy = e.clientY - pointerStart.y;
    if (Math.hypot(dx, dy) > 4) pointerStart.drag = true;
    if (pointerStart.drag) {
      flight = null;
      yaw = pointerStart.yaw - dx * 0.004;
      pitch = T.MathUtils.clamp(pointerStart.pitch - dy * 0.003, -0.68, 0.62);
      events.hover("");
      canvas.style.cursor = "grabbing";
      redraw();
    }
  }
  function release(e: PointerEvent) {
    if (pointerStart?.id !== e.pointerId) return;
    const click = !pointerStart.drag;
    pointerStart = null;
    canvas.style.cursor = "grab";
    if (click && !paused) {
      const b = hit(e);
      if (b) events.open(b.id);
    }
  }
  function leave() {
    events.hover("");
  }
  function lost(e: Event) {
    e.preventDefault();
    stop();
    paused = true;
    events.lost();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  const eventsController = new AbortController();
  const opts = { signal: eventsController.signal };
  canvas.addEventListener("pointerdown", press, opts);
  canvas.addEventListener("pointermove", point, opts);
  canvas.addEventListener("pointerup", release, opts);
  canvas.addEventListener("pointercancel", stop, opts);
  canvas.addEventListener("pointerleave", leave, opts);
  canvas.addEventListener("keydown", keyDown, opts);
  canvas.addEventListener("wheel", wheel, { ...opts, passive: false });
  window.addEventListener("keyup", keyUp, opts);
  canvas.addEventListener("blur", stop, opts);
  window.addEventListener("blur", stop, opts);
  canvas.addEventListener("webglcontextlost", lost, opts);
  resize();
  return {
    visit,
    setKey,
    tap(key: string) {
      if (paused) return;
      keys.add(key);
      moveCamera(0.14);
      keys.delete(key);
      redraw();
    },
    pause(value: boolean) {
      paused = value;
      stop();
      if (!value) redraw();
    },
    dispose() {
      dead = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      eventsController.abort();
      stop();
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      renderer.dispose();
      // Strict Mode may immediately reuse a mounted canvas. Release detached devices only.
      queueMicrotask(() => {
        if (!canvas.isConnected) renderer.forceContextLoss();
      });
    },
  };
}
