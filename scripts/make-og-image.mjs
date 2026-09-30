/* 生成社交分享卡片 og-image.png（1200×630）：用系统 Edge 无头渲染一张品牌图 */
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const OUT = "public/og-image.png";

const HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 1200px; height: 630px; overflow: hidden; }
  body {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 96px;
    background:
      radial-gradient(900px 480px at 82% 18%, rgba(56, 189, 248, 0.16), transparent 60%),
      radial-gradient(700px 420px at 12% 88%, rgba(103, 232, 249, 0.10), transparent 60%),
      #09090b;
    color: #f4f4f5;
    font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
  }
  .mark { display: flex; align-items: center; gap: 14px; }
  .mark span { font-size: 22px; font-weight: 600; color: #e4e4e7; }
  .eyebrow {
    margin-top: 44px;
    font-size: 15px;
    letter-spacing: 0.34em;
    text-transform: uppercase;
    color: #67e8f9;
  }
  h1 {
    margin-top: 18px;
    font-size: 74px;
    font-weight: 700;
    line-height: 1.12;
    letter-spacing: -0.02em;
  }
  h1 em { font-style: normal; color: transparent; background: linear-gradient(90deg, #67e8f9, #38bdf8); -webkit-background-clip: text; background-clip: text; }
  .lead { margin-top: 22px; font-size: 24px; color: #a1a1aa; }
  .tags { margin-top: 34px; display: flex; gap: 12px; }
  .tags i {
    font-style: normal;
    font-size: 17px;
    color: #a5f3fc;
    border: 1px solid rgba(103, 232, 249, 0.35);
    background: rgba(103, 232, 249, 0.08);
    border-radius: 999px;
    padding: 7px 20px;
  }
  .grain {
    position: absolute; inset: 0; pointer-events: none;
    background-image: radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px);
    background-size: 5px 5px;
  }
</style>
</head>
<body>
  <div class="grain"></div>
  <div class="mark">
    <svg width="40" height="40" viewBox="0 0 32 32">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#67e8f9"/>
          <stop offset="1" stop-color="#38bdf8"/>
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="#0b0c0f"/>
      <path d="M16 7.5l7.5 14h-15z" fill="none" stroke="url(#g)" stroke-width="2.4" stroke-linejoin="round"/>
      <circle cx="16" cy="17.5" r="2" fill="url(#g)"/>
    </svg>
    <span>流明壁纸 LUMEN</span>
  </div>
  <p class="eyebrow">Lumen Wallpapers</p>
  <h1>把世界的<em>光影</em><br/>装进每一块屏幕</h1>
  <p class="lead">精心挑选的 4K / 5K 高清壁纸 · 免费下载</p>
  <div class="tags"><i>通用</i><i>动漫</i><i>人物</i><i>横屏 / 竖屏</i></div>
</body>
</html>`;

mkdirSync("public", { recursive: true });

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: true,
  args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1"],
});

const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
await page.setContent(HTML, { waitUntil: "load", timeout: 30000 });
await page.screenshot({ path: OUT, type: "png" });
await browser.close();
console.log(`saved ${OUT}`);
