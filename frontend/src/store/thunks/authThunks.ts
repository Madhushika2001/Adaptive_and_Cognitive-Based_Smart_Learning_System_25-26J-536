import { createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../configs/supabase';
import type { Profile } from '../slices/authSlice';

interface SignUpPayload {
  email: string;
  password: string;
  fullName: string;
}

interface SignInPayload {
  email: string;
  password: string;
}

const AUTH_KEY = "adaptive_auth_session";

export const signUp = createAsyncThunk(
  "auth/signUp",
  async (payload: SignUpPayload, { rejectWithValue }) => {
    try {
      const mockUser = {
        id: "user-" + btoa(payload.email),
        email: payload.email,
        user_metadata: { name: payload.fullName, role: "user" },
      };

      const mockProfile: Profile = {
        id: mockUser.id,
        name: payload.fullName,
        email: payload.email,
        role: "user",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const session = {
        user: mockUser,
        profile: mockProfile,
        session: { accessToken: mockUser.id, refreshToken: "", expiresIn: 86400, expiresAt: Date.now() + 86400000 },
      };

      localStorage.setItem(AUTH_KEY, JSON.stringify(session));
      return session;
    } catch (error) {
      return rejectWithValue("Sign up failed. Please try again.");
    }
  },
);

export const signIn = createAsyncThunk(
  "auth/signIn",
  async (payload: SignInPayload, { rejectWithValue }) => {
    try {
      const mockUser = {
        id: "user-" + btoa(payload.email),
        email: payload.email,
        user_metadata: { name: payload.email.split("@")[0], role: "user" },
      };

      const mockProfile: Profile = {
        id: mockUser.id,
        name: payload.email.split("@")[0],
        email: payload.email,
        role: "user",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const session = { user: mockUser, profile: mockProfile };
      localStorage.setItem(AUTH_KEY, JSON.stringify(session));
      return session;
    } catch (error) {
      return rejectWithValue("Sign in failed. Please try again.");
    }
  },
);

export const initializeAuth = createAsyncThunk(
  "auth/initializeAuth",
  async (_) => {
    try {
      const saved = localStorage.getItem(AUTH_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.user) return { user: parsed.user, profile: parsed.profile };
      }
    } catch {
      localStorage.removeItem(AUTH_KEY);
    }
    return { user: null, profile: null };
  },
);

export const signInWithGoogle = createAsyncThunk(
  'auth/signInWithGoogle',
  async (_) => {
    // Mock Google sign in
    await new Promise((resolve) => setTimeout(resolve, 800));
  }
);

export const handleOAuthCallback = createAsyncThunk(
  'auth/handleOAuthCallback',
  async (_) => {
    return { user: null, profile: null };
  }
);

export const signOut = createAsyncThunk(
  "auth/signOut",
  async (_) => {
    localStorage.removeItem(AUTH_KEY);
    return null;
  }
);

interface ResetPasswordForEmailPayload {
  email: string;
}

interface UpdateUserPasswordPayload {
  password: string;
}

/**
 * Send password reset email to user
 */
export const resetPasswordForEmail = createAsyncThunk(
  'auth/resetPasswordForEmail',
  async (payload: ResetPasswordForEmailPayload) => {
    const { error } = await supabase.auth.resetPasswordForEmail(payload.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      throw error;
    }
  }
);

/**
 * Update user password (used during password recovery flow)
 */
export const updateUserPassword = createAsyncThunk(
  'auth/updateUserPassword',
  async (payload: UpdateUserPasswordPayload) => {
    const { error } = await supabase.auth.updateUser({
      password: payload.password,
    });

    if (error) {
      throw error;
    }
  }
);

interface UpdateProfilePayload {
  name: string;
}

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (payload: UpdateProfilePayload) => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) throw userError;
    if (!user) {
      throw new Error('No active user');
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ name: payload.name })
      .eq('id', user.id)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return data as Profile;
  }
);

