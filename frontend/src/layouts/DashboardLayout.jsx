import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="grid min-h-screen lg:grid-cols-[290px_1fr]">
        {/* Sidebar */}
        <aside className="sticky top-0 h-screen border-r border-[var(--line)] bg-[var(--surface-2)]">
          <Sidebar />
        </aside>

        {/* Main Content Area */}
        <div className="flex min-h-screen flex-col bg-[var(--surface)]">
          {/* Topbar */}
          <div className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--surface)]/90 backdrop-blur-xl">
            <Topbar />
          </div>

          {/* Page Content */}
          <main className="flex-1 px-5 py-6 md:px-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
