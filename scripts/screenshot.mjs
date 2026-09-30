/* 视觉验证脚本：用系统 Edge 无头截图 PC / 移动端关键视图 */
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const URL = "http://localhost:5173/";
const OUT = "shots";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: true,
  args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--no-proxy-server"],
});

async function shot(page, name) {
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`saved ${name}.png`);
}

// ---------- PC ----------
const pc = await browser.newPage();
await pc.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await pc.goto(URL, { waitUntil: "load", timeout: 60000 });
await sleep(4000);
await shot(pc, "pc-hero");

await pc.evaluate(() => document.getElementById("gallery")?.scrollIntoView());
await sleep(3000);
await shot(pc, "pc-gallery");

// 点击第一张卡片打开灯箱
await pc.click('figure[role="button"]');
await sleep(3000);
await shot(pc, "pc-lightbox");
await pc.keyboard.press("Escape");
await sleep(800);

// 切换分类
await pc.evaluate(() => window.scrollTo(0, 0));
await sleep(600);
await pc.evaluate(() => {
  const pills = [...document.querySelectorAll("button")];
  pills.find((b) => b.textContent.trim() === "城市")?.click();
});
await sleep(1800);
await pc.evaluate(() => document.getElementById("gallery")?.scrollIntoView());
await sleep(2000);
await shot(pc, "pc-city");

// ---------- Mobile ----------
const mob = await browser.newPage();
await mob.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await mob.goto(URL, { waitUntil: "load", timeout: 60000 });
await sleep(4000);
await shot(mob, "mob-hero");

await mob.evaluate(() => document.getElementById("gallery")?.scrollIntoView());
await sleep(3000);
await shot(mob, "mob-gallery");

await mob.click('figure[role="button"]');
await sleep(3000);
await shot(mob, "mob-lightbox");

await browser.close();
console.log("done");
