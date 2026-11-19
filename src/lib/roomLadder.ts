// Dimensions in metres, measured along and out from a bookcase wall.
export const hallHeight = 8.15;
export const eyeHeight = 1.63;
export const shelfSpacing = 0.76;
export const groundRows = 3;
export const railLimit = 1.34;
export const ladderSlope = 0.145;
export const shelfBase = (rows: number) => rows === 1 ? 1.55 : 0.61;
export const rowEyeHeight = (row: number, rows: number) => shelfBase(rows) + row * shelfSpacing + 0.35;

/** Balance rows across wall cases while keeping the catalogue order. */
export function stackShelves<T>(shelves: T[], hall: boolean): T[][] {
  const count = Math.ceil(shelves.length / (hall ? 8 : 4));
  return Array.from({ length: count }, (_, i) => shelves.slice(
    Math.floor(i * shelves.length / count), Math.floor((i + 1) * shelves.length / count),
  ));
}

export function ladderFor(rows: number) {
  const top = shelfBase(rows) + shelfSpacing * rows - 0.13;
  return { top, foot: 0.76 + top * ladderSlope, maxRise: rowEyeHeight(rows - 1, rows) - eyeHeight };
}

export function rowAtRise(rise: number, rows: number) {
  return Math.max(0, Math.min(rows - 1, Math.round((eyeHeight + rise - rowEyeHeight(0, rows)) / shelfSpacing)));
}
