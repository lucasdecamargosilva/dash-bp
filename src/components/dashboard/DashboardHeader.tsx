import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { LogOut, Moon, Sun, BarChart3, GitBranch, Trophy, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/context/TenantContext";

import { useTheme } from "@/hooks/useTheme";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export function DashboardHeader() {
  const { signOut, user } = useAuth();
  const { tenant } = useTenant();
  const { isDark, toggle } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
  };

  const { isAdmin } = useTenant();

  const navItems = [
    { path: "/", label: "Vendas", icon: BarChart3 },
    { path: "/pipeline", label: "Pipeline", icon: GitBranch },
    { path: "/comercial", label: "Comercial", icon: Trophy },
    ...(isAdmin ? [{ path: "/admin", label: "Admin", icon: Settings }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 bg-navy-900 dark:bg-[hsl(220,20%,6%)] text-white shadow-md">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <div className="flex items-center gap-4">
            <Logo size="sm" variant="white" />
            <div className="hidden sm:block h-4 w-px bg-white/20" />

            {/* Navigation */}
            <nav className="hidden sm:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-body font-medium transition-colors",
                      isActive
                        ? "bg-white/15 text-white"
                        : "text-navy-300 dark:text-steel-400 hover:text-white hover:bg-white/8"
                    )}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile navigation */}
            <div className="flex sm:hidden items-center gap-1 mr-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={cn(
                      "p-1.5 rounded-md transition-colors",
                      isActive
                        ? "bg-white/15 text-white"
                        : "text-navy-300 hover:text-white hover:bg-white/8"
                    )}
                    title={item.label}
                  >
                    <item.icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>

            <span className="hidden sm:block text-xs font-body text-navy-300 dark:text-steel-400 truncate max-w-[200px] mr-1">
              {user?.email}
            </span>

            <Button
              variant="ghost"
              size="sm"
              onClick={toggle}
              className="text-navy-300 dark:text-steel-400 hover:text-white hover:bg-white/10 h-8 w-8 p-0"
              title={isDark ? "Modo claro" : "Modo escuro"}
            >
              {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-navy-300 dark:text-steel-400 hover:text-white hover:bg-white/10 font-body text-xs gap-1.5 h-8"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
