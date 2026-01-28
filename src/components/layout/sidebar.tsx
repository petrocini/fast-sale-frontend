import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Store,
  ShoppingCart,
  Calendar,
  Package,
  Settings,
  LogOut,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const sidebarItems = [
  { icon: ShoppingCart, label: "Frente de Caixa", href: "/" },
  { icon: Package, label: "Produtos", href: "/products" },
  { icon: Calendar, label: "Eventos", href: "/events" },
  { icon: Settings, label: "Configurações", href: "/settings" },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("@fastsale:token");
    localStorage.removeItem("@fastsale:user");
    navigate("/login");
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-border bg-card shadow-lg z-50 flex flex-col">
      {/* Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-border">
        <div className="flex items-center gap-2 text-primary">
          <Store className="h-6 w-6" />
          <span className="font-bold text-lg tracking-tight">Fast Sale</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {sidebarItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border bg-muted/10">
        <Button
          variant="outline"
          className="w-full justify-start gap-3 border-destructive/20 hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Sair do Sistema
        </Button>
      </div>
    </aside>
  );
}
