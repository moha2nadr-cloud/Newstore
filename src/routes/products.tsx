import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, SlidersHorizontal, Plus, Eye, X, Check, LayoutGrid, List, Rows3 } from "lucide-react";
import { StoreHeader } from "@/components/layout/StoreHeader";
import { ImageWithSpinner } from "@/components/ImageWithSpinner";
import { CenteredSpinner } from "@/components/Spinner";
import { getCategories, getProducts } from "@/lib/products.functions";
import { useCart } from "@/lib/cart-store";
import { useSettings } from "@/lib/settings-store";

export const Route = createFileRoute("/products")({
  head: () => ({ meta: [{ title: "المنتجات — الطب الإسلامي البديل" }] }),
  component: ProductsPage,
});

const STATUS: Record<string, { label: string; cls: string; dot: string }> = {
  available: { label: "متوفر", cls: "bg-success/15 text-success border-success/30", dot: "bg-success" },
  limited: { label: "كمية محدودة", cls: "bg-warning/20 text-[oklch(0.4_0.16_70)] border-warning/40", dot: "bg-warning" },
  unavailable: { label: "غير متوفر", cls: "bg-destructive/15 text-destructive border-destructive/30", dot: "bg-destructive" },
};

function StatusPill({ status, size = "md" }: { status: string; size?: "sm" | "md" | "lg" }) {
  const s = STATUS[status] || STATUS.available;
  const sizes = { sm: "text-[10px] px-2 py-0.5", md: "text-xs px-2.5 py-1", lg: "text-sm px-3 py-1.5" };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${s.cls} ${sizes[size]}`}>
      <span className={`size-1.5 rounded-full ${s.dot}`} /> {s.label}
    </span>
  );
}

type LayoutMode = "grid" | "list" | "large";

function ProductsPage() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [status, setStatus] = useState<"available" | "unavailable" | "limited" | null>(null);
  const [sort, setSort] = useState<"newest" | "price_asc" | "price_desc" | "popular">("popular");
  const [filterOpen, setFilterOpen] = useState(false);
  const cart = useCart();
  const settings = useSettings();
  const [layout, setLayout] = useState<LayoutMode | null>(null);
  const effectiveLayout: LayoutMode = layout ?? ((settings?.product_layout as LayoutMode) || "grid");

  const { data: cats = [] } = useQuery({ queryKey: ["categories"], queryFn: () => getCategories(), staleTime: 5 * 60_000 });
  const productsQ = useQuery({
    queryKey: ["products", search, categoryId, status, sort],
    queryFn: () => getProducts({ data: { search, category_id: categoryId, status, sort } }),
    staleTime: 60_000,
  });
  const products = productsQ.data ?? [];

  return (
    <div className="space-y-5">
      <StoreHeader />

      <div className="mx-4 flex items-center gap-2">
        <button onClick={() => setFilterOpen(true)} className="active:scale-95 grid size-12 shrink-0 place-items-center rounded-2xl bg-card shadow-soft text-primary transition">
          <SlidersHorizontal className="size-5" />
        </button>
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن منتج..."
            className="w-full rounded-2xl bg-card shadow-soft pr-10 pl-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Layout switcher */}
      <div className="px-4 flex items-center justify-between">
        <h2 className="text-lg text-primary font-bold">المنتجات</h2>
        <div className="inline-flex rounded-full bg-card shadow-soft p-1">
          {([
            { v: "grid", icon: LayoutGrid },
            { v: "large", icon: Rows3 },
            { v: "list", icon: List },
          ] as const).map(({ v, icon: Icon }) => (
            <button key={v} onClick={() => setLayout(v)}
              className={`grid size-8 place-items-center rounded-full transition ${effectiveLayout === v ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              aria-label={v}>
              <Icon className="size-4" />
            </button>
          ))}
        </div>
      </div>

      {cats.length > 0 && (
        <div className="px-4">
          <div className="flex gap-3 overflow-x-auto py-1 -mx-4 px-4 scrollbar-none">
            <button onClick={() => setCategoryId(null)} className="active:scale-95 transition flex-shrink-0 flex flex-col items-center gap-1.5">
              <div className={`size-16 rounded-full grid place-items-center text-xs font-medium border-2 transition ${categoryId === null ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>الكل</div>
              <span className="text-[11px] text-muted-foreground">الكل</span>
            </button>
            {cats.map((c: any) => (
              <button key={c.id} onClick={() => setCategoryId(categoryId === c.id ? null : c.id)} className="active:scale-95 transition flex-shrink-0 flex flex-col items-center gap-1.5 max-w-[72px]">
                <div className={`size-16 rounded-full overflow-hidden border-2 bg-card transition ${categoryId === c.id ? "border-primary scale-105" : "border-border"}`}>
                  {c.image_url
                    ? <ImageWithSpinner src={c.image_url} className="size-full" imgClassName="object-contain p-1" width={160} />
                    : <div className="size-full bg-primary-soft" />}
                </div>
                <span className="text-[11px] text-muted-foreground truncate w-full text-center">{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="px-4">
        {productsQ.isLoading ? (
          <div className="rounded-3xl bg-card p-10 shadow-soft"><CenteredSpinner /></div>
        ) : products.length === 0 ? (
          <div className="rounded-3xl bg-card p-8 text-center shadow-soft text-muted-foreground text-sm">لا توجد منتجات.</div>
        ) : effectiveLayout === "list" ? (
          <div className="space-y-2">
            {products.map((p: any) => <ProductListItem key={p.id} p={p} cart={cart} />)}
          </div>
        ) : effectiveLayout === "large" ? (
          <div className="grid grid-cols-1 gap-4">
            {products.map((p: any) => <ProductCard key={p.id} p={p} cart={cart} large />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {products.map((p: any) => <ProductCard key={p.id} p={p} cart={cart} />)}
          </div>
        )}
      </div>

      {filterOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setFilterOpen(false)}
        >
          <div className="w-full max-w-md bg-card rounded-t-3xl p-5 space-y-4 animate-in slide-in-from-bottom duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">تصفية</h3>
              <button onClick={() => setFilterOpen(false)} className="rounded-full p-1.5 hover:bg-muted"><X className="size-4"/></button>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">الحالة</p>
              <div className="flex gap-2 flex-wrap">
                {[{ v: null, l: "الكل" }, { v: "available", l: "متوفر" }, { v: "limited", l: "كمية محدودة" }, { v: "unavailable", l: "غير متوفر" }].map((o: any) => (
                  <button key={o.l} onClick={() => setStatus(o.v)} className={`rounded-full px-4 py-2 text-sm border transition ${status === o.v ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}>{o.l}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">الترتيب</p>
              <div className="flex gap-2 flex-wrap">
                {[{ v: "popular", l: "الأكثر مشاهدة" }, { v: "newest", l: "الأحدث" }, { v: "price_asc", l: "الأرخص" }, { v: "price_desc", l: "الأغلى" }].map((o: any) => (
                  <button key={o.v} onClick={() => setSort(o.v)} className={`rounded-full px-4 py-2 text-sm border transition ${sort === o.v ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}>{o.l}</button>
                ))}
              </div>
            </div>
            <button onClick={() => setFilterOpen(false)} className="w-full rounded-2xl bg-primary text-primary-foreground py-3 font-medium">تطبيق</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductCard({ p, cart, large }: { p: any; cart: any; large?: boolean }) {
  const img = p.image_urls?.[0];
  const inCart = cart.has(p.id);
  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    cart.addItem({ id: p.id, name: p.name, price: p.price, currency: p.currency, image: img });
  };
  return (
    <Link
      to="/products/$id"
      params={{ id: String(p.id) }}
      preload="intent"
      className="block rounded-3xl bg-card shadow-soft overflow-hidden active:scale-[0.98] transition-transform"
    >
      <div className="relative aspect-square">
        {img ? <ImageWithSpinner src={img} className="size-full" width={large ? 800 : 400} /> : <div className="size-full bg-primary-soft" />}
        {p.is_new && <span className="absolute top-2 left-2 rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-[10px] font-bold">جديد</span>}
      </div>
      <div className={`p-3 ${large ? "p-4" : ""}`}>
        <h3 className={`font-bold line-clamp-1 ${large ? "text-base" : "text-sm"}`}>{p.name}</h3>
        <div className="mt-1.5"><StatusPill status={p.stock_status} size={large ? "md" : "sm"} /></div>
        {p.description && <p className="mt-2 text-[11px] text-muted-foreground line-clamp-2">{p.description}</p>}
        <div className="mt-2 flex items-center justify-between">
          <button
            type="button"
            onClick={handleAdd}
            className={`grid size-8 place-items-center rounded-full transition active:scale-90 ${inCart ? "bg-success text-success-foreground" : "bg-primary text-primary-foreground"}`}
            aria-label="إضافة"
          >
            {inCart ? <Check className="size-4" /> : <Plus className="size-4" />}
          </button>
          <div className="flex items-center gap-2">
            {p.views_count > 0 && <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground"><Eye className="size-3"/>{p.views_count}</span>}
            {p.price != null && <span className="text-sm font-bold">{p.price} {p.currency}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}

function ProductListItem({ p, cart }: { p: any; cart: any }) {
  const img = p.image_urls?.[0];
  const inCart = cart.has(p.id);
  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    cart.addItem({ id: p.id, name: p.name, price: p.price, currency: p.currency, image: img });
  };
  return (
    <Link
      to="/products/$id"
      params={{ id: String(p.id) }}
      preload="intent"
      className="flex items-center gap-3 rounded-2xl bg-card shadow-soft p-2 pr-3 active:scale-[0.98] transition-transform"
    >
      <div className="size-20 rounded-2xl overflow-hidden bg-primary-soft shrink-0">
        {img && <ImageWithSpinner src={img} className="size-full" width={200} />}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-bold text-sm line-clamp-1">{p.name}</h3>
        <div className="mt-1"><StatusPill status={p.stock_status} size="sm" /></div>
        {p.price != null && <p className="mt-1 text-sm font-bold">{p.price} {p.currency}</p>}
      </div>
      <button
        type="button"
        onClick={handleAdd}
        className={`grid size-9 place-items-center rounded-full active:scale-90 transition ${inCart ? "bg-success text-success-foreground" : "bg-primary text-primary-foreground"}`}
      >
        {inCart ? <Check className="size-4" /> : <Plus className="size-4" />}
      </button>
    </Link>
  );
}
