import { useEffect, useMemo, useState } from "react";
import { CaretDown, Images, MagnifyingGlass, WarningCircle } from "@phosphor-icons/react";
import {
  CATEGORIES,
  CATEGORY_LABEL,
  type CategoryId,
  type Orientation,
  type Wallpaper,
} from "../data/wallpapers";
import { fetchFirstNonEmptyPage, randomPage, wrapPage } from "../lib/api";
import { useColumnCount, useMasonryColumns } from "../hooks/useMasonry";
import { cn } from "../lib/utils";
import { WallpaperCard } from "./WallpaperCard";

const PAGE_SIZE = 30; // 与接口每页条数对齐：一次请求一整页、完整展示
type OrientationFilter = Orientation | "all";

const SKELETON_RATIOS = [0.75, 1.6, 1, 0.5625, 1.5, 0.8, 1.778, 0.667, 0.75, 1.6, 1, 1.5];
/** 加载更多时预览的骨架块（比例混合典型图型） */
const MORE_SKELETON_RATIOS = [0.75, 1.6, 1, 0.5625, 1.5, 0.8, 1.778, 0.667, 0.75, 1.6, 1, 1.5];

/**
 * 瀑布流形态的骨架屏：与真实卡片同一套贪心分列算法，
 * 保证占位布局、总高度与加载完成后一致（避免滚动条跳动）。
 */
function SkeletonGrid({ ratios, count }: { ratios: number[]; count: number }) {
  const cols: number[][] = Array.from({ length: count }, () => []);
  const heights = new Array<number>(count).fill(0);
  for (const r of ratios) {
    let min = 0;
    for (let i = 1; i < count; i++) {
      if (heights[i] < heights[min]) min = i;
    }
    cols[min].push(r);
    heights[min] += 1 / r + 0.06;
  }
  return (
    <div className="flex gap-3 md:gap-4">
      {cols.map((col, ci) => (
        <div key={ci} className="flex min-w-0 flex-1 flex-col gap-3 md:gap-4">
          {col.map((r, ri) => (
            <div key={ri} className="skeleton-shimmer w-full rounded-2xl" style={{ aspectRatio: r }} />
          ))}
        </div>
      ))}
    </div>
  );
}

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}

function Segmented<T extends string>({ label, value, onChange, options }: SegmentedProps<T>) {
  return (
    <div role="group" aria-label={label} className="flex shrink-0 rounded-full border border-white/10 bg-white/[0.03] p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={cn(
            "h-8 rounded-full px-3 text-xs transition-colors",
            value === o.value ? "bg-white/10 font-medium text-white" : "text-zinc-400 hover:text-zinc-100",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

interface Props {
  onOpen: (list: Wallpaper[], index: number) => void;
}

export function GallerySection({ onOpen }: Props) {
  // 按页存储（页内已按当前排序排好）；pages 为 null 表示首页还在请求中。
  // 每次刷新从随机页开始，加载更多向后环绕翻页，整库循环完才到底。
  const [pages, setPages] = useState<Wallpaper[][] | null>(null);
  const [pageSeq, setPageSeq] = useState<number[]>([]);
  const [nextPage, setNextPage] = useState(1);
  const [error, setError] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [exhausted, setExhausted] = useState(false);

  const [category, setCategory] = useState<CategoryId | "all">("all");
  const [orientation, setOrientation] = useState<OrientationFilter>("all");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  // 起始页在组件生命周期内只抽一次；放在 state 初始化器里，
  // 避免 StrictMode 双执行 effect 时各抽一个随机页、发出两次不同请求
  const [startPage] = useState(() => randomPage());

  const q = query.trim().toLowerCase();
  const filterKey = `${category}|${orientation}|${q}`;

  /** 页内排序：按 id 倒序（picsum 的 id 即入库顺序，id 大 = 较新入库，真实可依） */
  const sortPage = useMemo(() => (list: Wallpaper[]) => [...list].sort((a, b) => b.id - a.id), []);

  // 首屏：从随机页开始请求（startPage 固定，StrictMode 双执行会命中请求去重）
  useEffect(() => {
    let cancelled = false;
    setError(false);
    fetchFirstNonEmptyPage(startPage)
      .then(({ page, list }) => {
        if (cancelled) return;
        setPages([sortPage(list)]);
        setPageSeq([page]);
        setNextPage(wrapPage(page));
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [startPage]);

  const loaded = pages?.flat() ?? [];

  const filtered = useMemo(() => {
    const match = (x: Wallpaper) =>
      (category === "all" || x.category === category) &&
      (orientation === "all" || x.orientation === orientation) &&
      (!q ||
        x.title.toLowerCase().includes(q) ||
        x.author.toLowerCase().includes(q) ||
        x.tags.some((t) => t.toLowerCase().includes(q)) ||
        CATEGORY_LABEL[x.category].includes(q));
    return (pages ?? []).flatMap((p) => sortPage(p).filter(match));
  }, [pages, category, orientation, q, sortPage]);

  // 筛选条件变化时回到第一屏
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filterKey]);

  const shown = filtered.slice(0, visibleCount);

  const colCount = useColumnCount();
  const columns = useMasonryColumns(shown, colCount, loadingMore ? MORE_SKELETON_RATIOS : undefined);

  // 卡片在 filtered 中的原始序号（灯箱导航依赖）
  const indexOf = useMemo(() => {
    const m = new Map<number, number>();
    filtered.forEach((w, i) => m.set(w.id, i));
    return m;
  }, [filtered]);

  const handleRetry = () => {
    setPages(null);
    setError(false);
    fetchFirstNonEmptyPage(randomPage())
      .then(({ page, list }) => {
        setPages([sortPage(list)]);
        setPageSeq([page]);
        setNextPage(wrapPage(page));
      })
      .catch(() => setError(true));
  };

  const handleLoadMore = async () => {
    // 本地还有未展示的（筛选后）先直接展开
    if (visibleCount < filtered.length) {
      setVisibleCount((c) => c + PAGE_SIZE);
      return;
    }
    // 整库循环完毕（下一页已加载过）才到底
    if (loadingMore || exhausted || pageSeq.includes(nextPage)) {
      setExhausted(true);
      return;
    }
    setLoadingMore(true);
    try {
      const { page, list } = await fetchFirstNonEmptyPage(nextPage);
      setPages((prev) => [...(prev ?? []), sortPage(list)]);
      setPageSeq((prev) => [...prev, page]);
      setNextPage(wrapPage(page));
      setVisibleCount((c) => c + PAGE_SIZE);
    } catch {
      // 加载更多失败不打断页面，按钮仍在，用户可重试
    } finally {
      setLoadingMore(false);
    }
  };

  const handleReset = () => {
    setCategory("all");
    setOrientation("all");
    setQuery("");
  };

  const moreAvailable = visibleCount < filtered.length || !exhausted;

  return (
    <section id="gallery" className="scroll-mt-14">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3 pb-8 pt-14 md:pb-10 md:pt-20">
          <h2 className="font-display text-2xl font-semibold tracking-tight md:text-4xl">壁纸库</h2>
          <p className="text-sm text-zinc-500">
            {pages === null ? "加载中" : `已加载 ${loaded.length} 张`}
            {q && <>，搜索 “{query.trim()}”</>}
          </p>
        </div>
      </div>

      {/* 粘性筛选栏 */}
      <div className="sticky top-16 z-30 border-y border-white/[0.06] bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center">
          <div className="no-scrollbar -mx-1 flex flex-1 gap-2 overflow-x-auto px-1">
            {CATEGORIES.map((c) => {
              const active = category === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  aria-pressed={active}
                  className={cn(
                    "h-9 shrink-0 rounded-full border px-4 text-sm transition-all active:scale-[0.97]",
                    active
                      ? "border-transparent bg-cyan-400 font-medium text-zinc-950"
                      : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/25 hover:text-zinc-100",
                  )}
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full lg:w-60 lg:flex-none">
              <MagnifyingGlass size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索壁纸、标签或作者"
                aria-label="搜索壁纸"
                className="h-10 w-full rounded-full border border-white/10 bg-white/[0.04] pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-cyan-300/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
              />
            </div>
            <Segmented
              label="筛选方向"
              value={orientation}
              onChange={setOrientation}
              options={[
                { value: "all", label: "全部" },
                { value: "landscape", label: "横屏" },
                { value: "portrait", label: "竖屏" },
                { value: "square", label: "方形" },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-4 pb-4 sm:px-6">
        {/* 首屏请求失败 */}
        {error && (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <WarningCircle size={44} className="text-zinc-700" />
            <div>
              <h3 className="text-lg font-medium text-zinc-300">壁纸列表加载失败</h3>
              <p className="mt-1.5 text-sm text-zinc-500">无法连接 Picsum 接口，请检查网络后重试</p>
            </div>
            <button
              type="button"
              onClick={handleRetry}
              className="mt-2 inline-flex h-11 items-center rounded-full bg-cyan-400 px-6 text-sm font-medium text-zinc-950 transition-all hover:bg-cyan-300 active:scale-[0.98]"
            >
              重新加载
            </button>
          </div>
        )}

        {/* 首屏加载骨架（瀑布流形态） */}
        {!error && pages === null && (
          <div className="mt-8 md:mt-10">
            <SkeletonGrid ratios={SKELETON_RATIOS} count={colCount} />
          </div>
        )}

        {/* 空结果 */}
        {!error && pages !== null && filtered.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <Images size={44} className="text-zinc-700" />
            <div>
              <h3 className="text-lg font-medium text-zinc-300">没有找到匹配的壁纸</h3>
              <p className="mt-1.5 text-sm text-zinc-500">
                换个关键词，或清除当前筛选条件试试（搜索范围：已加载的 {loaded.length} 张）
              </p>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="mt-2 inline-flex h-11 items-center rounded-full border border-white/12 px-6 text-sm text-zinc-200 transition-all hover:border-cyan-300/50 hover:text-cyan-200 active:scale-[0.98]"
            >
              清除筛选
            </button>
          </div>
        )}

        {!error && pages !== null && filtered.length > 0 && (
          <>
            {/* 瀑布流：JS 贪心分列（追加不重排），骨架块直接续在各列末尾，贴合新卡片的落位 */}
            <div key={filterKey} className="mt-8 flex gap-3 md:mt-10 md:gap-4">
              {columns.map((col, ci) => (
                <div key={ci} className="flex min-w-0 flex-1 flex-col gap-3 md:gap-4">
                  {col.items.map((w) => (
                    <WallpaperCard
                      key={w.id}
                      wallpaper={w}
                      index={indexOf.get(w.id) ?? 0}
                      onOpen={() => onOpen(filtered, indexOf.get(w.id) ?? 0)}
                    />
                  ))}
                  {col.skeleton.map((ratio, ri) => (
                    <div key={`sk-${ri}`} className="skeleton-shimmer w-full rounded-2xl" style={{ aspectRatio: ratio }} />
                  ))}
                </div>
              ))}
            </div>

            <div className="flex flex-col items-center gap-3 pb-4 pt-10">
              {!loadingMore && moreAvailable && (
                <button
                  type="button"
                  onClick={handleLoadMore}
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-white/12 px-8 text-sm text-zinc-200 transition-all hover:border-cyan-300/50 hover:text-cyan-200 active:scale-[0.98]"
                >
                  加载更多
                  <CaretDown size={15} weight="bold" />
                </button>
              )}
              {!loadingMore && moreAvailable && visibleCount >= filtered.length && !exhausted && (
                <p className="text-xs text-zinc-600">还有更多壁纸</p>
              )}
              {!loadingMore && !moreAvailable && loaded.length > PAGE_SIZE && (
                <p className="text-xs text-zinc-600">已经到底了</p>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
