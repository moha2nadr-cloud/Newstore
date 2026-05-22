import { useSettings } from "@/lib/settings-store";

export function StoreHeader() {
  const s = useSettings();
  return (
    <header className="pt-10 pb-6 text-center px-4 space-y-4">
      <h1 className="font-thuluth text-4xl md:text-5xl text-primary leading-[1.6] animate-float-up">
        {s?.store_name || "الطب الإسلامي البديل"}
      </h1>
      {s?.store_tagline && (
        <p className="text-sm text-muted-foreground animate-float-up" style={{ animationDelay: "120ms" }}>
          {s.store_tagline}
        </p>
      )}
    </header>
  );
}
