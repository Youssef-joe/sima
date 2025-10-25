// File: ChatPanel.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Sima AI — Screen 02: Architect Chat (/chat)
 * - TDD-first: this component is paired with ChatPanel.spec.tsx (see block at bottom)
 * - Streaming via pluggable transport (SSE/WebSocket/mock)
 * - Uploads: PDF/DWG/IFC/Images (UI-level, integration later)
 * - i18n AR/EN + RTL, A11y labels, keyboard support
 * - Zero external icon/CDN deps to avoid import/fetch errors
 *
 * Fixes in this revision:
 * 1) Replaced rid() implementation with a SSR-safe, deterministic ID (timestamp+counter) to avoid any parsing/runtime quirks.
 * 2) Removed nested block comment inside the tests section that caused premature comment termination → "Unexpected token".
 * 3) Kept tests (Vitest/RTL) but ensured they are within a single non-nested block comment.
 */

export type Role = "user" | "assistant" | "system";
export interface ChatMessage { id: string; role: Role; text: string; files?: FileMeta[] }
export interface FileMeta { name: string; size: number; type?: string }
export type ChatEvent = { type: "delta"; data: string } | { type: "done" } | { type: "error"; message: string };
export interface ChatTransport {
  send: (msg: { text: string; files: File[] }) => Promise<void>;
  subscribe: (handler: (evt: ChatEvent) => void) => () => void;
}

const T = {
  ar: {
    brand: "Sima AI — مساعد العمارة",
    input: "اكتب رسالتك...",
    send: "إرسال",
    attach: "إرفاق ملف",
    uploading: "جاري التحميل...",
    error: "حدث خطأ في الاتصال. حاول مجددًا.",
    you: "أنت",
    ai: "Sima AI",
  },
  en: {
    brand: "Sima AI — Architect Chat",
    input: "Type your message...",
    send: "Send",
    attach: "Attach file",
    uploading: "Uploading...",
    error: "Connection error. Please retry.",
    you: "You",
    ai: "Sima AI",
  },
};

export type Lang = keyof typeof T;

export default function ChatPanel({ transport, lang: _lang = "ar" as Lang }: { transport?: ChatTransport; lang?: Lang }) {
  const [lang, setLang] = useState<Lang>(_lang);
  const t = useMemo(() => T[lang], [lang]);
  const rtl = lang === "ar";
  // Safe on client only; Next.js SSR won't execute useEffect during SSR.
  useEffect(() => { if (typeof document !== 'undefined') { document.documentElement.dir = rtl ? "rtl" : "ltr"; } }, [rtl]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const viewRef = useRef<HTMLDivElement | null>(null);

  // subscribe to streaming events
  useEffect(() => {
    if (!transport) return;
    const unsub = transport.subscribe((evt) => {
      if (evt.type === "delta") {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (!last || last.role !== "assistant") {
            return [...prev, { id: rid(), role: "assistant", text: evt.data }];
          }
          const clone = [...prev];
          clone[clone.length - 1] = { ...last, text: last.text + evt.data };
          return clone;
        });
      } else if (evt.type === "done") {
        setPending(false);
      } else if (evt.type === "error") {
        setPending(false);
        setErr(t.error);
      }
    });
    return () => unsub();
  }, [transport, t.error]);

  useEffect(() => {
    const el = viewRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, pending]);

  function onSend() {
    const text = draft.trim();
    if (!text && files.length === 0) return;
    setErr(null);
    setMessages((prev) => [
      ...prev,
      { id: rid(), role: "user", text, files: files.map(f => ({ name: f.name, size: f.size, type: f.type })) },
    ]);
    setDraft("");
    const toSend = [...files];
    setFiles([]);
    if (transport) {
      setPending(true);
      transport.send({ text, files: toSend }).catch(() => {
        setPending(false);
        setErr(t.error);
      });
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files ? Array.from(e.target.files) : [];
    if (list.length) setFiles((prev) => [...prev, ...list]);
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="font-semibold text-sm sm:text-base">{t.brand}</div>
          <div className="flex items-center gap-2">
            <button onClick={() => setLang("ar")} className={clsBtn(lang === "ar")}>AR</button>
            <button onClick={() => setLang("en")} className={clsBtn(lang === "en")}>EN</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-4">
        {/* Messages */}
        <div ref={viewRef} aria-label="chat-view" className="h-[52vh] md:h-[60vh] overflow-auto border rounded-2xl p-3 bg-slate-50">
          {messages.map((m) => (
            <Bubble key={m.id} role={m.role} who={m.role === "user" ? t.you : t.ai} text={m.text} files={m.files} />
          ))}
          {pending && (
            <div className="text-[12px] text-slate-500 px-2 py-1">{t.uploading}</div>
          )}
        </div>

        {/* Files preview */}
        {files.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {files.map((f, i) => (
              <span key={i} className="px-2 py-1 text-[12px] rounded-lg bg-slate-100 border">{f.name}</span>
            ))}
          </div>
        )}

        {/* Composer */}
        <div className="mt-3 flex items-center gap-2">
          <input
            aria-label={t.input}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") onSend(); }}
            placeholder={t.input}
            className="flex-1 px-3 py-2 border rounded-xl bg-white"
          />
          <label className="px-3 py-2 border rounded-xl cursor-pointer text-sm" aria-label={t.attach}>
            <input type="file" multiple onChange={onFile} className="hidden" />{t.attach}
          </label>
          <button onClick={onSend} className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm">{t.send}</button>
        </div>

        {err && (
          <div role="alert" className="mt-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{err}</div>
        )}
      </main>

      <style>{`
        html{scroll-behavior:smooth}
        :focus{outline:2px solid #0ea5e9; outline-offset:2px}
      `}</style>
    </div>
  );
}

function Bubble({ role, who, text, files }: { role: Role; who: string; text: string; files?: FileMeta[] }) {
  const isUser = role === "user";
  return (
    <div className={`my-2 flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] rounded-2xl px-3 py-2 border ${isUser ? "bg-sky-50 border-sky-200" : "bg-white border-slate-200"}`}>
        <div className="text-[11px] text-slate-500 mb-1">{who}</div>
        <div className="whitespace-pre-wrap text-sm">{text}</div>
        {files && files.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {files.map((f, i) => (
              <span key={i} className="px-2 py-0.5 text-[11px] rounded bg-slate-100 border">{f.name}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function clsBtn(active: boolean) {
  return `px-3 py-1.5 rounded-xl text-sm ${active ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"}`;
}

let __id_counter = 0;
function rid() {
  // SSR/browser-safe unique id without relying on Math.random chaining
  __id_counter = (__id_counter + 1) >>> 0;
  return `m_${Date.now().toString(36)}_${__id_counter.toString(36)}`;
}


// ————————————————————————————————————————————————————————
// File: ChatPanel.spec.tsx (Vitest + React Testing Library)
// NOTE: Keep this block as a single non-nested comment to avoid parser issues.
// ————————————————————————————————————————————————————————
/*
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, test, expect } from "vitest";
import ChatPanel, { ChatTransport, ChatEvent } from "./ChatPanel";

class MockTransport implements ChatTransport {
  private handlers: ((evt: ChatEvent)=>void)[] = [];
  async send(){ // no-op for tests }
  subscribe(h:(evt:ChatEvent)=>void){ this.handlers.push(h); return ()=>{}; }
  emit(evt:ChatEvent){ this.handlers.forEach(h=>h(evt)); }
}

describe("ChatPanel", ()=>{
  test("renders brand and language toggles", ()=>{
    const t = new MockTransport();
    render(<ChatPanel transport={t} lang="en" />);
    expect(screen.getByText(/Architect Chat/i)).toBeInTheDocument();
    expect(screen.getByText("AR")).toBeInTheDocument();
    expect(screen.getByText("EN")).toBeInTheDocument();
  });

  test("sends a message and receives streaming reply", async ()=>{
    const t = new MockTransport();
    render(<ChatPanel transport={t} lang="en" />);

    const input = screen.getByLabelText(/Type your message/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Hello" } });
    fireEvent.keyDown(input, { key: "Enter" });

    // user bubble
    expect(await screen.findByText("You")).toBeInTheDocument();
    expect(await screen.findByText("Hello")).toBeInTheDocument();

    // assistant stream
    t.emit({ type: "delta", data: "Hi " });
    t.emit({ type: "delta", data: "there" });
    t.emit({ type: "done" });

    await waitFor(()=>{
      expect(screen.getByText(/Hi there/)).toBeInTheDocument();
    });
  });

  test("attaches files and shows names chips", async ()=>{
    const t = new MockTransport();
    render(<ChatPanel transport={t} lang="en" />);
    const fileInput = screen.getByLabelText(/Attach file/i).querySelector('input[type="file"]'). as HTMLInputElement;
    const file = new File(["dummy"], "plan.ifc", { type: "model/ifc" });

    // Fire change
    fireEvent.change(fileInput, { target: { files: [file] } });

    const input = screen.getByLabelText(/Type your message/i) as HTMLInputElement;
    fireEvent.keyDown(input, { key: "Enter" }); // send

    expect(await screen.findByText("plan.ifc")).toBeInTheDocument();
  });

  test("shows error banner on transport error", async ()=>{
    const t = new MockTransport();
    render(<ChatPanel transport={t} lang="en" />);
    t.emit({ type: "error", message: "boom" });
    expect(await screen.findByRole("alert")).toHaveTextContent(/Connection error/i);
  });

  // New test: RTL switch should set dir="rtl" on html element
  test("toggles RTL on AR language", ()=>{
    const t = new MockTransport();
    render(<ChatPanel transport={t} lang="en" />);
    // switch to AR
    fireEvent.click(screen.getByText("AR"));
    expect(document.documentElement.getAttribute('dir')).toBe('rtl');
  });
});
*/
