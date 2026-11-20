import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { chromium } from "playwright";
import { platforms } from "../src/lib/platforms.ts";

const base = new URL(process.argv[2] ?? "http://localhost:3000").origin;
const catalog = JSON.parse(readFileSync(new URL("../content/catalog.json", import.meta.url)));
const sourceById = new Map(catalog.sources.map(s => [s.id, s]));
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const errors = [];
async function openPage(options) {
  const page = await browser.newPage(options);
  page.setDefaultTimeout(30000);
  page.on("pageerror", error => errors.push(error.message));
  return page;
}

function trackCamera() {
  const events = window.__THREE_DEVTOOLS__ = new EventTarget();
  events.addEventListener("observe", ({ detail }) => {
    if (detail.isScene) detail.onAfterRender = (_renderer, _scene, camera) => { window.testCamera = camera; };
  });
}

try {
  const page = await openPage({ viewport: { width: 1240, height: 850 }, reducedMotion: "reduce" });
  await page.goto(base);
  const nav = page.getByRole("navigation", { name: "Platform collections" });
  for (const { id, label } of platforms) {
    const expected = catalog.books.filter(b => [...sourceById.get(b.source).platforms, ...(b.platforms ?? []), ...(b.covers ?? [])].includes(id));
    await nav.getByRole("link", { name: `${label} ${expected.length}`, exact: true }).click();
    await page.getByRole("heading", { name: `${label} shelves` }).waitFor();
    assert.equal(new URL(page.url()).searchParams.get("platform"), id);
  }
  await page.goto(base + "/?platform=chatgpt&q=submission");
  const results = page.getByRole("list", { name: "Matching skills" });
  const link = results.locator('a[href*="book=chatgpt-app-submission"]');
  await link.click();
  await page.getByRole("dialog", { name: /reader/ }).waitFor();
  await page.keyboard.press("Escape");
  await link.waitFor();
  assert.equal(new URL(page.url()).searchParams.get("q"), "submission");
  await page.reload();
  await link.waitFor();

  await page.goto(base + "/?platform=grok&book=grok-run-output&details");
  const details = page.getByRole("dialog");
  await details.getByText("Runs in", { exact: true }).waitFor();
  await details.getByText("Covers", { exact: true }).waitFor();
  await details.getByText("Grok", { exact: true }).waitFor();
  const download = await page.request.get(base + "/downloads/grok-run-output.zip");
  assert.equal(download.status(), 200);
  assert.equal((await download.body()).subarray(0, 2).toString(), "PK");

  await page.addInitScript(trackCamera);
  await page.goto(base + "/?walk");
  await page.waitForFunction(() => window.testCamera);
  const canvas = page.locator('canvas[aria-label^="Walkable library"]');
  const groundPosition = () => page.evaluate(() => ({ x: window.testCamera.position.x, z: window.testCamera.position.z }));
  const start = await groundPosition();
  await canvas.dispatchEvent("wheel", { deltaY: -180, bubbles: true, cancelable: true });
  await page.waitForFunction(z => window.testCamera.position.z < z - 0.1, start.z);
  const end = await groundPosition();
  assert.ok(Math.abs(Math.hypot(end.x - start.x, end.z - start.z) - 1.242) < 0.001, "180 wheel pixels should walk 1.242 metres");
  const room = page.getByRole("combobox", { name: "Visit a room" });
  const volume = page.getByRole("combobox", { name: "Choose a volume" });
  await room.click();
  const names = await page.getByRole("option").allTextContents();
  assert.ok(names.includes("AI & Model Lab") && names.includes("Data Archive"));
  await page.keyboard.press("Escape");
  let physical = 0;
  for (const name of names) {
    await room.click();
    await page.getByRole("option", { name, exact: true }).click();
    await volume.click();
    physical += await page.getByRole("option").count();
    await page.keyboard.press("Escape");
  }
  assert.equal(physical, catalog.books.length);
  await page.getByRole("button", { name: "Use ladder", exact: true }).click();
  await page.getByRole("button", { name: "Step off ladder" }).click();
  console.log(`Walked ${names.length} rooms and counted ${physical} physical editions.`);

  // Verify the analog control against the actual camera, including its motion after release.
  await page.goto(base + "/?platform=deepseek");
  await page.getByRole("heading", { name: "DeepSeek shelves" }).waitFor();
  await page.getByRole("button", { name: "Enter library in expanded view" }).click();
  const expanded = page.locator("dialog:modal");
  await expanded.waitFor();
  await page.waitForFunction(() => window.testCamera);
  const cameraId = await page.evaluate(() => window.testCamera.uuid);
  const pose = () => page.evaluate(() => ({ z: window.testCamera.position.z, yaw: window.testCamera.rotation.y }));
  const stick = page.getByRole("group", { name: "Movement joystick", exact: true });
  async function pushStick(dx, dy) {
    const rect = await stick.boundingBox();
    const x = rect.x + rect.width / 2, y = rect.y + rect.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + rect.width * dx, y + rect.height * dy);
  }
  const bounds = await expanded.boundingBox();
  const screen = page.viewportSize();
  assert.ok(bounds.width > screen.width * 0.9 && bounds.width < screen.width);
  assert.ok(bounds.height > screen.height * 0.9 && bounds.height < screen.height);
  const initial = await pose();
  await pushStick(0.22, -0.45);
  await page.waitForFunction(p => window.testCamera.position.z < p.z - 0.15 && window.testCamera.rotation.y < p.yaw - 0.03, initial);
  await page.mouse.up();
  const still = await pose();
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  assert.deepEqual(await pose(), still);
  await pushStick(-0.15, 0.45);
  await page.waitForFunction(p => window.testCamera.position.z > p.z + 0.07 && window.testCamera.rotation.y > p.yaw + 0.01, still);
  await page.mouse.up();
  const startX = await page.evaluate(() => window.testCamera.position.x);
  await page.getByRole("button", { name: "Step right", exact: true }).click();
  await page.waitForFunction(x => window.testCamera.position.x > x + 0.05, startX);

  const look = () => page.evaluate(() => ({ yaw: window.testCamera.rotation.y, pitch: window.testCamera.rotation.x }));
  const beforeDrag = await look();
  const view = await canvas.boundingBox();
  const x = Math.round(view.x + view.width / 2), y = Math.round(view.y + view.height / 2);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 60, y + 40);
  await page.mouse.up();
  await page.waitForFunction(yaw => window.testCamera.rotation.y < yaw - 0.1, beforeDrag.yaw);
  const afterDrag = await look();
  assert.ok(Math.abs(beforeDrag.yaw - afterDrag.yaw - 0.204) < 0.001, "60 horizontal pixels should turn 0.204 radians");
  assert.ok(Math.abs(beforeDrag.pitch - afterDrag.pitch - 0.102) < 0.001, "40 vertical pixels should tilt 0.102 radians");

  const menu = expanded.getByRole("combobox", { name: "Visit a shelf" });
  await menu.click();
  await expanded.getByRole("listbox").waitFor();
  await page.keyboard.press("Escape");
  await expanded.getByRole("listbox").waitFor({ state: "hidden" });
  await expanded.waitFor();
  await expanded.getByRole("button", { name: "Use ladder", exact: true }).click();
  const height = await page.evaluate(() => window.testCamera.position.y);
  await pushStick(0, -0.4);
  await page.waitForFunction(y => window.testCamera.position.y > y + 0.08, height);
  await page.mouse.up();
  await expanded.getByRole("button", { name: "Roll ladder right" }).click();
  await expanded.getByRole("button", { name: "Read book" }).click();
  await page.getByRole("dialog", { name: /reader/ }).waitFor();
  await expanded.waitFor({ state: "hidden" });
  await page.keyboard.press("Escape");
  await expanded.getByRole("button", { name: "Step off ladder" }).waitFor();
  const onRail = await pose();
  await page.keyboard.press("Escape");
  await expanded.waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Expand library" }).click();
  await expanded.waitFor();
  assert.deepEqual(await pose(), onRail);
  assert.equal(await page.evaluate(() => window.testCamera.uuid), cameraId);
  await page.mouse.click(1, 1);
  await expanded.waitFor({ state: "hidden" });
  console.log("Verified joystick steering, forward/reverse travel, sideways steps, ladder use and position across modal and reader transitions.");
  await page.close();

  const mobile = await openPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
  await mobile.addInitScript(trackCamera);
  await mobile.goto(base + "/?platform=deepseek");
  await mobile.getByRole("heading", { name: "DeepSeek shelves" }).waitFor();
  await mobile.getByRole("button", { name: "Enter library in expanded view" }).tap();
  await mobile.waitForFunction(() => window.testCamera);
  const mobileRoom = mobile.locator("dialog:modal");
  const pad = await mobileRoom.getByRole("group", { name: "Movement joystick", exact: true }).boundingBox();
  const touch = await mobile.context().newCDPSession(mobile);
  const center = { id: 1, x: pad.x + pad.width / 2, y: pad.y + pad.height / 2 };
  const pushed = { ...center, x: center.x + 13, y: center.y - 26 };
  const touchPose = () => mobile.evaluate(() => [window.testCamera.rotation.y, window.testCamera.position.z, window.testCamera.position.x]);
  const beforeTouch = await touchPose();
  await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [center] });
  await touch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [pushed] });
  await mobile.waitForFunction(([yaw, z]) => window.testCamera.rotation.y < yaw - 0.02 && window.testCamera.position.z < z - 0.1, beforeTouch);
  const right = await mobileRoom.getByRole("button", { name: "Step right" }).boundingBox();
  await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [pushed, { id: 2, x: right.x + right.width / 2, y: right.y + right.height / 2 }] });
  await touch.send("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
  const afterCancel = await touchPose();
  // Wait past the side button's hold threshold so a missed cancellation shows up.
  await mobile.waitForTimeout(250);
  assert.deepEqual(await touchPose(), afterCancel);
  await mobileRoom.getByRole("button", { name: "Close expanded view" }).tap();
  await mobile.getByRole("button", { name: "Expand library" }).waitFor();
  console.log("Verified phone touch steering, simultaneous controls and cancellation.");

  await mobile.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      return type.startsWith("webgl") ? null : original.call(this, type, ...args);
    };
  });
  await mobile.goto(base + "/?platform=claude&walk");
  await mobile.getByRole("combobox", { name: "Browse by platform" }).click();
  await mobile.getByRole("option", { name: /^DeepSeek ·/ }).click();
  await mobile.getByRole("button", { name: "Expand library" }).tap();
  await mobile.locator("dialog:modal").waitFor();
  const picker = mobile.getByRole("combobox", { name: "Choose a volume" });
  await picker.click();
  await mobile.getByRole("option").first().click();
  await mobile.getByRole("button", { name: "Read book" }).click();
  await mobile.getByRole("dialog", { name: /reader/ }).waitFor();
  assert.equal(new URL(mobile.url()).searchParams.get("platform"), "deepseek");
  assert.ok(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  assert.deepEqual(errors, []);
  console.log("Verified all eight collections, scoped search, reader history, attribution, download, ladder and mobile fallback.");
} finally {
  await browser.close();
}
