import assert from "node:assert/strict";
import test from "node:test";
import { hallHeight, eyeHeight, groundRows, ladderFor, railLimit, rowAtRise, rowEyeHeight, stackShelves } from "../src/lib/roomLadder.ts";
import { canWalk, layOutFloor, walk } from "../src/lib/roomFloor.ts";

test("every real shelf occurs once and only the main hall can have a tall case", () => {
  for (let count = 0; count <= 60; count++) {
    const shelves = Array.from({ length: count }, (_, i) => i);
    for (const hall of [true, false]) {
      const stacks = stackShelves(shelves, hall);
      assert.deepEqual(stacks.flat(), shelves);
      for (const [i, stack] of stacks.entries()) {
        assert.ok(stack.length > 0 && stack.length <= (hall && i === 0 ? 8 : hall ? groundRows : 4));
      }
      if (hall) assert.equal(Boolean(ladderFor(stacks[0]?.length ?? 0)), count >= 5);
    }
  }
});

test("the ladder reaches each upper row without reaching the ceiling", () => {
  for (let count = 5; count <= 8; count++) {
    const ladder = ladderFor(count);
    assert.ok(ladder.top < hallHeight && ladder.maxRise + eyeHeight < ladder.top);
    for (let row = groundRows; row < count; row++) {
      const rise = rowEyeHeight(row) - eyeHeight;
      assert.ok(rise > 0 && rise <= ladder.maxRise);
      assert.equal(rowAtRise(rise, count), row);
    }
  }
});

test("each end of the rail has a walkable landing and the parked ladder blocks floor travel", () => {
  for (const cases of [[1], [5, 4, 3]]) {
    const floors = layOutFloor(cases);
    const bay = floors[0].bays[0], { foot } = ladderFor(8);
    for (const slide of [-railLimit, railLimit]) {
      const pos = { x: bay.x + slide, z: bay.z + foot + 0.65 };
      assert.ok(canWalk(floors, pos.x, pos.z));
      const occupied = { minX: pos.x - 0.53, maxX: pos.x + 0.53, minZ: bay.z + 0.55, maxZ: bay.z + foot + 0.28 };
      walk(floors, pos, 0, -5, occupied);
      assert.ok(pos.z >= occupied.maxZ);
    }
  }
});
