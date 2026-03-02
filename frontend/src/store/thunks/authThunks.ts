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

export const signUp = createAsyncThunk(
  'auth/signUp',
  async (payload: SignUpPayload, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: payload.email,
        password: payload.password,
        options: {
          data: {
            name: payload.fullName,
            role: 'user',
          },
        },
      });

      if (error) {
        return rejectWithValue(error.message || 'Sign up failed');
      }

      if (!data.user) {
        return rejectWithValue('User creation failed');
      }

      let profile: Profile | null = null;

      // Try to create profile, but don't fail if table doesn't exist
      try {
        // Try direct insert first
        const { data: insertData, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            name: payload.fullName,
            email: payload.email,
            role: 'user',
            provider: 'email',
          })
          .select()
          .single();

        if (!insertError && insertData) {
          profile = insertData as Profile;
        }
      } catch (err) {
        // Profile table might not exist yet, that's okay
        profile = null;
      }

      return {
        user: data.user,
        profile,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during sign up';
      return rejectWithValue(errorMessage);
    }
  }
);

export const signIn = createAsyncThunk(
  'auth/signIn',
  async (payload: SignInPayload, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: payload.email,
        password: payload.password,
      });

      if (error) {
        return rejectWithValue(error.message || 'Login failed');
      }

      let profile: Profile | null = null;

      if (data.user) {
        // Try to fetch profile, but don't fail if it doesn't exist
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (!profileError && profileData) {
            profile = profileData as Profile;
          }
        } catch (err) {
          // Profile table might not exist, continue anyway
          profile = null;
        }
      }

      return {
        user: data.user,
        profile,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during login';
      return rejectWithValue(errorMessage);
    }
  }
);

export const initializeAuth = createAsyncThunk(
  'auth/initializeAuth',
  async (_) => {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) throw error;

    if (!session?.user) {
      return { user: null, profile: null };
    }

    let profile: Profile | null = null;

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!profileError && profileData) {
        profile = profileData as Profile;
      }
    } catch (err) {
      // Profile table might not exist, continue anyway
      profile = null;
    }

    return { user: session.user, profile };
  }
);

export const signInWithGoogle = createAsyncThunk(
  'auth/signInWithGoogle',
  async (_) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
  }
);


export const handleOAuthCallback = createAsyncThunk(
  'auth/handleOAuthCallback',
  async (_) => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) throw sessionError;

    if (!session?.user) {
      throw new Error('No active session found');
    }

    const userEmail = session.user.email;
    const userName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || userEmail?.split('@')[0] || 'User';
    const provider = (session.user.app_metadata as any)?.provider || 'google';

    let profile: Profile | null = null;

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (existingProfile) {
      profile = existingProfile as Profile;
    } else {
      // Create profile using database function
      const { data: profileData, error: profileError } = await supabase.rpc('create_user_profile', {
        p_user_id: session.user.id,
        p_name: userName,
        p_email: userEmail || '',
        p_provider: provider,
      });

      if (profileError) {
        // If function fails, try direct insert as fallback
        const { data: insertData, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            name: userName,
            email: userEmail || '',
            role: 'user',
            provider: provider,
          })
          .select()
          .single();

        if (insertError) {
          // If insert fails (likely 409 - profile already exists from trigger)
          // Just fetch the existing profile that was created by the trigger
          const { data: existingProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (fetchError || !existingProfile) {
            throw new Error(`Failed to get user profile: ${fetchError?.message || insertError.message}`);
          }
          
          profile = existingProfile as Profile;
        } else if (insertData) {
          profile = insertData as Profile;
        }
      } else if (profileData) {
        profile = profileData as Profile;
      }
    }

      return { user: session.user, profile };
  }
);

export const signOut = createAsyncThunk(
  'auth/signOut',
  async (_) => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
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

