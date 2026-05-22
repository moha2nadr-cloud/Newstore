import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, Pin, Send, X } from "lucide-react";
import { motion } from "framer-motion";
import { ImageWithSpinner } from "@/components/ImageWithSpinner";
import { formatArabicDate, timeAgoAr } from "@/lib/format";
import { getFingerprint, getStoredName, setStoredName } from "@/lib/fingerprint";
import { useSettings } from "@/lib/settings-store";
import {
  toggleLike, getComments, addComment, getLikedPostIds,
} from "@/lib/home.functions";
import { toast } from "sonner";

export type Post = {
  id: number;
  kind: string;
  title?: string | null;
  body?: string | null;
  image_url?: string | null;
  pinned: boolean;
  created_at: string;
  like_count: number;
  comment_count: number;
};

export function PostCard({ post, liked, onLikedToggle }: { post: Post; liked: boolean; onLikedToggle: (id: number, liked: boolean) => void }) {
  const settings = useSettings();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [localLikes, setLocalLikes] = useState(post.like_count);
  const [localLiked, setLocalLiked] = useState(liked);

  useEffect(() => setLocalLiked(liked), [liked]);
  useEffect(() => setLocalLikes(post.like_count), [post.like_count]);

  const likeMut = useMutation({
    mutationFn: () => toggleLike({ data: { post_id: post.id, fingerprint: getFingerprint() } }),
    onMutate: () => {
      setLocalLiked((v) => !v);
      setLocalLikes((n) => n + (localLiked ? -1 : 1));
    },
    onSuccess: (res) => {
      setLocalLiked(res.liked);
      setLocalLikes(res.count);
      onLikedToggle(post.id, res.liked);
    },
  });

  return (
    <article
      id={`post-${post.id}`}
      className="mx-4 rounded-3xl bg-card shadow-soft overflow-hidden animate-float-up"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div>
          <p className="font-display text-base text-primary">{settings?.store_name || "الطب الإسلامي البديل"}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{formatArabicDate(post.created_at)} · {timeAgoAr(post.created_at)}</p>
        </div>
        {post.pinned && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-[10px] text-primary">
            <Pin className="size-3" /> مثبّت
          </span>
        )}
      </div>

      {/* Content */}
      {post.kind === "image" && post.image_url ? (
        <>
          <ImageWithSpinner src={post.image_url} alt={post.title || ""} className="w-full aspect-[4/3]" width={900} />
          {(post.title || post.body) && (
            <div className="p-4">
              {post.title && <h3 className="font-display text-lg text-foreground">{post.title}</h3>}
              {post.body && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{post.body}</p>}
            </div>
          )}
        </>
      ) : (
        <div className="px-6 py-8 bg-primary-soft/40 text-center">
          {post.title && <h3 className="font-display text-2xl text-foreground">{post.title}</h3>}
          {post.body && (
            <blockquote className="mt-3 text-base text-foreground/85 whitespace-pre-wrap leading-relaxed">
              <span className="text-primary text-3xl leading-none">”</span>
              {post.body}
            </blockquote>
          )}
          <div className="mt-4 flex justify-center"><span className="block h-px w-12 bg-primary/40" /></div>
        </div>
      )}

      {/* Actions — like (right) | comment (left) */}
      <div className="grid grid-cols-2 border-t border-border/60">
        <button onClick={() => likeMut.mutate()} className={`flex items-center justify-center gap-1.5 py-3 text-sm transition active:scale-95 ${localLiked ? "text-primary font-semibold" : "text-muted-foreground hover:bg-muted/50"}`}>
          <Heart className={`size-4 ${localLiked ? "fill-current" : ""}`} /> أعجبني {localLikes > 0 && <span className="text-xs">({localLikes})</span>}
        </button>
        <button onClick={() => setCommentsOpen(true)} className="flex items-center justify-center gap-1.5 py-3 text-sm text-muted-foreground hover:bg-muted/50 transition border-r border-border/60 active:scale-95">
          <MessageCircle className="size-4" /> تعليق {post.comment_count > 0 && <span className="text-xs">({post.comment_count})</span>}
        </button>
      </div>

      {commentsOpen && <CommentsSheet postId={post.id} onClose={() => setCommentsOpen(false)} />}
    </article>
  );
}

function CommentsSheet({ postId, onClose }: { postId: number; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: comments = [] } = useQuery({
    queryKey: ["comments", postId],
    queryFn: () => getComments({ data: { post_id: postId } }),
  });
  const [name, setName] = useState(getStoredName());
  const [body, setBody] = useState("");
  const mut = useMutation({
    mutationFn: () => addComment({ data: { post_id: postId, fingerprint: getFingerprint(), author_name: name.trim(), body: body.trim() } }),
    onSuccess: () => {
      setStoredName(name.trim());
      setBody("");
      qc.invalidateQueries({ queryKey: ["comments", postId] });
      qc.invalidateQueries({ queryKey: ["posts"] });
      toast.success("تم إضافة التعليق");
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 280 }}
        className="w-full max-w-md max-h-[85vh] bg-card rounded-t-3xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-display text-lg">التعليقات</h3>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted"><X className="size-4"/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {comments.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">لا توجد تعليقات بعد. كن أول من يعلّق.</p>}
          {comments.map((c: any) => (
            <div key={c.id} className="rounded-2xl bg-muted/50 p-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm">{c.author_name}</p>
                <p className="text-[10px] text-muted-foreground">{timeAgoAr(c.created_at)}</p>
              </div>
              <p className="text-sm mt-1 whitespace-pre-wrap">{c.body}</p>
              {c.reply_body && (
                <div className="mt-2 mr-6 rounded-2xl bg-primary/10 p-2.5 border-r-2 border-primary">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block size-1.5 rounded-full bg-primary" />
                    <p className="font-semibold text-xs text-primary">المشرف</p>
                    <p className="text-[10px] text-muted-foreground">· {timeAgoAr(c.reply_at)}</p>
                  </div>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{c.reply_body}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); if (!name.trim() || !body.trim()) return; mut.mutate(); }}
          className="border-t p-3 space-y-2 bg-background/50"
        >
          {!getStoredName() && (
            <input
              type="text"
              placeholder="اسمك"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-full bg-muted px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              maxLength={60}
              required
            />
          )}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="اكتب تعليقاً..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="flex-1 rounded-full bg-muted px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
              maxLength={2000}
              required
            />
            <button type="submit" disabled={mut.isPending || !body.trim() || !name.trim()} className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-50">
              <Send className="size-4" />
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export { getLikedPostIds };
