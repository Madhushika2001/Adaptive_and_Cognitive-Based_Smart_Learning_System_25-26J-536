export type TimeRangeKey = "6M" | "3M" | "1M" | "YTD";

export type CourseProgress = {
  id: string;
  name: string;
  code: string;
  progress: number;
};

export type TrendPoint = {
  label: string; // Aug, Sep...
  value: number; // 0-100
};

export type ProgressApiResponse = {
  overallProgress: number; // %
  overallDelta: number; // +/-
  upcomingTasks: number;
  courses: CourseProgress[];
  trend: Record<TimeRangeKey, TrendPoint[]>;
};

export const progressMockDB: ProgressApiResponse = {
  overallProgress: 82,
  overallDelta: 5,
  upcomingTasks: 2,

  courses: [
    { id: "1", name: "Database Administration", code: "IT4040", progress: 42 },
    { id: "2", name: "Cloud Computing", code: "IT4090", progress: 72 },
    { id: "3", name: "Deep Learning", code: "SE4050", progress: 45 },
    { id: "4", name: "Database Administration", code: "IT4040", progress: 75 },
    { id: "5", name: "Cloud Computing", code: "IT4090", progress: 88 },
    { id: "6", name: "Deep Learning", code: "SE4050", progress: 92 },
    { id: "7", name: "Database Administration", code: "IT4040", progress: 25 },
    { id: "8", name: "Cloud Computing", code: "IT4090", progress: 45 },
    { id: "9", name: "Database Administration", code: "IT4040", progress: 60 },
    { id: "10", name: "Deep Learning", code: "SE4050", progress: 50 },
    { id: "11", name: "Deep Learning", code: "SE4050", progress: 92 },
    { id: "12", name: "Database Administration", code: "IT4040", progress: 25 },
    { id: "13", name: "Cloud Computing", code: "IT4090", progress: 45 },
    { id: "14", name: "Database Administration", code: "IT4040", progress: 60 },
    { id: "15", name: "Deep Learning", code: "SE4050", progress: 50 },
  ],

  trend: {
    "6M": [
      { label: "Aug", value: 60 },
      { label: "Sep", value: 42 },
      { label: "Oct", value: 61 },
      { label: "Nov", value: 80 },
      { label: "Dec", value: 60 },
      { label: "Jan", value: 70 },
    ],
    "3M": [
      { label: "Nov", value: 80 },
      { label: "Dec", value: 60 },
      { label: "Jan", value: 70 },
    ],
    "1M": [{ label: "Jan", value: 70 }],
    "YTD": [
      { label: "Jan", value: 70 },
      { label: "Feb", value: 75 },
      { label: "Mar", value: 68 },
      { label: "Apr", value: 82 },
      { label: "May", value: 78 },
      { label: "Jun", value: 85 },
    ],
  },
};