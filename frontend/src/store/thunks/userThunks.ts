import { createAsyncThunk } from '@reduxjs/toolkit';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

export const fetchUserInfo = createAsyncThunk(
  'user/fetchUserInfo',
  async (jwt: string, { rejectWithValue }) => {
    const res = await fetch(`${API_BASE_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    if (!res.ok) throw new Error('Failed to fetch user info');
    const data = await res.json();
    // Normalize keys for Redux state
    return {
      id: data.user_id,
      name: data.user_name,
      ...data
    };
  }
);
