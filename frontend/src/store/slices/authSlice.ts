import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { User } from '@supabase/supabase-js';
import { signUp, signIn, signOut, initializeAuth, handleOAuthCallback, updateProfile } from '../thunks/authThunks';

export type UserRole = 'user';

export interface Profile {
  id: string;
  name: string;
  provider?: string;
  role: UserRole;
  email?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SessionData {
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  expiresAt?: number;
}

export interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: SessionData | null;
  isInitialized: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  profile: null,
  session: null,
  isInitialized: false,
  isAuthenticated: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(signUp.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.profile = action.payload.profile;
        if (action.payload.user) {
          state.session = {
            accessToken: action.payload.user.id,
            refreshToken: action.payload.user.user_metadata?.refresh_token,
            expiresIn: 3600,
          };
        }
        state.isAuthenticated = !!action.payload.user;
        state.isInitialized = true;
        state.error = null;
      })
      .addCase(signUp.rejected, (state, action) => {
        state.user = null;
        state.profile = null;
        state.session = null;
        state.isAuthenticated = false;
        state.error = action.payload as string || action.error.message || 'Sign up failed';
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.profile = action.payload.profile;
        if (action.payload.user) {
          state.session = {
            accessToken: action.payload.user.id,
            refreshToken: action.payload.user.user_metadata?.refresh_token,
            expiresIn: 3600,
          };
        }
        state.isAuthenticated = !!action.payload.user;
        state.isInitialized = true;
        state.error = null;
      })
      .addCase(signIn.rejected, (state, action) => {
        state.user = null;
        state.profile = null;
        state.session = null;
        state.isAuthenticated = false;
        state.error = action.payload as string || action.error.message || 'Login failed';
      })
      .addCase(signOut.fulfilled, (state) => {
        state.user = null;
        state.profile = null;
        state.session = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(initializeAuth.pending, (state) => {
        if (!state.isInitialized) {
          state.isInitialized = false;
        }
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.profile = action.payload.profile;
        if (action.payload.user) {
          state.session = {
            accessToken: action.payload.user.id,
            refreshToken: action.payload.user.user_metadata?.refresh_token,
            expiresIn: 3600,
          };
        }
        state.isAuthenticated = !!action.payload.user;
        state.isInitialized = true;
        state.error = null;
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.user = null;
        state.profile = null;
        state.session = null;
        state.isAuthenticated = false;
        state.isInitialized = true;
        state.error = null;
      })
      .addCase(handleOAuthCallback.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.profile = action.payload.profile;
        if (action.payload.user) {
          state.session = {
            accessToken: action.payload.user.id,
            refreshToken: action.payload.user.user_metadata?.refresh_token,
            expiresIn: 3600,
          };
        }
        state.isAuthenticated = !!action.payload.user;
        state.isInitialized = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action: PayloadAction<Profile>) => {
        state.profile = action.payload;
      });
  },
});

export default authSlice.reducer;

