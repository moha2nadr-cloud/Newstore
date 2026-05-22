import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { ChevronRight, Eye, Plus, Check, AlertTriangle } from "lucide-react";
import { ImageWithSpinner } from "@/components/ImageWithSpinner";
import { CenteredSpinner } from "@/components/Spinner";
import { getProduct, trackProductView } from "@/lib/products.functions";
import { useSettings } from "@/lib/settings-store";
import { useCart } from "@/lib/cart-store";
import { getFingerprint } from "@/lib/fingerprint";

export const Route = createFileRoute("/products/$id")({
  component: ProductDetail,
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center">
      <AlertTriangle className="size-10 text-destructive" />
      <h2 className="text-lg font-bold">تعذر تحميل المنتج</h2>
      <p className="text-sm text-muted-foreground">{error.message}</p>
      <Link to="/products" className="rounded-full bg-primary text-primary-foreground px-6 py-2 text-sm font-medium">
        العودة للمنتجات
      </Link>
    </div>
  ),
});

function ProductDetail() {
  const { id } = Route.useParams();
  const pid = Number(id);
  const settings = useSettings();
  const cart = useCart();
  const { data: p, isLoading, error } = useQuery({ queryKey: ["product", pid], queryFn: () => getProduct({ data: { id: pid } }) });

  useEffect(() => {
    if (!pid) return;
    const fp = getFingerprint();
    if (fp) trackProductView({ data: { id: pid, fingerprint: fp } }).catch(() => {});
  }, [pid]);

  if (isLoading) return <div className="min-h-screen grid place-items-center"><CenteredSpinner /></div>;
  if (error || !p) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center">
      <AlertTriangle className="size-10 text-destructive" />
      <h2 className="text-lg font-bold">المنتج غير موجود</h2>
      <p className="text-sm text-muted-foreground">لم نتمكن من العثور على المنتج المطلوب.</p>
      <Link to="/products" className="rounded-full bg-primary text-primary-foreground px-6 py-2 text-sm font-medium">
        العودة للمنتجات
      </Link>
    </div>
  );

  const phone = (settings?.whatsapp_orders || "").replace(/\D/g, "");
  const msg = encodeURIComponent(`السلام عليكم،\nأرغب بطلب: ${p.name}${p.price ? ` (${p.price} ${p.currency})` : ""}\nشكراً.`);
  const wa = phone ? `https://wa.me/${phone}?text=${msg}` : "#";
  const inCart = cart.has(p.id);

  const statusMap: Record<string, { l: string; cls: string }> = {
    available: { l: "متوفر", cls: "badge-blur-green" },
    unavailable: { l: "غير متوفر", cls: "badge-blur-red" },
    limited: { l: "كمية محدودة", cls: "badge-blur-yellow" },
  };
  const st = statusMap[p.stock_status] || statusMap.available;

  return (
    <div className="pb-6">
      <div className="relative">
        {p.image_urls?.[0] ? (
          <ImageWithSpinner src={p.image_urls[0]} className="w-full aspect-square" />
        ) : (
          <div className="w-full aspect-square bg-primary-soft" />
        )}
        <Link to="/products" className="absolute top-4 right-4 grid size-10 place-items-center rounded-full glass shadow-soft">
          <ChevronRight className="size-5" />
        </Link>
        <span className={`absolute top-4 left-4 rounded-full px-3 py-1 text-xs font-semibold ${st.cls}`}>{st.l}</span>
      </div>

      {p.image_urls?.length > 1 && (
        <div className="px-4 mt-3 flex gap-2 overflow-x-auto">
          {p.image_urls.slice(1).map((u: string, i: number) => (
            <div key={i} className="shrink-0 size-20 rounded-2xl overflow-hidden">
              <ImageWithSpinner src={u} className="size-full" />
            </div>
          ))}
        </div>
      )}

      <div className="px-4 mt-4 space-y-3">
        {p.category_name && <p className="text-xs text-primary">{p.category_name}</p>}
        <h1 className="font-display text-2xl text-foreground">{p.name}</h1>
        <div className="flex items-center justify-between">
          {p.price != null && <p className="text-2xl font-bold">{p.price} <span className="text-base text-muted-foreground">{p.currency}</span></p>}
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground"><Eye className="size-4"/> {p.views_count || 0} مشاهدة</span>
        </div>
        {p.description && <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">{p.description}</p>}
        {p.notes && (
          <div className="rounded-2xl bg-primary-soft/40 p-3 text-sm">
            <p className="font-semibold text-primary mb-1">ملاحظات</p>
            <p className="whitespace-pre-wrap">{p.notes}</p>
          </div>
        )}
        {p.quantity != null && <p className="text-sm text-muted-foreground">الكمية المتوفرة: {p.quantity}</p>}

        <div className="flex gap-2 pt-2">
          <button
            onClick={() => cart.addItem({ id: p.id, name: p.name, price: p.price, currency: p.currency, image: p.image_urls?.[0] })}
            className={`grid size-12 place-items-center rounded-2xl ${inCart ? "bg-success text-success-foreground" : "bg-foreground text-background"}`}
          >
            {inCart ? <Check className="size-5"/> : <Plus className="size-5" />}
          </button>
          <a href={wa} target="_blank" rel="noreferrer" className="flex-1 rounded-2xl bg-[#25D366] text-white grid place-items-center font-medium">
            اطلب عبر واتساب
          </a>
        </div>
      </div>
    </div>
  );
}
