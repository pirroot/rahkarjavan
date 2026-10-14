type ChartPoint = { category: string; views: number };

export function AdminDashboardChart({ data }: { data: ChartPoint[] }) {
  const max = Math.max(1, ...data.map((item) => item.views));

  return (
    <div
      className="grid h-52 items-end gap-3"
      style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}
      role="img"
      aria-label="نمودار بازدید به تفکیک دسته"
    >
      {data.map((point) => {
        const height = Math.max(6, Math.round((point.views / max) * 100));
        const views = point.views.toLocaleString('fa-IR');
        return (
          <div className="flex h-full min-w-0 flex-col items-center gap-1.5" key={point.category}>
            <span className="text-[10px] font-bold text-slate-300">{views}</span>

            <div className="flex w-full flex-1 items-end">
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-brand-red/40 to-brand-red"
                style={{ height: `${height}%` }}
                title={`${point.category}: ${views} بازدید`}
              />
            </div>

            <span
              className="w-full truncate text-center text-[10px] text-slate-400"
              title={point.category}
            >
              {point.category}
            </span>
          </div>
        );
      })}
    </div>
  );
}
