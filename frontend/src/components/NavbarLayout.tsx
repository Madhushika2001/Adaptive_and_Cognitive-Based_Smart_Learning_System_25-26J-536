import type { ReactNode } from "react";
import Navbar from "./Navbar";

export default function NavbarLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />
      <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
