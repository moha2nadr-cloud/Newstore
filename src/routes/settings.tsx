import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useSettings } from "@/lib/settings-store";
import { Headphones, Info, Type } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "الإعدادات" }] }),
  component: SettingsPage,
});

const SIZES = [
  { v: 0.9, l: "صغير" },
  { v: 1.0, l: "متوسط" },
  { v: 1.1, l: "كبير" },
  { v: 1.25, l: "أكبر" },
];
const KEY = "herb_font_scale_v1";

function SettingsPage() {
  const s = useSettings();
  const [scale, setScale] = useState(1);
  const [aboutOpen, setAboutOpen] = useState(false);

  useEffect(() => {
    const v = parseFloat(localStorage.getItem(KEY) || "1");
    setScale(v);
    document.documentElement.style.setProperty("--font-scale", String(v));
  }, []);

  const update = (v: number) => {
    setScale(v);
    localStorage.setItem(KEY, String(v));
    document.documentElement.style.setProperty("--font-scale", String(v));
  };

  const phone = (s?.whatsapp_support || "").replace(/\D/g, "");

  return (
    <div className="space-y-5 pb-6">
      <header className="pt-8 pb-2 text-center">
        <h1 className="font-display text-3xl text-primary">الإعدادات</h1>
      </header>

      <div className="px-4 space-y-3">
        <section className="rounded-3xl bg-card shadow-soft p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="grid size-10 place-items-center rounded-2xl bg-primary-soft text-primary"><Type className="size-5"/></div>
            <div>
              <p className="font-semibold">حجم النص</p>
              <p className="text-xs text-muted-foreground">اختر الحجم المناسب لعرض النص</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {SIZES.map((o) => (
              <button
                key={o.v}
                onClick={() => update(o.v)}
                className={`rounded-2xl py-2.5 text-sm border ${scale === o.v ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border"}`}
              >
                {o.l}
              </button>
            ))}
          </div>
        </section>

        <a
          href={phone ? `https://wa.me/${phone}` : "#"}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-3xl bg-card shadow-soft p-5 hover:shadow-elegant transition"
        >
          <div className="grid size-10 place-items-center rounded-2xl bg-primary-soft text-primary"><Headphones className="size-5"/></div>
          <div className="flex-1">
            <p className="font-semibold">الدعم والمساعدة</p>
            <p className="text-xs text-muted-foreground">مركز المساعدة والدعم الفني</p>
          </div>
        </a>

        <button
          onClick={() => setAboutOpen(true)}
          className="w-full flex items-center gap-3 rounded-3xl bg-card shadow-soft p-5 hover:shadow-elegant transition text-right"
        >
          <div className="grid size-10 place-items-center rounded-2xl bg-primary-soft text-primary"><Info className="size-5"/></div>
          <div className="flex-1">
            <p className="font-semibold">عن التطبيق</p>
            <p className="text-xs text-muted-foreground">معلومات عن التطبيق</p>
          </div>
        </button>
      </div>

      {aboutOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 backdrop-blur-sm p-4" onClick={() => setAboutOpen(false)}>
          <div className="bg-card rounded-3xl p-6 max-w-sm w-full shadow-elegant text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-2xl text-primary mb-3">{s?.store_name || "الطب الإسلامي البديل"}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{s?.about_text || ""}</p>
            <button onClick={() => setAboutOpen(false)} className="mt-5 rounded-2xl bg-primary text-primary-foreground px-6 py-2.5">إغلاق</button>
          </div>
        </div>
      )}
    </div>
  );
}
