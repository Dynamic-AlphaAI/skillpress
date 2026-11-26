import assert from "node:assert/strict";
import test from "node:test";
import { artworkQueue, nearbyBooks } from "../src/lib/roomResources.ts";

test("a growing library keeps only nearby books within its texture budget", () => {
  const books = Array.from({ length: 5000 }, (_, id) => ({ id, position: { x: 4, y: 1.6, z: id / 10 } }));
  const start = nearbyBooks(books, { x: 0, y: 1.6, z: 0 }, 64, 16);
  assert.equal(start.length, 64);
  assert.equal(start[0].id, 0);
  const destination = nearbyBooks(books, { x: 0, y: 1.6, z: 100 }, 64, 16);
  assert.equal(destination.length, 64);
  assert.equal(destination[0].id, 1000);
  assert.ok(destination.every(book => !start.includes(book)));
  assert.deepEqual(nearbyBooks(books, { x: 100, y: 1.6, z: 0 }, 64, 16), []);
  assert.deepEqual(nearbyBooks([], { x: 0, y: 0, z: 0 }, 64, 16), []);
});

test("cover decodes have bounded concurrency and skip abandoned books", async () => {
  const queue = artworkQueue(2);
  const active = new AbortController(), abandoned = new AbortController();
  const releases = [];
  const started = [];
  const task = id => async () => {
    started.push(id);
    await new Promise(resolve => releases.push(resolve));
  };
  const flush = () => new Promise(resolve => setImmediate(resolve));
  queue.add(task(1), active.signal);
  queue.add(task(2), active.signal);
  queue.add(task(3), abandoned.signal);
  queue.add(task(4), active.signal);
  await flush();
  assert.deepEqual(started, [1, 2]);
  abandoned.abort();
  releases.shift()();
  await flush();
  assert.deepEqual(started, [1, 2, 4]);
  queue.add(task(5), active.signal);
  queue.dispose();
  releases.forEach(release => release());
  await flush();
  assert.deepEqual(started, [1, 2, 4]);
});
