import type { AuthState } from './slices/authSlice';

export interface RootState {
  auth: AuthState;
}

// Common types that can be shared across slices
export type LoadingState = "idle" | "loading" | "succeeded" | "failed";

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

