import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../store/store';
import { initializeAuth } from '../store/thunks/authThunks';

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider initialises auth once on mount by reading the localStorage
 * session (written by signIn / signUp).  No Supabase listener is needed here
 * because auth is managed locally with localStorage-backed mock credentials.
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  return <>{children}</>;
};
