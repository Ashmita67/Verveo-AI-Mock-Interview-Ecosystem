import { NavLink } from "react-router-dom";
import { LogOut, Sparkles } from "lucide-react";
import { dashboardLinks } from "@/constants/navigation";
import { cn } from "@/utils/cn";
import { useAuth } from "@/context/AuthContext";

function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="flex h-full w-full max-w-xs flex-col rounded-[28px] border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3 border-b border-border pb-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold">Verveo</p>
          <p className="text-xs text-muted-foreground">AI Interview Ecosystem</p>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        {dashboardLinks.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground",
                isActive && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </div>

      <div className="mt-auto rounded-3xl bg-secondary p-4">
        <p className="text-sm font-semibold">{user?.name}</p>
        <p className="mt-1 text-xs text-muted-foreground">{user?.email}</p>
        <button
          type="button"
          onClick={logout}
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:opacity-80"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
