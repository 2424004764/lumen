import { useEffect, useMemo, useState } from "react";
import type { Wallpaper } from "../data/wallpapers";

/** 响应式列数：手机 2 列 / 平板 3 列 / 桌面 4 列 */
export function useColumnCount(): number {
  const [count, setCount] = useState(() =>
    typeof window === "undefined" ? 4 : window.matchMedia("(min-width: 1280px)").matches ? 4 : window.matchMedia("(min-width: 768px)").matches ? 3 : 2,
  );

  useEffect(() => {
    const xl = window.matchMedia("(min-width: 1280px)");
    const md = window.matchMedia("(min-width: 768px)");
    const update = () => setCount(xl.matches ? 4 : md.matches ? 3 : 2);
    xl.addEventListener("change", update);
    md.addEventListener("change", update);
    update();
    return () => {
      xl.removeEventListener("change", update);
      md.removeEventListener("change", update);
    };
  }, []);

  return count;
}

export interface MasonryColumn {
  items: Wallpaper[];
  /** 追加在该列末尾的骨架块宽高比（加载更多时） */
  skeleton: number[];
}

/**
 * 贪心瀑布流分列：每张图放入当前最矮的列。
 * 算法按序确定性执行，前缀分配结果只取决于前缀本身，
 * 因此「追加」新图不会改变已有图所在列，只会接到某列末尾（解决 CSS columns 追加重排问题）。
 * skeletonRatios 非空时，从各列当前累计高度继续贪心分配骨架块，
 * 保证骨架出现的位置就是后续新卡片将要落位的位置（加载更多时视觉连续）。
 */
export function useMasonryColumns(
  wallpapers: Wallpaper[],
  count: number,
  skeletonRatios: number[] = EMPTY_RATIOS,
): MasonryColumn[] {
  return useMemo(() => {
    const cols: MasonryColumn[] = Array.from({ length: count }, () => ({ items: [], skeleton: [] }));
    const heights = new Array<number>(count).fill(0);
    for (const w of wallpapers) {
      let min = 0;
      for (let i = 1; i < count; i++) {
        if (heights[i] < heights[min]) min = i;
      }
      cols[min].items.push(w);
      // 列内卡片高度 ∝ 1/ratio，再计入间距的固定开销
      heights[min] += 1 / w.ratio + 0.06;
    }
    for (const r of skeletonRatios) {
      let min = 0;
      for (let i = 1; i < count; i++) {
        if (heights[i] < heights[min]) min = i;
      }
      cols[min].skeleton.push(r);
      heights[min] += 1 / r + 0.06;
    }
    return cols;
  }, [wallpapers, count, skeletonRatios]);
}

const EMPTY_RATIOS: number[] = [];
