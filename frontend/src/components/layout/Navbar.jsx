import { Link } from "react-router-dom";
import { Moon, Sparkles, Sun } from "lucide-react";
import { navLinks } from "@/constants/navigation";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/hooks/useTheme";

function Navbar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="shell flex h-20 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_12px_30px_rgba(14,165,233,0.18)]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight">Verveo</p>
            <p className="text-xs text-muted-foreground">Practice Smarter. Interview Better.</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {navLinks.map((item) => (
            <a key={item.label} href={item.href} className="text-sm text-muted-foreground transition hover:text-foreground">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-border/70 bg-card/80 transition hover:-translate-y-0.5 hover:bg-muted/70"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link to="/login" className="hidden sm:block">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link to="/register">
            <Button>Get Started</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
