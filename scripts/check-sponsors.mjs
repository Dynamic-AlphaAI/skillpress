import assert from "node:assert/strict";
import { join } from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";

async function checkLogoFit(panel, width, height) {
  const buffer = await sharp({ create: { width, height, channels: 4, background: "#00f2fb" } }).png().toBuffer();
  const input = panel.getByLabel("Logo", { exact: true });
  assert.match(await input.getAttribute("aria-describedby"), /-help/);
  await panel.getByText(/512 × 512 px square works best/).waitFor();
  await input.setInputFiles({ name: "logo.png", mimeType: "image/png", buffer });
  await panel.getByText("Uploaded at " + width + " × " + height + " px").waitFor();
  const proof = panel.getByRole("img", { name: /Artwork preview/ });
  const bounds = await proof.evaluate(async canvas => {
    // Wait for the logo image to reach the drawn sign, then measure the visible mark.
    const ctx = canvas.getContext("2d");
    for (let i = 0; i < 80; i++) {
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let x0 = canvas.width, y0 = canvas.height, x1 = -1, y1 = -1;
      for (let offset = 0; offset < data.length; offset += 4) {
        if (data[offset] > 4 || data[offset + 1] < 237 || data[offset + 2] < 247) continue;
        const x = offset / 4 % canvas.width, y = Math.floor(offset / 4 / canvas.width);
        x0 = Math.min(x0, x); x1 = Math.max(x1, x);
        y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      }
      if (x1 >= 0) return { width: x1 - x0 + 1, height: y1 - y0 + 1 };
      await new Promise(resolve => setTimeout(resolve, 25));
    }
  });
  assert.ok(bounds, "Logo appeared in the sign preview");
  assert.ok(Math.abs(bounds.width / bounds.height / (width / height) - 1) < 0.08, "The sign preserves the logo shape");
}

const base = new URL(process.argv[2] ?? "http://localhost:3000").origin;
const photos = process.argv[3];
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
try {
  const page = await browser.newPage({ viewport: { width: 1150, height: 760 }, reducedMotion: "reduce" });
  page.setDefaultTimeout(60000);
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  const inventory = { checkoutEnabled: true, bookings: {} };
  await page.route("**/api/sponsors", route => route.fulfill({ json: inventory }));
  await page.goto(base + "/?walk");
  await page.getByRole("button", { name: "Expand library", exact: true }).click();
  await page.getByRole("button", { name: "Use ladder", exact: true }).waitFor();
  const canvas = page.locator('canvas[aria-label^="Walkable library"]');
  const details = page.getByRole("dialog", { name: "Library sponsorships" });
  const sponsors = page.getByRole("button", { name: "Sponsors", exact: true });
  const open = () => sponsors.click();
  async function select(name) {
    await details.getByRole("combobox", { name: "Sponsor placement" }).click();
    await details.getByRole("option", { name }).click();
  }
  async function clickSign() {
    const rect = await canvas.boundingBox();
    await canvas.click({ position: { x: rect.width / 2, y: rect.height / 2 } });
    await details.waitFor();
  }
  async function close() {
    await page.keyboard.press("Escape");
    await details.waitFor({ state: "hidden" });
    assert.ok(await page.getByRole("dialog", { name: "Walk the library" }).isVisible());
  }

  await open();
  await close();
  if (photos) await page.screenshot({ path: join(photos, "entrance.jpg"), quality: 86 });
  for (const [name, domain] of [["Armadai", "armadai.sh"], ["Crawlrr", "crawlrr.com"], ["Sftir", "sftir.com"]]) {
    await open();
    if (name !== "Armadai") await select(new RegExp(name));
    assert.equal(await details.getByRole("link", { name: "Visit " + domain }).getAttribute("href"), "https://" + domain + "/");
    assert.equal(await details.getByRole("textbox").count(), 0);
    const price = name === "Sftir" ? "$20" : "$75";
    await details.getByRole("button", { name: "Book this spot · " + price }).click();
    await details.getByRole("button", { name: "Pay " + price + " with Stripe" }).waitFor();
    await details.getByLabel("Brand name").waitFor();
    if (name === "Armadai") {
      await details.getByLabel("Brand name").fill("Acorn Studio");
      await details.getByLabel("Slogan").fill("Design for the curious.");
      await details.getByLabel("Website").fill("example.com");
      await checkLogoFit(details, 1024, 256);
      let posted;
      await page.route("**/api/sponsors/checkout", route => {
        posted = route.request().postDataJSON();
        return route.fulfill({ status: 409, json: { error: "Another sponsor just reserved this spot." } });
      });
      await details.getByRole("button", { name: "Pay $75 with Stripe" }).click();
      await details.getByRole("alert").getByText(/just reserved/).waitFor();
      assert.equal(posted.spot, "ceiling-1");
      assert.equal(posted.creative.name, "Acorn Studio");
      assert.match(posted.creative.logo, /^data:image\/png;base64,/);
      const normalized = await sharp(Buffer.from(posted.creative.logo.split(",")[1], "base64")).metadata();
      assert.deepEqual([normalized.width, normalized.height], [512, 128]);
      assert.equal(posted.creative.url, "https://example.com/");
      await page.unroute("**/api/sponsors/checkout");
    }
    await details.getByRole("button", { name: "View sign in hall" }).click();
    if (photos) await page.screenshot({ path: join(photos, name + ".jpg"), quality: 86 });
    await clickSign();
    await details.getByRole("heading", { name, exact: true }).waitFor();
    await close();
  }
  await open();
  await select(/Rear hanging sign/);
  await details.getByLabel("Brand name").fill("Acorn Studio");
  await details.getByLabel("Slogan").fill("Design for the curious.");
  await details.getByLabel("Website").fill("example.com");
  await details.locator('input[type="file"]').setInputFiles({name:"not-a-logo.png",mimeType:"image/png",buffer:Buffer.from("broken")});
  await details.getByRole("alert").getByText(/could not be opened/).waitFor();
  assert.ok(await details.getByRole("button", { name: "Preview in the hall" }).isDisabled());
  await details.locator('input[type="file"]').setInputFiles("public/sponsors/sftir.png");
  await details.getByRole("button", { name: "Preview in the hall" }).click();
  await details.waitFor({state:"hidden"});
  await clickSign();
  await details.getByRole("heading", {name:"Acorn Studio"}).waitFor();
  assert.equal(await details.getByRole("link", {name:"Visit example.com"}).getAttribute("href"), "https://example.com/");
  await details.getByRole("button", {name:"Clear preview"}).click();
  await details.waitFor({state:"hidden"});
  await clickSign();
  await details.getByRole("heading", {name:"Sponsor this spot"}).waitFor();
  await close();
  await page.close();

  const phone = await browser.newPage({ viewport:{width:375,height:812}, isMobile:true, hasTouch:true });
  await phone.addInitScript(() => {
    const get = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      return type.startsWith("webgl") ? null : get.call(this, type, ...args);
    };
  });
  let paidUntil;
  await phone.route("**/api/sponsors", route => route.fulfill({ json: {
    checkoutEnabled: true, bookings: paidUntil > Date.now() ? {
      "ceiling-1": { status: "paid", until: paidUntil,
        creative: { name: "Acorn Studio", slogan: "Design for the curious.", url: "https://example.com/", logo: "/sponsors/sftir.png" } }
    } : {},
  } }));
  await phone.goto(base + "/?platform=deepseek&walk");
  await phone.getByText("The library catalogue", {exact:true}).waitFor();
  await phone.getByRole("button", { name:"Sponsors",exact:true }).tap();
  const panel = phone.getByRole("dialog", {name:"Library sponsorships"});
  await panel.getByRole("link", {name:"Visit armadai.sh"}).waitFor();
  paidUntil = Date.now() + 6000;
  await phone.evaluate(() => window.dispatchEvent(new Event("pageshow")));
  await panel.getByRole("heading", { name: "Acorn Studio" }).waitFor();
  assert.equal(await panel.getByRole("button", { name: /Book this spot/ }).count(), 0);
  await panel.getByRole("link", { name: "Visit armadai.sh" }).waitFor();
  await panel.getByRole("button", { name: "Book this spot · $75" }).waitFor();
  await panel.getByRole("combobox").tap();
  await panel.getByRole("option", {name:/West wall · 01/}).tap();
  await panel.getByRole("button", {name:"Preview sign"}).waitFor();
  await checkLogoFit(panel, 128, 384);
  const proof = panel.getByRole("img", { name: /Artwork preview/ });
  const beforeText = await proof.evaluate(canvas => canvas.toDataURL());
  await panel.getByLabel("Brand name").fill("Juniper");
  assert.ok(await proof.evaluate(canvas => canvas.toDataURL()) !== beforeText);
  await panel.getByLabel("Logo", { exact: true }).setInputFiles({ name: "large.png", mimeType: "image/png", buffer: Buffer.alloc(2 * 1024 * 1024 + 1) });
  await panel.getByRole("alert").getByText(/up to 2 MB/).waitFor();
  assert.equal(await proof.count(), 0);
  assert.ok(await panel.getByRole("button", { name: /Pay .* with Stripe/ }).isDisabled());
  assert.ok(await panel.evaluate(e => e.scrollWidth <= e.clientWidth + 1));
  await panel.getByRole("button", {name:"Close sponsor details"}).tap();
  assert.deepEqual(errors, []);
  console.log("Verified all three bookable house signs, checkout submission and conflict handling, proportional wall and hanging logo previews, upload guidance and validation, private preview and reset, paid placement protection and expiry, expanded view, and mobile without WebGL.");
} finally {
  await browser.close();
}
