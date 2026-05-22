// One-shot: fix schema + migrate data from old site (alattar-sy.vercel.app)
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

console.log("→ Schema fixes");
await sql`ALTER TABLE post_likes ALTER COLUMN post_id TYPE integer USING NULLIF(post_id,'')::integer`.catch(e => console.log("post_likes:", e.message));
await sql`ALTER TABLE posts ALTER COLUMN published SET DEFAULT true`.catch(()=>{});
await sql`UPDATE posts SET published = true WHERE published IS NULL OR published = false`;
// Add new settings keys if missing
await sql`INSERT INTO site_settings (key, value) VALUES ('ai_prompt', ${JSON.stringify("أنت طبيب أعشاب خبير في الطب الإسلامي البديل. أجب بالعربية الفصحى باختصار ومباشرة. قدم نصائح علاجية بالأعشاب الطبيعية والسنة النبوية. اذكر أسماء الأعشاب الموجودة في المتجر عندما يكون ذلك مناسباً.")}::jsonb) ON CONFLICT (key) DO NOTHING`;
await sql`INSERT INTO site_settings (key, value) VALUES ('product_layout', ${JSON.stringify("grid")}::jsonb) ON CONFLICT (key) DO NOTHING`;

console.log("→ Fetching old data");
const res = await fetch("https://alattar-sy.vercel.app/api/config");
const { data } = await res.json();

console.log("→ Migrating settings");
const s = data.settings || {};
const map = {
  store_name: s.siteName,
  store_tagline: s.tagline,
  whatsapp_orders: s.whatsappNumber ? String(s.whatsappNumber) : "",
  whatsapp_support: s.whatsappNumber ? String(s.whatsappNumber) : "",
  contact_location: s.address || s.footerAddress || "",
  contact_phone: s.footerPhone || "",
  contact_email: s.footerEmail || "",
  about_text: s.aboutText || "",
};
for (const [k, v] of Object.entries(map)) {
  if (v) await sql`INSERT INTO site_settings (key, value, updated_at) VALUES (${k}, ${JSON.stringify(v)}::jsonb, NOW()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
}

console.log("→ Wiping & migrating categories");
await sql`DELETE FROM products`;
await sql`DELETE FROM categories`;
await sql`ALTER SEQUENCE categories_id_seq RESTART WITH 1`.catch(()=>{});
await sql`ALTER SEQUENCE products_id_seq RESTART WITH 1`.catch(()=>{});

const catIdMap = {}; // oldId -> newId
let sort = 0;
for (const c of data.categories || []) {
  const r = await sql`INSERT INTO categories (name, image_url, sort_order) VALUES (${c.name}, ${c.image || null}, ${sort++}) RETURNING id`;
  catIdMap[c.id] = r[0].id;
}
console.log(`  ${Object.keys(catIdMap).length} categories`);

console.log("→ Migrating products");
let count = 0;
for (const p of data.products || []) {
  if (!p.published) continue;
  const img = p.imageData || p.image;
  const imgs = img ? [img] : [];
  if (Array.isArray(p.images)) imgs.push(...p.images.filter(Boolean));
  const status = p.availability === "limited" ? "limited" : p.availability === "unavailable" ? "unavailable" : "available";
  const price = p.price && !isNaN(Number(p.price)) ? Number(p.price) : null;
  const catId = catIdMap[p.categoryId] || null;
  await sql`INSERT INTO products (name, description, price, currency, stock_status, category_id, image_urls, is_new, views_count)
    VALUES (${p.name}, ${p.description || null}, ${price}, ${'₪'}, ${status}, ${catId}, ${imgs}, ${!!p.featured}, 0)`;
  count++;
}
console.log(`  ${count} products`);

console.log("→ Migrating slides");
await sql`DELETE FROM slides`;
await sql`ALTER SEQUENCE slides_id_seq RESTART WITH 1`.catch(()=>{});
let sIdx = 0;
for (const sl of data.slides || []) {
  if (!sl.published) continue;
  const img = sl.imageData || sl.image;
  if (!img) continue;
  await sql`INSERT INTO slides (image_url, title, sort_order) VALUES (${img}, ${null}, ${sIdx++})`;
}
console.log(`  ${sIdx} slides`);

console.log("✓ Done");
