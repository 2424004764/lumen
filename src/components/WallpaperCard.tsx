import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import { CircleNotch, DownloadSimple } from "@phosphor-icons/react";
import { ORIENTATION_LABEL, thumbUrl, type Wallpaper } from "../data/wallpapers";
import { downloadWallpaper, fallbackDownload } from "../lib/download";
import { loadThumbObjectUrl } from "../lib/thumb-cache";
import { cn } from "../lib/utils";
import { ProgressRing } from "./ProgressRing";
import { useToast } from "./Toast";

interface Props {
  wallpaper: Wallpaper;
  index: number;
  onOpen: () => void;
}

export function WallpaperCard({ wallpaper: w, index, onOpen }: Props) {
  // 首屏前 8 张直接加载，其余进入视口附近再请求
  const [inView, setInView] = useState(index < 8);
  const [displaySrc, setDisplaySrc] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [received, setReceived] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const cardRef = useRef<HTMLElement | null>(null);
  const [downloading, setDownloading] = useState(false);
  const reduce = useReducedMotion();
  const notify = useToast();

  // 视口外的卡片滚动到附近（300px 提前量）才开始加载
  useEffect(() => {
    if (inView) return;
    const el = cardRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setInView(true);
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [inView]);

  // 流式加载缩略图：进度环显示百分比，完成后 blob 直出（缓存命中秒出）
  useEffect(() => {
    if (!inView) return;
    let cancelled = false;
    loadThumbObjectUrl(thumbUrl(w), (pct, got) => {
      if (cancelled) return;
      setProgress(pct);
      setReceived(got);
    })
      .then((url) => {
        if (cancelled) return;
        setDisplaySrc(url);
        setProgress(100);
      })
      .catch(() => {
        if (cancelled) return;
        // 兜底：退回浏览器直接加载
        setDisplaySrc(thumbUrl(w));
      });
    return () => {
      cancelled = true;
    };
  }, [inView, w.id]);

  const handleQuickDownload = async (e: MouseEvent) => {
    e.stopPropagation();
    if (downloading) return;
    setDownloading(true);
    try {
      await downloadWallpaper(w);
      notify("壁纸已开始下载");
    } catch {
      fallbackDownload(w);
      notify("自动下载失败，已在新标签页打开图片", "error");
    } finally {
      setDownloading(false);
    }
  };

  const handleKeydown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen();
    }
  };

  return (
    <motion.figure
      ref={cardRef}
      data-id={w.id}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.55, delay: Math.min(index, 7) * 0.05, ease: [0.16, 1, 0.3, 1] }}
      role="button"
      tabIndex={0}
      aria-label={`查看壁纸「${w.title}」`}
      onClick={onOpen}
      onKeyDown={handleKeydown}
      className="group relative cursor-zoom-in overflow-hidden rounded-2xl border border-white/[0.05] bg-zinc-900/60 outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
    >
      {/* 固定宽高比，加载前由骨架占位，避免布局抖动 */}
      <div className="relative overflow-hidden" style={{ aspectRatio: w.ratio }}>
        <div aria-hidden="true" className="skeleton-shimmer absolute inset-0" />

        {inView && !loaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <ProgressRing progress={progress} received={received} size={44} compact />
          </div>
        )}

        {displaySrc && (
          <img
            src={displaySrc}
            alt={w.title}
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setLoaded(true)}
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-700 ease-out group-hover:scale-[1.05]",
              loaded ? "opacity-100" : "opacity-0",
            )}
          />
        )}

        {/* 悬停信息层（只展示由接口尺寸算出的真实规格） */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-zinc-950/85 via-zinc-950/25 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <figcaption className="translate-y-2 transition-transform duration-300 group-hover:translate-y-0">
            <p className="flex items-center gap-3 text-xs text-zinc-300/90">
              <span className="font-display font-semibold text-cyan-200">{w.resClass}</span>
              <span>{ORIENTATION_LABEL[w.orientation]}</span>
            </p>
          </figcaption>
        </div>

        {/* 快捷下载 */}
        <button
          type="button"
          onClick={handleQuickDownload}
          aria-label={`下载「${w.title}」`}
          className="absolute right-3 top-3 flex size-9 translate-y-[-6px] items-center justify-center rounded-full border border-white/15 bg-zinc-950/60 text-white opacity-0 backdrop-blur transition-all duration-300 hover:border-transparent hover:bg-cyan-400 hover:text-zinc-950 active:scale-95 group-hover:translate-y-0 group-hover:opacity-100"
        >
          {downloading ? (
            <CircleNotch size={16} className="animate-spin" />
          ) : (
            <DownloadSimple size={16} weight="bold" />
          )}
        </button>
      </div>
    </motion.figure>
  );
}
