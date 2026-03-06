import { progressMockDB, type ProgressApiResponse, type TimeRangeKey } from "../mock/progress.mock";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// Simulated backend: you can later replace with real fetch("/api/progress")
export async function getProgressData(): Promise<ProgressApiResponse> {
  await sleep(300); // simulate network delay
  return progressMockDB;
}

export function getTrendForRange(data: ProgressApiResponse, range: TimeRangeKey) {
  return data.trend[range] ?? [];
}