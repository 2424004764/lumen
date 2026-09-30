import { motion, useReducedMotion, useScroll, useTransform, type Variants } from "motion/react";
import { ArrowDown, Shuffle } from "@phosphor-icons/react";

const HERO_IMG = "https://picsum.photos/seed/lumen-neon-rain/1920/1080";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

export function Hero({ onRandom }: { onRandom: () => void }) {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  // 背景轻微视差，制造纵深；偏好减少动效时位移归零
  const bgY = useTransform(scrollY, [0, 800], [0, reduce ? 0 : 140]);

  return (
    <section id="top" className="relative flex min-h-[92svh] flex-col justify-end overflow-hidden">
      {/* 背景图：外层做视差，内层做 Ken Burns 慢推近（两层分离避免 transform 冲突） */}
      <motion.div style={{ y: bgY }} className="absolute inset-0">
        <img
          src={HERO_IMG}
          alt=""
          fetchPriority="high"
          className="animate-kenburns h-full w-full object-cover"
        />
      </motion.div>

      {/* 压暗层：保证文字可读，并与页面底色自然衔接 */}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/10 to-zinc-950/40" />
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/75 via-zinc-950/15 to-transparent" />

      <motion.div
        variants={container}
        initial={reduce ? false : "hidden"}
        animate="show"
        className="relative z-10 mx-auto w-full max-w-[1400px] px-4 pb-20 pt-32 sm:px-6 md:pb-28"
      >
        <motion.p
          variants={item}
          className="font-display text-xs font-medium uppercase tracking-[0.32em] text-cyan-300/90"
        >
          Lumen Wallpapers
        </motion.p>

        <motion.h1
          variants={item}
          className="mt-5 font-display text-5xl font-semibold leading-[1.08] tracking-[-0.02em] sm:text-6xl lg:text-7xl"
        >
          把世界的
          <span className="bg-gradient-to-r from-cyan-300 via-sky-400 to-cyan-200 bg-clip-text text-transparent">
            光影
          </span>
          <br />
          装进每一块屏幕
        </motion.h1>

        <motion.p variants={item} className="mt-6 max-w-[36em] text-base leading-relaxed text-zinc-300/90 md:text-lg">
          精心挑选的 4K / 5K 高清壁纸，横屏竖屏全覆盖，免费下载。
        </motion.p>

        <motion.div variants={item} className="mt-9 flex flex-wrap items-center gap-3">
          <a
            href="#gallery"
            className="inline-flex h-12 items-center gap-2 rounded-full bg-cyan-400 px-7 font-medium text-zinc-950 transition-all hover:bg-cyan-300 active:scale-[0.98]"
          >
            开始浏览
            <ArrowDown size={17} weight="bold" />
          </a>
          <button
            type="button"
            onClick={onRandom}
            className="inline-flex h-12 items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-6 text-zinc-100 backdrop-blur transition-all hover:bg-white/[0.12] active:scale-[0.98]"
          >
            <Shuffle size={17} className="text-cyan-300" />
            随便看看
          </button>
        </motion.div>
      </motion.div>
    </section>
  );
}
