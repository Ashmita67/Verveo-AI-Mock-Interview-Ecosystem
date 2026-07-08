import { Menu } from "lucide-react";
import { Outlet } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/utils/cn";
import Sidebar from "./Sidebar";
import { Button } from "@/components/ui/Button";

function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen overflow-hidden bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/30 backdrop-blur-[1px] lg:hidden"
        />
      ) : null}

      <div className="flex h-full min-w-0 flex-col lg:pl-72">
        <div className="flex items-center justify-between gap-4 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-xl lg:hidden">
          <Button variant="outline" size="sm" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-4 w-4" />
            Menu
          </Button>
          <div className="text-sm font-medium text-muted-foreground">Verveo workspace</div>
        </div>

        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className={cn("shell py-6 sm:py-8 lg:py-10", "app-page")}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
