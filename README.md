# 流明壁纸 LUMEN

响应式壁纸展示站前端。深色沉浸式画廊，适配 PC 与手机端，支持分类筛选、方向筛选、服务端搜索、排序、灯箱预览与一键下载。壁纸数据实时来自 [wallhaven.cc](https://wallhaven.cc) 官方 API（全真实元数据），部署在 Cloudflare Pages。

线上地址：https://lumen-wallpapers.pages.dev

## 快速开始

```bash
npm install
npm run dev        # 开发服务器 http://localhost:5174
npm run build      # 类型检查 + 生产构建
npm run preview    # 预览生产构建

# 部署（含 Pages Functions）
npx wrangler pages deploy dist --project-name=lumen-wallpapers --branch=main --commit-dirty=true
```

本地开发说明：wallhaven 接口与缩略图经 Vite 开发代理转发；若你的网络需要系统代理才能访问 wallhaven，Vite 会自动读取 `HTTPS_PROXY` / `HTTP_PROXY` 环境变量。

## 架构

```
浏览器 ── /api/wallhaven ──────── CF Pages Function ── wallhaven.cc/api/v1/search（无 CORS，需代理）
       └─ /api/wallhaven-thumb ── CF Pages Function ── th.wallhaven.cc（缩略图，无 CORS，代理并透传长度以支持进度环）
       └─ 直连 w.wallhaven.cc ─── 原图下载（自带 CORS，流式下载显示百分比）
```

- 列表与缩略图代理只透传白名单参数、强制 SFW，边缘缓存 5 分钟（列表）/ 31 天（缩略图）
- 本地开发由 `vite.config.ts` 的 `server.proxy` 承担同样的转发（规则顺序注意：thumb 在前）

## 技术栈

| 类别 | 选型 |
|---|---|
| 框架 | React 19 + TypeScript + Vite 6 |
| 样式 | Tailwind CSS v4（`@tailwindcss/vite` 插件） |
| 动效 | Motion（`motion/react`），入场编排 / 视差 / 灯箱弹簧动画 |
| 图标 | Phosphor Icons（`@phosphor-icons/react`） |
| 字体 | Space Grotesk（`@fontsource-variable` 自托管）+ 系统中文字体 |
| 服务端 | Cloudflare Pages Functions（wallhaven 代理） |

设计约定：全站深色主题锁定；唯一强调色电光青（cyan）；卡片 `rounded-2xl`、按钮与筛选 pill 全圆角的圆角体系；层级 z-index：筛选栏 30 / 导航 40 / 灯箱 50 / 颗粒 60 / Toast 70。

## 功能

- **真实数据**：分类（通用 / 动漫 / 人物）、分辨率、浏览量、收藏数、日期、文件大小、主色调全部来自 wallhaven 接口
- **服务端筛选**：分类与关键词搜索（wallhaven 标签搜索）实时重查；排序支持 随机（会话种子，刷新换一批）/ 最新 / 收藏最多；方向（横竖屏）在客户端过滤已加载数据
- **瀑布流画廊**：JS 贪心分列瀑布流（手机 2 列 / 平板 3 列 / 桌面 4 列，追加不重排）；首屏与加载更多均使用瀑布流形态骨架（占位高度与真实内容一致，避免滚动条跳动），骨架块直接续在各列末尾
- **进度加载**：卡片缩略图与灯箱预览流式加载并显示百分比进度环（拿不到 Content-Length 时降级为已接收体积），完成后 blob 直出；进入视口附近才开始请求、模块级缓存避免筛选重挂载时重复下载
- **灯箱预览**：键盘（← → Esc）、触屏滑动切换、真实元数据信息栏（分类 / 方向 / 分辨率 / 浏览 / 收藏 / 日期 / 体积 / 主色调色板）；下载原图同样带实时百分比、失败新标签兜底 + Toast 反馈
- **SEO**：OG 图（`scripts/make-og-image.mjs` 生成）、robots.txt、sitemap.xml
- **无障碍**：焦点可见、ARIA 标签、`prefers-reduced-motion` 降级

## 目录结构

```
functions/api/                # CF Pages Functions（生产代理）
  wallhaven.ts                #   列表代理
  wallhaven-thumb/[size]/[sub]/[file].ts  # 缩略图代理
src/
  App.tsx                     # 组合入口：灯箱状态 / 随机壁纸 / 颗粒层
  data/wallpapers.ts          # 类型 + wallhaven 字段映射 + 图片 URL 构造
  lib/api.ts                  # 画廊查询（搜索/分类/排序/种子）+ 分页缓存
  lib/download.ts             # 下载逻辑（blob + 兜底）
  lib/progress.ts             # 流式加载（百分比进度）
  lib/thumb-cache.ts          # 缩略图 blob 缓存
  lib/utils.ts                # cn / 数字与日期、体积格式化
  hooks/useMasonry.ts         # 贪心瀑布流分列（追加稳定）+ 响应式列数
  components/
    Navbar.tsx                # 固定导航（滚动毛玻璃）+ Logo
    Hero.tsx                  # 全屏 Hero（Ken Burns + 视差 + 入场编排）
    GallerySection.tsx        # 服务端查询 + 粘性筛选栏 + 瀑布流 + 分页
    WallpaperCard.tsx         # 卡片（进度环、悬停规格、快捷下载）
    Lightbox.tsx              # 灯箱（键盘/滑动导航、元数据、下载）
    ProgressRing.tsx          # 进度环
    Toast.tsx                 # 轻提示（Context 注入）
    Footer.tsx                # 页脚（yifang 工具箱外链，带 UTM）
public/                       # favicon / og-image / robots / sitemap
scripts/                      # og 图生成、截图、SEO 冒烟等工具
```

## 接入自己的后端

1. `src/lib/api.ts`：把 `/api/wallhaven` 换成真实接口，按后端协议调整分页参数
2. `src/data/wallpapers.ts` 的 `mapWallhavenItem`：映射后端真实字段
3. 三个 URL 构造函数（`thumbUrl / previewUrl / downloadUrl`）指向真实图片服务；若图片服务自带 CORS，可删掉 `functions/api/wallhaven-thumb` 代理直连

## 说明

壁纸数据与图片实时来自 [wallhaven.cc](https://wallhaven.cc)，仅加载 SFW（安全）内容。wallhaven 免 key 有约 45 次/分钟的接口限速，代理层已做 5 分钟边缘缓存缓解。国内网络访问 wallhaven 通常需要代理。
