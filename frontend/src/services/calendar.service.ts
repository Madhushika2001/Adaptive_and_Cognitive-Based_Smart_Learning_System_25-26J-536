import { calendarMocks } from "../mock/calendar.mock";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// export async function getCalendarData() {

export  function getCalendarData(monthKey: string) {
  // await sleep(200);
  return calendarMocks[monthKey] ?? {
    monthLabel: "",
    monthKey,
    courses: [],
    events: [],
    tasks: [],
  };
}