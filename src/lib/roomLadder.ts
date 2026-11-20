// Dimensions in metres, measured along and out from a bookcase wall.
export const hallHeight = 8.15;
export const eyeHeight = 1.63;
export const shelfSpacing = 0.76;
export const groundRows = 3;
export const railLimit = 1.34;
export const ladderSlope = 0.145;
export const shelfBase = (rows: number) => rows === 1 ? 1.55 : 0.61;
export const rowEyeHeight = (row: number, rows: number) => shelfBase(rows) + row * shelfSpacing + 0.35;

/** Fill every case from the floor first, then add upper rows only to the tall cases. */
export function stackShelves<T>(shelves: T[], cases: readonly { low?: boolean }[]): T[][] {
  const lower = Math.min(shelves.length, cases.length * groundRows);
  const upper = shelves.length - lower;
  const tallCount = cases.filter(bay => !bay.low).length;
  const share = (rows: number, count: number, i: number) => Math.floor(rows / count) + Number(i < rows % count);
  let cursor = 0, tallIndex = 0;
  return cases.map((bay, i) => {
    const start = cursor;
    cursor += share(lower, cases.length, i);
    if (!bay.low) cursor += share(upper, tallCount, tallIndex++);
    return shelves.slice(start, cursor);
  });
}

export function ladderFor(rows: number) {
  const top = shelfBase(rows) + shelfSpacing * rows - 0.13;
  return { top, foot: 0.76 + top * ladderSlope, maxRise: rowEyeHeight(rows - 1, rows) - eyeHeight };
}

export function rowAtRise(rise: number, rows: number) {
  return Math.max(0, Math.min(rows - 1, Math.round((eyeHeight + rise - rowEyeHeight(0, rows)) / shelfSpacing)));
}
