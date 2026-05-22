import { createServerFn } from "@tanstack/react-start";
import { getSql } from "./db.server";

const PUBLIC_KEYS = [
  "store_name", "store_tagline",
  "whatsapp_orders", "whatsapp_support",
  "contact_location", "contact_phone", "contact_email",
  "about_text",
  "product_layout",
];

export const getPublicSettings = createServerFn({ method: "GET" }).handler(async () => {
  const sql = getSql();
  const rows = await sql`SELECT key, value FROM site_settings WHERE key = ANY(${PUBLIC_KEYS as any})` as any[];
  const out: Record<string, any> = {};
  for (const k of PUBLIC_KEYS) out[k] = "";
  out.product_layout = "grid";
  for (const r of rows) out[r.key] = r.value;
  return out as Record<string, any>;
});

export const getAllSettings = createServerFn({ method: "GET" }).handler(async () => {
  const sql = getSql();
  const rows = await sql`SELECT key, value FROM site_settings` as any[];
  const out: Record<string, any> = {};
  for (const r of rows) out[r.key] = r.value;
  return out;
});
