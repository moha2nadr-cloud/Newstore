import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

async function requireAdmin() {
  const { isAdmin } = await import("./auth.server");
  if (!(await isAdmin())) throw new Error("غير مصرح");
}

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator(z.object({ email: z.string().email(), password: z.string().min(1) }))
  .handler(async ({ data }) => {
    const { verifyAdminCredentials, issueAdminSession } = await import("./auth.server");
    const ok = await verifyAdminCredentials(data.email, data.password);
    if (!ok) throw new Error("بيانات الدخول غير صحيحة");
    await issueAdminSession();
    return { ok: true };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const { clearAdminSession } = await import("./auth.server");
  clearAdminSession();
  return { ok: true };
});

export const adminCheck = createServerFn({ method: "GET" }).handler(async () => {
  const { isAdmin } = await import("./auth.server");
  return { isAdmin: await isAdmin() };
});

export const adminUpload = createServerFn({ method: "POST" })
  .inputValidator(z.object({ dataUrl: z.string().min(20), folder: z.string().optional() }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { uploadDataUrl } = await import("./cloudinary.server");
    const url = await uploadDataUrl(data.dataUrl, data.folder || "herbs");
    return { url };
  });

export const adminSaveSetting = createServerFn({ method: "POST" })
  .inputValidator(z.object({ key: z.string().min(1).max(60), value: z.any() }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { getSql } = await import("./db.server");
    const sql = getSql();
    await sql`
      INSERT INTO site_settings (key, value, updated_at)
      VALUES (${data.key}, ${JSON.stringify(data.value)}::jsonb, NOW())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `;
    return { ok: true };
  });

export const adminSaveCategory = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.number().optional().nullable(), name: z.string().min(1).max(100), image_url: z.string().nullable().optional(), sort_order: z.number().optional() }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { getSql } = await import("./db.server");
    const sql = getSql();
    if (data.id) {
      await sql`UPDATE categories SET name = ${data.name}, image_url = ${data.image_url ?? null}, sort_order = ${data.sort_order ?? 0} WHERE id = ${data.id}`;
      return { id: data.id };
    }
    const r = await sql`INSERT INTO categories (name, image_url, sort_order) VALUES (${data.name}, ${data.image_url ?? null}, ${data.sort_order ?? 0}) RETURNING id` as any[];
    return { id: r[0].id };
  });

export const adminDeleteCategory = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.number() }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { getSql } = await import("./db.server");
    const sql = getSql();
    const r = await sql`SELECT image_url FROM categories WHERE id = ${data.id}` as any[];
    if (r[0]?.image_url) {
      const { deleteByUrl } = await import("./cloudinary.server");
      await deleteByUrl(r[0].image_url);
    }
    await sql`DELETE FROM categories WHERE id = ${data.id}`;
    return { ok: true };
  });

export const adminSaveProduct = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    id: z.number().optional().nullable(),
    name: z.string().min(1).max(200),
    description: z.string().nullable().optional(),
    price: z.number().nullable().optional(),
    currency: z.string().max(10).optional(),
    quantity: z.number().nullable().optional(),
    stock_status: z.enum(["available", "unavailable", "limited"]),
    category_id: z.number().nullable().optional(),
    image_urls: z.array(z.string()).max(20),
    is_new: z.boolean().optional(),
  }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { getSql } = await import("./db.server");
    const sql = getSql();
    if (data.id) {
      await sql`UPDATE products SET
        name = ${data.name}, description = ${data.description ?? null},
        price = ${data.price ?? null}, currency = ${data.currency ?? "₪"},
        quantity = ${data.quantity ?? null}, stock_status = ${data.stock_status},
        category_id = ${data.category_id ?? null}, image_urls = ${data.image_urls as any},
        is_new = ${data.is_new ?? false}
        WHERE id = ${data.id}`;
      return { id: data.id };
    }
    const r = await sql`INSERT INTO products
      (name, description, price, currency, quantity, stock_status, category_id, image_urls, is_new)
      VALUES (${data.name}, ${data.description ?? null}, ${data.price ?? null}, ${data.currency ?? "₪"},
              ${data.quantity ?? null}, ${data.stock_status}, ${data.category_id ?? null},
              ${data.image_urls as any}, ${data.is_new ?? false})
      RETURNING id` as any[];
    return { id: r[0].id };
  });

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.number() }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { getSql } = await import("./db.server");
    const sql = getSql();
    const r = await sql`SELECT image_urls FROM products WHERE id = ${data.id}` as any[];
    const { deleteByUrl } = await import("./cloudinary.server");
    for (const u of (r[0]?.image_urls || [])) await deleteByUrl(u);
    await sql`DELETE FROM products WHERE id = ${data.id}`;
    return { ok: true };
  });

export const adminSaveSlide = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    id: z.number().optional().nullable(),
    image_url: z.string().min(1),
    title: z.string().nullable().optional(),
    subtitle: z.string().nullable().optional(),
    cta_text: z.string().nullable().optional(),
    sort_order: z.number().optional(),
  }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { getSql } = await import("./db.server");
    const sql = getSql();
    if (data.id) {
      await sql`UPDATE slides SET image_url=${data.image_url}, title=${data.title ?? null}, subtitle=${data.subtitle ?? null}, cta_text=${data.cta_text ?? null}, sort_order=${data.sort_order ?? 0} WHERE id=${data.id}`;
      return { id: data.id };
    }
    const r = await sql`INSERT INTO slides (image_url,title,subtitle,cta_text,sort_order) VALUES (${data.image_url}, ${data.title ?? null}, ${data.subtitle ?? null}, ${data.cta_text ?? null}, ${data.sort_order ?? 0}) RETURNING id` as any[];
    return { id: r[0].id };
  });

export const adminDeleteSlide = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.number() }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { getSql } = await import("./db.server");
    const sql = getSql();
    const r = await sql`SELECT image_url FROM slides WHERE id=${data.id}` as any[];
    if (r[0]?.image_url) {
      const { deleteByUrl } = await import("./cloudinary.server");
      await deleteByUrl(r[0].image_url);
    }
    await sql`DELETE FROM slides WHERE id=${data.id}`;
    return { ok: true };
  });

export const adminListPosts = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const { getSql } = await import("./db.server");
  const sql = getSql();
  return await sql`SELECT id, kind, title, body, image_url, pinned, created_at FROM posts ORDER BY pinned DESC, created_at DESC` as any[];
});

export const adminSavePost = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    id: z.number().optional().nullable(),
    kind: z.enum(["text", "image"]),
    title: z.string().nullable().optional(),
    body: z.string().nullable().optional(),
    image_url: z.string().nullable().optional(),
    pinned: z.boolean().optional(),
  }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { getSql } = await import("./db.server");
    const sql = getSql();
    if (data.id) {
      await sql`UPDATE posts SET kind=${data.kind}, title=${data.title ?? null}, body=${data.body ?? null}, image_url=${data.image_url ?? null}, pinned=${data.pinned ?? false}, published=true WHERE id=${data.id}`;
      return { id: data.id };
    }
    const r = await sql`INSERT INTO posts (kind,title,body,image_url,pinned,published) VALUES (${data.kind}, ${data.title ?? null}, ${data.body ?? null}, ${data.image_url ?? null}, ${data.pinned ?? false}, true) RETURNING id` as any[];
    return { id: r[0].id };
  });

export const adminDeletePost = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.number() }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { getSql } = await import("./db.server");
    const sql = getSql();
    const r = await sql`SELECT image_url FROM posts WHERE id=${data.id}` as any[];
    if (r[0]?.image_url) {
      const { deleteByUrl } = await import("./cloudinary.server");
      await deleteByUrl(r[0].image_url);
    }
    await sql`DELETE FROM posts WHERE id=${data.id}`;
    return { ok: true };
  });

export const adminListComments = createServerFn({ method: "POST" })
  .inputValidator(z.object({ post_id: z.number() }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { getSql } = await import("./db.server");
    const sql = getSql();
    return await sql`SELECT id, author_name, body, reply_body, reply_at, created_at FROM post_comments WHERE post_id=${data.post_id} ORDER BY created_at DESC` as any[];
  });

export const adminReplyComment = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.number(), reply: z.string().min(1).max(2000) }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { getSql } = await import("./db.server");
    const sql = getSql();
    await sql`UPDATE post_comments SET reply_body=${data.reply}, reply_at=NOW() WHERE id=${data.id}`;
    return { ok: true };
  });

export const adminDeleteComment = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.number() }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { getSql } = await import("./db.server");
    const sql = getSql();
    await sql`DELETE FROM post_comments WHERE id=${data.id}`;
    return { ok: true };
  });
