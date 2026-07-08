import { NavLink } from "react-router-dom";
import { LogOut, Sparkles, X } from "lucide-react";
import { dashboardLinks } from "@/constants/navigation";
import { cn } from "@/utils/cn";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";

function Sidebar({ open = false, onClose }) {
  const { user, logout } = useAuth();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-border/60 bg-card/95 px-4 py-5 shadow-[0_24px_80px_rgba(15,23,42,0.14)] backdrop-blur-xl transition-transform duration-300 lg:w-72 lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      )}
    >
      <div className="flex items-center justify-between gap-3 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_12px_30px_rgba(14,165,233,0.18)]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold tracking-tight">Verveo</p>
            <p className="text-xs text-muted-foreground">AI Interview Ecosystem</p>
          </div>
        </div>
        {onClose ? (
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      <div className="space-y-2 pb-5">
        {dashboardLinks.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition duration-200 hover:bg-muted/70 hover:text-foreground",
                isActive && "bg-primary text-primary-foreground shadow-[0_10px_24px_rgba(14,165,233,0.18)] hover:bg-primary hover:text-primary-foreground",
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </div>

      <div className="mt-auto rounded-[20px] border border-border/60 bg-muted/50 p-4">
        <p className="text-sm font-semibold tracking-tight">{user?.name}</p>
        <p className="mt-1 text-xs text-muted-foreground">{user?.email}</p>
        <button
          type="button"
          onClick={logout}
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-foreground transition hover:text-primary"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
