import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store/store';
import { initializeAuth, signOut } from '../store/thunks/authThunks';
import { supabase } from '../configs/supabase';

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider component manages authentication state by initializing auth,
 * fetching user info, and listening for auth state changes from Supabase.
 * It handles:
 * - Initial auth state loading
 * - Session management and refresh
 * - User profile updates
 * - Auto sign-out on auth errors
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const dispatch = useDispatch<AppDispatch>();

  // Initialize auth on mount
  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  // Listen for Supabase auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      // Handle password recovery - refresh session
      if (event === 'PASSWORD_RECOVERY') {
        return;
      }

      // Token was refreshed or user signed in
      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        dispatch(initializeAuth());
        return;
      }

      // User signed out
      if (event === 'SIGNED_OUT') {
        dispatch(signOut());
        return;
      }

      // For all other events, reinitialize auth state
      dispatch(initializeAuth());
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [dispatch]);

  return <>{children}</>;
};

