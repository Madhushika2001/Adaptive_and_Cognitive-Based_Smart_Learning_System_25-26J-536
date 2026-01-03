import React, { useState } from "react";
import { IoIosArrowDown } from "react-icons/io";

type Option = { label: string; value: string };

type Props = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  className?: string;
  selectClassName?: string;
  disabled?: boolean;
};

export default function CustomSelect({
  label,
  value,
  onChange,
  options,
  className = "",
  selectClassName = "",
  disabled = false,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={className}>
      {label && (
        <label className="block text-[14px] font-normal text-[#4B5563] mb-1">{label}</label>
      )}

      <div className="relative">
        <select
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
          className={`w-full appearance-none border border-[#D4D4D4] text-[16px] font-normal rounded-md pl-3 pr-10 py-2 bg-white text-[#000000]
            focus:outline-none focus:ring-0 focus:border-[#055160]
            ${disabled ? "opacity-60 cursor-not-allowed" : ""}
            ${selectClassName}`}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <span
          className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2
            text-gray-500 transition-transform duration-200
            ${isOpen ? "rotate-180" : "rotate-0"}`}
        >
          <IoIosArrowDown className="w-4 h-4" />
        </span>
      </div>
    </div>
  );
}
