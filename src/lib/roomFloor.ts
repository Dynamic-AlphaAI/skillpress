import { groundRows } from "./roomLadder.ts";

export const hallHalfWidth = 6.6;
export const doorHalfWidth = 1.45;
const wingHalfWidth = 4;
const baySpacing = 3.95;
const wingSpacing = 11.6;

type Rectangle = { minX: number; maxX: number; minZ: number; maxZ: number };
export type Position = { x: number; z: number; yaw: number };
export interface RoomFloor extends Rectangle {
  side: number;
  doorZ: number;
  entry: Position;
  bays: Position[];
}

export function wallPoint(bay: Position, along: number, depth: number) {
  const cos = Math.cos(bay.yaw), sin = Math.sin(bay.yaw);
  return { x: bay.x + along * cos + depth * sin, z: bay.z - along * sin + depth * cos };
}

export function ladderFootprint(bay: Position, slide: number, foot: number): Rectangle {
  const a = wallPoint(bay, slide - 0.53, 0.55), b = wallPoint(bay, slide + 0.53, foot + 0.28);
  return { minX: Math.min(a.x, b.x), maxX: Math.max(a.x, b.x), minZ: Math.min(a.z, b.z), maxZ: Math.max(a.z, b.z) };
}

/** Adjacent tall cases share a ladder. Short cases, doorways and corners break the rail. */
export function ladderRuns<T extends Position & { stack: readonly unknown[] }>(bays: T[]): T[][] {
  const along = (p: Position) => p.x * Math.cos(p.yaw) - p.z * Math.sin(p.yaw);
  const ordered = bays.filter(bay => bay.stack.length > groundRows)
    .sort((a, b) => a.yaw - b.yaw || along(a) - along(b));
  const runs: T[][] = [];
  for (const bay of ordered) {
    const run = runs.at(-1), previous = run?.at(-1);
    if (run && previous && previous.yaw === bay.yaw && Math.hypot(bay.x - previous.x, bay.z - previous.z) <= baySpacing + 0.02) {
      run.push(bay);
    } else runs.push([bay]);
  }
  return runs;
}

export function layOutFloor(caseCounts: number[]): RoomFloor[] {
  if (!caseCounts.length) return [];
  const hallCases = caseCounts[0];
  const pairs = Math.max(1, Math.ceil((caseCounts.length - 1) / 2), Math.ceil((hallCases - 2) / 4));
  const front = 7.2;
  const rear = -wingSpacing * (pairs - 1) - 8.8;
  const hall: RoomFloor = {
    minX: -hallHalfWidth, maxX: hallHalfWidth, minZ: rear, maxZ: front,
    side: 0, doorZ: 0, entry: { x: 0, z: front - 1.2, yaw: 0 },
    bays: Array.from({ length: hallCases }, (_, i) => {
      const side = i % 2 ? 1 : -1;
      if (i < 2) return { x: side * 3.7, z: rear + 0.18, yaw: 0 };
      const pair = Math.floor((i - 2) / 2);
      const z = pair === 0 ? wingSpacing / 3 : -Math.ceil(pair / 2) * wingSpacing + (pair % 2 ? 2 : 1) * wingSpacing / 3;
      return { x: side * (hallHalfWidth - 0.18), z, yaw: -side * Math.PI / 2 };
    }),
  };
  return [hall, ...caseCounts.slice(1).map((count, i) => {
    const side = i % 2 ? 1 : -1;
    const doorZ = -Math.floor(i / 2) * wingSpacing;
    const edge = side * hallHalfWidth;
    const end = edge + side * (Math.ceil(count / 2) + 1) * baySpacing;
    return {
      minX: Math.min(edge, end), maxX: Math.max(edge, end),
      minZ: doorZ - wingHalfWidth, maxZ: doorZ + wingHalfWidth, side, doorZ,
      entry: { x: edge + side * 1.35, z: doorZ, yaw: -side * Math.PI / 2 },
      bays: Array.from({ length: count }, (_, j) => ({
        x: edge + side * (Math.floor(j / 2) + 1) * baySpacing,
        z: doorZ + (j % 2 ? 1 : -1) * (wingHalfWidth - 0.18), yaw: j % 2 ? Math.PI : 0,
      })),
    };
  })];
}

export function roomAt(floors: RoomFloor[], x: number, z: number) {
  if (Math.abs(x) <= hallHalfWidth) return 0;
  return Math.max(0, floors.findIndex((r) => x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ));
}

/** A camera-radius inset keeps the reader clear of the walls, shelves and window table. */
export function canWalk(floors: RoomFloor[], x: number, z: number, obstacles: Rectangle[] = []) {
  const hall = floors[0];
  if (!hall) return false;
  if (obstacles.some(r => x > r.minX && x < r.maxX && z > r.minZ && z < r.maxZ)) return false;
  if (Math.abs(x) <= hallHalfWidth - 0.96 && z >= hall.minZ + 0.52 && z <= hall.maxZ - 0.52) {
    if (z < hall.minZ + 1.68 && Math.abs(x) < 1.55) return false;
    return !hall.bays.some((bay, i) => i < 2 && Math.abs(x - bay.x) < 2.18 && z > bay.z - 0.33 && z < bay.z + 0.88);
  }
  return floors.some((wing) => {
    if (!wing.side) return false;
    const along = x * wing.side - hallHalfWidth;
    const across = Math.abs(z - wing.doorZ);
    if (along >= -0.97 && along < 0.55) return across < doorHalfWidth - 0.3;
    return along >= 0.55 && along <= wing.maxX - wing.minX - 0.55 && across <= wingHalfWidth - 0.96;
  });
}

/** Small independent axis steps slide along walls and cannot jump across a door jamb. */
export function walk(floors: RoomFloor[], position: { x: number; z: number }, dx: number, dz: number, obstacles: Rectangle[] = []) {
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.14));
  for (let i = 0; i < steps; i++) {
    if (dx && canWalk(floors, position.x + dx / steps, position.z, obstacles)) position.x += dx / steps;
    if (dz && canWalk(floors, position.x, position.z + dz / steps, obstacles)) position.z += dz / steps;
  }
}
