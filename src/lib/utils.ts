export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

/** 下载量等数字的中文习惯格式：40213 -> 4 万，9812 -> 9,812 */
export function formatCount(n: number): string {
  if (n >= 10000) {
    const v = (n / 10000).toFixed(1).replace(/\.0$/, "");
    return `${v} 万`;
  }
  return n.toLocaleString("zh-CN");
}

/** 文件体积：10129568 -> 9.7 MB */
export function formatBytes(n: number): string {
  if (n >= 1048576) return `${(n / 1048576).toFixed(1)} MB`;
  if (n >= 1024) return `${Math.round(n / 1024)} KB`;
  return `${n} B`;
}

/** 相对日期：今天 / 昨天 / n 天前 / 超过 30 天显示原日期（兼容 "YYYY-MM-DD HH:mm:ss"） */
export function formatDate(iso: string): string {
  const d = new Date(iso.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return iso;
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return "今天";
  if (days === 1) return "昨天";
  if (days < 30) return `${days} 天前`;
  return iso.slice(0, 10);
}
