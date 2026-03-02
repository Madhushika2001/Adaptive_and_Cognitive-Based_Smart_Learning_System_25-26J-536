import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  const { isAuthenticated, isInitialized } = useSelector((state: RootState) => state.auth);

  // Show nothing while checking auth state
  if (!isInitialized) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: loc }} />;
  }

  return <>{children}</>;
}
