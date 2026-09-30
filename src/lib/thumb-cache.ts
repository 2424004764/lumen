import { fetchBlobWithProgress } from "./progress";

/**
 * 缩略图 blob URL 的模块级缓存：
 * 筛选切换会导致卡片整体重挂载，缓存保证同一张缩略图只请求一次，
 * 命中后直接复用 object URL（秒出）。
 */
const cache = new Map<string, Promise<string>>();

export function loadThumbObjectUrl(
  url: string,
  onProgress?: (pct: number | null, received: number) => void,
): Promise<string> {
  const hit = cache.get(url);
  if (hit) return hit;

  const pending = fetchBlobWithProgress(url, (pct, received) => onProgress?.(pct, received))
    .then((blob) => URL.createObjectURL(blob))
    .catch((err) => {
      // 失败不缓存，下次进入视口可重试
      cache.delete(url);
      throw err;
    });
  cache.set(url, pending);
  return pending;
}
