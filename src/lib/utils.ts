export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** 下载量等数字的中文习惯格式：40213 -> 4 万，9812 -> 9,812 */
export function formatCount(n: number): string {
  if (n >= 10000) {
    const v = (n / 10000).toFixed(1).replace(/\.0$/, "");
    return `${v} 万`;
  }
  return n.toLocaleString("zh-CN");
}

/** 相对日期：今天 / 昨天 / n 天前 / 超过 30 天回退为 ISO 日期 */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return "今天";
  if (days === 1) return "昨天";
  if (days < 30) return `${days} 天前`;
  return iso;
}
