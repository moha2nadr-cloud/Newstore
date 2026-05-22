import { Link, useLocation } from "@tanstack/react-router";
import { Home, ShoppingBag, Sparkles, Settings } from "lucide-react";

// First item appears on the right (RTL).
const items = [
  { to: "/", label: "الرئيسية", icon: Home },
  { to: "/products", label: "المنتجات", icon: ShoppingBag },
  { to: "/ai", label: "الذكاء", icon: Sparkles },
  { to: "/settings", label: "الإعدادات", icon: Settings },
];

export function BottomNav() {
  const { pathname } = useLocation();
  if (pathname.startsWith("/admin")) return null;
  return (
    <nav className="fixed bottom-3 left-1/2 z-40 -translate-x-1/2 w-[min(94%,640px)]">
      <div className="glass rounded-3xl shadow-elegant border border-border/60 px-2 py-2">
        <ul className="flex items-center justify-between">
          {items.map((it) => {
            const active = it.to === "/" ? pathname === "/" : pathname.startsWith(it.to);
            const Icon = it.icon;
            return (
              <li key={it.to} className="flex-1">
                <Link
                  to={it.to}
                  preload="intent"
                  className={`flex flex-col items-center gap-1 rounded-2xl py-1.5 active:scale-95 transition-[transform,background-color,color] duration-150 ${
                    active ? "text-primary bg-primary/12" : "text-muted-foreground"
                  }`}
                >
                  <Icon className={`size-5 ${active ? "stroke-[2.4]" : ""}`} />
                  <span className="text-[11px] font-medium leading-none">{it.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
