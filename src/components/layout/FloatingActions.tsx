import { useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart-store";
import { useSettings } from "@/lib/settings-store";
import { ShoppingCart, X } from "lucide-react";

function WhatsAppIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M20.52 3.48A11.93 11.93 0 0012.04 0C5.46 0 .12 5.34.12 11.92c0 2.1.55 4.15 1.6 5.96L0 24l6.27-1.64a11.9 11.9 0 005.77 1.47h.01c6.58 0 11.92-5.34 11.92-11.92 0-3.18-1.24-6.18-3.45-8.43zM12.05 21.8h-.01a9.9 9.9 0 01-5.04-1.38l-.36-.21-3.72.97.99-3.62-.24-.37a9.88 9.88 0 01-1.52-5.27c0-5.47 4.45-9.92 9.92-9.92 2.65 0 5.13 1.03 7 2.9a9.85 9.85 0 012.9 7c0 5.47-4.45 9.9-9.92 9.9zm5.43-7.42c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15s-.77.97-.94 1.17c-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48a9.02 9.02 0 01-1.67-2.07c-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.79.37s-1.04 1.02-1.04 2.48 1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35z"/>
    </svg>
  );
}

export function FloatingActions() {
  const { pathname } = useLocation();
  const { items, removeItem, clear } = useCart();
  const settings = useSettings();
  const [cartOpen, setCartOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const show =
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/ai") &&
    !pathname.startsWith("/settings");
  if (!show) return null;

  const phone = (settings?.whatsapp_orders || "").replace(/\D/g, "");
  const waBase = phone ? `https://wa.me/${phone}` : "#";

  const orderMessage = () => {
    const lines = items.map((it, i) => `${i + 1}. ${it.name}${it.price ? ` — ${it.price} ${it.currency || ""}` : ""}`);
    return encodeURIComponent(`السلام عليكم،\nأرغب بطلب المنتجات التالية:\n\n${lines.join("\n")}\n\nشكراً لكم.`);
  };

  return (
    <>
      <div className="fixed bottom-28 left-4 z-40 flex flex-col items-center gap-3">
        {mounted && items.length > 0 && (
          <button
            onClick={() => setCartOpen(true)}
            aria-label="السلة"
            className="relative grid size-12 place-items-center rounded-full bg-foreground text-background shadow-elegant transition-transform hover:scale-105"
          >
            <ShoppingCart className="size-5" />
            <span className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              {items.length}
            </span>
          </button>
        )}
        <a
          href={waBase}
          target="_blank"
          rel="noreferrer"
          aria-label="واتساب"
          className="grid size-14 place-items-center rounded-full bg-[#25D366] text-white shadow-elegant transition-transform hover:scale-105"
        >
          <WhatsAppIcon className="size-7" />
        </a>
      </div>

      {cartOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm p-4" onClick={() => setCartOpen(false)}>
          <div className="w-full max-w-md rounded-3xl bg-card p-5 shadow-elegant" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl">سلة الطلبات</h3>
              <button onClick={() => setCartOpen(false)} className="rounded-full p-1 hover:bg-muted"><X className="size-4"/></button>
            </div>
            <ul className="space-y-2 max-h-[50vh] overflow-y-auto">
              {items.map((it) => (
                <li key={it.id} className="flex items-center justify-between gap-3 rounded-2xl bg-muted/50 p-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{it.name}</p>
                    {it.price ? <p className="text-xs text-muted-foreground">{it.price} {it.currency}</p> : null}
                  </div>
                  <button onClick={() => removeItem(it.id)} className="rounded-full p-1.5 hover:bg-background"><X className="size-4 text-destructive"/></button>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex gap-2">
              <button onClick={() => { clear(); setCartOpen(false); }} className="rounded-2xl border border-border px-4 py-2.5 text-sm">إلغاء الطلب</button>
              <a
                href={phone ? `${waBase}?text=${orderMessage()}` : "#"}
                target="_blank"
                rel="noreferrer"
                className="flex-1 rounded-2xl bg-[#25D366] text-white font-medium grid place-items-center"
              >
                اطلب عبر واتساب
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
