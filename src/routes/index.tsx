import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { StoreHeader } from "@/components/layout/StoreHeader";
import { HeroSlider } from "@/components/home/HeroSlider";
import { PostCard } from "@/components/home/PostCard";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { CenteredSpinner } from "@/components/Spinner";
import { getSlides, getPosts, getLikedPostIds } from "@/lib/home.functions";
import { getFingerprint } from "@/lib/fingerprint";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "الطب الإسلامي البديل — الرئيسية" },
      { name: "description", content: "أعشاب طبيعية لحياة صحية." },
    ],
  }),
  component: Home,
});

function Home() {
  const [fp, setFp] = useState("");
  useEffect(() => setFp(getFingerprint()), []);

  const slidesQ = useQuery({ queryKey: ["slides"], queryFn: () => getSlides(), staleTime: 60_000 });
  const postsQ = useQuery({ queryKey: ["posts"], queryFn: () => getPosts(), staleTime: 60_000 });
  const { data: likedIds = [] } = useQuery({
    queryKey: ["liked-ids", fp],
    queryFn: () => getLikedPostIds({ data: { fingerprint: fp } }),
    enabled: !!fp,
  });

  const slides = slidesQ.data ?? [];
  const posts = postsQ.data ?? [];
  const likedSet = new Set(likedIds);
  const [overrides, setOverrides] = useState<Record<number, boolean>>({});

  return (
    <div className="space-y-5">
      <StoreHeader />
      {slidesQ.isLoading ? (
        <div className="mx-4 aspect-[16/9] rounded-3xl bg-primary-soft/40 grid place-items-center"><CenteredSpinner /></div>
      ) : (
        <HeroSlider slides={slides} />
      )}
      <div className="space-y-4">
        {postsQ.isLoading ? (
          <div className="mx-4 rounded-3xl bg-card p-10 shadow-soft"><CenteredSpinner /></div>
        ) : posts.length === 0 ? (
          <div className="mx-4 rounded-3xl bg-card p-8 text-center shadow-soft">
            <p className="font-display text-xl text-primary">لا توجد منشورات بعد</p>
          </div>
        ) : (
          posts.map((p: any) => (
            <PostCard
              key={p.id}
              post={p}
              liked={overrides[p.id] ?? likedSet.has(p.id)}
              onLikedToggle={(id, l) => setOverrides((o) => ({ ...o, [id]: l }))}
            />
          ))
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
