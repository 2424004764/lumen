// CF Pages Function：壁纸列表代理
// wallhaven 的 API 不返回 CORS 头，浏览器直连会被拦，经服务端转发。
// 只透传白名单参数；未指定 purity 时强制 SFW。
const ALLOWED_PARAMS = new Set(["q", "categories", "purity", "sorting", "order", "page", "seed", "ratios"]);

export const onRequestGet = async ({ request }: { request: Request }) => {
  const { searchParams } = new URL(request.url);
  const target = new URL("https://wallhaven.cc/api/v1/search");
  for (const [key, value] of searchParams) {
    if (ALLOWED_PARAMS.has(key) && value) target.searchParams.set(key, value);
  }
  if (!target.searchParams.has("purity")) target.searchParams.set("purity", "100");

  const upstream = await fetch(target.toString(), {
    headers: { Accept: "application/json" },
    cf: { cacheTtl: 300, cacheEverything: true },
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
};
