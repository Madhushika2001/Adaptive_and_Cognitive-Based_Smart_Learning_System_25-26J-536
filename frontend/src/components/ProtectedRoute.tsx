import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  // Temporarily bypass authentication for development
  return <>{children}</>;
}
