/**
 * 数据层：壁纸列表来自 Picsum 官方接口 https://picsum.photos/v2/list（实时请求、分页）。
 * 接口只提供 id / 作者 / 尺寸，标题、分类、热度等字段由 id 确定性生成，保证同一张图信息稳定。
 * 后端就绪后：把 lib/api.ts 里的接口地址换掉、并按真实字段调整 mapPicsumItem 即可。
 */

export type CategoryId = "nature" | "city" | "architecture" | "abstract" | "minimal" | "night";
export type Orientation = "landscape" | "portrait" | "square";
export type ResClass = "2K" | "4K" | "5K";

export interface Wallpaper {
  id: number; // Picsum 图片 id
  title: string;
  category: CategoryId;
  orientation: Orientation;
  ratio: number; // 宽 / 高
  resClass: ResClass;
  author: string;
  downloads: number;
  likes: number;
  createdAt: string; // ISO 日期
  tags: string[];
  origW: number;
  origH: number;
}

/** Picsum /v2/list 的原始条目 */
export interface PicsumItem {
  id: string;
  author: string;
  width: number;
  height: number;
  url: string;
  download_url: string;
}

export const CATEGORIES: { id: CategoryId | "all"; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "nature", label: "自然" },
  { id: "city", label: "城市" },
  { id: "architecture", label: "建筑" },
  { id: "abstract", label: "抽象" },
  { id: "minimal", label: "极简" },
  { id: "night", label: "夜色" },
];

export const CATEGORY_LABEL: Record<CategoryId, string> = {
  nature: "自然",
  city: "城市",
  architecture: "建筑",
  abstract: "抽象",
  minimal: "极简",
  night: "夜色",
};

export const ORIENTATION_LABEL: Record<Orientation, string> = {
  landscape: "横屏",
  portrait: "竖屏",
  square: "方形",
};

/* ---------- 由 id 确定性生成的演示字段 ---------- */

const CATEGORY_ORDER: CategoryId[] = ["nature", "city", "architecture", "abstract", "minimal", "night"];

const TITLE_BANK: Record<CategoryId, [string[], string[]]> = {
  nature: [
    ["山雾", "湖面", "松风", "暮色", "雪线", "晨雾", "海岸", "溪谷", "云影", "旷野"],
    ["未散", "微光", "之上", "深处", "低语", "尽头", "来信", "初醒"],
  ],
  city: [
    ["霓虹", "天桥", "街灯", "幕墙", "地铁", "车流", "巷口", "夜市"],
    ["雨夜", "之后", "末班", "六点", "折射", "灯火"],
  ],
  architecture: [
    ["楼梯", "拱门", "立面", "走廊", "廊柱", "穹顶", "天井"],
    ["几何", "光影", "之下", "序列", "留白"],
  ],
  abstract: [
    ["流体", "色谱", "噪点", "波纹", "光斑", "折叠"],
    ["实验", "运动", "梦境", "演算"],
  ],
  minimal: [
    ["留白", "单色", "线条", "灰阶", "白墙"],
    ["练习", "研究", "之间", "独处"],
  ],
  night: [
    ["银河", "星轨", "月光", "萤火", "夜色", "灯塔"],
    ["铁轨", "海岸", "之森", "长曝光"],
  ],
};

function orientationOf(ratio: number): Orientation {
  if (ratio >= 1.15) return "landscape";
  if (ratio <= 0.87) return "portrait";
  return "square";
}

function resClassOf(width: number): ResClass {
  if (width >= 4500) return "5K";
  if (width >= 2600) return "4K";
  return "2K";
}

/** 接口条目 → 站内壁纸模型（同一 id 永远生成相同信息） */
export function mapPicsumItem(item: PicsumItem): Wallpaper {
  const id = Number.parseInt(item.id, 10) || 0;
  const ratio = item.width / item.height;
  const category = CATEGORY_ORDER[id % CATEGORY_ORDER.length];
  const [heads, tails] = TITLE_BANK[category];
  const title = heads[(id * 7 + 2) % heads.length] + tails[(id * 3 + 5) % tails.length];
  const daysAgo = (id * 11) % 200;
  return {
    id,
    title,
    category,
    orientation: orientationOf(ratio),
    ratio: Math.round(ratio * 1000) / 1000,
    resClass: resClassOf(item.width),
    author: item.author,
    downloads: 400 + ((id * 3709) % 42000),
    likes: 60 + ((id * 137) % 3800),
    createdAt: new Date(Date.UTC(2026, 8, 29) - daysAgo * 86400000).toISOString().slice(0, 10),
    tags: [CATEGORY_LABEL[category], title],
    origW: item.width,
    origH: item.height,
  };
}

/* ---------- 图片 URL（按 id 请求原始尺寸，实时加载） ---------- */

const base = (id: number) => `https://picsum.photos/id/${id}`;

/** 卡片缩略图（宽固定 600，高按比例） */
export function thumbUrl(w: Wallpaper): string {
  return `${base(w.id)}/600/${Math.round(600 / w.ratio)}`;
}

/** 灯箱预览图（约 1280px 级别） */
export function previewUrl(w: Wallpaper): string {
  const width = w.ratio >= 1 ? 1280 : Math.round(1280 * w.ratio);
  return `${base(w.id)}/${width}/${Math.round(width / w.ratio)}`;
}

/** 下载用原图（接口返回的原始尺寸） */
export function downloadUrl(w: Wallpaper): string {
  return `${base(w.id)}/${w.origW}/${w.origH}`;
}

export function downloadFilename(w: Wallpaper): string {
  return `lumen-${String(w.id).padStart(3, "0")}-${w.resClass}.jpg`;
}
