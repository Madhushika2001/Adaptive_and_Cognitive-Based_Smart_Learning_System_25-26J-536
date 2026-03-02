import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { getCalendarData } from "../services/calendar.service";
import type {
  CalendarEvent,
  CalendarTask,
  CourseKey,
} from "../mock/calendar.mock";
import DayHoverCard from "../components/DayHoverCard";
import NewEventModal from "../components/NewEventModal";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function ymd(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function classNames(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

function Dot({ color }: { color: "yellow" | "orange" }) {
  return (
    <span
      className={classNames(
        "inline-block h-2 w-2 rounded-full",
        color === "yellow" ? "bg-[#F4C430]" : "bg-[#F28C28]",
      )}
    />
  );
}

function EventPill({
  e,
  onEnter,
  onLeave,
  onMove,
}: {
  e: CalendarEvent;
  onEnter?: (ev: React.MouseEvent) => void;
  onLeave?: () => void;
  onMove?: (ev: React.MouseEvent) => void;
}) {
  return (
    <div
      className={classNames(
        "rounded-xl bg-[#087990] text-white px-2.5 py-1.5 leading-tight",
        onEnter && "cursor-pointer",
      )}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onMouseMove={onMove}
    >
      <div className="text-[10px] font-semibold truncate">{e.title}</div>
      <div className="text-[9px] opacity-90 truncate">
        {e.start} - {e.end}
      </div>
    </div>
  );
}

type HoverState = { date: string; x: number; y: number } | null;

function getMonthLabel(y: number, m: number) {
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

function getPrevMonth(y: number, m: number) {
  if (m === 1) return { y: y - 1, m: 12 };
  return { y, m: m - 1 };
}

function getNextMonth(y: number, m: number) {
  if (m === 12) return { y: y + 1, m: 1 };
  return { y, m: m + 1 };
}

export default function CalendarPage() {
  const [loading, setLoading] = useState(true);

  const [course, setCourse] = useState<CourseKey>("All Courses");
  const [view, setView] = useState<"Month">("Month");

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [newEventOpen, setNewEventOpen] = useState(false);
  // dropdowns
  const [openView, setOpenView] = useState(false);
  const [openCourse, setOpenCourse] = useState(false);

  //  hover popup
  const [hover, setHover] = useState<HoverState>(null);

  // initialize as REAL current month
  const now = useMemo(() => new Date(), []);
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1); // 1-12

  // month dropdown
  const [openMonth, setOpenMonth] = useState(false);

  // Load data for selected monthKey
  useEffect(() => {
    const monthKey = `${currentYear}-${pad(currentMonth)}`;
    setLoading(true);

    (async () => {
      const data = await getCalendarData(monthKey);
      setEvents(data.events);
      setTasks(data.tasks);
      setLoading(false);
    })();
  }, [currentYear, currentMonth]);

  const filteredEvents = useMemo(() => {
    if (course === "All Courses") return events;
    return events.filter((e) => e.course === course);
  }, [events, course]);

  // build month grid based on currentYear/currentMonth
  const { cells } = useMemo(() => {
    const first = new Date(currentYear, currentMonth - 1, 1);
    const startDay = first.getDay();
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

    const grid: Array<{ day: number | null; date: string | null }> = [];
    for (let i = 0; i < startDay; i++) grid.push({ day: null, date: null });
    for (let d = 1; d <= daysInMonth; d++) {
      grid.push({ day: d, date: ymd(currentYear, currentMonth, d) });
    }
    while (grid.length < 42) grid.push({ day: null, date: null });

    return { cells: grid };
  }, [currentYear, currentMonth]);

  // highlighted auto from events/tasks (no hardcoded Set)
  const highlighted = useMemo(() => {
    const set = new Set<string>();
    for (const e of filteredEvents) set.add(e.date);
    for (const t of tasks) set.add(t.date);
    return set;
  }, [filteredEvents, tasks]);

  // place hover near cursor with viewport clamp
  const CARD_W = 360;
  const CARD_H = 360;

  function placeHover(date: string, clientX: number, clientY: number) {
    let x = clientX + 12;
    let y = clientY + 12;

    const maxX = window.innerWidth - CARD_W - 12;
    const maxY = window.innerHeight - CARD_H - 12;

    if (x > maxX) x = clientX - CARD_W - 12;
    if (y > maxY) y = clientY - CARD_H - 12;

    setHover({ date, x, y });
  }

  function goPrevMonth() {
    setHover(null);
    setOpenCourse(false);
    setOpenView(false);
    setOpenMonth(false);
    const prev = getPrevMonth(currentYear, currentMonth);
    setCurrentYear(prev.y);
    setCurrentMonth(prev.m);
  }

  function goNextMonth() {
    setHover(null);
    setOpenCourse(false);
    setOpenView(false);
    setOpenMonth(false);
    const next = getNextMonth(currentYear, currentMonth);
    setCurrentYear(next.y);
    setCurrentMonth(next.m);
  }

  const prev = getPrevMonth(currentYear, currentMonth);
  const next = getNextMonth(currentYear, currentMonth);
  const prevLabel = MONTH_NAMES[prev.m - 1];
  const nextLabel = MONTH_NAMES[next.m - 1];

  if (loading)
    return <div className="p-6 text-sm text-gray-500">Loading...</div>;

  return (
    <div className="relative w-full bg-white rounded-[8px] p-[30px] border border-[#D1D5DB] shadow-[0px_0px_4px_0px_#00000040]">
        {/* header */}
        <div className="flex items-center justify-between">
          <h1 className="text-[32px] font-bold text-[#055160]">Calendar</h1>

          <button onClick={() => setNewEventOpen(true)}  className="cursor-pointer h-10 px-4 rounded-lg bg-[#0B7C86] text-white text-[12px] font-semibold"
          type="button">
            + New Event
          </button>
        </div>

        {/* filters row */}
        <div className="mt-4 flex items-center gap-4">
          {/* View dropdown */}
          {/* <div className="relative">
            <button
              type="button"
              onClick={() => {
                setOpenView((v) => !v);
                setOpenCourse(false);
              setOpenMonth(false);
              }}
              className="h-10 w-[110px] rounded-lg border border-[#E5E7EB] bg-white px-4 text-[12px] text-[#083C44] flex items-center justify-between"
            >
              {view}
              <ChevronDown className="h-4 w-4 text-[#083C44]/70" />
            </button>

            {openView && (
              <div className="absolute z-50 mt-2 w-[110px] rounded-lg border border-[#E5E7EB] bg-white shadow-lg overflow-hidden">
                {["Month"].map((v) => (
                  <button
                    key={v}
                    className="w-full text-left px-3 py-2 text-[12px] hover:bg-[#F3FAF6]"
                    onClick={() => {
                      setView(v as "Month");
                      setOpenView(false);
                    }}
                    type="button"
                  >
                    {v}
                  </button>
                ))}
              </div>
            )}
          </div> */}

        {/* Month dropdown (12 months) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setOpenMonth((v) => !v);
              setOpenCourse(false);
              setOpenView(false);
            }}
            className="h-10 w-[180px] rounded-lg border border-[#E5E7EB] bg-white px-4 text-[12px] text-[#083C44] flex items-center justify-between"
          >
            {getMonthLabel(currentYear, currentMonth)}
            <ChevronDown className="h-4 w-4 text-[#083C44]/70" />
          </button>

          {openMonth && (
            <div className="absolute z-50 mt-2 w-[180px] rounded-lg border border-[#E5E7EB] bg-white shadow-lg overflow-hidden max-h-[260px] overflow-y-auto">
              {MONTH_NAMES.map((mName, i) => {
                const m = i + 1;
                const active = m === currentMonth;
                return (
                  <button
                    key={mName}
                    type="button"
                    onClick={() => {
                      setCurrentMonth(m);
                      setOpenMonth(false);
                    }}
                    className={classNames(
                      "w-full text-left px-3 py-2 text-[12px] hover:bg-[#F3FAF6]",
                      active && "font-semibold text-[#0B7C86]",
                    )}
                  >
                    {mName}
                  </button>
                );
              })}
              </div>
            )}
          </div>

          {/* Course dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setOpenCourse((v) => !v);
                setOpenView(false);
              setOpenMonth(false);
              }}
              className="h-10 w-[220px] rounded-lg border border-[#E5E7EB] bg-white px-4 text-[12px] text-[#083C44] flex items-center justify-between"
            >
              {course}
              <ChevronDown className="h-4 w-4 text-[#083C44]/70" />
            </button>

            {openCourse && (
              <div className="absolute z-50 mt-2 w-[220px] rounded-lg border border-[#E5E7EB] bg-white shadow-lg overflow-hidden">
                {(
                  [
                    "All Courses",
                    "Deep Learning",
                    "Cloud Computing",
                    "Database Algorithms",
                  ] as CourseKey[]
                ).map((c) => (
                  <button
                    key={c}
                    className={classNames(
                      "w-full text-left px-3 py-2 text-[12px] hover:bg-[#F3FAF6]",
                      course === c && "font-semibold text-[#0B7C86]",
                    )}
                    onClick={() => {
                      setCourse(c);
                      setOpenCourse(false);
                    }}
                    type="button"
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* month nav row */}
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={goPrevMonth}
            className="h-7 px-3 rounded-md cursor-pointer border border-[#0B7C86] text-[#0B7C86] text-[11px] flex items-center gap-2"
            >
            <ChevronLeft className="h-4 w-4" />
            {prevLabel}
          </button>

          <div className="text-[14px] font-semibold text-[#083C44]">
            {getMonthLabel(currentYear, currentMonth)}
          </div>

          <button
            type="button"
            onClick={goNextMonth}
            className="h-7 px-3 cursor-pointer rounded-md border border-[#0B7C86] text-[#0B7C86] text-[11px] flex items-center gap-2"
            >
            {nextLabel}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* calendar grid */}
        <div className="mt-3 border border-[#E5E7EB] rounded-xl overflow-hidden">
          {/* weekdays header */}
          <div className="grid grid-cols-7 bg-white">
            {DAYS.map((d) => (
              <div
                key={d}
                className="h-9 flex items-center justify-center text-[14px] font-semibold text-[#000000] border-b border-r border-[#E5E7EB] last:border-r-0"
              >
                {d}
              </div>
            ))}
          </div>

          {/* cells */}
          <div className="grid grid-cols-7">
            {cells.map((c, idx) => {
              const isEmpty = !c.day || !c.date;
              const isTint = c.date ? highlighted.has(c.date) : false;

              const dayEvents = c.date
                ? filteredEvents.filter((e) => e.date === c.date)
                : [];

              const dayTasks = c.date
                ? tasks.filter((t) => t.date === c.date)
                : [];

              return (
                <button
                  key={idx}
                  type="button"
                  className={classNames(
                    "h-[150px] text-left p-2 border-b border-r border-[#E6E6E6] last:border-r-0 relative ",
                    isTint && "bg-[#D1E7DD]",
                  )}
                  disabled={isEmpty}
                >
                  {/* date number */}
                  <div className="text-[14px] font-medium text-right  text-[#000000]">
                    {c.day ?? ""}
                  </div>

                  {/*  Hover only works on highlighted days */}
                  <div className="mt-1 space-y-1">
                    {dayEvents
                    .slice(0, 2)
                    .map((e) =>
                      isTint ? (
                        <EventPill
                          key={e.id}
                          e={e}
                          onEnter={(ev) =>
                            placeHover(e.date, ev.clientX, ev.clientY)
                          }
                          onMove={(ev) =>
                            placeHover(e.date, ev.clientX, ev.clientY)
                          }
                          onLeave={() => setHover(null)}
                        />
                      ) : (
                      <EventPill key={e.id} e={e} />
                    ))}
                  </div>

                  {/* dots */}
                  <div className="absolute left-2 bottom-2 flex gap-2">
                    {dayTasks.slice(0, 2).map((t) => (
                      <Dot key={t.id} color={t.color} />
                    ))}
                  </div>
                </button>
              );
            })}
                  </div>
                </div>

      {/* Hover Card (near cursor) */}
      {hover && (
        <div className="fixed z-[9999]" style={{ left: hover.x, top: hover.y }}
          onMouseLeave={() => setHover(null)}>
          <DayHoverCard
            date={hover.date}
            events={filteredEvents.filter((ev) => ev.date === hover.date)}
            tasks={tasks.filter((t) => t.date === hover.date)}
            onClose={() => setHover(null)}
          />
          </div>
        )}
        <NewEventModal
            open={newEventOpen}
            onClose={() => setNewEventOpen(false)}
            onSave={(data) => {
                console.log("NEW EVENT:", data);
            }}
        />
    </div>
  );
}
