import { Search, Bell, MessageCircle, ChevronDown, Menu, LogOut } from "lucide-react";
import profileImage from "../assets/profile.svg";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";

type NavbarProps = {
  onMenuClick?: () => void;
};

export default function Navbar({ onMenuClick }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const nav = useNavigate();
  
  const profile = useSelector((state: RootState) => state.auth.profile);
  const user = useSelector((state: RootState) => state.auth.user);
  const displayName = profile?.name || user?.email?.split('@')[0] || 'Student Account';

  function logout() {
    localStorage.removeItem("auth_token");
    nav("/login", { replace: true });
  }

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  return (
    <header className="h-16 w-full bg-white border-b border-gray-200 flex items-center px-4 sm:px-6">
      {/* Left: Menu + Search */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Mobile menu button */}
        {onMenuClick && (
        <button
          onClick={onMenuClick}
          className="md:hidden h-10 w-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50"
          aria-label="Open sidebar"
          type="button"
        >
          <Menu className="h-5 w-5 text-gray-700" />
        </button>
        )}

        <div className="relative w-full max-w-xl min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#EAF6F1] text-sm outline-none
                       focus:ring-2 focus:ring-[#087990]/20"
          />
        </div>
      </div>

      {/* Right: Icons + User */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button className="h-10 w-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50">
          <MessageCircle className="h-5 w-5 text-gray-600" />
        </button>

        <button className="h-10 w-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50">
          <Bell className="h-5 w-5 text-gray-600" />
        </button>

        <div className="hidden sm:block h-10 w-px bg-gray-200 mx-1" />

        {/* Profile Dropdown */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen((s) => !s)}
            className="flex items-center gap-2 hover:bg-gray-50 px-2 py-1 rounded-xl" type="button">
          <div className="h-9 w-9 rounded-full overflow-hidden border border-gray-200">
            <img 
              src={profileImage} 
              alt="Profile" 
              className="h-full w-full object-cover"
            />
          </div>
          {/* Hide name on very small screens */}
          <span className="hidden sm:inline text-sm font-medium text-gray-700">
            {displayName}
          </span>
          <ChevronDown className={`h-4 w-4 text-gray-500 transition ${open ? "rotate-180" : ""}`} />
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                type="button"
              >
                <LogOut className="h-4 w-4" />
                Logout
        </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
