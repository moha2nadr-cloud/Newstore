import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);
await sql`CREATE TABLE IF NOT EXISTS site_settings (key TEXT PRIMARY KEY, value JSONB NOT NULL, updated_at TIMESTAMPTZ DEFAULT NOW())`;
await sql`CREATE TABLE IF NOT EXISTS slides (id SERIAL PRIMARY KEY, image_url TEXT NOT NULL, title TEXT, subtitle TEXT, cta_text TEXT, sort_order INT DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW())`;
await sql`CREATE TABLE IF NOT EXISTS posts (id SERIAL PRIMARY KEY, kind TEXT NOT NULL DEFAULT 'text', title TEXT, body TEXT, image_url TEXT, pinned BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT NOW())`;
await sql`CREATE TABLE IF NOT EXISTS post_likes (post_id INT REFERENCES posts(id) ON DELETE CASCADE, fingerprint TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(), PRIMARY KEY (post_id, fingerprint))`;
await sql`CREATE TABLE IF NOT EXISTS post_comments (id SERIAL PRIMARY KEY, post_id INT REFERENCES posts(id) ON DELETE CASCADE, fingerprint TEXT NOT NULL, author_name TEXT NOT NULL, body TEXT NOT NULL, reply_body TEXT, reply_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW())`;
await sql`CREATE TABLE IF NOT EXISTS categories (id SERIAL PRIMARY KEY, name TEXT NOT NULL, image_url TEXT, sort_order INT DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW())`;
await sql`CREATE TABLE IF NOT EXISTS products (id SERIAL PRIMARY KEY, category_id INT REFERENCES categories(id) ON DELETE SET NULL, name TEXT NOT NULL, price NUMERIC, currency TEXT DEFAULT 'USD', quantity INT, stock_status TEXT NOT NULL DEFAULT 'available', image_urls TEXT[] DEFAULT '{}', description TEXT, notes TEXT, views_count INT DEFAULT 0, is_new BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT NOW())`;
await sql`CREATE TABLE IF NOT EXISTS product_views (product_id INT REFERENCES products(id) ON DELETE CASCADE, fingerprint TEXT NOT NULL, viewed_at TIMESTAMPTZ DEFAULT NOW(), PRIMARY KEY (product_id, fingerprint))`;
await sql`CREATE TABLE IF NOT EXISTS ai_disclaimer_accepted (fingerprint TEXT PRIMARY KEY, accepted_at TIMESTAMPTZ DEFAULT NOW())`;
await sql`CREATE TABLE IF NOT EXISTS user_names (fingerprint TEXT PRIMARY KEY, name TEXT NOT NULL, updated_at TIMESTAMPTZ DEFAULT NOW())`;

// Seed default settings
const defaults = [
  ['store_name', '"الطب الإسلامي البديل"'],
  ['store_tagline', '"أعشاب طبيعية لحياة صحية"'],
  ['whatsapp_orders', '"+970000000000"'],
  ['whatsapp_support', '"+970000000000"'],
  ['contact_location', '"الموقع"'],
  ['contact_phone', '"+970000000000"'],
  ['contact_email', '"info@example.com"'],
  ['ai_prompt', '"أنت طبيب أعشاب خبير في الطب الإسلامي البديل. قدم إجابات مختصرة ومفيدة بالعربية الفصحى. لا تضع تحذيرات في كل رد. أجب على قدر السؤال."'],
  ['about_text', '"تطبيق متخصص في الأعشاب الطبيعية والطب الإسلامي البديل."'],
];
for (const [k, v] of defaults) {
  await sql`INSERT INTO site_settings (key, value) VALUES (${k}, ${v}::jsonb) ON CONFLICT (key) DO NOTHING`;
}
console.log("DB initialized");
