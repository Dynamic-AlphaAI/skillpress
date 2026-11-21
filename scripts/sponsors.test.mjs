import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { planSponsorSpots, sponsorWebsite } from "../src/lib/sponsors.ts";
import { layOutFloor } from "../src/lib/roomFloor.ts";
import { hallHeight, shelfBase, shelfSpacing } from "../src/lib/roomLadder.ts";

test("the same house placements and three ceiling signs exist throughout differently sized halls", () => {
  for (const counts of [[1], [8, 2], [24, ...Array(10).fill(1)], [40, ...Array(10).fill(2)]]) {
    const [floor] = layOutFloor(counts);
    const stacks = floor.bays.map(bay => Array(bay.low ? 3 : 7).fill(null));
    const spots = planSponsorSpots({ floor, stacks });
    assert.equal(new Set(spots.map(s => s.id)).size, spots.length);
    const hanging = spots.filter(s => s.kind === "hanging");
    assert.deepEqual(hanging.map(s => s.sponsor?.name), ["Armadai", "Crawlrr", undefined]);
    assert.equal(new Set(hanging.map(s => s.z)).size, 3);
    const walls = spots.filter(s => s.kind === "wall");
    assert.equal(walls.filter(s => s.x < 0).length * 2, walls.length);
    assert.deepEqual(walls.filter(s => s.sponsor).map(s => s.id), ["east-03"]);
    for (const spot of spots) {
      assert.ok(spot.z > floor.minZ && spot.z < floor.maxZ);
      assert.ok(spot.y - spot.height / 2 > 3.75 && spot.y + spot.height / 2 < hallHeight);
      if (spot.sponsor) {
        assert.equal(sponsorWebsite(spot.sponsor.url), spot.sponsor.url);
        assert.ok(spot.sponsor.slogan.trim().length);
        assert.ok(readFileSync("public" + spot.sponsor.logo).subarray(1, 4).equals(Buffer.from("PNG")));
      }
      if (spot.kind === "wall") floor.bays.forEach((bay, i) => {
        if (bay.yaw !== spot.yaw || Math.abs(spot.z - bay.z) >= 1.9 + .91) return;
        assert.ok(spot.y - spot.height / 2 > shelfBase(stacks[i].length) + stacks[i].length * shelfSpacing + .06);
      });
    }
  }
});

test("sponsor destinations accept normal HTTPS websites and reject other schemes or credentials", () => {
  assert.equal(sponsorWebsite(" example.com/path "), "https://example.com/path");
  assert.equal(sponsorWebsite("https://example.com/?q=1"), "https://example.com/?q=1");
  for (const value of ["", "https://", "bad site", "localhost", "http://example.com", "javascript:alert(1)", "data:text/plain,x", "https://name@example.com"]) assert.equal(sponsorWebsite(value), undefined);
});
