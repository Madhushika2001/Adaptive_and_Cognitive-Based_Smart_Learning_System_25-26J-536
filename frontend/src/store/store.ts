import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore Supabase User type which contains non-serializable data
        ignoredActionPaths: [
          "payload.user",
          "auth.user"
        ],
        // Ignore these paths in the state
        ignoredPaths: [
          "auth.user",
        ],
      },
    }),
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;

