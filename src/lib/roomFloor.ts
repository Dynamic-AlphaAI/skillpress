import { groundRows } from "./roomLadder.ts";

export const hallHalfWidth = 6.6;
export const doorHalfWidth = 1.45;
const wingHalfWidth = 4;
const baySpacing = 3.95;
const wingSpacing = 11.6;
const hallEndCases = 4;
const casesPerDoorPair = 4;
const tallRows = 7;
const averageHallRows = (groundRows + tallRows) / 2;

type Rectangle = { minX: number; maxX: number; minZ: number; maxZ: number };
export type Position = { x: number; z: number; yaw: number };
export interface RoomFloor extends Rectangle {
  side: number;
  doorZ: number;
  entry: Position;
  bays: (Position & { low?: boolean })[];
}

/** Reserve a mix of low and tall cases along the actual length of the hall. */
export function hallCaseCount(rows: number, wings: number) {
  const doorPairs = Math.max(1, Math.ceil(wings / 2), Math.ceil((rows / averageHallRows - hallEndCases) / casesPerDoorPair));
  return Math.min(hallEndCases + casesPerDoorPair * doorPairs, Math.ceil(rows / 2));
}

function hallBays(count: number, doorPairs: number, front: number, rear: number): RoomFloor["bays"] {
  // Centre the joinery in each wall span. The long spans fit two cases on a shared rail.
  const stations = [{ z: (front + doorHalfWidth) / 2, span: 0 }];
  for (let span = 1; span < doorPairs; span++) {
    const middle = -(span - 0.5) * wingSpacing;
    for (const offset of [baySpacing / 2, -baySpacing / 2]) stations.push({ z: middle + offset, span });
  }
  stations.push({ z: (rear - (doorPairs - 1) * wingSpacing - doorHalfWidth) / 2, span: doorPairs });

  const sideCount = Math.min(count, stations.length * 2);
  const bays: RoomFloor["bays"] = Array.from({ length: sideCount }, (_, i) => {
    const side = i % 2 ? 1 : -1;
    const onWall = side < 0 ? Math.ceil(sideCount / 2) : Math.floor(sideCount / 2);
    // Sparse filtered collections still reach both ends of each wall.
    const j = Math.round(Math.floor(i / 2) * (stations.length - 1) / Math.max(1, onWall - 1));
    const { z, span } = stations[j];
    return { x: side * (hallHalfWidth - 0.18), z, yaw: -side * Math.PI / 2, low: (span % 2 === 0) === (side > 0) };
  });
  const endBays = [
    { z: rear + 0.18, yaw: 0, low: false },
    { z: front - 0.18, yaw: Math.PI, low: true },
  ];
  for (const end of endBays) {
    for (const x of [-3.7, 3.7]) if (bays.length < count) bays.push({ x, ...end });
  }
  return bays;
}

export function wallPoint(bay: Position, along: number, depth: number) {
  const cos = Math.cos(bay.yaw), sin = Math.sin(bay.yaw);
  return { x: bay.x + along * cos + depth * sin, z: bay.z - along * sin + depth * cos };
}

export function wallRectangle(bay: Position, left: number, right: number, near: number, far: number): Rectangle {
  const a = wallPoint(bay, left, near), b = wallPoint(bay, right, far);
  return { minX: Math.min(a.x, b.x), maxX: Math.max(a.x, b.x), minZ: Math.min(a.z, b.z), maxZ: Math.max(a.z, b.z) };
}

export function ladderFootprint(bay: Position, slide: number, foot: number): Rectangle {
  return wallRectangle(bay, slide - 0.53, slide + 0.53, 0.55, foot + 0.28);
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
  const pairs = Math.max(1, Math.ceil((caseCounts.length - 1) / 2), Math.ceil((hallCases - hallEndCases) / casesPerDoorPair));
  const front = 7.2;
  const rear = -wingSpacing * (pairs - 1) - front;
  const hall: RoomFloor = {
    minX: -hallHalfWidth, maxX: hallHalfWidth, minZ: rear, maxZ: front,
    side: 0, doorZ: 0, entry: { x: 0, z: front - 1.2, yaw: 0 },
    bays: hallBays(hallCases, pairs, front, rear),
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
    if (z < hall.minZ + 1.1 || z > hall.maxZ - 1.1) {
      return !hall.bays.some(bay => (bay.yaw === 0 || bay.yaw === Math.PI) && Math.abs(x - bay.x) < 2.18 && Math.abs(z - bay.z) < 0.88);
    }
    return true;
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
