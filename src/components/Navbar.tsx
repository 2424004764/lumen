import { useId, useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { Shuffle } from "@phosphor-icons/react";
import { cn } from "../lib/utils";

/** 棱镜 logo：简单的几何标记（三角形 + 光点） */
export function LogoMark({ size = 28 }: { size?: number }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#67e8f9" />
          <stop offset="1" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="#0b0c0f" />
      <path d="M16 7.5l7.5 14h-15z" fill="none" stroke={`url(#${id})`} strokeWidth="2.4" strokeLinejoin="round" />
      <circle cx="16" cy="17.5" r="2" fill={`url(#${id})`} />
    </svg>
  );
}

export function Navbar({ onRandom }: { onRandom: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 24));

  return (
    <motion.header
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-colors duration-300",
        scrolled
          ? "border-b border-white/[0.06] bg-zinc-950/75 shadow-lg shadow-black/20 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 sm:px-6">
        <a href="#top" className="flex items-center gap-2.5" aria-label="返回顶部，流明壁纸">
          <LogoMark />
          <span className="font-display text-[17px] font-semibold tracking-tight">流明壁纸</span>
          <span className="hidden font-display text-[11px] font-medium uppercase tracking-[0.28em] text-zinc-500 sm:inline">
            Lumen
          </span>
        </a>

        <nav className="flex items-center gap-2" aria-label="主导航">
          <a
            href="#gallery"
            className="hidden rounded-full px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white md:inline-flex"
          >
            壁纸库
          </a>
          <button
            type="button"
            onClick={onRandom}
            aria-label="随机查看一张壁纸"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm text-zinc-200 transition-all hover:border-cyan-300/40 hover:bg-white/[0.08] hover:text-white active:scale-[0.97]"
          >
            <Shuffle size={16} className="text-cyan-300" />
            <span className="hidden sm:inline">随机一张</span>
          </button>
        </nav>
      </div>
    </motion.header>
  );
}
