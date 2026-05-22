import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { aiChat, checkDisclaimer, acceptDisclaimer } from "@/lib/ai.functions";
import { getFingerprint } from "@/lib/fingerprint";

export const Route = createFileRoute("/ai")({
  head: () => ({ meta: [{ title: "الذكاء الاصطناعي — الطب الإسلامي البديل" }] }),
  component: AiPage,
});

type Msg = { role: "user" | "assistant"; content: string };

function AiPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    setLoading(true);
    const newMessages: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    try {
      let assistantText = "";
      setMessages([...newMessages, { role: "assistant", content: "" }]);
      const stream = await aiChat({ data: { messages: newMessages } });
      for await (const chunk of stream as any) {
        assistantText += chunk.delta || "";
        setMessages([...newMessages, { role: "assistant", content: assistantText }]);
      }
    } catch (e: any) {
      setMessages([...newMessages, { role: "assistant", content: "حدث خطأ، حاول مجدداً." }]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    const fp = getFingerprint();
    if (messages.length === 0 && fp) {
      const res = await checkDisclaimer({ data: { fingerprint: fp } });
      if (!res.accepted) {
        setPendingPrompt(text);
        setShowDisclaimer(true);
        return;
      }
    }
    send(text);
  };

  const confirmDisclaimer = async () => {
    const fp = getFingerprint();
    if (fp) await acceptDisclaimer({ data: { fingerprint: fp } });
    setShowDisclaimer(false);
    if (pendingPrompt) { send(pendingPrompt); setPendingPrompt(null); }
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="pt-8 pb-4 text-center px-4">
        <h1 className="font-display text-3xl text-primary">الذكاء الاصطناعي</h1>
        <p className="text-xs text-muted-foreground mt-1">مساعدك الشخصي للأعشاب الطبيعية</p>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-40 space-y-3">
        {messages.length === 0 && !loading && (
          <div className="mt-12 text-center text-muted-foreground text-sm px-6">
            <p>اسأل عن أي عشبة وفوائدها واستخداماتها.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm ${m.role === "user" ? "bg-primary-soft text-foreground" : "bg-card shadow-soft"}`}>
              {m.role === "assistant" ? (
                <div className="prose prose-sm max-w-none [&>*]:my-1.5">
                  <ReactMarkdown>{m.content || "..."}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{m.content}</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <form onSubmit={onSubmit} className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[min(94%,640px)]">
        <div className="glass rounded-full shadow-elegant border border-border/60 flex items-center gap-2 p-1.5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="اكتب سؤالك هنا..."
            className="flex-1 bg-transparent px-4 py-2.5 text-sm outline-none"
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()} className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-40">
            <Send className="size-4" />
          </button>
        </div>
      </form>

      {showDisclaimer && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/50 backdrop-blur-sm p-4">
          <div className="bg-card rounded-3xl p-6 max-w-sm text-center shadow-elegant">
            <h3 className="font-display text-xl text-primary mb-3">تنبيه مهم</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">قد يرتكب النموذج أخطاء. يجب الحذر وأخذ الاستشارة الطبية من مختص قبل اعتماد أي معلومة.</p>
            <button onClick={confirmDisclaimer} className="mt-5 w-full rounded-2xl bg-primary text-primary-foreground py-3 font-medium">فهمت</button>
          </div>
        </div>
      )}
    </div>
  );
}
