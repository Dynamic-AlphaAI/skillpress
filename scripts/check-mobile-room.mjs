import assert from "node:assert/strict";
import { chromium, webkit } from "playwright";

const base = new URL(process.argv[2] ?? "http://localhost:3000").origin;
const engine = process.env.PLAYWRIGHT_BROWSER === "webkit" ? webkit : chromium;
const browser = await engine.launch({
  executablePath: engine === webkit ? process.env.PLAYWRIGHT_WEBKIT_EXECUTABLE : process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  ...(engine === chromium ? { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } : {}),
});
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
  page.setDefaultTimeout(30000);
  page.on("pageerror", error => errors.push(error.message));
  page.on("crash", () => errors.push("Browser tab crashed"));
  await page.addInitScript(() => {
    window.__THREE_DEVTOOLS__ = new EventTarget();
    window.__THREE_DEVTOOLS__.addEventListener("observe", ({ detail }) => {
      if (detail.isScene) detail.onAfterRender = (renderer, scene, camera) => { window.roomAudit = { renderer, scene, camera }; };
    });
  });
  async function enter() {
    await page.goto(base + "/?walk");
    await page.waitForFunction(() => window.roomAudit?.scene.children.some(object =>
      object.name.startsWith("book/") && object.visible && object.material?.map));
  }
  async function snapshot() {
    return page.evaluate(() => {
      const { renderer, scene } = window.roomAudit;
      let detailedBooks = 0;
      const textures = new Set();
      scene.traverse(object => {
        if (object.name.startsWith("book/") && object.visible && object.material?.map) detailedBooks++;
        for (const material of [object.material].flat()) if (material?.map) textures.add(material.map);
      });
      let bytes = 0;
      for (const texture of textures) bytes += (texture.image?.width ?? 0) * (texture.image?.height ?? 0) * 4;
      return { detailedBooks, jackets: document.querySelectorAll("[data-jacket]").length, textureMiB: bytes / 1048576,
        gpuTextures: renderer.info.memory.textures, drawCalls: renderer.info.render.calls,
        antialias: renderer.getContext().getContextAttributes()?.antialias, pixels: renderer.domElement.width * renderer.domElement.height };
    });
  }
  await enter();
  const initial = await snapshot();
  assert.ok(initial.detailedBooks > 0 && initial.detailedBooks <= 64);
  assert.ok(initial.jackets <= 64);
  assert.ok(initial.textureMiB < 100, "The whole catalogue must not allocate hundreds of MiB in textures");
  assert.equal(initial.antialias, false);
  const room = page.getByRole("combobox", { name: "Visit a room" });
  await room.tap();
  const names = await page.getByRole("option").allTextContents();
  await page.keyboard.press("Escape");
  await page.getByRole("listbox").waitFor({ state: "hidden" });
  const sizes = [];
  for (const name of [...names.slice(1), names[0]]) {
    await room.tap();
    await page.getByRole("option", { name, exact: true }).tap();
    await page.getByRole("listbox").waitFor({ state: "hidden" });
    // Allow the newly requested artwork to commit and a render to upload it.
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const sample = await snapshot();
    assert.ok(sample.detailedBooks <= 64 && sample.jackets <= 64, name);
    assert.ok(sample.textureMiB < 100, name);
    sizes.push(sample.textureMiB);
  }
  await page.getByRole("button", { name: "Expand library", exact: true }).tap();
  const dialog = page.locator("dialog:modal");
  await dialog.waitFor();
  const cameraId = await page.evaluate(() => window.roomAudit.camera.uuid);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForFunction(() => innerWidth > innerHeight);
  assert.ok((await snapshot()).pixels <= 1_000_000);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.setViewportSize({ width: 390, height: 844 });
  await dialog.getByRole("button", { name: "Read book", exact: true }).tap();
  await page.getByRole("dialog", { name: /reader/ }).waitFor();
  await page.keyboard.press("Escape");
  await dialog.waitFor();
  assert.equal(await page.evaluate(() => window.roomAudit.camera.uuid), cameraId);

  // Exercise a real lost device while the room is open, not just getContext returning null.
  const lost = await page.evaluate(() => {
    const extension = window.roomAudit.renderer.getContext().getExtension("WEBGL_lose_context");
    if (!extension) return false;
    extension.loseContext();
    return true;
  });
  assert.ok(lost, "This test needs WebGL context-loss simulation");
  await page.getByText("The library catalogue", { exact: true }).waitFor();
  assert.equal(await page.locator("[data-jacket]").count(), 0);
  assert.equal(await page.getByRole("group", { name: "Movement joystick", exact: true }).count(), 0);
  await page.getByRole("combobox", { name: "Visit a room" }).tap();
  await page.getByRole("option", { name: names[1], exact: true }).tap();
  await page.getByRole("button", { name: "Read book", exact: true }).tap();
  await page.getByRole("dialog", { name: /reader/ }).waitFor();
  await page.keyboard.press("Escape");
  await page.getByText("The library catalogue", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Leave room", exact: false }).tap();
  await page.getByRole("button", { name: "Enter the library", exact: true }).tap();
  await page.waitForFunction(id => window.roomAudit.camera.uuid !== id, cameraId);
  assert.ok((await snapshot()).textureMiB < 100);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ engine: engine.name(), initial, roomsVisited: names.length, maxTextureMiB: Math.max(...sizes), verified: ["bounded artwork", "rotation", "reader round trip", "context-loss fallback", "re-entry"] }, null, 2));
} finally {
  await browser.close();
}
