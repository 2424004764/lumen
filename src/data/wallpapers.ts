/**
 * 数据层：壁纸列表来自 wallhaven.cc 官方 API（经 /api/wallhaven 代理）。
 * 所有字段均为接口真实数据：分类、分辨率、浏览/收藏数、日期、文件大小、主色调。
 * 后端就绪后：把 lib/api.ts 的接口地址换掉、按真实字段调整 mapWallhavenItem 即可。
 */

export type CategoryId = "general" | "anime" | "people";
export type Orientation = "landscape" | "portrait" | "square";
export type SortId = "random" | "new" | "favorites";

export interface Wallpaper {
  id: string; // wallhaven 壁纸 id，如 "qrow67"
  category: CategoryId;
  purity: string;
  width: number;
  height: number;
  ratio: number; // 宽 / 高
  views: number;
  favorites: number;
  createdAt: string;
  fileType: string; // 如 image/png
  fileSize: number; // 字节
  colors: string[]; // 主色调
  fullPath: string; // 原图（w.wallhaven.cc，带 CORS，可流式下载）
}

/** wallhaven /api/v1/search 返回的原始条目 */
export interface WallhavenItem {
  id: string;
  url: string;
  views: number;
  favorites: number;
  source: string;
  purity: string;
  category: string;
  dimension_x: number;
  dimension_y: number;
  resolution: string;
  ratio: string;
  file_size: number;
  file_type: string;
  created_at: string;
  colors: string[];
  path: string;
  thumbs: { large: string; original: string; small: string };
}

export const CATEGORIES: { id: CategoryId | "all"; label: string; code: string }[] = [
  { id: "all", label: "全部", code: "111" },
  { id: "general", label: "通用", code: "100" },
  { id: "anime", label: "动漫", code: "010" },
  { id: "people", label: "人物", code: "001" },
];

export const CATEGORY_LABEL: Record<CategoryId, string> = {
  general: "通用",
  anime: "动漫",
  people: "人物",
};

export const ORIENTATION_LABEL: Record<Orientation, string> = {
  landscape: "横屏",
  portrait: "竖屏",
  square: "方形",
};

export const SORTINGS: Record<SortId, { label: string; api: string }> = {
  random: { label: "随机", api: "random" },
  new: { label: "最新", api: "date_added" },
  favorites: { label: "收藏最多", api: "favorites" },
};

/** 分类 id → wallhaven categories 参数（三位开关：通用/动漫/人物） */
export function categoryCode(id: CategoryId | "all"): string {
  return CATEGORIES.find((c) => c.id === id)?.code ?? "111";
}

export function orientationOf(w: Wallpaper): Orientation {
  const r = w.width / w.height;
  if (r >= 1.15) return "landscape";
  if (r <= 0.87) return "portrait";
  return "square";
}

/** 分辨率档位（按真实宽度） */
export function resClassOf(w: Wallpaper): string {
  if (w.width >= 5000) return "5K";
  if (w.width >= 3800) return "4K";
  if (w.width >= 2500) return "2K";
  if (w.width >= 1900) return "1080P";
  return "HD";
}

export function mapWallhavenItem(item: WallhavenItem): Wallpaper {
  return {
    id: item.id,
    category: (["general", "anime", "people"].includes(item.category) ? item.category : "general") as CategoryId,
    purity: item.purity,
    width: item.dimension_x,
    height: item.dimension_y,
    ratio: item.dimension_x / item.dimension_y,
    views: item.views,
    favorites: item.favorites,
    createdAt: item.created_at,
    fileType: item.file_type,
    fileSize: item.file_size,
    colors: item.colors ?? [],
    fullPath: item.path,
  };
}

/* ---------- 图片 URL ---------- */

/** 卡片缩略图（经代理流式加载，支持进度环；路径与 CDN 同构便于纯前缀代理） */
export function thumbUrl(w: Wallpaper): string {
  return `/api/wallhaven-thumb/lg/${w.id.slice(0, 2)}/${w.id}.jpg`;
}

/** 代理不可用时的兜底直连（<img> 不需要 CORS） */
export function thumbFallbackUrl(w: Wallpaper): string {
  return `https://th.wallhaven.cc/lg/${w.id.slice(0, 2)}/${w.id}.jpg`;
}

/** 灯箱预览图（orig 档缩略图，全分辨率 JPG，经代理流式加载） */
export function previewUrl(w: Wallpaper): string {
  return `/api/wallhaven-thumb/orig/${w.id.slice(0, 2)}/${w.id}.jpg`;
}

export function previewFallbackUrl(w: Wallpaper): string {
  return `https://th.wallhaven.cc/orig/${w.id.slice(0, 2)}/${w.id}.jpg`;
}

/** 下载原图（w.wallhaven.cc 带 CORS，浏览器可直连流式下载） */
export function downloadUrl(w: Wallpaper): string {
  return w.fullPath;
}

export function downloadFilename(w: Wallpaper): string {
  const ext = w.fileType.split("/")[1] ?? "jpg";
  return `wallhaven-${w.id}.${ext}`;
}
