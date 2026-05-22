import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

await sql`DELETE FROM products`; await sql`DELETE FROM categories`;
await sql`DELETE FROM posts`; await sql`DELETE FROM slides`;

await sql`INSERT INTO slides (image_url, title, subtitle, cta_text, sort_order) VALUES
('https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=1200', 'قوة الطبيعة', 'أعشاب طبيعية 100% لصحة أفضل وحياة متوازنة', 'تسوق الآن', 1),
('https://images.unsplash.com/photo-1515envious97/?w=1200', 'علاج طبيعي', 'من قلب الطبيعة إليك', 'استكشف', 2)`;

await sql`INSERT INTO posts (kind, title, body, pinned, created_at) VALUES
('text', 'الموقع قيد التطوير', 'نعمل على تحسين تجربتكم لنقدم لكم الأفضل قريباً', true, NOW() - INTERVAL '2 hours'),
('text', NULL, 'الطبيعة لا تُسرع، ومع ذلك تصل إلى كل شيء.', false, NOW() - INTERVAL '5 hours')`;

const cats = await sql`INSERT INTO categories (name, image_url, sort_order) VALUES
('المناعة', 'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?w=200', 1),
('الجهاز الهضمي', 'https://images.unsplash.com/photo-1597305877032-0668b3c6413a?w=200', 2),
('التجميل والعناية', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200', 3),
('التنحيف', 'https://images.unsplash.com/photo-1615485925600-97237c4fc1ec?w=200', 4)
RETURNING id`;

const c1 = cats[0].id;
await sql`INSERT INTO products (category_id, name, price, currency, stock_status, image_urls, description, is_new) VALUES
(${c1}, 'بابونج مجفف', 4.50, 'USD', 'available', ARRAY['https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600'], 'يساعد على الاسترخاء وتحسين النوم وتهدئة الأعصاب.', false),
(${c1}, 'شمر طبيعي', 3.75, 'USD', 'limited', ARRAY['https://images.unsplash.com/photo-1597305877032-0668b3c6413a?w=600'], 'يساعد على الهضم وتخفيف الانتفاخ والغازات.', false),
(${c1}, 'شاي أخضر', 5.25, 'USD', 'available', ARRAY['https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=600'], 'يعزز حرق الدهون ويدعم الصحة العامة.', true),
(${c1}, 'كركديه مجفف', 4.00, 'USD', 'available', ARRAY['https://images.unsplash.com/photo-1556881286-fc6915169721?w=600'], 'غني بمضادات الأكسدة ويدعم صحة القلب.', false),
(${c1}, 'كركم مطحون', 4.25, 'USD', 'unavailable', ARRAY['https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600'], 'مضاد للالتهابات ويعزز المناعة بشكل طبيعي.', true)`;

console.log("Seed done");
