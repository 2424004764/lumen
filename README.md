# 流明壁纸 LUMEN

响应式壁纸展示站前端。深色沉浸式画廊，适配 PC 与手机端，支持分类筛选、方向筛选、排序、搜索、灯箱预览与一键下载。壁纸列表实时请求 [Picsum 官方接口](https://picsum.photos/v2/list) 分页获取，图片全部按 id 从 picsum.photos 实时加载。

## 快速开始

```bash
npm install
npm run dev        # 开发服务器 http://localhost:5173
npm run build      # 类型检查 + 生产构建
npm run preview    # 预览生产构建
```

## 技术栈

| 类别 | 选型 |
|---|---|
| 框架 | React 19 + TypeScript + Vite 6 |
| 样式 | Tailwind CSS v4（`@tailwindcss/vite` 插件） |
| 动效 | Motion（`motion/react`），入场编排 / 视差 / 灯箱弹簧动画 |
| 图标 | Phosphor Icons（`@phosphor-icons/react`） |
| 字体 | Space Grotesk（`@fontsource-variable` 自托管）+ 系统中文字体 |

设计约定：全站深色主题锁定；唯一强调色电光青（cyan）；卡片 `rounded-2xl`、按钮与筛选 pill 全圆角的圆角体系；层级 z-index：筛选栏 30 / 导航 40 / 灯箱 50 / 颗粒 60 / Toast 70。

## 功能

- **接口驱动**：壁纸列表实时请求 `https://picsum.photos/v2/list`（全库 34 页约 993 张）；每次刷新从随机页进入，首屏骨架屏、失败可重试、分页去重缓存
- **加载更多**：页内排序、按页追加（新页永远接在已渲染内容末尾，不会插入中间），向后环绕翻页（翻完整库才“到底”），本地未展示的先展开、不够时再请求下一页接口
- **瀑布流画廊**：JS 贪心分列瀑布流（手机 2 列 / 平板 3 列 / 桌面 4 列，追加不重排）；首屏与加载更多均使用瀑布流形态骨架（占位高度与真实内容一致，避免滚动条跳动）；卡片缩略图流式加载并显示百分比进度环（进入视口附近才开始请求、模块级缓存避免筛选重挂载时重复下载），完成后渐入，悬停显示规格（分辨率档位 / 方向）与快捷下载
- **筛选**：6 个分类（自然 / 城市 / 建筑 / 抽象 / 极简 / 夜色）+ 横竖屏方向筛选 + 关键词搜索（标题 / 标签 / 作者，范围：已加载页）；列表按图片 id 倒序（入库新者优先）
- **灯箱预览**：流式加载并显示百分比进度环（拿不到 Content-Length 时降级为已接收体积），完成后 blob 直出；信息栏只展示接口真实数据（方向、原始分辨率、作者）；键盘（← → Esc）、触屏滑动切换；下载原图同样带实时百分比、失败新标签兜底 + Toast 反馈
- **空状态**：无结果时提供清除筛选入口
- **无障碍**：焦点可见、ARIA 标签、`prefers-reduced-motion` 降级

## 目录结构

```
src/
  App.tsx                  # 组合入口：灯箱状态 / 随机壁纸 / 颗粒层
  data/wallpapers.ts       # 类型 + Picsum 接口数据映射 + 图片 URL 构造
  lib/api.ts               # /v2/list 分页请求、并发去重与页缓存
  lib/download.ts          # 下载逻辑（blob + 兜底）
  lib/utils.ts             # cn / delay / 数字与日期格式化
  components/
    Navbar.tsx             # 固定导航（滚动毛玻璃）+ Logo
    Hero.tsx               # 全屏 Hero（Ken Burns + 视差 + 入场编排）
    GallerySection.tsx     # 接口加载 + 粘性筛选栏 + 瀑布流 + 分页 + 空状态
    WallpaperCard.tsx      # 卡片（骨架屏、悬停层、快捷下载）
    Lightbox.tsx           # 灯箱（键盘/滑动导航、信息栏、下载）
    Toast.tsx              # 轻提示（Context 注入）
    Footer.tsx
public/                    # favicon
scripts/
  screenshot.mjs           # 无头浏览器截图（puppeteer-core + 系统 Edge）
```

## 接入后端

1. [api.ts](src/lib/api.ts) 里把 `API` 换成真实接口地址，按后端分页协议调整 `page/limit` 参数
2. [wallpapers.ts](src/data/wallpapers.ts) 里的 `mapPicsumItem` 改为映射后端真实字段（接口已提供 id / 作者 / 原始尺寸；标题、分类、热度目前由 id 确定性生成，换成真实字段即可）
3. 三个 URL 构造函数（`thumbUrl / previewUrl / downloadUrl`）指向真实图片服务

## 说明

图片与列表数据实时来自 [Picsum](https://picsum.photos)。`/v2/list` 接口只提供 id、作者与尺寸：页面上展示的方向、原始分辨率、作者、2K/4K/5K 档位均由这些真实字段算出；分类与搜索词由 id 确定性生成，仅用于站内筛选组织，不作为图片信息展示。国内网络访问较慢时骨架屏会先占位，图片渐入显示。
