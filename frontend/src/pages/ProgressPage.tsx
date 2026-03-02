import { Bell, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { getProgressData, getTrendForRange } from "../services/progress.service";
import type { ProgressApiResponse, TimeRangeKey } from "../mock/progress.mock";

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full">
      <div className="h-2 rounded-full bg-[#E7ECEA] overflow-hidden">
        <div
          className="h-2 rounded-full bg-[#8ED48F]"
          style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
        />
      </div>
    </div>
  );
}

const RANGE_UI: { label: string; key: TimeRangeKey }[] = [
  { label: "Last 6 Months", key: "6M" },
  { label: "Last 3 Months", key: "3M" },
  { label: "Last Month", key: "1M" },
  { label: "This Year", key: "YTD" },
];

export default function ProgressPage() {
  const [data, setData] = useState<ProgressApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedRange, setSelectedRange] = useState(RANGE_UI[0]); // default 6M
  const [open, setOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // close dropdown when clicking outside
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // load from "backend"
  useEffect(() => {
    (async () => {
      try {
        const res = await getProgressData();
        setData(res);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const trend = useMemo(() => {
    if (!data) return [];
    return getTrendForRange(data, selectedRange.key);
  }, [data, selectedRange]);

  // Convert trend values into a svg path (simple smoothing)
  const chartPath = useMemo(() => {
    if (trend.length === 0) return "";
    // map points into a 300x160 viewbox like your current svg
    const w = 300;
    const h = 160;
    const padX = 20;
    const padY = 20;

    const xs = trend.map((_, i) =>
      trend.length === 1
        ? w / 2
        : padX + (i * (w - padX * 2)) / (trend.length - 1)
    );
    const ys = trend.map((p) => {
      const v = Math.min(Math.max(p.value, 0), 100);
      const y = padY + ((100 - v) * (h - padY * 2)) / 100;
      return y;
    });

    // Build a smooth-ish cubic path
    let d = `M${xs[0]},${ys[0]}`;
    for (let i = 1; i < xs.length; i++) {
      const x0 = xs[i - 1];
      const y0 = ys[i - 1];
      const x1 = xs[i];
      const y1 = ys[i];
      const cx = (x0 + x1) / 2;
      d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`;
    }
    return d;
  }, [trend]);

  if (loading) {
    return <div className="p-6 text-sm text-gray-500">Loading...</div>;
  }

  if (!data) {
    return <div className="p-6 text-sm text-red-500">Failed to load data</div>;
  }

  return (
    <div className="w-full bg-white">
      <div className="px-6 py-6">
        <h1 className="text-[22px] font-bold text-[#083C44]">Your Progress</h1>

        {/* SUMMARY CARDS */}
        <div className="mt-4 flex flex-wrap gap-6">
          <div className="w-[200px] rounded-2xl border border-[#DDE6E3] bg-[#EFFFF3] px-5 py-4">
            <p className="text-[12px] text-[#5E6D6A]">Overall Progress</p>

            <div className="mt-2 flex items-start justify-between">
              <p className="text-[28px] font-bold leading-none text-[#0C4A52]">
                {data.overallProgress}%
              </p>
              <p className="text-[11px] font-semibold text-[#32B06A]">
                ↑ +{data.overallDelta}%
              </p>
            </div>

            <p className="mt-2 text-[11px] text-[#7B8A87]">From last month</p>
          </div>

          <div className="w-[200px] rounded-2xl border border-[#DDE6E3] bg-[#EFFFF3] px-5 py-4">
            <div className="flex items-center justify-between">
              <p className="text-[12px] text-[#5E6D6A]">Upcoming Tasks</p>
              <div className="h-7 w-7 rounded-lg border border-[#DDE6E3] bg-white flex items-center justify-center">
                <Bell className="h-4 w-4 text-[#0F6B73]" />
              </div>
            </div>

            <p className="mt-2 text-[28px] font-bold leading-none text-[#0C4A52]">
              {data.upcomingTasks}
            </p>
            <p className="mt-2 text-[11px] text-[#7B8A87]">In this month</p>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-6">
          {/* COURSE PROGRESS PANEL */}
          <div className="rounded-2xl border border-[#DDE6E3] bg-white overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="text-[14px] font-semibold text-[#083C44]">
                Course Progress
              </h2>

              <button className="h-8 px-3 rounded-md bg-[#0B7C86] text-white text-[11px] font-medium flex items-center gap-2">
                <span className="inline-block">✦</span>
                Course Name
              </button>
            </div>

            <div className="px-5 pb-5">
              <div className="h-[480px] overflow-auto pr-3 results-scroll">
                <div className="space-y-4">
                  {data.courses.map((c) => (
                    <div key={c.id} className="space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <p className="text-[#2C3E3B]">
                          {c.name} -{" "}
                          <span className="text-[#6D7C79]">{c.code}</span>
                        </p>
                        <p className="text-[#6D7C79]">{c.progress}%</p>
                      </div>
                      <ProgressBar value={c.progress} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* PERFORMANCE TREND PANEL */}
          <div className="rounded-2xl border border-[#DDE6E3] bg-white overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="text-[14px] font-semibold text-[#083C44]">
                Performance Trend
              </h2>

              {/* Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setOpen((v) => !v)}
                  className="h-8 px-3 rounded-md bg-[#0B7C86] text-white text-[11px] font-medium flex items-center gap-2"
                  type="button"
                >
                  {selectedRange.label}
                  <ChevronDown
                    className={`h-4 w-4 transition ${
                      open ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {open && (
                  <div className="absolute right-0 mt-2 w-40 rounded-lg border border-[#DDE6E3] bg-white shadow-lg z-50 overflow-hidden">
                    {RANGE_UI.map((r) => (
                      <button
                        key={r.key}
                        type="button"
                        onClick={() => {
                          setSelectedRange(r);
                          setOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-[12px] hover:bg-[#F3FAF6] ${
                          selectedRange.key === r.key
                            ? "text-[#0B7C86] font-semibold"
                            : "text-[#083C44]"
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Inner chart card */}
            <div className="px-5 pb-5">
              <div className="rounded-2xl border border-[#DDE6E3] bg-[#F3FAF6] p-4">
                <div className="relative h-[250px] rounded-xl bg-[#F3FAF6]">
                  {/* grid */}
                  <div className="absolute inset-0 rounded-xl overflow-hidden">
                    <div className="h-full w-full grid grid-rows-6">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="border-t border-[#DDE6E3]" />
                      ))}
                    </div>
                    <div className="absolute inset-0 grid grid-cols-6">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="border-l border-[#DDE6E3]" />
                      ))}
                    </div>
                  </div>

                  {/* line */}
                  <svg
                    viewBox="0 0 300 160"
                    className="absolute inset-0 w-full h-full"
                    preserveAspectRatio="none"
                  >
                    <path
                      d={chartPath}
                      fill="none"
                      stroke="#2F84FF"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />

                    {/* points */}
                    {trend.map((p, i) => {
                      const w = 300;
                      const h = 160;
                      const padX = 20;
                      const padY = 20;
                      const x =
                        trend.length === 1
                          ? w / 2
                          : padX + (i * (w - padX * 2)) / (trend.length - 1);
                      const v = Math.min(Math.max(p.value, 0), 100);
                      const y = padY + ((100 - v) * (h - padY * 2)) / 100;

                      return (
                      <circle
                        key={`${p.label}-${i}`}
                        cx={x}
                        cy={y}
                        r="5"
                        fill="#2F84FF"
                        stroke="#EAF2FF"
                        strokeWidth="4"
                      />
                    );
                    })}
                  </svg>

                  {/* y-axis labels */}
                  <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-[#5B6A67]">
                    <span>100</span>
                    <span>80</span>
                    <span>60</span>
                    <span>40</span>
                    <span>20</span>
                    <span>0</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[10px] text-[#5B6A67]">
                  {trend.map((p) => (
                    <span key={p.label}>{p.label}</span>
                  ))}
                </div>

                <div className="mt-2 flex items-center justify-center gap-2 text-[10px] text-[#2F84FF]">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#2F84FF]" />
                  {selectedRange.label.toLowerCase()}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* END GRID */}
      </div>
    </div>
  );
}