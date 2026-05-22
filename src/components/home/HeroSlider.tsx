import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ImageWithSpinner } from "@/components/ImageWithSpinner";

type Slide = { id: number; image_url: string; title?: string | null; subtitle?: string | null; cta_text?: string | null };

export function HeroSlider({ slides }: { slides: Slide[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ direction: "rtl", loop: true });
  const [selected, setSelected] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    const interval = setInterval(() => emblaApi.scrollNext(), 5000);
    return () => { clearInterval(interval); emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  if (!slides.length) {
    return (
      <div className="mx-4 aspect-[16/9] rounded-3xl bg-primary-soft/40 grid place-items-center">
        <div className="size-8 rounded-full border-2 border-primary/25 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative mx-4">
      <div ref={emblaRef} className="overflow-hidden rounded-3xl shadow-soft">
        <div className="flex">
          {slides.map((s, i) => (
            <div key={s.id} className="relative min-w-0 flex-[0_0_100%] aspect-[16/9]">
              <ImageWithSpinner src={s.image_url} alt={s.title || ""} className="size-full" width={1200} eager={i === 0} />
              {(s.title || s.subtitle || s.cta_text) && (
                <div className="absolute inset-0 bg-gradient-to-l from-black/55 via-black/20 to-transparent flex flex-col justify-center pr-6 pl-12 text-white">
                  {s.title && <h2 className="font-display text-2xl md:text-3xl">{s.title}</h2>}
                  {s.subtitle && <p className="mt-1.5 text-xs md:text-sm opacity-90 max-w-xs">{s.subtitle}</p>}
                  {s.cta_text && (
                    <button className="mt-3 self-start rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground">
                      {s.cta_text}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {slides.length > 1 && (
        <>
          <button onClick={scrollPrev} aria-label="السابق" className="absolute top-1/2 -translate-y-1/2 right-2 grid size-9 place-items-center rounded-full glass shadow-soft">
            <ChevronRight className="size-5" />
          </button>
          <button onClick={scrollNext} aria-label="التالي" className="absolute top-1/2 -translate-y-1/2 left-2 grid size-9 place-items-center rounded-full glass shadow-soft">
            <ChevronLeft className="size-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {slides.map((_, i) => (
              <span key={i} className={`block size-1.5 rounded-full transition-all ${i === selected ? "w-5 bg-white" : "bg-white/60"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
