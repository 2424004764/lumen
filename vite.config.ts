import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { HttpsProxyAgent } from "https-proxy-agent";

// 本地开发时，上游 wallhaven 可能需要走系统代理才能访问（如 HTTP_PROXY/HTTPS_PROXY）
const proxyUrl =
  process.env.HTTPS_PROXY ?? process.env.https_proxy ?? process.env.HTTP_PROXY ?? process.env.http_proxy;
const upstreamAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    // 开发环境代理：CF Pages Function 只在生产生效，本地由 Vite 转发到 wallhaven
    proxy: {
      // 注意：thumb 规则必须在前，避免被 /api/wallhaven 前缀误匹配
      "/api/wallhaven-thumb": {
        target: "https://th.wallhaven.cc",
        changeOrigin: true,
        agent: upstreamAgent,
        rewrite: (path) => path.replace(/^\/api\/wallhaven-thumb/, ""),
      },
      "/api/wallhaven": {
        target: "https://wallhaven.cc",
        changeOrigin: true,
        agent: upstreamAgent,
        rewrite: (path) => path.replace(/^\/api\/wallhaven/, "/api/v1/search"),
      },
    },
  },
});
