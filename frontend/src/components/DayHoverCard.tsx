import { X } from "lucide-react";
import type { CalendarEvent, CalendarTask } from "../mock/calendar.mock";

function Dot({ color }: { color: "yellow" | "orange" }) {
  return (
    <span
      className={`inline-block h-3 w-3 rounded-full ${
        color === "yellow" ? "bg-[#F4C430]" : "bg-[#F28C28]"
      }`}
    />
  );
}

type Props = {
  date: string; // YYYY-MM-DD
  events: CalendarEvent[];
  tasks: CalendarTask[];
  onClose?: () => void;
};

export default function DayHoverCard({ date, events, tasks, onClose }: Props) {
  const dayNum = Number(date.split("-")[2]);
  const dayLabel = new Date(date)
    .toLocaleDateString("en-US", { weekday: "short" })
    .toUpperCase();

  return (
    <div className="w-[360px] rounded-xl border border-[#111827] bg-white shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-4">
        <div className="flex gap-4">
          <div className="min-w-[60px]">
            <div className="text-[30px] font-bold text-[#0B7C86] leading-none">
              {dayNum}
            </div>
            <div className="text-[11px] font-semibold text-[#111827]">
              {dayLabel}
            </div>

            <div className="mt-3 text-[10px] font-semibold text-[#0B7C86]">
              EVENTS
            </div>
          </div>

          <div className="pt-1">
            <div className="text-[14px] font-semibold text-[#111827]">Today</div>
            <div className="text-[11px] text-[#6B7280]">
              {events.length} events and {tasks.length} tasks
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="h-8 w-8 rounded-lg border border-[#E5E7EB] flex items-center justify-center"
          aria-label="Close"
        >
          <X className="h-4 w-4 text-[#111827]" />
        </button>
      </div>

      <div className="px-4">
        <div className="h-px bg-[#D1D5DB]" />
      </div>

      {/* Events */}
      <div className="px-5 py-4 space-y-4">
        {events.slice(0, 2).map((e) => (
          <div key={e.id} className="rounded-xl bg-[#D1E7DD] px-4 py-4">
            <div className="text-[12px] text-[#111827]/70">
              {e.start} - {e.end}
            </div>
            <div className="text-[16px] font-medium text-[#111827]">
              {e.title}
            </div>
          </div>
        ))}
      </div>

      {/* Tasks */}
      <div className="px-5 pb-5">
        <div className="flex items-center gap-3">
          <div className="text-[11px] font-semibold text-[#0B7C86]">TASK</div>
          <div className="flex-1 h-px bg-[#D1D5DB]" />
        </div>

        <div className="mt-4 space-y-3">
          {tasks.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-3 text-[13px] text-[#111827]"
            >
              <Dot color={t.color} />
              <span>{t.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}