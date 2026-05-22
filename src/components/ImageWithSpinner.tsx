import { useState } from "react";
import { optimizeImage } from "@/lib/image-url";

export function ImageWithSpinner({
  src,
  alt = "",
  className = "",
  imgClassName = "",
  width = 700,
  eager = false,
}: {
  src: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
  width?: number;
  eager?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const optimized = optimizeImage(src, width);
  return (
    <div className={`relative overflow-hidden bg-muted ${className}`}>
      {!loaded && !errored && (
        <div className="absolute inset-0 grid place-items-center">
          <div className="size-7 rounded-full border-2 border-primary/25 border-t-primary animate-spin" />
        </div>
      )}
      {!errored && (
        <img
          src={optimized}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={eager ? "high" : "auto"}
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className={`size-full object-cover transition-opacity duration-200 ${loaded ? "opacity-100" : "opacity-0"} ${imgClassName}`}
        />
      )}
      {errored && (
        <div className="absolute inset-0 grid place-items-center text-xs text-muted-foreground">
          تعذّر تحميل الصورة
        </div>
      )}
    </div>
  );
}
