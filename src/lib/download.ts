import { downloadFilename, downloadUrl, type Wallpaper } from "../data/wallpapers";
import { fetchBlobWithProgress } from "./progress";

/**
 * 下载壁纸：流式读取原图（可带进度回调）转 blob 触发浏览器保存。
 * 后端就绪后，这里改为请求真实下载接口即可。
 */
export async function downloadWallpaper(
  item: Wallpaper,
  onProgress?: (pct: number | null) => void,
): Promise<void> {
  const blob = await fetchBlobWithProgress(downloadUrl(item), (pct) => onProgress?.(pct));
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = downloadFilename(item);
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}

/** fetch 失败时的兜底：新标签页打开原图，由用户手动另存 */
export function fallbackDownload(item: Wallpaper): void {
  window.open(downloadUrl(item), "_blank", "noopener");
}
