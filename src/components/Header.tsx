import { Search, User, Sun, Moon } from "lucide-react";
import { useState, useEffect, Fragment } from "react";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { useTheme } from "@/contexts/ThemeContext";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export function Header() {
  const { profile, loading } = useProfile();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const displayName = profile?.full_name || "User";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <Fragment>
    <header
      className={cn(
        "flex items-center justify-between py-4 animate-fade-in transition-all duration-300",
        scrolled
          ? "fixed top-0 left-0 right-0 z-50 px-4 py-3 bg-background/80 backdrop-blur-md border-b border-border/40 shadow-sm"
          : "relative"
      )}
    >
      {/* Brand logo */}
      <button
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-2 hover:opacity-85 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
        aria-label={`${siteConfig.name} – go to dashboard`}
      >
        <img
          src={siteConfig.logo}
          alt={siteConfig.name}
          className="h-10 w-auto select-none"
          draggable={false}
        />
      </button>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label={
            theme === "light" ? "Switch to dark mode" : "Switch to light mode"
          }
          className="text-muted-foreground hover:text-foreground"
        >
          {theme === "light" ? (
            <Moon className="w-5 h-5" />
          ) : (
            <Sun className="w-5 h-5" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground"
        >
          <Search className="w-5 h-5" />
        </Button>
        <NotificationDropdown />

        {/* User avatar */}
        <button
          onClick={() => navigate("/profile")}
          className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent/70 flex items-center justify-center text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity ml-1"
          aria-label="Go to profile"
        >
          {loading ? <User className="w-4 h-4" /> : initials}
        </button>
      </div>
    </header>
    {scrolled && <div className="h-[64px]" aria-hidden="true" />}
    </Fragment>
  );
}
