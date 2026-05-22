import { createServerFn } from "@tanstack/react-start";
import { getSql } from "./db.server";
import { z } from "zod";

export const checkDisclaimer = createServerFn({ method: "POST" })
  .inputValidator(z.object({ fingerprint: z.string().min(1) }))
  .handler(async ({ data }) => {
    const sql = getSql();
    const rows = await sql`SELECT 1 FROM ai_disclaimer_accepted WHERE fingerprint = ${data.fingerprint}` as any[];
    return { accepted: rows.length > 0 };
  });

export const acceptDisclaimer = createServerFn({ method: "POST" })
  .inputValidator(z.object({ fingerprint: z.string().min(1) }))
  .handler(async ({ data }) => {
    const sql = getSql();
    await sql`INSERT INTO ai_disclaimer_accepted (fingerprint) VALUES (${data.fingerprint}) ON CONFLICT DO NOTHING`;
    return { ok: true };
  });

const chatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })).min(1).max(40),
});

export const aiChat = createServerFn({ method: "POST" })
  .inputValidator(chatSchema)
  .handler(async function* ({ data }) {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      yield { delta: "خدمة الذكاء الاصطناعي غير مهيأة." };
      return;
    }
    const sql = getSql();
    const settingsRows = await sql`SELECT value FROM site_settings WHERE key = 'ai_prompt'` as any[];
    const customPrompt = settingsRows[0]?.value || "أنت طبيب أعشاب خبير.";
    const products = await sql`SELECT name, description, stock_status FROM products ORDER BY id DESC LIMIT 80` as any[];
    const productCtx = products.length
      ? `\n\nمنتجات المتجر الحالية:\n${products.map((p: any) => `- ${p.name}${p.description ? `: ${p.description}` : ""} (${p.stock_status})`).join("\n")}`
      : "";

    const systemPrompt = `${customPrompt}\nأجب بالعربية الفصحى، باختصار ومباشرة. لا تكرر التحذيرات. تصرّف كطبيب أعشاب خبير في الطب الإسلامي البديل.${productCtx}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        stream: true,
        messages: [
          { role: "system", content: systemPrompt },
          ...data.messages,
        ],
      }),
    });

    if (!response.ok || !response.body) {
      const text = await response.text().catch(() => "");
      yield { delta: `حدث خطأ: ${response.status} ${text.slice(0, 200)}` };
      return;
    }

    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += value;
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === "[DONE]") return;
        try {
          const json = JSON.parse(payload);
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) yield { delta };
        } catch {}
      }
    }
  });
