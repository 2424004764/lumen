// CF Pages Function：缩略图代理
// th.wallhaven.cc（缩略图 CDN）不带 CORS 头，直连无法用 fetch 流式读取（百分比进度环），
// 经此转发并透传 Content-Length，让前端进度可见。原图（w.wallhaven.cc）有 CORS，无需代理。
// 路由与 CDN 路径同构：/api/wallhaven-thumb/{size}/{两位子目录}/{id}.jpg
export const onRequestGet = async ({
  params,
}: {
  params: { size: string; sub: string; file: string };
}) => {
  const { size, sub, file } = params;
  if (!["lg", "small", "orig"].includes(size) || !/^[a-z0-9]{2}$/.test(sub) || !/^[a-z0-9]+\.jpg$/i.test(file)) {
    return new Response("bad request", { status: 400 });
  }

  const target = `https://th.wallhaven.cc/${size}/${sub}/${file}`;
  const upstream = await fetch(target, { cf: { cacheTtl: 2678400, cacheEverything: true } });

  const headers = new Headers();
  headers.set("content-type", upstream.headers.get("content-type") ?? "image/jpeg");
  const length = upstream.headers.get("content-length");
  if (length) headers.set("content-length", length);
  headers.set("cache-control", "public, max-age=2678400, immutable");

  return new Response(upstream.body, { status: upstream.status, headers });
};
