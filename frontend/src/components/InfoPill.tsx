import React from "react";
import { 
  Calendar, 
  Clock, 
  Hourglass, 
  FileText,
  BookOpen,
  Users,
  BarChart,
  Target
} from "lucide-react";

type Props = {
  title: string;
  value: string;
  tint?: string; // background + text classes
  icon?: React.ReactNode; // custom icon
  iconName?: string; // predefined icon names
  className?: string; // extra wrapper classes
  titleClassName?: string;
  valueClassName?: string;
};

// Predefined icons for common use cases
const iconMap: Record<string, React.ReactNode> = {
  calendar: <Calendar className="w-5 h-5" />,
  clock: <Clock className="w-5 h-5" />,
  hourglass: <Hourglass className="w-5 h-5" />,
  file: <FileText className="w-5 h-5" />,
  book: <BookOpen className="w-5 h-5" />,
  users: <Users className="w-5 h-5" />,
  chart: <BarChart className="w-5 h-5" />,
  target: <Target className="w-5 h-5" />
};

export default function InfoPill({
  title,
  value,
  tint = "bg-[#EEF6FF] text-[#1C5D99]",
  icon,
  iconName,
  className = "",
  titleClassName = "",
  valueClassName = "",
}: Props) {
  // Get the icon to display
  const displayIcon = icon || (iconName ? iconMap[iconName] : null);

  return (
    <div
      className={`rounded-xl px-4 py-3 min-w-[160px] flex items-start gap-3 ${tint} ${className}`}
    >
      {displayIcon && (
        <div className="mt-1 flex-shrink-0">
          {displayIcon}
        </div>
      )}
      <div>
      <p className={`text-[20px] font-semibold ${titleClassName}`}>{title}</p>
      <p className={`text-[16px] font-medium mt-1 ${valueClassName}`}>{value}</p>
      </div>
    </div>
  );
}
