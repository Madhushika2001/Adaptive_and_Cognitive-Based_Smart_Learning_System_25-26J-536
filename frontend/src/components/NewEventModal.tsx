import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import DatePickerIcon from "./DatePickerIcon";

type TaskColor = "orange" | "yellow";

export type NewEventPayload = {
  title: string;
  date: { day: string; month: string; year: string };
  allDay: boolean;
  time: { start: string; end: string };
  note: string;
  tasks: TaskColor[]; // dots shown in screenshot
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSave?: (data: NewEventPayload) => void; // connect later to backend
  defaultDate?: { day: number; monthIndex: number; year: number }; // optional
};

const MONTHS = [
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

function toISODate(day: string, month: string, year: string) {
  const monthIndex = MONTHS.indexOf(month) + 1;
  const mm = monthIndex < 10 ? `0${monthIndex}` : `${monthIndex}`;
  const dd = day.padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

function fromISODate(iso: string) {
  // iso = YYYY-MM-DD
  const [y, m, d] = iso.split("-");
  const monthIndex = Number(m) - 1;
  return { y, mIndex: monthIndex, d };
}

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

export default function NewEventModal({
  open,
  onClose,
  onSave,
  defaultDate,
}: Props) {
  const modalRef = useRef<HTMLDivElement | null>(null);

  const now = useMemo(() => new Date(), []);
  const initDay = defaultDate?.day ?? now.getDate();
  const initMonth = defaultDate?.monthIndex ?? now.getMonth();
  const initYear = defaultDate?.year ?? now.getFullYear();

  const [title, setTitle] = useState("");
  const [day, setDay] = useState(pad2(initDay));
  const [month, setMonth] = useState(MONTHS[initMonth]);
  const [year, setYear] = useState(String(initYear));

  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [allDay, setAllDay] = useState(false);

  const [note, setNote] = useState("");
  const [tasks, setTasks] = useState<TaskColor[]>(["orange", "yellow"]);

  const [openMonth, setOpenMonth] = useState(false);

  // reset small things when opening
  useEffect(() => {
    if (!open) return;
    setOpenMonth(false);
  }, [open]);

  // close on outside click + ESC
  useEffect(() => {
    if (!open) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    function onClick(e: MouseEvent) {
      if (!modalRef.current) return;
      if (!modalRef.current.contains(e.target as Node)) onClose();
    }

    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open, onClose]);

  const toggleTask = (color: TaskColor) => {
    setTasks((prev) => {
      if (prev.includes(color)) return prev.filter((c) => c !== color);
      return [...prev, color];
    });
  };

  const handleSave = () => {
    const payload: NewEventPayload = {
      title: title.trim(),
      date: { day, month, year },
      allDay,
      time: { start, end },
      note: note.trim(),
      tasks,
    };
    onSave?.(payload);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/60 p-6">
      <div
        ref={modalRef}
        className="w-[500px] rounded-xl border border-[#E5E7EB] bg-white shadow-[0px_0px_14px_0px_#0000001F] overflow-hidden"
      >
        {/* Top spacing like screenshot */}
        <div className="px-6 pt-6 pb-3">
          <div className="mt-1 text-[16px] font-semibold text-[#083C44]">
            New Event
          </div>
        </div>

        {/* Form Card */}
        <div className="px-6 pb-6">
          <div className="rounded-xl border border-[#E5E7EB] p-5">
            {/* Event Title */}
            <label className="block">
              <div className="text-[12px] font-semibold text-[#083C44]">
                Event Title
              </div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-2 h-9 w-full rounded-lg border border-[#E5E7EB] px-3 text-[12px] outline-none focus:border-[#0B7C86]/50"
                placeholder=""
              />
            </label>

            {/* Date */}
            <div className="mt-4">
              <div className="text-[12px] font-semibold text-[#083C44]">
                Date
              </div>

              <div className="mt-2 flex items-center gap-2">
                {/* day */}
                <input
                  value={day}
                  onChange={(e) =>
                    setDay(e.target.value.replace(/\D/g, "").slice(0, 2))
                  }
                  className="h-9 w-[60px] rounded-lg border border-[#E5E7EB] px-3 text-[12px] text-center outline-none focus:border-[#0B7C86]/50"
                />

                {/* month dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenMonth((v) => !v)}
                    className="h-9 w-[140px] rounded-lg border border-[#E5E7EB] px-3 text-[12px] text-[#6B7280] flex items-center justify-center gap-2"
                  >
                    {month}
                    <span className="text-[#6B7280]">▾</span>
                  </button>

                  {openMonth && (
                    <div className="absolute z-50 mt-2 w-[160px] max-h-[220px] overflow-auto rounded-lg border border-[#E5E7EB] bg-white shadow-lg">
                      {MONTHS.map((m) => (
                        <button
                          key={m}
                          type="button"
                          className="w-full text-left px-3 py-2 text-[12px] hover:bg-[#F3FAF6]"
                          onClick={() => {
                            setMonth(m);
                            setOpenMonth(false);
                          }}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* year */}
                <input
                  value={year}
                  onChange={(e) =>
                    setYear(e.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  className="h-9 w-[90px] rounded-lg border border-[#E5E7EB] px-3 text-[12px] text-center outline-none focus:border-[#0B7C86]/50"
                />

                {/* calendar icon */}
                <button
                  type="button"
                  className="ml-auto h-9 w-9 rounded-lg border border-[#E5E7EB] flex items-center justify-center"
                  aria-label="Pick date"
                >
                  <DatePickerIcon
                    value={toISODate(day, month, year)}
                    onChange={(iso) => {
                      const { y, mIndex, d } = fromISODate(iso);
                      setYear(y);
                      setMonth(MONTHS[mIndex] ?? "January");
                      setDay(d);
                    }}
                  />{" "}
                </button>
              </div>
            </div>

            {/* Time + All day */}
            <div className="mt-4">
              <div className="text-[12px] font-semibold text-[#083C44]">
                Time
              </div>

              <div className="mt-2 flex items-center gap-2">
                <input
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  placeholder="Starts"
                  disabled={allDay}
                  className="h-9 w-[110px] rounded-lg border border-[#E5E7EB] px-3 text-[12px] outline-none disabled:bg-[#F9FAFB] disabled:text-[#9CA3AF]"
                />

                <span className="text-[#9CA3AF] text-[12px]">-</span>

                <input
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  placeholder="Ends"
                  disabled={allDay}
                  className="h-9 w-[110px] rounded-lg border border-[#E5E7EB] px-3 text-[12px] outline-none disabled:bg-[#F9FAFB] disabled:text-[#9CA3AF]"
                />

                <div className="ml-auto flex items-center gap-3">
                  <span className="text-[12px] font-semibold text-[#111827]">
                    All Days
                  </span>

                  {/* toggle */}
                  <button
                    type="button"
                    onClick={() => setAllDay((v) => !v)}
                    className={classNames(
                      "h-5 w-10 rounded-full border transition relative cursor-pointer",
                      allDay
                        ? "bg-[#0B7C86] border-[#0B7C86]"
                        : "bg-gray-200 border-[#D1D5DB]",
                    )}
                    aria-label="Toggle all day"
                  >
                    <span
                      className={classNames(
                        "absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-white shadow transition",
                        allDay ? "left-5" : "left-1",
                      )}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="mt-4">
              <div className="text-[12px] font-semibold text-[#083C44]">
                Note
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="mt-2 h-[90px] w-full resize-none rounded-lg border border-[#E5E7EB] px-3 py-2 text-[12px] outline-none focus:border-[#0B7C86]/50"
              />
            </div>

            {/* Add Task */}
            <div className="mt-4">
              <div className="text-[12px] font-semibold text-[#083C44]">
                Add Task
              </div>

              <div className="mt-2 h-[72px] w-full rounded-lg border border-[#E5E7EB] px-4 py-3">
                <div className="flex flex-col gap-3">
                  {/* dots like screenshot (clickable) */}
                  <button
                    type="button"
                    onClick={() => toggleTask("orange")}
                    className="flex items-center gap-3 text-left"
                  >
                    <span
                      className={classNames(
                        "h-2.5 w-2.5 rounded-full",
                        tasks.includes("orange")
                          ? "bg-[#F28C28]"
                          : "bg-[#F28C28]/30",
                      )}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleTask("yellow")}
                    className="flex items-center gap-3 text-left"
                  >
                    <span
                      className={classNames(
                        "h-2.5 w-2.5 rounded-full",
                        tasks.includes("yellow")
                          ? "bg-[#F4C430]"
                          : "bg-[#F4C430]/30",
                      )}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-5 rounded-lg border border-[#0B7C86] cursor-pointer text-[#0B7C86] text-[12px] font-semibold bg-white"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="h-9 px-6 rounded-lg bg-[#0B7C86] cursor-pointer text-white text-[12px] font-semibold"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function classNames(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}
