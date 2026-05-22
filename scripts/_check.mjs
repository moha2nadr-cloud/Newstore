import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);
const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY 1`;
for (const t of tables) {
  const cols = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name=${t.table_name} ORDER BY ordinal_position`;
  const c = await sql.query(`SELECT COUNT(*)::int AS n FROM "${t.table_name}"`);
  console.log(`\n${t.table_name} (${c[0].n}):`, cols.map(c=>`${c.column_name}:${c.data_type}`).join(", "));
}
