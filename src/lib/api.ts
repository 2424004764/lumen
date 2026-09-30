import { mapWallhavenItem, type WallhavenItem, type Wallpaper } from "../data/wallpapers";

/**
 * 画廊查询（服务端执行：搜索 / 分类 / 排序 / 随机种子）
 * 经 CF Pages Function 代理访问 wallhaven；结果按查询条件 + 页码缓存。
 */
const API = "/api/wallhaven";

export interface GalleryQuery {
  q: string;
  categories: string; // "111" | "100" | "010" | "001"
  sorting: string; // random | date_added | favorites | views
  seed: string | null; // random 排序的会话种子（跨页保持同一随机序列）
}

export interface PageResult {
  list: Wallpaper[];
  seed: string | null; // wallhaven 实际使用的种子（后续页要带上）
  lastPage: number;
}

const cache = new Map<string, Promise<PageResult>>();
const inFlight = new Map<string, Promise<PageResult>>();

export function randomSeed(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export function fetchGalleryPage(query: GalleryQuery, page: number): Promise<PageResult> {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  params.set("categories", query.categories);
  params.set("sorting", query.sorting);
  if (query.seed) params.set("seed", query.seed);
  params.set("page", String(page));

  const key = params.toString();
  const cached = cache.get(key);
  if (cached) return cached;

  let pending = inFlight.get(key);
  if (!pending) {
    pending = fetch(`${API}?${key}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`壁纸列表请求失败：HTTP ${res.status}`);
        const data = (await res.json()) as { data?: unknown; meta?: { seed?: string; last_page?: number } };
        const list = (Array.isArray(data.data) ? data.data : []).map((raw) =>
          mapWallhavenItem(raw as WallhavenItem),
        );
        return { list, seed: data.meta?.seed ?? null, lastPage: data.meta?.last_page ?? page };
      })
      .finally(() => inFlight.delete(key));
    inFlight.set(key, pending);
    pending
      .then((result) => cache.set(key, Promise.resolve(result)))
      .catch(() => {
        /* 失败不缓存 */
      });
  }
  return pending;
}
