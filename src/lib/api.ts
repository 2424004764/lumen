import { mapPicsumItem, type PicsumItem, type Wallpaper } from "../data/wallpapers";

const API = "https://picsum.photos/v2/list";
export const API_LIMIT = 30;

/** Picsum 全库页数（每页 30 张，共约 993 张图；超范围页返回空数组，由空页跳过逻辑兜底） */
export const TOTAL_PAGES = 34;

/** 随机起始页：每次刷新进入不同的壁纸集合 */
export function randomPage(): number {
  return 1 + Math.floor(Math.random() * TOTAL_PAGES);
}

/** 翻页环绕：最后一页之后回到第 1 页 */
export function wrapPage(page: number): number {
  return (page % TOTAL_PAGES) + 1;
}

/** 从 from 页开始取第一个非空页（自动跳过空页并回绕），用于随机起点与环绕翻页 */
export async function fetchFirstNonEmptyPage(from: number): Promise<{ page: number; list: Wallpaper[] }> {
  let page = from;
  for (let i = 0; i < TOTAL_PAGES; i++) {
    const list = await fetchWallpapers(page);
    if (list.length > 0) return { page, list };
    page = wrapPage(page);
  }
  throw new Error("壁纸库无可用数据");
}

/** 已加载分页缓存（Map 保持插入顺序，getCached 按页序展开） */
const pages = new Map<number, Wallpaper[]>();
/** 进行中的请求（并发去重，避免 StrictMode 双执行等场景重复请求同一页） */
const inFlight = new Map<number, Promise<Wallpaper[]>>();

/** 请求一页壁纸列表；同一页并发只发一次请求，结果缓存复用 */
export function fetchWallpapers(page: number): Promise<Wallpaper[]> {
  const cached = pages.get(page);
  if (cached) return Promise.resolve(cached);

  let pending = inFlight.get(page);
  if (!pending) {
    pending = fetch(`${API}?page=${page}&limit=${API_LIMIT}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`壁纸列表请求失败：HTTP ${res.status}`);
        const data: unknown = await res.json();
        const list = (Array.isArray(data) ? data : []).map((raw) => mapPicsumItem(raw as PicsumItem));
        pages.set(page, list);
        return list;
      })
      .finally(() => {
        inFlight.delete(page);
      });
    inFlight.set(page, pending);
  }
  return pending;
}

/** 已加载的全部壁纸（用于“随机一张”等场景） */
export function getCached(): Wallpaper[] {
  return [...pages.values()].flat();
}

/** 确保第一页可用（供随机入口在画廊未加载时兜底） */
export async function ensureFirstPage(): Promise<Wallpaper[]> {
  try {
    return await fetchWallpapers(1);
  } catch {
    return [];
  }
}
