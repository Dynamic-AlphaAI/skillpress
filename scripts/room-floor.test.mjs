import assert from "node:assert/strict";
import test from "node:test";
import { canWalk, doorHalfWidth, hallHalfWidth, layOutFloor, roomAt, walk } from "../src/lib/roomFloor.ts";

test("each subject room opens directly onto the hall and can be left by the same door", () => {
  const floors = layOutFloor([5, 4, 7, 6, 2, 3]);
  assert.equal(floors.length, 6);
  for (const [i, wing] of floors.entries()) {
    if (!i) continue;
    const visitor = { x: 0, z: wing.doorZ };
    const distance = wing.side * (hallHalfWidth + 2);
    walk(floors, visitor, distance, 0);
    assert.equal(roomAt(floors, visitor.x, visitor.z), i);
    walk(floors, visitor, -distance, 0);
    assert.ok(Math.abs(visitor.x) < 0.01);
    assert.equal(roomAt(floors, visitor.x, visitor.z), 0);
    visitor.z = wing.doorZ - doorHalfWidth - 1;
    walk(floors, visitor, distance * 3, 0);
    assert.ok(Math.abs(visitor.x) < hallHalfWidth);
  }
});

test("the entrance and every shelf viewing position are accessible across different collection sizes", () => {
  for (const counts of [[1], [3, 2], [5, 8, 2, 5, 6, 1]]) {
    const floors = layOutFloor(counts);
    for (const [i, room] of floors.entries()) {
      assert.ok(canWalk(floors, room.entry.x, room.entry.z));
      assert.equal(roomAt(floors, room.entry.x, room.entry.z), i);
      for (const bay of room.bays) {
        const x = bay.x + Math.sin(bay.yaw) * 2.75;
        const z = bay.z + Math.cos(bay.yaw) * 2.75;
        assert.ok(canWalk(floors, x, z));
        assert.equal(roomAt(floors, x, z), i);
      }
    }
  }
});

test("a large wheel step stops in front of both end walls' bookcases and the window table", () => {
  const floors = layOutFloor([8, 2, 2]);
  const endCases = floors[0].bays.filter(bay => bay.yaw === 0 || bay.yaw === Math.PI);
  assert.equal(endCases.length, 4);
  for (const bay of endCases) {
    const visitor = { x: bay.x, z: 0 };
    walk(floors, visitor, 0, Math.sign(bay.z) * 80);
    assert.ok(Math.abs(visitor.z - bay.z) >= 0.88);
  }
  const visitor = { ...floors[0].entry };
  walk(floors, visitor, 0, -80);
  assert.ok(visitor.z > floors[0].minZ + 1.6);
});
