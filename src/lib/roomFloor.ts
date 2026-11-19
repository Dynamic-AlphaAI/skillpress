export const hallHalfWidth = 6.6;
export const doorHalfWidth = 1.45;
const wingHalfWidth = 4;
const baySpacing = 3.95;
const wingSpacing = 8.6;

type Rectangle = { minX: number; maxX: number; minZ: number; maxZ: number };
export type Position = { x: number; z: number; yaw: number };
export interface RoomFloor extends Rectangle {
  side: number;
  doorZ: number;
  entry: Position;
  bays: Position[];
}

export function layOutFloor(caseCounts: number[]): RoomFloor[] {
  if (!caseCounts.length) return [];
  const hallCases = caseCounts[0];
  const pairs = Math.max(1, Math.ceil((caseCounts.length - 1) / 2), Math.ceil((hallCases - 2) / 2));
  const front = 7.2;
  const rear = -wingSpacing * (pairs - 1) - 6.6;
  const hall: RoomFloor = {
    minX: -hallHalfWidth, maxX: hallHalfWidth, minZ: rear, maxZ: front,
    side: 0, doorZ: 0, entry: { x: 0, z: front - 1.2, yaw: 0 },
    bays: Array.from({ length: hallCases }, (_, i) => {
      const side = i % 2 ? 1 : -1;
      if (i < 2) return { x: caseCounts.length === 1 && hallCases === 1 ? 0 : side * 4.05, z: -2.65, yaw: 0 };
      return { x: side * (hallHalfWidth - 0.18), z: -wingSpacing * (Math.floor((i - 2) / 2) + 0.5), yaw: -side * Math.PI / 2 };
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
export function canWalk(floors: RoomFloor[], x: number, z: number) {
  const hall = floors[0];
  if (!hall) return false;
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
export function walk(floors: RoomFloor[], position: { x: number; z: number }, dx: number, dz: number) {
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.14));
  for (let i = 0; i < steps; i++) {
    if (dx && canWalk(floors, position.x + dx / steps, position.z)) position.x += dx / steps;
    if (dz && canWalk(floors, position.x, position.z + dz / steps)) position.z += dz / steps;
  }
}
