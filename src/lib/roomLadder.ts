// Dimensions in metres, in the front-facing bookcase's local coordinates.
export const hallHeight = 8.15;
export const eyeHeight = 1.63;
export const shelfSpacing = 0.76;
export const groundRows = 3;
export const railLimit = 1.34;
export const ladderSlope = 0.145;
export const rowEyeHeight = (row: number) => 0.61 + row * shelfSpacing + 0.35;

/** Keep each real shelf in catalogue order. Small collections fit on the floor. */
export function stackShelves<T>(shelves: T[], hall: boolean): T[][] {
  const towerRows = hall && shelves.length >= 5 ? Math.min(8, shelves.length) : 0;
  const stacks = towerRows ? [shelves.slice(0, towerRows)] : [];
  const remaining = shelves.length - towerRows;
  const cases = Math.ceil(remaining / (hall ? groundRows : 4));
  for (let i = 0; i < cases; i++) {
    stacks.push(shelves.slice(towerRows + Math.floor(i * remaining / cases),
      towerRows + Math.floor((i + 1) * remaining / cases)));
  }
  return stacks;
}

export function ladderFor(rows: number) {
  if (rows <= groundRows) return null;
  const top = 0.61 + shelfSpacing * rows - 0.13;
  return { top, foot: 0.76 + top * ladderSlope, maxRise: rowEyeHeight(rows - 1) - eyeHeight };
}

export function rowAtRise(rise: number, rows: number) {
  return Math.max(0, Math.min(rows - 1, Math.round((eyeHeight + rise - rowEyeHeight(0)) / shelfSpacing)));
}
