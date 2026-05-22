import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  LogOut, Plus, Pencil, Trash2, Upload, Loader2, Pin, MessageSquare, X, Save,
} from "lucide-react";
import {
  adminLogin, adminLogout, adminCheck, adminUpload,
  adminSaveSetting,
  adminSaveCategory, adminDeleteCategory,
  adminSaveProduct, adminDeleteProduct,
  adminSaveSlide, adminDeleteSlide,
  adminListPosts, adminSavePost, adminDeletePost,
  adminListComments, adminReplyComment, adminDeleteComment,
} from "@/lib/admin.functions";
import { getCategories, getProducts } from "@/lib/products.functions";
import { getSlides } from "@/lib/home.functions";
import { getAllSettings } from "@/lib/settings.functions";
import { ImageWithSpinner } from "@/components/ImageWithSpinner";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "لوحة التحكم" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

const TABS = [
  { id: "products", label: "المنتجات" },
  { id: "categories", label: "الأصناف" },
  { id: "slides", label: "السلايدر" },
  { id: "posts", label: "المنشورات" },
  { id: "settings", label: "الإعدادات" },
] as const;
type Tab = typeof TABS[number]["id"];

function AdminPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-check"],
    queryFn: () => adminCheck(),
  });
  if (isLoading) return <div className="min-h-screen grid place-items-center"><Loader2 className="animate-spin size-6 text-primary" /></div>;
  if (!data?.isAdmin) return <LoginScreen onSuccess={() => refetch()} />;
  return <Dashboard onLogout={() => refetch()} />;
}

function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminLogin({ data: { email, password } });
      toast.success("مرحباً بك");
      onSuccess();
    } catch (err: any) {
      toast.error(err?.message || "فشل تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen grid place-items-center px-4 bg-background">
      <form onSubmit={submit} className="w-full max-w-sm bg-card rounded-3xl shadow-elegant p-6 space-y-4">
        <div className="text-center">
          <h1 className="font-display text-2xl text-primary">لوحة التحكم</h1>
          <p className="text-xs text-muted-foreground mt-1">سجل الدخول للمتابعة</p>
        </div>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="البريد الإلكتروني" className="w-full rounded-2xl bg-muted px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="كلمة المرور" className="w-full rounded-2xl bg-muted px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
        <button disabled={loading} className="w-full rounded-2xl bg-primary text-primary-foreground py-3 font-medium flex items-center justify-center gap-2 disabled:opacity-60">
          {loading && <Loader2 className="animate-spin size-4" />} دخول
        </button>
      </form>
    </div>
  );
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("products");
  const doLogout = async () => {
    await adminLogout();
    toast.success("تم تسجيل الخروج");
    onLogout();
  };
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-30 bg-card/90 backdrop-blur border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-display text-xl text-primary">لوحة التحكم</h1>
          <button onClick={doLogout} className="rounded-full px-3 py-1.5 text-xs bg-muted hover:bg-destructive hover:text-destructive-foreground flex items-center gap-1.5"><LogOut className="size-3.5"/>خروج</button>
        </div>
        <nav className="max-w-5xl mx-auto px-4 pb-2 flex gap-1.5 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`shrink-0 rounded-full px-4 py-1.5 text-sm transition ${tab === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{t.label}</button>
          ))}
        </nav>
      </header>
      <main className="max-w-5xl mx-auto p-4">
        {tab === "products" && <ProductsAdmin />}
        {tab === "categories" && <CategoriesAdmin />}
        {tab === "slides" && <SlidesAdmin />}
        {tab === "posts" && <PostsAdmin />}
        {tab === "settings" && <SettingsAdmin />}
      </main>
    </div>
  );
}

/* ---------- Cloudinary Upload ---------- */
function useImageUpload() {
  const [uploading, setUploading] = useState(false);
  const upload = async (file: File, folder = "herbs"): Promise<string> => {
    setUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const { url } = await adminUpload({ data: { dataUrl, folder } });
      return url;
    } finally {
      setUploading(false);
    }
  };
  return { uploading, upload };
}

function ImagePicker({ value, onChange, folder, className = "" }: { value: string | null; onChange: (url: string | null) => void; folder?: string; className?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const { uploading, upload } = useImageUpload();
  return (
    <div className={`relative rounded-2xl overflow-hidden bg-muted ${className}`}>
      {value ? <ImageWithSpinner src={value} className="size-full" /> : <div className="size-full grid place-items-center text-xs text-muted-foreground">لا توجد صورة</div>}
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={async (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        try { onChange(await upload(f, folder)); toast.success("تم رفع الصورة"); }
        catch (err: any) { toast.error(err?.message || "فشل الرفع"); }
        if (ref.current) ref.current.value = "";
      }} />
      <div className="absolute bottom-1 right-1 left-1 flex gap-1">
        <button type="button" onClick={() => ref.current?.click()} disabled={uploading} className="flex-1 rounded-full bg-primary text-primary-foreground text-[11px] py-1 flex items-center justify-center gap-1">
          {uploading ? <Loader2 className="animate-spin size-3"/> : <Upload className="size-3"/>} رفع
        </button>
        {value && <button type="button" onClick={() => onChange(null)} className="rounded-full bg-destructive text-destructive-foreground text-[11px] px-2"><X className="size-3"/></button>}
      </div>
    </div>
  );
}

function MultiImagePicker({ values, onChange, folder, max = 20 }: { values: string[]; onChange: (urls: string[]) => void; folder?: string; max?: number }) {
  const ref = useRef<HTMLInputElement>(null);
  const { uploading, upload } = useImageUpload();
  const handle = async (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).slice(0, max - values.length);
    const out = [...values];
    for (const f of arr) {
      try { out.push(await upload(f, folder)); onChange([...out]); }
      catch (e: any) { toast.error(e?.message || "فشل الرفع"); }
    }
    toast.success(`تم رفع ${arr.length} صورة`);
    if (ref.current) ref.current.value = "";
  };
  return (
    <div className="grid grid-cols-3 gap-2">
      {values.map((u, i) => (
        <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-muted">
          <ImageWithSpinner src={u} className="size-full" />
          <button type="button" onClick={() => onChange(values.filter((_, j) => j !== i))} className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-destructive text-destructive-foreground"><X className="size-3"/></button>
        </div>
      ))}
      {values.length < max && (
        <>
          <button type="button" onClick={() => ref.current?.click()} disabled={uploading} className="aspect-square rounded-xl bg-muted border-2 border-dashed border-border grid place-items-center text-xs text-muted-foreground gap-1">
            {uploading ? <Loader2 className="animate-spin size-5"/> : <><Upload className="size-5"/><span>إضافة صور</span></>}
          </button>
          <input ref={ref} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handle(e.target.files)} />
        </>
      )}
    </div>
  );
}

/* ---------- Categories ---------- */
function CategoriesAdmin() {
  const qc = useQueryClient();
  const { data: cats = [] } = useQuery({ queryKey: ["categories"], queryFn: () => getCategories() });
  const [editing, setEditing] = useState<any | null>(null);
  const saveMut = useMutation({
    mutationFn: (d: any) => adminSaveCategory({ data: d }),
    onSuccess: () => { toast.success("تم الحفظ"); qc.invalidateQueries({ queryKey: ["categories"] }); setEditing(null); },
    onError: (e: any) => toast.error(e?.message || "خطأ"),
  });
  const delMut = useMutation({
    mutationFn: (id: number) => adminDeleteCategory({ data: { id } }),
    onSuccess: () => { toast.success("تم الحذف"); qc.invalidateQueries({ queryKey: ["categories"] }); },
  });
  return (
    <div className="space-y-4">
      <button onClick={() => setEditing({ name: "", image_url: null, sort_order: 0 })} className="rounded-2xl bg-primary text-primary-foreground px-4 py-2 text-sm flex items-center gap-1.5"><Plus className="size-4"/>إضافة صنف</button>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {cats.map((c: any) => (
          <div key={c.id} className="bg-card rounded-2xl p-3 shadow-soft">
            <div className="aspect-square rounded-xl overflow-hidden bg-muted mb-2">
              {c.image_url ? <ImageWithSpinner src={c.image_url} className="size-full"/> : <div className="size-full"/>}
            </div>
            <p className="font-medium text-sm truncate">{c.name}</p>
            <div className="mt-2 flex gap-1.5">
              <button onClick={() => setEditing(c)} className="flex-1 rounded-full bg-muted text-xs py-1.5"><Pencil className="size-3 inline"/></button>
              <button onClick={() => confirm("حذف؟") && delMut.mutate(c.id)} className="flex-1 rounded-full bg-destructive/10 text-destructive text-xs py-1.5"><Trash2 className="size-3 inline"/></button>
            </div>
          </div>
        ))}
      </div>
      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing.id ? "تعديل صنف" : "إضافة صنف"}>
          <ImagePicker value={editing.image_url} onChange={(u) => setEditing({ ...editing, image_url: u })} folder="categories" className="aspect-square w-full max-w-[200px] mx-auto" />
          <Field label="اسم الصنف"><input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="input"/></Field>
          <Field label="الترتيب"><input type="number" value={editing.sort_order || 0} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} className="input"/></Field>
          <button disabled={saveMut.isPending || !editing.name} onClick={() => saveMut.mutate(editing)} className="btn-primary"><Save className="size-4"/>حفظ</button>
        </Modal>
      )}
    </div>
  );
}

/* ---------- Products ---------- */
function ProductsAdmin() {
  const qc = useQueryClient();
  const { data: products = [] } = useQuery({ queryKey: ["products", "", null, null, "newest"], queryFn: () => getProducts({ data: {} }) });
  const { data: cats = [] } = useQuery({ queryKey: ["categories"], queryFn: () => getCategories() });
  const [editing, setEditing] = useState<any | null>(null);
  const saveMut = useMutation({
    mutationFn: (d: any) => adminSaveProduct({ data: d }),
    onSuccess: () => { toast.success("تم الحفظ"); qc.invalidateQueries({ queryKey: ["products"] }); setEditing(null); },
    onError: (e: any) => toast.error(e?.message || "خطأ"),
  });
  const delMut = useMutation({
    mutationFn: (id: number) => adminDeleteProduct({ data: { id } }),
    onSuccess: () => { toast.success("تم الحذف"); qc.invalidateQueries({ queryKey: ["products"] }); },
  });
  const empty = { name: "", description: "", price: null, currency: "₪", quantity: null, stock_status: "available", category_id: null, image_urls: [], is_new: false };
  return (
    <div className="space-y-4">
      <button onClick={() => setEditing({ ...empty })} className="rounded-2xl bg-primary text-primary-foreground px-4 py-2 text-sm flex items-center gap-1.5"><Plus className="size-4"/>إضافة منتج</button>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {products.map((p: any) => (
          <div key={p.id} className="bg-card rounded-2xl p-3 shadow-soft">
            <div className="aspect-square rounded-xl overflow-hidden bg-muted mb-2">
              {p.image_urls?.[0] ? <ImageWithSpinner src={p.image_urls[0]} className="size-full"/> : <div className="size-full"/>}
            </div>
            <p className="font-medium text-sm truncate">{p.name}</p>
            <p className="text-xs text-muted-foreground">{p.price ? `${p.price} ${p.currency}` : "—"}</p>
            <div className="mt-2 flex gap-1.5">
              <button onClick={() => setEditing({ ...p, image_urls: p.image_urls || [] })} className="flex-1 rounded-full bg-muted text-xs py-1.5"><Pencil className="size-3 inline"/></button>
              <button onClick={() => confirm("حذف؟") && delMut.mutate(p.id)} className="flex-1 rounded-full bg-destructive/10 text-destructive text-xs py-1.5"><Trash2 className="size-3 inline"/></button>
            </div>
          </div>
        ))}
      </div>
      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing.id ? "تعديل منتج" : "إضافة منتج"}>
          <Field label="الصور (حتى 20)">
            <MultiImagePicker values={editing.image_urls} onChange={(urls) => setEditing({ ...editing, image_urls: urls })} folder="products" />
          </Field>
          <Field label="الاسم"><input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="input"/></Field>
          <Field label="الوصف"><textarea rows={3} value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="input"/></Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="السعر"><input type="number" step="0.01" value={editing.price ?? ""} onChange={(e) => setEditing({ ...editing, price: e.target.value === "" ? null : Number(e.target.value) })} className="input"/></Field>
            <Field label="العملة"><input value={editing.currency || "₪"} onChange={(e) => setEditing({ ...editing, currency: e.target.value })} className="input"/></Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="الكمية"><input type="number" value={editing.quantity ?? ""} onChange={(e) => setEditing({ ...editing, quantity: e.target.value === "" ? null : Number(e.target.value) })} className="input"/></Field>
            <Field label="الحالة">
              <select value={editing.stock_status} onChange={(e) => setEditing({ ...editing, stock_status: e.target.value })} className="input">
                <option value="available">متوفر</option>
                <option value="limited">كمية محدودة</option>
                <option value="unavailable">غير متوفر</option>
              </select>
            </Field>
          </div>
          <Field label="الصنف">
            <select value={editing.category_id ?? ""} onChange={(e) => setEditing({ ...editing, category_id: e.target.value ? Number(e.target.value) : null })} className="input">
              <option value="">— بدون صنف —</option>
              {cats.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!editing.is_new} onChange={(e) => setEditing({ ...editing, is_new: e.target.checked })}/>منتج جديد</label>
          <button disabled={saveMut.isPending || !editing.name} onClick={() => saveMut.mutate(editing)} className="btn-primary"><Save className="size-4"/>حفظ</button>
        </Modal>
      )}
    </div>
  );
}

/* ---------- Slides ---------- */
function SlidesAdmin() {
  const qc = useQueryClient();
  const { data: slides = [] } = useQuery({ queryKey: ["slides"], queryFn: () => getSlides() });
  const [editing, setEditing] = useState<any | null>(null);
  const saveMut = useMutation({
    mutationFn: (d: any) => adminSaveSlide({ data: d }),
    onSuccess: () => { toast.success("تم الحفظ"); qc.invalidateQueries({ queryKey: ["slides"] }); setEditing(null); },
    onError: (e: any) => toast.error(e?.message || "خطأ"),
  });
  const delMut = useMutation({
    mutationFn: (id: number) => adminDeleteSlide({ data: { id } }),
    onSuccess: () => { toast.success("تم الحذف"); qc.invalidateQueries({ queryKey: ["slides"] }); },
  });
  return (
    <div className="space-y-4">
      <button onClick={() => setEditing({ image_url: "", title: "", subtitle: "", cta_text: "", sort_order: 0 })} className="rounded-2xl bg-primary text-primary-foreground px-4 py-2 text-sm flex items-center gap-1.5"><Plus className="size-4"/>إضافة سلايد</button>
      <div className="grid sm:grid-cols-2 gap-3">
        {slides.map((s: any) => (
          <div key={s.id} className="bg-card rounded-2xl p-3 shadow-soft">
            <div className="aspect-[16/9] rounded-xl overflow-hidden bg-muted mb-2">
              <ImageWithSpinner src={s.image_url} className="size-full"/>
            </div>
            <p className="font-medium text-sm truncate">{s.title || "بدون عنوان"}</p>
            <div className="mt-2 flex gap-1.5">
              <button onClick={() => setEditing(s)} className="flex-1 rounded-full bg-muted text-xs py-1.5"><Pencil className="size-3 inline"/></button>
              <button onClick={() => confirm("حذف؟") && delMut.mutate(s.id)} className="flex-1 rounded-full bg-destructive/10 text-destructive text-xs py-1.5"><Trash2 className="size-3 inline"/></button>
            </div>
          </div>
        ))}
      </div>
      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing.id ? "تعديل سلايد" : "إضافة سلايد"}>
          <ImagePicker value={editing.image_url || null} onChange={(u) => setEditing({ ...editing, image_url: u || "" })} folder="slides" className="aspect-[16/9] w-full" />
          <Field label="العنوان"><input value={editing.title || ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="input"/></Field>
          <Field label="العنوان الفرعي"><input value={editing.subtitle || ""} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} className="input"/></Field>
          <Field label="نص الزر"><input value={editing.cta_text || ""} onChange={(e) => setEditing({ ...editing, cta_text: e.target.value })} className="input"/></Field>
          <Field label="الترتيب"><input type="number" value={editing.sort_order || 0} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} className="input"/></Field>
          <button disabled={saveMut.isPending || !editing.image_url} onClick={() => saveMut.mutate(editing)} className="btn-primary"><Save className="size-4"/>حفظ</button>
        </Modal>
      )}
    </div>
  );
}

/* ---------- Posts ---------- */
function PostsAdmin() {
  const qc = useQueryClient();
  const { data: posts = [] } = useQuery({ queryKey: ["admin-posts"], queryFn: () => adminListPosts() });
  const [editing, setEditing] = useState<any | null>(null);
  const [commentsOf, setCommentsOf] = useState<number | null>(null);
  const saveMut = useMutation({
    mutationFn: (d: any) => adminSavePost({ data: d }),
    onSuccess: () => { toast.success("تم الحفظ"); qc.invalidateQueries({ queryKey: ["admin-posts"] }); qc.invalidateQueries({ queryKey: ["posts"] }); setEditing(null); },
    onError: (e: any) => toast.error(e?.message || "خطأ"),
  });
  const delMut = useMutation({
    mutationFn: (id: number) => adminDeletePost({ data: { id } }),
    onSuccess: () => { toast.success("تم الحذف"); qc.invalidateQueries({ queryKey: ["admin-posts"] }); qc.invalidateQueries({ queryKey: ["posts"] }); },
  });
  return (
    <div className="space-y-4">
      <button onClick={() => setEditing({ kind: "text", title: "", body: "", image_url: null, pinned: false })} className="rounded-2xl bg-primary text-primary-foreground px-4 py-2 text-sm flex items-center gap-1.5"><Plus className="size-4"/>منشور جديد</button>
      <div className="space-y-2">
        {posts.map((p: any) => (
          <div key={p.id} className="bg-card rounded-2xl p-3 shadow-soft flex gap-3">
            {p.image_url && <div className="size-16 rounded-xl overflow-hidden bg-muted shrink-0"><ImageWithSpinner src={p.image_url} className="size-full"/></div>}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                {p.pinned && <Pin className="size-3 text-primary"/>}
                <p className="font-medium text-sm truncate">{p.title || "بدون عنوان"}</p>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{p.body}</p>
              <div className="mt-2 flex gap-1.5">
                <button onClick={() => setEditing(p)} className="rounded-full bg-muted text-xs px-3 py-1"><Pencil className="size-3 inline"/></button>
                <button onClick={() => setCommentsOf(p.id)} className="rounded-full bg-muted text-xs px-3 py-1 flex items-center gap-1"><MessageSquare className="size-3"/>التعليقات</button>
                <button onClick={() => confirm("حذف؟") && delMut.mutate(p.id)} className="rounded-full bg-destructive/10 text-destructive text-xs px-3 py-1"><Trash2 className="size-3 inline"/></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing.id ? "تعديل منشور" : "منشور جديد"}>
          <Field label="النوع">
            <select value={editing.kind} onChange={(e) => setEditing({ ...editing, kind: e.target.value })} className="input">
              <option value="text">نص</option>
              <option value="image">صورة</option>
            </select>
          </Field>
          {editing.kind === "image" && (
            <ImagePicker value={editing.image_url} onChange={(u) => setEditing({ ...editing, image_url: u })} folder="posts" className="aspect-video w-full" />
          )}
          <Field label="العنوان"><input value={editing.title || ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="input"/></Field>
          <Field label="النص"><textarea rows={5} value={editing.body || ""} onChange={(e) => setEditing({ ...editing, body: e.target.value })} className="input"/></Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!editing.pinned} onChange={(e) => setEditing({ ...editing, pinned: e.target.checked })}/>تثبيت في الأعلى</label>
          <button disabled={saveMut.isPending} onClick={() => saveMut.mutate(editing)} className="btn-primary"><Save className="size-4"/>حفظ</button>
        </Modal>
      )}
      {commentsOf && <CommentsModal postId={commentsOf} onClose={() => setCommentsOf(null)} />}
    </div>
  );
}

function CommentsModal({ postId, onClose }: { postId: number; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: comments = [] } = useQuery({ queryKey: ["admin-comments", postId], queryFn: () => adminListComments({ data: { post_id: postId } }) });
  const [replyOf, setReplyOf] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const replyMut = useMutation({
    mutationFn: ({ id, reply }: { id: number; reply: string }) => adminReplyComment({ data: { id, reply } }),
    onSuccess: () => { toast.success("تم الرد"); setReplyOf(null); setReplyText(""); qc.invalidateQueries({ queryKey: ["admin-comments", postId] }); },
  });
  const delMut = useMutation({
    mutationFn: (id: number) => adminDeleteComment({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-comments", postId] }); },
  });
  return (
    <Modal onClose={onClose} title="التعليقات">
      {comments.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">لا توجد تعليقات</p>}
      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
        {comments.map((c: any) => (
          <div key={c.id} className="bg-muted/50 rounded-2xl p-3">
            <div className="flex justify-between items-start">
              <p className="font-medium text-sm">{c.author_name}</p>
              <button onClick={() => delMut.mutate(c.id)} className="text-destructive"><Trash2 className="size-3.5"/></button>
            </div>
            <p className="text-sm mt-1">{c.body}</p>
            {c.reply_body && <div className="mt-2 rounded-xl bg-primary-soft p-2 text-xs"><span className="font-semibold text-primary">الإدارة:</span> {c.reply_body}</div>}
            {replyOf === c.id ? (
              <div className="mt-2 flex gap-1.5">
                <input value={replyText} onChange={(e) => setReplyText(e.target.value)} className="input flex-1" placeholder="ردك..."/>
                <button onClick={() => replyText && replyMut.mutate({ id: c.id, reply: replyText })} className="rounded-full bg-primary text-primary-foreground px-3 text-xs">إرسال</button>
              </div>
            ) : (
              <button onClick={() => { setReplyOf(c.id); setReplyText(c.reply_body || ""); }} className="mt-2 text-xs text-primary">{c.reply_body ? "تعديل الرد" : "رد"}</button>
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
}

/* ---------- Settings ---------- */
function SettingsAdmin() {
  const qc = useQueryClient();
  const { data: settings = {} } = useQuery({ queryKey: ["all-settings"], queryFn: () => getAllSettings() });
  const [local, setLocal] = useState<Record<string, string>>({});
  useEffect(() => {
    const init: Record<string, string> = {};
    for (const k of FIELDS.map((f) => f.key)) init[k] = settings[k] ?? "";
    setLocal(init);
  }, [settings]);
  const saveMut = useMutation({
    mutationFn: async () => {
      for (const f of FIELDS) {
        await adminSaveSetting({ data: { key: f.key, value: local[f.key] || "" } });
      }
    },
    onSuccess: () => { toast.success("تم الحفظ"); qc.invalidateQueries({ queryKey: ["all-settings"] }); qc.invalidateQueries({ queryKey: ["public-settings"] }); },
    onError: (e: any) => toast.error(e?.message || "خطأ"),
  });
  return (
    <div className="bg-card rounded-3xl shadow-soft p-4 space-y-3">
      {FIELDS.map((f) => (
        <Field key={f.key} label={f.label}>
          {f.type === "textarea" ? (
            <textarea rows={4} value={local[f.key] || ""} onChange={(e) => setLocal({ ...local, [f.key]: e.target.value })} className="input"/>
          ) : (
            <input value={local[f.key] || ""} onChange={(e) => setLocal({ ...local, [f.key]: e.target.value })} className="input"/>
          )}
        </Field>
      ))}
      <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="btn-primary"><Save className="size-4"/>حفظ الإعدادات</button>
    </div>
  );
}
const FIELDS = [
  { key: "store_name", label: "اسم المتجر" },
  { key: "store_tagline", label: "شعار/وصف قصير" },
  { key: "whatsapp_orders", label: "واتساب الطلبات (مع رمز الدولة)" },
  { key: "whatsapp_support", label: "واتساب الدعم" },
  { key: "contact_location", label: "الموقع" },
  { key: "contact_phone", label: "رقم الهاتف" },
  { key: "contact_email", label: "البريد الإلكتروني" },
  { key: "about_text", label: "نبذة عن المتجر", type: "textarea" as const },
  { key: "product_layout", label: "شكل عرض المنتجات الافتراضي (grid / list / large)" },
  { key: "ai_prompt", label: "قواعد الذكاء الاصطناعي (تعليمات النظام)", type: "textarea" as const },
];

/* ---------- Shared UI ---------- */
function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-card rounded-3xl p-5 max-h-[90vh] overflow-y-auto space-y-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg text-primary">{title}</h3>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted"><X className="size-4"/></button>
        </div>
        {children}
      </div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground mb-1 block">{label}</span>
      {children}
    </label>
  );
}
