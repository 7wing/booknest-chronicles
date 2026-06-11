import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home, Search, BookOpen, Users, User, MessageCircle, Bell, Plus, Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PostEditor } from "@/components/community/PostEditor";
import { useUIStore } from "@/store/uiStore";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuthStore } from "@/store/authStore";
import logo from "@/assets/booknest-logo.png";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/explore", label: "Explore", icon: Search },
  { path: "/my-books", label: "My Books", icon: BookOpen },
  { path: "/community", label: "Community", icon: Users },
  { path: "/profile", label: "Profile", icon: User },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { openPostEditor } = useUIStore();
  const { unreadCount, markAllRead } = useNotifications();
  const profile = useAuthStore((s) => s.profile);
  const displayName = profile?.display_name || "Reader";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background paper-texture">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 z-40 hidden lg:flex w-64 flex-col border-r border-border bg-card/95 backdrop-blur-sm" aria-label="Main navigation">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
          <img src={logo} alt="BookNest logo" className="h-9 w-9 object-contain" />
          <h1 className="font-heading text-xl font-bold text-foreground">BookNest</h1>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                  active
                    ? "bg-accent/15 text-accent font-semibold"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}

          <div className="pt-4 border-t border-border mt-4 space-y-1">
            <Link
              to="/chat"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                location.pathname === "/chat"
                  ? "bg-accent/15 text-accent font-semibold"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <MessageCircle className="h-5 w-5" />
              Messages
            </Link>
            <Link
              to="/live"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                location.pathname === "/live"
                  ? "bg-accent/15 text-accent font-semibold"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Radio className="h-5 w-5" />
              Live
              <span className="ml-auto live-badge text-[10px] py-0.5 px-1.5">2</span>
            </Link>
            {/* Notifications in sidebar */}
            <button
              onClick={markAllRead}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] w-full text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <Bell className="h-5 w-5" />
              Notifications
              {unreadCount > 0 && (
                <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          </div>
        </nav>

        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3 px-2">
            <Avatar className="h-9 w-9 border-2 border-accent/30">
              {profile?.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt={displayName} />
              ) : null}
              <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{displayName}</p>
              <p className="text-[11px] text-muted-foreground">12-day streak 🔥</p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Top Bar (mobile/tablet) */}
      <header className="sticky top-0 z-40 flex lg:hidden items-center gap-3 px-4 py-3 border-b border-border bg-card/95 backdrop-blur-lg">
        <img src={logo} alt="BookNest" className="h-7 w-7 object-contain" />
        <h1 className="font-heading text-lg font-bold text-foreground">BookNest</h1>
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 relative"
            aria-label="Notifications"
            onClick={markAllRead}
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full h-4 min-w-4 flex items-center justify-center px-0.5">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
          <Avatar className="h-8 w-8 border-2 border-accent/30">
            {profile?.avatar_url ? (
              <AvatarImage src={profile.avatar_url} alt={displayName} />
            ) : null}
            <AvatarFallback className="bg-secondary text-secondary-foreground text-[10px]">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:ml-64 pb-20 lg:pb-0 min-h-screen">
        {children}
      </main>

      {/* FAB */}
      <button
        className="fab lg:hidden"
        onClick={openPostEditor}
        aria-label="Create new post"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Post Editor */}
      <PostEditor />

      {/* Bottom Nav (mobile/tablet) */}
      <nav className="bottom-nav lg:hidden" aria-label="Bottom navigation">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`bottom-nav-item ${active ? "active" : ""}`}
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}