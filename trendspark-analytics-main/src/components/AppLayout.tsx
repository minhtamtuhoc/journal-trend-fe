import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  TrendingUp,
  Search,
  Users,
  Bookmark,
  Library,
  Bell,
  FileBarChart,
  Settings,
  Shield,
  LogOut,
  Sparkles,
  Activity,
  Command,
} from "lucide-react";
import { useEffect } from "react";
import { useAuth, isAdminUser } from "@/auth";
import { useNotifications } from "@/hooks/data/use-notifications";
import { motion } from "framer-motion";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/trends", label: "Trend Analytics", icon: TrendingUp },
  { to: "/search", label: "Search Explorer", icon: Search },
  { to: "/authors", label: "Researchers", icon: Users },
  { to: "/collections", label: "Collections", icon: Library },
  { to: "/bookmarks", label: "Bookmarks", icon: Bookmark },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/reports", label: "Reports", icon: FileBarChart },
] as const;

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { data: notifications = [] } = useNotifications();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!user) navigate({ to: "/login" });
  }, [user, navigate]);

  if (!user) return null;

  const unread = notifications.filter((n) => n.unread).length;

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-border glass flex flex-col min-h-screen max-h-screen sticky top-0">
        <Link to="/dashboard" className="p-6 flex items-center gap-3">
          <div className="size-9 rounded-lg flex items-center justify-center glow-brand" style={{ background: "var(--gradient-brand)" }}>
            <Sparkles className="size-4 text-brand-foreground" />
          </div>
          <div>
            <div className="font-bold tracking-tight text-foreground text-sm uppercase">Helix Analytics</div>
            <div className="text-[10px] text-muted-foreground font-mono">v4.0 · intelligence</div>
          </div>
        </Link>

        <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-1">
          <div className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Intelligence</div>
          {nav.map((item) => {
            const active = pathname === item.to || (item.to !== "/dashboard" && pathname.startsWith(item.to));
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-brand/10 text-brand border border-brand/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50 border border-transparent"
                }`}
              >
                <Icon className="size-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.to === "/notifications" && unread > 0 && (
                  <span className="text-[10px] font-mono bg-brand/20 text-brand px-1.5 py-0.5 rounded">{unread}</span>
                )}
              </Link>
            );
          })}

          <div className="px-3 pt-6 pb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Account</div>
          <Link
            to="/profile"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              pathname === "/profile" ? "bg-brand/10 text-brand border border-brand/30" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            }`}
          >
            <Settings className="size-4" />
            Profile Settings
          </Link>
          <Link
            to="/admin"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              pathname.startsWith("/admin")
                ? "bg-brand/10 text-brand border border-brand/30"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            }`}
          >
            <Shield className="size-4" />
            <span className="flex-1">Admin Panel</span>
            {!isAdminUser(user) && (
              <span className="text-[9px] font-mono uppercase text-muted-foreground">Admin</span>
            )}
          </Link>
        </nav>

        <div className="shrink-0 p-4 border-t border-border space-y-3 bg-background/80">
          <div className="rounded-xl p-3 border border-border bg-surface-elevated/50 hidden lg:block">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Sync Engine</div>
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs text-foreground">Next sync · 02:00 AM</span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
              <Activity className="size-3" /> OpenAlex · Crossref · Semantic Scholar
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border border-border text-foreground hover:bg-destructive/10 hover:border-destructive/40 hover:text-destructive transition-colors"
          >
            <LogOut className="size-4" /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border glass flex items-center justify-between px-8 sticky top-0 z-30">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search papers, authors, DOIs..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const q = (e.target as HTMLInputElement).value;
                  navigate({ to: "/search", search: { q } });
                }
              }}
              className="w-full bg-secondary/40 border border-border rounded-lg py-2 pl-10 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 transition-all placeholder:text-muted-foreground"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1 text-[10px] font-mono text-muted-foreground border border-border rounded px-1.5 py-0.5">
              <Command className="size-2.5" />K
            </kbd>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/notifications" className="relative text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="size-5" />
              {unread > 0 && <span className="absolute -top-1 -right-1 size-2 bg-brand rounded-full ring-2 ring-background" />}
            </Link>
            <div className="flex items-center gap-3 border-l border-border pl-6">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-foreground">{user.name}</div>
                <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">{user.role}</div>
              </div>
              <div
                className="size-10 rounded-full flex items-center justify-center text-xs font-bold text-brand-foreground shrink-0"
                style={{ background: "var(--gradient-brand)" }}
                title={user.name}
              >
                {user.name.slice(0, 2).toUpperCase()}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-medium border border-border hover:bg-destructive/10 hover:border-destructive/40 hover:text-destructive transition-colors"
                title="Đăng xuất"
              >
                <LogOut className="size-4" />
                <span className="hidden md:inline">Đăng xuất</span>
              </button>
            </div>
          </div>
        </header>

        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex-1 p-8 overflow-y-auto"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">{title}</h1>
        {subtitle && <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}