import { Menu } from "lucide-react";
import { Outlet } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./Sidebar";

function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="shell py-6 lg:py-8">
        <div className="mb-4 flex items-center justify-between lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen((current) => !current)}
            className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium"
          >
            <Menu className="h-4 w-4" />
            Menu
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className={sidebarOpen ? "block" : "hidden lg:block"}>
            <Sidebar />
          </div>
          <main className="min-w-0 rounded-[28px] border border-border bg-card/80 p-5 shadow-sm backdrop-blur-xl sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
