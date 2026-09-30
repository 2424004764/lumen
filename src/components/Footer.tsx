import { ArrowSquareOut } from "@phosphor-icons/react";
import { CATEGORIES } from "../data/wallpapers";
import { LogoMark } from "./Navbar";

/** 带 UTM 来源参数，工具箱侧可统计从本站页脚跳入的流量 */
const TOOLS_URL =
  "https://tool.fologde.com/?utm_source=lumen-wallpapers&utm_medium=footer";

export function Footer() {
  return (
    <footer id="about" className="mt-16 border-t border-white/[0.06]">
      <div className="mx-auto max-w-[1400px] px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.6fr_1fr_1.2fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <LogoMark size={26} />
              <span className="font-display text-[16px] font-semibold tracking-tight">流明壁纸</span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-zinc-500">
              精心挑选的高清壁纸，让每一块屏幕都值得停留。
            </p>
          </div>

          <nav aria-label="分类导航">
            <h4 className="mb-3 text-sm font-medium text-zinc-300">浏览</h4>
            <ul className="space-y-2.5">
              {CATEGORIES.filter((c) => c.id !== "all").map((c) => (
                <li key={c.id}>
                  <a href="#gallery" className="text-sm text-zinc-500 transition-colors hover:text-cyan-200">
                    {c.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h4 className="mb-3 text-sm font-medium text-zinc-300">关于</h4>
            <a
              href={TOOLS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-zinc-300 transition-colors hover:text-cyan-200"
            >
              yifang 工具箱打造
              <ArrowSquareOut size={14} className="text-zinc-500" />
            </a>
            <p className="mt-2 text-xs leading-relaxed text-zinc-600">
              壁纸数据与图片服务来自 Picsum
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col justify-between gap-2 border-t border-white/[0.06] pt-6 text-xs text-zinc-600 sm:flex-row">
          <span>© 2026 流明壁纸 LUMEN</span>
        </div>
      </div>
    </footer>
  );
}
