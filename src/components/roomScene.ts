import * as T from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { LibraryRoom } from "@/lib/roomShelves";
import { canWalk, doorHalfWidth, hallHalfWidth, ladderFootprint, layOutFloor, roomAt, walk, wallPoint, wallRuns, type Position } from "@/lib/roomFloor";
import { bindingBands } from "@/lib/jacketDesign";
import type { Book } from "@/lib/types";
import { playSound } from "./sound";
import { eyeHeight, hallHeight, ladderFor, ladderSlope, railLimit, rowAtRise, shelfBase, shelfSpacing } from "@/lib/roomLadder";
import { buildLadder } from "./libraryLadder";

type SceneEvents = {
  ladder: (shelf: number | null) => void;
  enterRoom: (index: number) => void;
  open: (id: string) => void;
  hover: (title: string) => void;
  lost: () => void;
};
type Flight = { from: T.Vector3; to: T.Vector3; yaw: number; turn: number; pitch: number; targetPitch: number; elapsed: number };

const walkSpeedMultiplier = 1.15;
const lookSensitivity = 0.85;

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
    if (d.jacket) {
      for (const [top, height] of bindingBands(d.jacket.layout)) ctx.fillRect(0, top * 512, 128, height * 512);
    } else {
      for (const y of [38, 43, 467, 471]) ctx.fillRect(7, y, 114, 2);
    }
    ctx.fillStyle = d.ink;
    ctx.textAlign = "center";
    ctx.font = "22px Georgia";
    ctx.fillText(String(book.rank).padStart(2, "0"), 64, 30);
    ctx.save();
    ctx.translate(64, 254);
    ctx.rotate(Math.PI / 2);
    ctx.font = d.jacket?.layout === "poster" || d.jacket?.layout === "banner" ? "bold 33px Arial" : "bold 34px Georgia";
    ctx.textBaseline = "middle";
    ctx.fillText(d.title, 0, 0, 390);
    ctx.restore();
    ctx.font = "25px Georgia";
    ctx.fillText("§", 64, 501);
  });
}

// Browsers disallow external subresources when an SVG is rasterized as an image.
// Embed just the local illustration used by this face before sending it to WebGL.
async function jacketImageUrl(svg: SVGElement, plate?: string) {
  const image = svg.querySelector("image");
  if (image && plate) {
    try {
      const response = await fetch(plate);
      if (!response.ok) throw new Error("Illustration unavailable");
      const blob = await response.blob();
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
      image.setAttribute("href", data);
    } catch {
      image.remove(); // The printed vector artwork underneath still fills the panel.
    }
  }
  return URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" }));
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
  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, 0, 0, 384, 576);
    URL.revokeObjectURL(img.src);
    if (!d.jacket) {
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
    }
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
  img.onerror = () => URL.revokeObjectURL(img.src);
  void jacketImageUrl(copy, d.jacket?.plate).then((url) => { img.src = url; });
  return texture;
}

/** Local-space bookcases face the centre aisle. Camera coordinates are in metres. */
export function createRoom(
  canvas: HTMLCanvasElement,
  rooms: LibraryRoom[],
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
  const floors = layOutFloor(rooms.map((room) => room.stacks.length));
  const hall = floors[0];
  const front = hall.maxZ;
  const rear = hall.minZ;
  let currentRoom = 0;
  const bays = rooms.flatMap((room, roomIndex) => floors[roomIndex].bays.map((position, i) => ({
    ...position, roomIndex,
    stack: room.stacks[i],
  })));
  const entry = new T.Vector3(hall.entry.x, 1.63, hall.entry.z);
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
    pitch: 0.08,
    targetPitch: 0.08,
    elapsed: 0,
  };
  let yaw = 0;
  let pitch = 0.08;
  const keys = new Set<string>();
  let stickTurn = 0;
  let stickForward = 0;
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
  textures.add(floorTex);
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
  textures.add(rugTexture);
  function sign(title: string, lines: string[], x: number, y: number, z: number, angle: number, width: number, height: number) {
    const h = lines.length ? 384 : 112;
    const texture = paintTexture(768, h, (ctx) => {
      ctx.fillStyle = "#29352f";
      ctx.fillRect(0, 0, 768, h);
      ctx.strokeStyle = "#bfa371";
      ctx.lineWidth = 4;
      ctx.strokeRect(7, 7, 754, h - 14);
      ctx.textAlign = "center";
      ctx.fillStyle = "#f8eaca";
      ctx.font = "54px Georgia";
      ctx.fillText(title, 384, lines.length ? 85 : 73, 714);
      ctx.font = "33px Georgia";
      lines.forEach((line, i) => ctx.fillText(line, 384, 147 + i * 44, 714));
    });
    textures.add(texture);
    const geometry = new T.PlaneGeometry(width, height);
    geometries.add(geometry);
    const plaque = new T.Mesh(geometry, register(new T.MeshBasicMaterial({ map: texture })));
    plaque.position.set(x, y, z);
    plaque.rotation.y = angle;
    scene.add(plaque);
  }
  // Draw the hall perimeter in segments so every opening leads onto the floor of its wing.
  const hallPaint = surface(rooms[0].paint);
  function hallWall(side: number, start: number, end: number) {
    const length = end - start;
    const z = (start + end) / 2;
    const x = side * hallHalfWidth;
    block(x, 2.05, z, 0.18, 4.1, length, hallPaint);
    block(x, 0.48, z, 0.24, 0.96, length, walnut);
    block(x, 0.98, z, 0.31, 0.07, length, panel);
    block(x, 3.82, z, 0.26, 0.07, length, brass);
  }
  for (const side of [-1, 1]) {
    let cursor = rear;
    for (const wing of floors.filter((r) => r.side === side).sort((a, b) => a.doorZ - b.doorZ)) {
      hallWall(side, cursor, wing.doorZ - doorHalfWidth);
      cursor = wing.doorZ + doorHalfWidth;
    }
    hallWall(side, cursor, front);
  }
  for (const z of [rear, front]) block(0, 2.05, z, hallHalfWidth * 2, 4.1, 0.2, hallPaint);
  const clerestory = register(new T.MeshBasicMaterial({ color: "#ead6ac" }));
  const upperWall = hallHeight - 4.1;
  const lamps: { x: number; z: number; drop: number }[] = [];
  rooms.forEach((room, i) => {
    const r = floors[i];
    const width = r.maxX - r.minX, depth = r.maxZ - r.minZ;
    const x = (r.minX + r.maxX) / 2, z = (r.minZ + r.maxZ) / 2;
    const floor = floorTex.clone();
    floor.repeat.set(width / 3, depth / 3);
    textures.add(floor);
    block(x, -0.09, z, width, 0.16, depth, surface("#ecd0a6", floor));
    block(x, r.side ? 4.15 : hallHeight + 0.05, z, width, 0.15, depth, plaster);
    const rug = rugTexture.clone();
    rug.repeat.y = (r.side ? width + hallHalfWidth : depth) / 1.83;
    textures.add(rug);
    const runner = surface(room.runner, rug);
    if (!r.side) {
      block(x, 0.009, z, 2.45, 0.018, depth - 0.32, runner);
      for (const side of [-1, 1]) {
        const sideX = side * hallHalfWidth;
        block(sideX, 4.1 + upperWall / 2, z, 0.18, upperWall, depth, hallPaint);
        block(sideX, 4.1, z, 0.42, 0.15, depth, walnut);
        for (let panelZ = front - 1.05; panelZ > rear + 0.88; panelZ -= 2.15) {
          block(sideX, 5.0, panelZ, 0.24, 1.45, 1.82, walnut);
          block(sideX, 5.0, panelZ, 0.27, 1.29, 1.64, panel);
          block(sideX, 6.94, panelZ, 0.25, 1.83, 1.78, dark);
          block(sideX, 6.94, panelZ, 0.28, 1.66, 1.61, clerestory);
          block(sideX, 6.94, panelZ, 0.30, 1.66, 0.045, walnut);
          block(sideX, 7.31, panelZ, 0.30, 0.047, 1.61, walnut);
        }
      }
      for (const wallZ of [rear, front]) {
        block(0, 4.1 + upperWall / 2, wallZ, width, upperWall, 0.2, hallPaint);
        for (const offset of [-4.5, -2.25, 0, 2.25, 4.5]) {
          block(offset, 6.8, wallZ, 1.89, 2.06, 0.24, walnut);
          block(offset, 6.8, wallZ, 1.7, 1.87, 0.28, clerestory);
          block(offset, 6.8, wallZ, 0.05, 1.87, 0.30, walnut);
          block(offset, 7.12, wallZ, 1.7, 0.05, 0.30, walnut);
        }
        block(0, 4.1, wallZ, width, 0.15, 0.42, walnut);
      }
      sign(room.label, [], 0, 4.57, rear + 0.13, 0, 3.55, 0.52);
      for (let beamZ = front - 1.45; beamZ > rear; beamZ -= 4.3) {
        block(0, hallHeight - 0.18, beamZ, width, 0.21, 0.19, dark);
        lamps.push({ x: 0, z: beamZ, drop: hallHeight - 4.15 });
      }
      for (const beamX of [-4.7, -2.2, 2.2, 4.7]) block(beamX, hallHeight - 0.12, z, 0.12, 0.12, depth, panel);
      return;
    }
    const edge = r.side * hallHalfWidth;
    const outer = r.side < 0 ? r.minX : r.maxX;
    const faceHall = -r.side * Math.PI / 2;
    const wallPaint = surface(room.paint);
    for (const wallZ of [r.minZ, r.maxZ]) {
      block(x, 2.05, wallZ, width, 4.1, 0.18, wallPaint);
      block(x, 0.44, wallZ, width, 0.88, 0.25, walnut);
      block(x, 0.91, wallZ, width, 0.06, 0.32, panel);
      block(x, 3.83, wallZ, width, 0.06, 0.27, brass);
    }
    block(outer, 2.05, z, 0.2, 4.1, depth, wallPaint);
    // A runner turns off the central carpet and continues through the open doorway.
    const length = Math.abs(outer) - 1.24 - 0.32;
    const rugBase = new T.Matrix4().makeRotationY(Math.PI / 2).setPosition(r.side * (1.24 + length / 2), 0, z);
    block(0, 0.009, 0, 1.83, 0.018, length, runner, rugBase);
    for (const offset of [-doorHalfWidth, doorHalfWidth]) {
      block(edge, 1.45, z + offset, 0.38, 2.9, 0.17, walnut);
      block(edge, 1.45, z + offset, 0.4, 2.9, 0.045, brass);
    }
    block(edge, 3.48, z, 0.18, 1.24, doorHalfWidth * 2, hallPaint);
    block(edge, 2.88, z, 0.42, 0.18, doorHalfWidth * 2 + 0.38, walnut);
    block(edge, 0.021, z, 0.19, 0.025, doorHalfWidth * 2, brass);
    sign(room.label, [], edge - r.side * 0.13, 3.21, z, faceHall, 2.83, 0.41);
    sign(rooms[0].label, [], edge + r.side * 0.13, 3.21, z, -faceHall, 2.83, 0.41);
    sign(room.label, room.topics, edge + r.side * 1.1, 1.88, r.minZ + 0.14, 0, 1.66, 0.84);
    // Suspended aisle signs can be read face-on while approaching from the entrance.
    const signX = r.side * 2.06;
    const title = r.side < 0 ? "←  " + room.label : room.label + "  →";
    block(signX, 3.49, z, 2.76, 0.43, 0.07, dark);
    for (const offset of [-1.02, 1.02]) block(signX + offset, (3.7 + hallHeight) / 2, z, 0.02, hallHeight - 3.7, 0.02, brass);
    sign(title, [], signX, 3.49, z + 0.044, 0, 2.71, 0.39);
    sign(r.side < 0 ? room.label + "  →" : "←  " + room.label, [], signX, 3.49, z - 0.044, Math.PI, 2.71, 0.39);
    for (let distance = 2.2; distance < width; distance += 3.95) {
      const beamX = edge + r.side * distance;
      block(beamX, 3.97, z, 0.2, 0.21, depth, dark);
      lamps.push({ x: beamX, z, drop: 0 });
    }
  });
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
  for (const wing of floors.slice(1)) {
    const wall = new T.Mesh(endGeometry, endMaterial);
    wall.rotation.y = -wing.side * Math.PI / 2;
    wall.position.set((wing.side < 0 ? wing.minX : wing.maxX) - wing.side * 0.12, 2.03, wing.doorZ);
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
  for (const { x, z, drop } of lamps) {
    block(x, 3.78 + drop, z, 0.022, 0.49, 0.022, brass);
    const bulb = new T.Mesh(lampGlobe, lightGlass);
    bulb.position.set(x, 3.43 + drop, z);
    scene.add(bulb);
    const shade = new T.Mesh(lampShade, shadeMaterial);
    shade.position.set(x, 3.52 + drop, z);
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
  const rails = rooms.flatMap((room, roomIndex) => wallRuns(bays.filter(bay => bay.roomIndex === roomIndex)).map(run => {
    const origin = run[0];
    const cases = run.map(bay => ({
      bay, offset: Math.hypot(bay.x - origin.x, bay.z - origin.z), firstShelf: room.shelves.indexOf(bay.stack[0]),
    }));
    const span = cases[cases.length - 1].offset;
    const size = ladderFor(Math.max(...run.map(bay => bay.stack.length)));
    const rig = buildLadder(size.top, size.foot, walnut, brass, unit, geometries);
    const slide = span / 2 + railLimit * 0.6;
    const parked = wallPoint(origin, slide, 0);
    rig.carriage.rotation.y = origin.yaw;
    rig.carriage.position.set(parked.x, 0, parked.z);
    scene.add(rig.carriage);
    const base = new T.Matrix4().makeRotationY(origin.yaw).setPosition(origin.x, 0, origin.z);
    block(span / 2, size.top - 0.16, 0.68, span + 3.66, 0.065, 0.065, brass, base);
    for (const { offset } of cases) {
      for (const x of [-1.65, 1.65]) block(offset + x, size.top - 0.16, 0.39, 0.08, 0.10, 0.6, walnut, base);
    }
    return { roomIndex, origin, cases, span, size, rig, slide, obstacle: ladderFootprint(origin, slide, size.foot) };
  }));
  type Rail = typeof rails[number];
  const railByBay = new Map(rails.flatMap(rail => rail.cases.map(c => [c.bay, { rail, offset: c.offset }] as const)));
  const obstacles = rails.map(rail => rail.obstacle);
  let mounted: Rail | null = null;
  let rise = 0;
  let descending = false;
  let lastRow = -1;
  const pickable: T.Mesh[] = [];
  const shelfPositions: (Position & { height: number; rail: Rail; offset: number })[][] = rooms.map(() => []);
  const paper = surface("#e4d6b8");
  const boards = new Map<string, T.Material>();
  const hitMaterial = register(new T.MeshBasicMaterial());
  for (const bay of bays) {
    const { roomIndex, stack, x, z, yaw: angle } = bay;
    const position = railByBay.get(bay)!;
    const base = new T.Matrix4().makeRotationY(angle).setPosition(x, 0, z);
    const timber = (x: number, y: number, distance: number, w: number, h: number, d: number, m: T.Material) =>
      block(x, y, distance, w, h, d, m, base);
    const bottom = shelfBase(stack.length);
    const step = shelfSpacing;
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
      const shelfIndex = shelfPositions[roomIndex].length;
      shelfPositions[roomIndex].push({ x, z, yaw: angle, height: deck + 0.35, ...position });
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
        hitBox.userData.room = roomIndex;
        if (shelf.upper) hitBox.userData.upper = shelfIndex;
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
  function placeClimber() {
    if (!mounted) return;
    const { origin, rig, size, slide, cases } = mounted;
    const parked = wallPoint(origin, slide, 0);
    rig.carriage.position.set(parked.x, 0, parked.z);
    Object.assign(mounted.obstacle, ladderFootprint(origin, slide, size.foot));
    const nearest = cases.reduce((a, b) => Math.abs(slide - a.offset) < Math.abs(slide - b.offset) ? a : b);
    const rows = nearest.bay.stack.length;
    // Lean beside the stile to keep its rungs and the book titles in view.
    const eye = wallPoint(origin, slide - 0.45, size.foot + 0.62 - rise * ladderSlope);
    camera.position.set(eye.x, eyeHeight + rise, eye.z);
    const row = nearest.firstShelf + rowAtRise(rise, rows);
    if (row !== lastRow) {
      lastRow = row;
      events.ladder(row);
    }
  }
  function mountLadder(rail: Rail, height = 0, along = rail.slide) {
    if (paused || rail.roomIndex !== currentRoom) return;
    stop();
    flight = null;
    mounted = rail;
    descending = false;
    lastRow = -1;
    rise = T.MathUtils.clamp(height, 0, rail.size.maxRise);
    rail.slide = T.MathUtils.clamp(along, -railLimit, rail.span + railLimit);
    yaw = rail.origin.yaw + (height ? 0 : 0.18);
    pitch = height ? 0 : 0.19;
    placeClimber();
    events.hover("");
    playSound("step");
    redraw();
  }
  function stepOff() {
    if (!mounted) return;
    const landing = wallPoint(mounted.origin, mounted.slide, mounted.size.foot + 0.65);
    camera.position.set(landing.x, eyeHeight, landing.z);
    mounted = null;
    descending = false;
    rise = 0;
    lastRow = -1;
    pitch = 0;
    stop();
    events.hover("");
    events.ladder(null);
  }
  function toggleLadder() {
    if (paused) return;
    if (!mounted) {
      const inRoom = rails.filter(rail => rail.roomIndex === currentRoom);
      const distance = (rail: Rail) => {
        const foot = wallPoint(rail.origin, rail.slide, rail.size.foot);
        return Math.hypot(camera.position.x - foot.x, camera.position.z - foot.z);
      };
      if (inRoom.length) mountLadder(inRoom.reduce((a, b) => distance(a) <= distance(b) ? a : b));
      return;
    }
    stop();
    if (reduce.matches || rise === 0) stepOff();
    else descending = true;
    redraw();
  }
  function hit(e: PointerEvent) {
    const r = canvas.getBoundingClientRect();
    pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, (-(e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(pointer, camera);
    const book = ray.intersectObjects(pickable, false).find(({ object }) => object.userData.room === currentRoom);
    if (!mounted) {
      const inRoom = rails.filter(rail => rail.roomIndex === currentRoom);
      const rung = ray.intersectObjects(inRoom.map(rail => rail.rig.hit), false)[0];
      if (rung && (!book || rung.distance < book.distance)) {
        const target = inRoom.find(rail => rail.rig.hit === rung.object)!;
        return { label: "Use ladder", activate: () => mountLadder(target) };
      }
    }
    if (!book) return;
    const volume = book.object.userData.book as Book;
    const upper = book.object.userData.upper as number | undefined;
    const target = upper === undefined ? undefined : shelfPositions[currentRoom][upper];
    if (target && (mounted !== target.rail || Math.abs(target.height - camera.position.y) > 1)) {
      return { label: `Climb to ${volume.design.title}`, activate: () => mountLadder(target.rail, target.height - eyeHeight, target.offset + 0.45) };
    }
    return { label: `${volume.design.title} · ${volume.source.author} · Open book`, activate: () => events.open(volume.id) };
  }
  function redraw() {
    if (!frame && !dead && !paused) {
      last = performance.now();
      frame = requestAnimationFrame(render);
    }
  }
  function moveCamera(dt: number, forwardSpeed: number, strafe: number, turn: number, scrollStep = 0) {
    yaw -= turn * dt * 1.6 * lookSensitivity;
    if (mounted) {
      const previousRise = rise;
      rise = T.MathUtils.clamp(rise + forwardSpeed * dt * 1.65 + scrollStep, 0, mounted.size.maxRise);
      mounted.slide = T.MathUtils.clamp(mounted.slide + strafe * dt * 2.2, -railLimit, mounted.span + railLimit);
      placeClimber();
      if (Math.floor(previousRise / 0.31) !== Math.floor(rise / 0.31)) playSound("step");
      return;
    }
    forward.set(-Math.sin(yaw), 0, -Math.cos(yaw));
    right.set(Math.cos(yaw), 0, -Math.sin(yaw));
    move
      .copy(forward)
      .multiplyScalar(forwardSpeed)
      .addScaledVector(right, strafe)
      .clampLength(0, 1)
      .multiplyScalar(dt * 2.8)
      .addScaledVector(forward, scrollStep)
      .multiplyScalar(walkSpeedMultiplier);
    const prevX = camera.position.x,
      prevZ = camera.position.z;
    walk(floors, camera.position, move.x, move.z, obstacles);
    const nextRoom = roomAt(floors, camera.position.x, camera.position.z);
    if (nextRoom !== currentRoom) {
      currentRoom = nextRoom;
      events.hover("");
      events.enterRoom(currentRoom);
    }
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
    if (descending) {
      rise = Math.max(0, rise - dt * 3.3);
      if (rise === 0) stepOff();
      else placeClimber();
    } else if (flight) {
      flight.elapsed += dt;
      const t = reduce.matches ? 1 : Math.min(flight.elapsed / 1.05, 1);
      const ease = t * t * (3 - 2 * t);
      camera.position.lerpVectors(flight.from, flight.to, ease);
      yaw = flight.yaw + flight.turn * ease;
      pitch = flight.pitch * (1 - ease) + flight.targetPitch * ease;
      if (t === 1) flight = null;
    } else if (keys.size || scrollRemaining || stickTurn || stickForward) {
      const scrollStep = reduce.matches ? scrollRemaining : T.MathUtils.clamp(scrollRemaining, -4 * dt, 4 * dt);
      scrollRemaining -= scrollStep;
      const f = Number(keys.has("w") || keys.has("arrowup")) - Number(keys.has("s") || keys.has("arrowdown"));
      const strafe = Number(keys.has("d") || keys.has("step-right")) - Number(keys.has("a") || keys.has("step-left"));
      const turn = Number(keys.has("arrowright")) - Number(keys.has("arrowleft"));
      moveCamera(dt, T.MathUtils.clamp(f + stickForward, -1, 1), strafe, T.MathUtils.clamp(turn + stickTurn, -1, 1), scrollStep);
    }
    camera.rotation.set(pitch, yaw, 0, "YXZ");
    renderer.render(scene, camera);
    if (flight || descending || keys.size || scrollRemaining || stickTurn || stickForward) frame = requestAnimationFrame(render);
  }
  function stop() {
    keys.clear();
    stickTurn = stickForward = 0;
    scrollRemaining = 0;
    pointerStart = null;
  }
  function visitRoom(index: number) {
    if (paused || !rooms[index]) return;
    stop();
    flight = null;
    stepOff();
    currentRoom = index;
    const entrance = floors[index].entry;
    camera.position.set(entrance.x, 1.63, entrance.z);
    yaw = entrance.yaw;
    pitch = index === 0 ? 0.08 : -0.03;
    events.enterRoom(index);
    redraw();
  }
  function visit(index: number) {
    if (paused) return;
    const bay = shelfPositions[currentRoom][index];
    if (bay && rooms[currentRoom].shelves[index].upper) {
      mountLadder(bay.rail, bay.height - eyeHeight, bay.offset + 0.45);
      return;
    }
    stepOff();
    const entrance = floors[currentRoom].entry;
    const to = bay
      ? new T.Vector3(bay.x + Math.sin(bay.yaw) * 2.75, 1.64, bay.z + Math.cos(bay.yaw) * 2.75)
      : new T.Vector3(entrance.x, 1.63, entrance.z);
    const targetYaw = bay?.yaw ?? entrance.yaw;
    // Cut directly to the shelf when a camera glide would pass through furniture.
    const steps = Math.ceil(camera.position.distanceTo(to) / 0.14);
    for (let i = 1; i <= steps; i++) {
      const x = T.MathUtils.lerp(camera.position.x, to.x, i / steps);
      const z = T.MathUtils.lerp(camera.position.z, to.z, i / steps);
      if (!canWalk(floors, x, z, obstacles)) {
        camera.position.copy(to);
        yaw = targetYaw;
        break;
      }
    }
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
    if (k === "e" && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      if (!e.repeat) toggleLadder();
      return;
    }
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
      const target = hit(e);
      events.hover(target?.label ?? "");
      canvas.style.cursor = target ? "pointer" : "grab";
      return;
    }
    if (e.pointerId !== pointerStart.id) return;
    const dx = e.clientX - pointerStart.x,
      dy = e.clientY - pointerStart.y;
    if (Math.hypot(dx, dy) > 4) pointerStart.drag = true;
    if (pointerStart.drag) {
      flight = null;
      yaw = pointerStart.yaw - dx * 0.004 * lookSensitivity;
      pitch = T.MathUtils.clamp(pointerStart.pitch - dy * 0.003 * lookSensitivity, -0.68, 0.62);
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
    if (click && !paused && !descending) hit(e)?.activate();
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
    visitRoom,
    toggleLadder,
    setKey,
    setStick(turn: number, f: number) {
      if (paused || descending) return;
      stickTurn = turn;
      stickForward = f;
      if (turn || f) {
        flight = null;
        redraw();
      }
    },
    stepSide(side: "left" | "right") {
      if (paused || descending) return;
      flight = null;
      moveCamera(0.14, 0, side === "left" ? -1 : 1, 0);
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
