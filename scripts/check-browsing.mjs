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
  page.on("pageerror", error => errors.push(error.message));
  return page;
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

  await page.addInitScript(() => {
    const events = window.__THREE_DEVTOOLS__ = new EventTarget();
    events.addEventListener("observe", ({ detail }) => {
      if (detail.isScene) detail.onAfterRender = (_renderer, _scene, camera) => { window.testCamera = camera; };
    });
  });
  await page.goto(base + "/?walk");
  await page.waitForFunction(() => window.testCamera);
  const canvas = page.locator('canvas[aria-label^="Walkable library"]');
  const startZ = await page.evaluate(() => window.testCamera.position.z);
  await canvas.dispatchEvent("wheel", { deltaY: -180, bubbles: true, cancelable: true });
  await page.waitForFunction(z => window.testCamera.position.z < z - 0.1, startZ);
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

  const mobile = await openPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
  await mobile.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      return type.startsWith("webgl") ? null : original.call(this, type, ...args);
    };
  });
  await mobile.goto(base + "/?platform=claude&walk");
  await mobile.getByRole("combobox", { name: "Browse by platform" }).click();
  await mobile.getByRole("option", { name: /^DeepSeek ·/ }).click();
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
