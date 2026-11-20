import assert from "node:assert/strict";
import test from "node:test";
import { hallHeight, eyeHeight, groundRows, ladderFor, railLimit, rowAtRise, rowEyeHeight, stackShelves } from "../src/lib/roomLadder.ts";
import { canWalk, doorHalfWidth, hallCaseCount, ladderFootprint, ladderRuns, layOutFloor, walk, wallPoint } from "../src/lib/roomFloor.ts";

test("balanced cases keep each real shelf once and respect both ceiling heights", () => {
  for (let count = 0; count <= 260; count++) {
    const shelves = Array.from({ length: count }, (_, i) => i);
    const halls = [0, 1, 5, 10].map(wings => layOutFloor([hallCaseCount(count, wings), ...Array(wings).fill(1)])[0]);
    const wing = layOutFloor([1, Math.ceil(count / 4)])[1];
    for (const floor of [...halls, wing]) {
      const stacks = stackShelves(shelves, floor.bays);
      assert.deepEqual(stacks.flat(), shelves);
      for (const [i, stack] of stacks.entries()) {
        assert.ok(stack.length > 0 && stack.length <= (floor.side ? 4 : 7));
        if (floor.bays[i].low) assert.ok(stack.length <= groundRows);
        if (stack.length <= groundRows) continue;
        const ladder = ladderFor(stack.length);
        assert.ok(ladder.top < (floor.side ? 4.1 : hallHeight));
        assert.ok(ladder.maxRise > 0 && ladder.maxRise + eyeHeight < ladder.top);
        for (let row = groundRows; row < stack.length; row++) {
          const rise = rowEyeHeight(row, stack.length) - eyeHeight;
          assert.ok(rise <= ladder.maxRise);
          assert.equal(rowAtRise(rise, stack.length), row);
        }
      }
    }
  }
});

test("only cases with upper shelves carry a ladder, and a low case splits the rail", () => {
  const cases = [1, 2, 3, 4, 8, 3, 4].map((rows, i) => ({
    x: i * 3.95, z: 0, yaw: 0, stack: Array(rows).fill(null),
  }));
  assert.deepEqual(ladderRuns(cases.slice(0, 3)), []);
  assert.deepEqual(ladderRuns(cases), [[cases[3], cases[4]], [cases[6]]]);
});

test("rails run along outside walls and stop before doorways", () => {
  const floors = layOutFloor([16, 7, 6, 2, 3, 1]);
  const hall = floors[0];
  const rails = floor => ladderRuns(floor.bays.map(bay => ({ ...bay, stack: Array(floor.side ? 4 : 8).fill(null) })));
  const runs = rails(hall);
  assert.ok(runs.some(run => run.length > 1 && run[0].yaw > 0));
  assert.ok(runs.some(run => run.length > 1 && run[0].yaw < 0));
  assert.equal(runs.flat().length, hall.bays.length);
  for (const floor of floors) {
    for (const run of rails(floor)) {
      for (const bay of run) {
        const wallDistance = Math.min(bay.x-floor.minX,floor.maxX-bay.x,bay.z-floor.minZ,floor.maxZ-bay.z);
        assert.ok(Math.abs(wallDistance-0.18)<0.001);
      }
      const origin = run[0], last = run.at(-1), span = Math.hypot(last.x-origin.x, last.z-origin.z);
      const {foot} = ladderFor(floor.side ? 4 : 8);
      for (let slide = -railLimit; slide <= span + railLimit + 0.001; slide += 0.1) {
        const landing = wallPoint(origin, slide, foot + 0.65);
        const obstacles = [ladderFootprint(origin, slide, foot)];
        assert.ok(canWalk(floors, landing.x, landing.z, obstacles));
        if (!floor.side && Math.abs(origin.yaw) === Math.PI / 2) {
          for (const wing of floors.slice(1)) {
            if (wing.side === Math.sign(origin.x)) assert.ok(Math.abs(landing.z-wing.doorZ) > doorHalfWidth + 0.5);
          }
        }
        walk(floors, landing, -Math.sin(origin.yaw)*3, -Math.cos(origin.yaw)*3, obstacles);
        const parked = wallPoint(origin, slide, foot);
        assert.ok(Math.hypot(landing.x-parked.x,landing.z-parked.z) >= 0.28);
      }
    }
  }
});
