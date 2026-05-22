import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getSlides = createServerFn({ method: "GET" }).handler(async () => {
  const { getSql } = await import("./db.server");
  const sql = getSql();
  const rows = await sql`SELECT id, image_url, title, subtitle, cta_text FROM slides ORDER BY sort_order ASC, id ASC` as any[];
  return rows;
});

export const getPosts = createServerFn({ method: "GET" }).handler(async () => {
  const { getSql } = await import("./db.server");
  const sql = getSql();
  const rows = await sql`
    SELECT p.id::int AS id, p.kind, p.title, p.body, p.image_url, p.pinned, p.created_at,
      COALESCE((SELECT COUNT(*) FROM post_likes l WHERE l.post_id = p.id), 0)::int AS like_count,
      COALESCE((SELECT COUNT(*) FROM post_comments c WHERE c.post_id = p.id), 0)::int AS comment_count
    FROM posts p
    WHERE COALESCE(p.published, true) = true
    ORDER BY p.pinned DESC, p.created_at DESC
    LIMIT 50
  ` as any[];
  return rows;
});


export const getLikedPostIds = createServerFn({ method: "POST" })
  .inputValidator(z.object({ fingerprint: z.string().min(1) }))
  .handler(async ({ data }) => {
    const { getSql } = await import("./db.server");
    const sql = getSql();
    const rows = await sql`SELECT post_id FROM post_likes WHERE fingerprint = ${data.fingerprint}` as any[];
    return rows.map((r) => r.post_id as number);
  });

export const toggleLike = createServerFn({ method: "POST" })
  .inputValidator(z.object({ post_id: z.number(), fingerprint: z.string().min(1) }))
  .handler(async ({ data }) => {
    const { getSql } = await import("./db.server");
    const sql = getSql();
    const existing = await sql`SELECT 1 FROM post_likes WHERE post_id = ${data.post_id} AND fingerprint = ${data.fingerprint}` as any[];
    if (existing.length) {
      await sql`DELETE FROM post_likes WHERE post_id = ${data.post_id} AND fingerprint = ${data.fingerprint}`;
    } else {
      await sql`INSERT INTO post_likes (post_id, fingerprint) VALUES (${data.post_id}, ${data.fingerprint}) ON CONFLICT DO NOTHING`;
    }
    const count = await sql`SELECT COUNT(*)::int AS c FROM post_likes WHERE post_id = ${data.post_id}` as any[];
    return { liked: !existing.length, count: count[0].c };
  });

export const getComments = createServerFn({ method: "POST" })
  .inputValidator(z.object({ post_id: z.number() }))
  .handler(async ({ data }) => {
    const { getSql } = await import("./db.server");
    const sql = getSql();
    const rows = await sql`SELECT id, author_name, body, reply_body, reply_at, created_at FROM post_comments WHERE post_id = ${data.post_id} ORDER BY created_at DESC LIMIT 200` as any[];
    return rows;
  });

export const addComment = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    post_id: z.number(),
    fingerprint: z.string().min(1),
    author_name: z.string().min(1).max(60),
    body: z.string().min(1).max(2000),
  }))
  .handler(async ({ data }) => {
    const { getSql } = await import("./db.server");
    const sql = getSql();
    await sql`INSERT INTO post_comments (post_id, fingerprint, author_name, body) VALUES (${data.post_id}, ${data.fingerprint}, ${data.author_name}, ${data.body})`;
    await sql`INSERT INTO user_names (fingerprint, name) VALUES (${data.fingerprint}, ${data.author_name}) ON CONFLICT (fingerprint) DO UPDATE SET name = EXCLUDED.name`;
    return { ok: true };
  });
