import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "sonner";
import appCss from "../styles.css?url";
import { BottomNav } from "@/components/layout/BottomNav";
import { FloatingActions } from "@/components/layout/FloatingActions";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center">
        <h1 className="font-display text-7xl text-primary">٤٠٤</h1>
        <p className="mt-3 text-muted-foreground">الصفحة غير موجودة</p>
        <a href="/" className="mt-6 inline-block rounded-full bg-primary px-6 py-2 text-primary-foreground">العودة للرئيسية</a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <h1 className="font-display text-3xl text-foreground">حدث خطأ</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button onClick={() => { router.invalidate(); reset(); }} className="mt-6 rounded-full bg-primary px-6 py-2 text-primary-foreground">إعادة المحاولة</button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1" },
      { title: "الطب الإسلامي البديل" },
      { name: "description", content: "أعشاب طبيعية لحياة صحية" },
      { name: "theme-color", content: "#4a5d3a" },
      { property: "og:title", content: "الطب الإسلامي البديل" },
      { name: "twitter:title", content: "الطب الإسلامي البديل" },
      { property: "og:description", content: "أعشاب طبيعية لحياة صحية" },
      { name: "twitter:description", content: "أعشاب طبيعية لحياة صحية" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/463829ee-be54-4ee9-9ff0-24830f0b4ce4/id-preview-139d473f--7bfd845f-449b-4aa4-a51b-408a300a40d8.lovable.app-1779301041794.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/463829ee-be54-4ee9-9ff0-24830f0b4ce4/id-preview-139d473f--7bfd845f-449b-4aa4-a51b-408a300a40d8.lovable.app-1779301041794.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/app-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "preconnect", href: "https://res.cloudinary.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Amiri+Quran&family=Tajawal:wght@300;400;500;700;800&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen pb-28">
        <Outlet />
      </div>
      <FloatingActions />
      <BottomNav />
      <Toaster position="top-center" richColors dir="rtl" />
    </QueryClientProvider>
  );
}
