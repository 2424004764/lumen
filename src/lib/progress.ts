/**
 * 带进度回调的 blob 加载：
 * 服务端返回 Content-Length 时给真实百分比（0-99，完成时 100）；
 * 拿不到大小时 pct 为 null，调用方可用 received 展示已接收字节数。
 * 注意：跨域响应的 Content-Length 属于 CORS 安全列表头，Picsum 可用；
 * 若目标服务未放行，会自动退化为 null（不确定进度）而不报错。
 */
export async function fetchBlobWithProgress(
  url: string,
  onProgress: (pct: number | null, received: number) => void,
  signal?: AbortSignal,
): Promise<Blob> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`请求失败：HTTP ${res.status}`);

  const total = Number(res.headers.get("content-length")) || 0;
  if (!res.body) {
    const blob = await res.blob();
    onProgress(100, blob.size);
    return blob;
  }

  const reader = res.body.getReader();
  const chunks: BlobPart[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.byteLength;
    onProgress(total ? Math.min(99, Math.floor((received / total) * 100)) : null, received);
  }

  const blob = new Blob(chunks, { type: res.headers.get("content-type") ?? "image/jpeg" });
  onProgress(100, blob.size);
  return blob;
}
