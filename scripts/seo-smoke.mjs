/* 冒烟验证：初始 HTML 静态兜底 + React 挂载替换 + 渲染后页面正常 */
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const URL = "http://localhost:5175/";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

mkdirSync("shots", { recursive: true });

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: true,
  args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--no-proxy-server"],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});

const raw = await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 }).then(() => page.content());
console.log("初始 HTML 含兜底内容:", raw.includes("seo-fallback"));
console.log("初始 HTML 含 h1 文案:", raw.includes("装进每一块屏幕"));

// 等待 React 应用挂载（Navbar 渲染出 header 元素）
await page.waitForSelector("header", { timeout: 30000 }).catch(() => {});
console.log("挂载后兜底元素已移除:", (await page.$(".seo-fallback")) === null);
console.log("React 导航栏已渲染:", (await page.$("header")) !== null);
console.log("页面错误:", errors.length ? errors.slice(0, 3) : "无");

await page.screenshot({ path: "shots/seo-smoke.png" });
console.log("saved shots/seo-smoke.png");

await browser.close();
console.log("done");
