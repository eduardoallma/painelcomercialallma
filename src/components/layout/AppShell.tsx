import { useState } from "react";
import { Outlet } from "react-router-dom";
import SidebarNav from "./SidebarNav";

export default function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:block w-60 flex-shrink-0">
        <SidebarNav />
      </div>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-60 transform transition-transform duration-300 lg:hidden ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarNav onNavigate={() => setDrawerOpen(false)} />
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <Outlet context={{ onMenuClick: () => setDrawerOpen(true) }} />
      </main>
    </div>
  );
}
