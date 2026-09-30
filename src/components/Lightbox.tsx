import { useEffect, useRef, useState, type TouchEvent } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  CircleNotch,
  DownloadSimple,
  Eye,
  Heart,
  X,
} from "@phosphor-icons/react";
import {
  CATEGORY_LABEL,
  ORIENTATION_LABEL,
  downloadFilename,
  orientationOf,
  previewFallbackUrl,
  previewUrl,
  resClassOf,
  type Wallpaper,
} from "../data/wallpapers";
import { downloadWallpaper, fallbackDownload } from "../lib/download";
import { fetchBlobWithProgress } from "../lib/progress";
import { cn, formatBytes, formatCount, formatDate } from "../lib/utils";
import { ProgressRing } from "./ProgressRing";
import { useToast } from "./Toast";

interface Props {
  list: Wallpaper[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

export function Lightbox({ list, index, onClose, onIndexChange }: Props) {
  const w = list[index];
  const [displaySrc, setDisplaySrc] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [received, setReceived] = useState(0);
  const [imgVisible, setImgVisible] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [dlProgress, setDlProgress] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const notify = useToast();

  const prev = () => onIndexChange((index - 1 + list.length) % list.length);
  const next = () => onIndexChange((index + 1) % list.length);

  // 键盘导航
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // 打开时锁定页面滚动，并聚焦关闭按钮
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  // 预览图流式预加载：真实百分比进度，完成后以 blob 直出
  useEffect(() => {
    const controller = new AbortController();
    setDisplaySrc(null);
    setProgress(null);
    setReceived(0);
    setImgVisible(false);

    fetchBlobWithProgress(
      previewUrl(w),
      (pct, got) => {
        setProgress(pct);
        setReceived(got);
      },
      controller.signal,
    )
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;
        setDisplaySrc(url);
        setProgress(100);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        // 兜底：代理不可用时直连缩略图 CDN
        setDisplaySrc(previewFallbackUrl(w));
      });

    return () => {
      controller.abort();
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [w.id]);

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    setDlProgress(null);
    try {
      await downloadWallpaper(w, (pct) => setDlProgress(pct));
      notify(`已下载 ${downloadFilename(w)}`);
    } catch {
      fallbackDownload(w);
      notify("自动下载失败，已在新标签页打开图片", "error");
    } finally {
      setDownloading(false);
      setDlProgress(null);
    }
  };

  const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    if (Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) next();
      else prev();
    }
    touchStart.current = null;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      role="dialog"
      aria-modal="true"
      aria-label="壁纸预览"
      className="fixed inset-0 z-50 flex flex-col"
    >
      {/* 背板 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-zinc-950/85 backdrop-blur-md"
      />

      {/* 顶栏 */}
      <div className="relative z-10 flex h-16 items-center justify-between px-4 md:px-6">
        <p className="font-display text-sm tabular-nums text-zinc-400">
          {String(index + 1).padStart(2, "0")}
          <span className="mx-1.5 text-zinc-600">/</span>
          {String(list.length).padStart(2, "0")}
        </p>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="关闭预览"
          className="flex size-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.05] text-zinc-200 transition-all hover:bg-white/[0.14] hover:text-white active:scale-95"
        >
          <X size={18} />
        </button>
      </div>

      {/* 图片区：容器不拦截点击，空白处点击穿透到背板关闭 */}
      <div
        className="pointer-events-none relative z-10 flex min-h-0 flex-1 items-center justify-center px-4 py-2 md:px-24"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {!imgVisible && <ProgressRing progress={progress} received={received} />}

        {displaySrc && (
          <motion.img
            key={w.id}
            src={displaySrc}
            alt={`${resClassOf(w)} ${ORIENTATION_LABEL[orientationOf(w)]}壁纸预览`}
            onLoad={() => setImgVisible(true)}
            initial={{ opacity: 0, scale: 0.965 }}
            animate={{ opacity: imgVisible ? 1 : 0, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "pointer-events-auto max-h-full max-w-full select-none rounded-xl object-contain shadow-2xl shadow-black/50",
            )}
          />
        )}

        <button
          type="button"
          onClick={prev}
          aria-label="上一张"
          className="pointer-events-auto absolute left-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-zinc-900/70 text-zinc-200 backdrop-blur transition-all hover:border-cyan-300/40 hover:text-cyan-200 active:scale-95 md:left-6"
        >
          <ArrowLeft size={18} />
        </button>
        <button
          type="button"
          onClick={next}
          aria-label="下一张"
          className="pointer-events-auto absolute right-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-zinc-900/70 text-zinc-200 backdrop-blur transition-all hover:border-cyan-300/40 hover:text-cyan-200 active:scale-95 md:right-6"
        >
          <ArrowRight size={18} />
        </button>
      </div>

      {/* 底部信息栏 */}
      <div className="relative z-10 px-4 pb-5 pt-3 md:px-6 md:pb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto flex max-w-[1400px] flex-col gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.05] px-5 py-4 backdrop-blur-xl md:flex-row md:items-center md:justify-between"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-400">
              <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2.5 py-0.5 text-cyan-300">
                {CATEGORY_LABEL[w.category]}
              </span>
              <span>{ORIENTATION_LABEL[orientationOf(w)]}</span>
              <span className="font-display tabular-nums">
                {w.width} × {w.height}
              </span>
              <span className="inline-flex items-center gap-1">
                <Eye size={12} />
                {formatCount(w.views)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Heart size={12} weight="fill" className="text-rose-400/80" />
                {formatCount(w.favorites)}
              </span>
              <span>{formatDate(w.createdAt)}</span>
              <span className="font-display tabular-nums">{formatBytes(w.fileSize)}</span>
              {w.colors.length > 0 && (
                <span className="inline-flex items-center gap-1" aria-label="主色调">
                  {w.colors.slice(0, 5).map((c) => (
                    <span
                      key={c}
                      className="size-3 rounded-full border border-white/15"
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-cyan-400 px-7 font-medium text-zinc-950 transition-all hover:bg-cyan-300 active:scale-[0.98] disabled:cursor-wait disabled:opacity-75"
          >
            {downloading ? (
              <>
                <CircleNotch size={17} className="animate-spin" />
                {dlProgress !== null ? `下载中 ${dlProgress}%` : "准备原图中"}
              </>
            ) : (
              <>
                <DownloadSimple size={17} weight="bold" />
                下载 {resClassOf(w)} 原图
              </>
            )}
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
