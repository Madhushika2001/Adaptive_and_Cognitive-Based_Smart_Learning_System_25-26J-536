import { useEffect, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";

type Props = {
  value: string; // "YYYY-MM-DD"
  onChange: (next: string) => void;
  buttonClassName?: string;
};

export default function DatePickerIcon({
  value,
  onChange,
  buttonClassName,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [supported, setSupported] = useState(true);

  // detect if browser supports input[type="date"]
  useEffect(() => {
    const i = document.createElement("input");
    i.setAttribute("type", "date");
    setSupported(i.type === "date");
  }, []);

  const openPicker = () => {
    if (!inputRef.current) return;

    // Modern browsers (Chromium) support showPicker()
    // fallback -> focus + click
    if (typeof inputRef.current.showPicker === "function") inputRef.current.showPicker();
    else {
      inputRef.current.focus();
      inputRef.current.click();
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={openPicker}
        className={
          buttonClassName ??
          "h-9 w-9 rounded-lg border border-[#E5E7EB] flex items-center justify-center"
        }
        aria-label="Pick date"
      >
        <CalendarDays className="h-4 w-4 text-[#0B7C86] cursor-pointer" />
      </button>

      {/* Hidden native picker */}
      <input
        ref={inputRef}
        type={supported ? "date" : "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 pointer-events-none"
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}