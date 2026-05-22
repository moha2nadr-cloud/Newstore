import { createServerFn } from "@tanstack/react-start";
import { getSql } from "./db.server";
import { z } from "zod";

export const getCategories = createServerFn({ method: "GET" }).handler(async () => {
  const sql = getSql();
  return await sql`SELECT id, name, image_url FROM categories ORDER BY sort_order ASC, id ASC` as any[];
});

const filtersSchema = z.object({
  search: z.string().optional(),
  category_id: z.number().optional().nullable(),
  status: z.enum(["available", "unavailable", "limited"]).optional().nullable(),
  sort: z.enum(["newest", "price_asc", "price_desc", "popular"]).optional(),
  min_price: z.number().optional().nullable(),
  max_price: z.number().optional().nullable(),
});

export const getProducts = createServerFn({ method: "POST" })
  .inputValidator(filtersSchema)
  .handler(async ({ data }) => {
    const sql = getSql();
    // Build dynamic conditions using neon's parameter style
    const search = data.search?.trim() || null;
    const cat = data.category_id ?? null;
    const status = data.status ?? null;
    const minP = data.min_price ?? null;
    const maxP = data.max_price ?? null;
    const sort = data.sort || "newest";

    const orderBy =
      sort === "price_asc" ? sql`p.price ASC NULLS LAST` :
      sort === "price_desc" ? sql`p.price DESC NULLS LAST` :
      sort === "popular" ? sql`p.views_count DESC` :
      sql`p.created_at DESC`;

    const rows = await sql`
      SELECT p.id, p.name, p.price, p.currency, p.quantity, p.stock_status,
             p.image_urls, p.description, p.views_count, p.is_new, p.category_id,
             c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE (${search}::text IS NULL OR p.name ILIKE '%' || ${search} || '%' OR p.description ILIKE '%' || ${search} || '%' OR c.name ILIKE '%' || ${search} || '%')
        AND (${cat}::int IS NULL OR p.category_id = ${cat})
        AND (${status}::text IS NULL OR p.stock_status = ${status})
        AND (${minP}::numeric IS NULL OR p.price >= ${minP})
        AND (${maxP}::numeric IS NULL OR p.price <= ${maxP})
      ORDER BY ${orderBy}
      LIMIT 200
    ` as any[];
    return rows;
  });

export const getProduct = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.number() }))
  .handler(async ({ data }) => {
    const sql = getSql();
    const rows = await sql`
      SELECT p.*, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.id = ${data.id}
    ` as any[];
    return rows[0] || null;
  });

export const trackProductView = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.number(), fingerprint: z.string().min(1) }))
  .handler(async ({ data }) => {
    const sql = getSql();
    const inserted = await sql`
      INSERT INTO product_views (product_id, fingerprint) VALUES (${data.id}, ${data.fingerprint})
      ON CONFLICT DO NOTHING RETURNING product_id
    ` as any[];
    if (inserted.length) {
      await sql`UPDATE products SET views_count = views_count + 1 WHERE id = ${data.id}`;
    }
    return { ok: true };
  });
