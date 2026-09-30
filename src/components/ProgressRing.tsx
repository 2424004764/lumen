/** 加载进度环：有百分比时显示数字，未知大小时显示已接收体积 */
export function ProgressRing({
  progress,
  received,
  size = 64,
  compact = false,
}: {
  progress: number | null;
  received: number;
  size?: number;
  compact?: boolean;
}) {
  const r = compact ? 17 : 26;
  const c = 2 * Math.PI * r;
  const known = progress !== null;
  const offset = c * (1 - (known ? progress : 25) / 100);
  return (
    <div
      className="flex flex-col items-center gap-1.5"
      role="status"
      aria-label={known ? `加载中 ${progress}%` : "加载中"}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        className={known ? "" : "animate-spin [animation-duration:1.6s]"}
      >
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke={compact ? "rgb(255 255 255 / 0.18)" : "rgb(255 255 255 / 0.12)"}
          strokeWidth={compact ? 5 : 4}
        />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke="#22d3ee"
          strokeWidth={compact ? 5 : 4}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform="rotate(-90 32 32)"
          style={known ? { transition: "stroke-dashoffset 0.2s ease-out" } : undefined}
        />
      </svg>
      <span
        className={
          compact
            ? "font-display text-[11px] tabular-nums text-zinc-300"
            : "font-display text-sm tabular-nums text-zinc-400"
        }
      >
        {known ? `${progress}%` : `${(received / 1048576).toFixed(1)} MB`}
      </span>
    </div>
  );
}
