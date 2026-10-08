"use client";
import { useEffect, useState } from "react";
import { type FormDef, fieldNames, MAX_LEN } from "@/lib/forms";

type S = Record<string, string>;
const card = "rounded-2xl bg-white border border-blue-100 shadow-sm p-5";
const input = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500";

// Edits the single row for a FormDef (Settings, Baptism Flow).
export default function SettingsForm({ def }: { def: FormDef }) {
  const fields = fieldNames(def);
  const api = `/api/${def.key}`;
  const [s, setS] = useState<S>(() => Object.fromEntries(fields.map(f => [f, ""])));
  const [state, setState] = useState<"loading" | "ready" | "saving" | "loadFailed">("loading");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch(api, { cache: "no-store" })
      .then(r => { if (!r.ok) throw 0; return r.json(); })
      .then(d => {
        if (d) setS(Object.fromEntries(fieldNames(def).map(f => [f, d[f] ?? ""])));
        setState("ready");
      })
      .catch(() => setState("loadFailed"));
  }, [api, def]);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setState("saving"); setMsg(null);
    try {
      const r = await fetch(api, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) });
      const d = await r.json().catch(() => ({}));
      setMsg(r.ok ? { ok: true, text: `${def.title} saved.` } : { ok: false, text: d.error ?? `Couldn’t save ${def.title}.` });
    } catch { setMsg({ ok: false, text: `Couldn’t save ${def.title}. Check your connection and try again.` }); }
    setState("ready");
  }

  return (
    <div className="min-h-screen">
      <header className="h-12 bg-gradient-to-r from-[#1f4fb3] to-[#3b3fb0]" />
      <div className="p-6 max-w-3xl">
        <h1 className="text-4xl font-bold">{def.title}</h1>
        <p className="text-blue-700 mb-4">{def.intro}</p>
        {state === "loading" ? <p role="status">Loading {def.title}…</p> :
         state === "loadFailed" ? <p role="status" className="rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-900">The database is unavailable, so {def.title} couldn’t be loaded. Refresh the page to try again.</p> : (
        <form onSubmit={save} className="space-y-5">
          {def.sections.map((sec, i) => (
            <section key={sec.heading} className={card} aria-labelledby={`sec${i}`}>
              <h2 id={`sec${i}`} className="text-xl font-bold mb-3">{sec.heading}</h2>
              <div className={`grid gap-4 ${sec.grid}`}>{sec.fields.map(f => (
                <label key={f.name} className="block"><span className="font-medium">{f.label}</span>
                  <input className={input} maxLength={MAX_LEN} value={s[f.name]} onChange={e => setS({ ...s, [f.name]: e.target.value })} /></label>))}
              </div>
            </section>))}
          <div className="flex items-center gap-4">
            <button type="submit" disabled={state === "saving"} className="rounded-lg bg-[#1f4fb3] px-5 py-2 font-semibold text-white hover:bg-[#12327f] disabled:opacity-60">
              {state === "saving" ? "Saving…" : `Save ${def.title}`}</button>
            {msg && <span role="status" className={msg.ok ? "text-emerald-700" : "text-red-600"}>{msg.text}</span>}
          </div>
        </form>)}
      </div>
    </div>
  );
}
