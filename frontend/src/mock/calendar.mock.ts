export type CourseKey =
  | "All Courses"
  | "Deep Learning"
  | "Cloud Computing"
  | "Database Algorithms";

export type CalendarEvent = {
  id: string;
  date: string; // YYYY-MM-DD
  course: Exclude<CourseKey, "All Courses">;
  title: string;
  start: string; // "8.30 am"
  end: string; // "11.30 am"
  type: "Revision" | "Quiz" | "Model Paper";
};

export type CalendarTask = {
  id: string;
  date: string; // YYYY-MM-DD
  color: "yellow" | "orange";
  text: string;
};

export type CalendarMonthData = {
  monthLabel: string;
  monthKey: string; // YYYY-MM
  courses: CourseKey[];
  events: CalendarEvent[];
  tasks: CalendarTask[];
};

const COURSES: CourseKey[] = [
  "All Courses",
  "Deep Learning",
  "Cloud Computing",
  "Database Algorithms",
];

export const calendarMocks: Record<string, CalendarMonthData> = {
  "2025-10": {
  monthLabel: "October 2025",
  monthKey: "2025-10",
  courses: COURSES,

  events: [
    { id: "e1", date: "2025-10-01", course: "Deep Learning", title: "Deep Learning Revision", start: "8.30 am", end: "11.30 am", type: "Revision" },
    { id: "e2", date: "2025-10-01", course: "Cloud Computing", title: "Cloud Computing Quiz", start: "12.30 pm", end: "2.30 pm", type: "Quiz" },

    { id: "e3", date: "2025-10-06", course: "Deep Learning", title: "Deep Learning Quiz", start: "8.30 am", end: "11.30 am", type: "Quiz" },

    { id: "e4", date: "2025-10-07", course: "Database Algorithms", title: "Database Algorithms Revision", start: "8.30 am", end: "11.30 am", type: "Revision" },
    { id: "e5", date: "2025-10-09", course: "Cloud Computing", title: "Cloud Computing Revision", start: "8.30 am", end: "11.30 am", type: "Revision" },

    { id: "e6", date: "2025-10-11", course: "Cloud Computing", title: "Cloud Computing Model Paper", start: "8.30 am", end: "11.30 am", type: "Model Paper" },
    { id: "e7", date: "2025-10-11", course: "Deep Learning", title: "Deep Learning Model Paper", start: "12.30 pm", end: "2.30 pm", type: "Model Paper" },

    { id: "e8", date: "2025-10-14", course: "Database Algorithms", title: "Database Algorithms Quiz", start: "8.30 am", end: "11.30 am", type: "Quiz" },

    { id: "e9", date: "2025-10-19", course: "Database Algorithms", title: "Database Algorithms Model Paper", start: "8.30 am", end: "11.30 am", type: "Model Paper" },
    { id: "e10", date: "2025-10-19", course: "Deep Learning", title: "Deep Learning Revision", start: "12.30 pm", end: "2.30 pm", type: "Revision" },

    { id: "e11", date: "2025-10-23", course: "Deep Learning", title: "Deep Learning Quiz", start: "8.30 am", end: "11.30 am", type: "Quiz" },
    { id: "e12", date: "2025-10-23", course: "Cloud Computing", title: "Cloud Computing Revision", start: "12.30 pm", end: "2.30 pm", type: "Revision" },

    { id: "e13", date: "2025-10-24", course: "Cloud Computing", title: "Cloud Computing Quiz", start: "8.30 am", end: "11.30 am", type: "Quiz" },

    { id: "e14", date: "2025-10-30", course: "Deep Learning", title: "Deep Learning Model Paper", start: "8.30 am", end: "11.30 am", type: "Model Paper" },
    { id: "e15", date: "2025-10-30", course: "Database Algorithms", title: "Database Algorithms Revision", start: "12.30 pm", end: "2.30 pm", type: "Revision" },
],

  tasks: [
    { id: "t1", date: "2025-10-01", color: "yellow", text: "Complete the Deep Learning Note" },
    { id: "t2", date: "2025-10-01", color: "orange", text: "Getting a Good Score on the Quiz" },
    ],
  },

  "2026-03": {
    monthLabel: "March 2026",
    monthKey: "2026-03",
    courses: COURSES,

    events: [
      { id: "m1", date: "2026-03-02", course: "Deep Learning", title: "Deep Learning Revision", start: "8.30 am", end: "11.30 am", type: "Revision" },
      { id: "m2", date: "2026-03-02", course: "Cloud Computing", title: "Cloud Computing Quiz", start: "12.30 pm", end: "2.30 pm", type: "Quiz" },

      { id: "m3", date: "2026-03-05", course: "Database Algorithms", title: "Database Algorithms Revision", start: "8.30 am", end: "11.30 am", type: "Revision" },

      { id: "m4", date: "2026-03-08", course: "Cloud Computing", title: "Cloud Computing Model Paper", start: "8.30 am", end: "11.30 am", type: "Model Paper" },
      { id: "m5", date: "2026-03-08", course: "Deep Learning", title: "Deep Learning Quiz", start: "12.30 pm", end: "2.30 pm", type: "Quiz" },

      { id: "m6", date: "2026-03-12", course: "Deep Learning", title: "Deep Learning Model Paper", start: "8.30 am", end: "11.30 am", type: "Model Paper" },

      { id: "m7", date: "2026-03-15", course: "Database Algorithms", title: "Database Algorithms Quiz", start: "8.30 am", end: "11.30 am", type: "Quiz" },

      { id: "m8", date: "2026-03-18", course: "Cloud Computing", title: "Cloud Computing Revision", start: "8.30 am", end: "11.30 am", type: "Revision" },

      { id: "m9", date: "2026-03-22", course: "Deep Learning", title: "Deep Learning Revision", start: "8.30 am", end: "11.30 am", type: "Revision" },
      { id: "m10", date: "2026-03-22", course: "Database Algorithms", title: "Database Algorithms Model Paper", start: "12.30 pm", end: "2.30 pm", type: "Model Paper" },

      { id: "m11", date: "2026-03-26", course: "Cloud Computing", title: "Cloud Computing Quiz", start: "8.30 am", end: "11.30 am", type: "Quiz" },

      { id: "m12", date: "2026-03-30", course: "Deep Learning", title: "Deep Learning Model Paper", start: "8.30 am", end: "11.30 am", type: "Model Paper" },
    ],

    tasks: [
      { id: "mt1", date: "2026-03-02", color: "yellow", text: "Review Neural Network Architectures" },
      { id: "mt2", date: "2026-03-02", color: "orange", text: "Practice Quiz Questions" },
      { id: "mt3", date: "2026-03-12", color: "yellow", text: "Revise Optimization Algorithms" },
      { id: "mt4", date: "2026-03-22", color: "orange", text: "Complete Database Assignment" },
    ],
  },
};