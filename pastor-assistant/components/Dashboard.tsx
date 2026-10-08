"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type D = { summary:{criticalAlerts:number;tasksRequiringAttention:number;activeTasks:number};
  taskSummary:{overdue:number;upcoming:number;completed:number};
  todaysSchedule:{ID:number;time:string;description:string;location:string;type:string}[];
  criticalAlerts:{ID:number;type:string;text:string;created:string;emailSubject:string|null}[];
  currentTasks:{ID:number;priority:number;description:string;due:string;type:string}[];
  employeeName:string|null };

const REFRESH_MS = 3_000;
// SQL datetimes arrive without a zone; treat them as local wall-clock time.
const local = (s: string) => new Date(s.replace("Z", ""));
const t12 = (s: string) => local(s).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
function dueLabel(s: string) {
  const days = Math.round((startOfDay(local(s)) - startOfDay(new Date())) / 864e5);
  if (days < 0) return { text: `Overdue · ${local(s).toLocaleDateString()}`, cls: "text-red-600 font-semibold" };
  if (days === 0) return { text: "Due today", cls: "text-red-600 font-semibold" };
  if (days === 1) return { text: "Due tomorrow", cls: "text-amber-600" };
  return { text: local(s).toLocaleDateString(), cls: "" };
}
const prio = (p: number) => p <= 3 ? ["High","bg-red-500 text-white"] : p <= 6 ? ["Medium","bg-amber-300 text-amber-950"] : ["Low","bg-emerald-300 text-emerald-950"];
const card = "rounded-2xl bg-white border border-blue-100 shadow-sm";
// Summary tiles: label on the left, number on the right, to keep the row short.
const stat = "rounded-2xl border px-4 py-2 flex items-center justify-between gap-3 leading-tight";
const Empty = ({ t }: { t: string }) => <p className="p-4 text-sm text-slate-500">{t}</p>;

export default function Dashboard({ name }: { name: string }) {
  const [d, setD] = useState<D | null>(null);
  const [failed, setFailed] = useState(false);
  const busy = useRef(false); // skip a tick if the previous refresh is still running
  const load = useCallback(async () => {
    if (busy.current) return; busy.current = true;
    try { const r = await fetch("/api/dashboard", { cache: "no-store" }); if (!r.ok) throw 0;
      setD(await r.json()); setFailed(false); } catch { setFailed(true); } finally { busy.current = false; }
  }, []);
  useEffect(() => { load(); const i = setInterval(load, REFRESH_MS); return () => clearInterval(i); }, [load]);

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-end gap-4 bg-gradient-to-r from-[#1f4fb3] to-[#3b3fb0] text-white px-6 py-3">
        <span>{new Date().toLocaleDateString([], { weekday:"long", year:"numeric", month:"long", day:"numeric" })}</span>
        <span aria-label={`${d?.summary.criticalAlerts ?? 0} critical alerts`} className="rounded-full bg-red-500 px-2 text-sm">{d?.summary.criticalAlerts ?? 0}</span>
        <span className="font-semibold">{d?.employeeName ?? name}</span>
      </header>
      <div className="p-6">
        <h1 className="text-4xl font-bold">{greet}, Pastor</h1>
        <p className="text-blue-700 mb-4">Here’s what needs your attention today.</p>
        {failed && <p role="status" className="mb-3 rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-900">Couldn’t refresh just now. Showing the last loaded data; retrying in a few seconds.</p>}
        {!d ? <p role="status">{failed ? "The database is unavailable. Retrying…" : "Loading dashboard…"}</p> : (
        <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className={`${stat} bg-red-50 border-red-100`}><div className="min-w-0"><b className="text-red-600">Critical Alerts</b><small className="block">Require immediate attention</small></div><div className="text-3xl font-bold text-red-700">{d.summary.criticalAlerts}</div></div>
              <div className={`${stat} bg-amber-50 border-amber-100`}><div className="min-w-0"><b className="text-amber-700">Tasks Requiring Attention</b><small className="block">Overdue or upcoming</small></div><div className="text-3xl font-bold text-amber-800">{d.summary.tasksRequiringAttention}</div></div>
              <div className={`${stat} bg-blue-50 border-blue-100`}><div className="min-w-0"><b>All Tasks</b><small className="block">Total tasks</small></div><div className="text-3xl font-bold">{d.summary.activeTasks}</div></div>
            </div>
            <section className={card} aria-labelledby="ca"><h2 id="ca" className="p-4 pb-1 text-xl font-bold">Critical Alerts</h2>
              {d.criticalAlerts.length === 0 ? <Empty t="No critical alerts requiring attention." /> :
              <ul className="p-3 space-y-2">{d.criticalAlerts.map(a => (
                <li key={a.ID} className={`rounded-xl p-3 flex justify-between gap-3 ${a.type === "High" ? "bg-yellow-50" : "bg-red-50"}`}>
                  <div className="min-w-0"><b>{a.emailSubject ?? (a.text.length > 60 ? a.text.slice(0, 60) + "…" : a.text)}</b>
                    <p className="text-sm text-slate-600 truncate">{a.text}</p></div>
                  <div className="text-right text-sm shrink-0"><span className={`rounded-full px-2 ${a.type === "High" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-700"}`}>{a.type ?? "Critical"}</span><div>{local(a.created).toLocaleString([], { month:"short", day:"numeric", hour:"numeric", minute:"2-digit" })}</div></div>
                </li>))}</ul>}
            </section>
            <section className={card} aria-labelledby="ct"><h2 id="ct" className="p-4 pb-1 text-xl font-bold">Current Tasks</h2>
              {d.currentTasks.length === 0 ? <Empty t="No active tasks." /> :
              <ul className="divide-y">{d.currentTasks.map(t => { const [pl, pc] = prio(t.priority); const du = dueLabel(t.due); return (
                <li key={t.ID} className="grid grid-cols-[90px_1fr_auto] gap-3 items-center px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-center text-sm ${pc}`}>{pl} ({t.priority})</span>
                  <span>{t.description}{t.type && <small className="block text-slate-500">{t.type}</small>}</span>
                  <span className={`text-sm ${du.cls}`}>{du.text}</span></li>); })}</ul>}
            </section>
            <section className={`${card} p-4 flex flex-wrap gap-6`} aria-label="All tasks summary">
              <b>All Tasks</b>
              <span className="text-red-600">● {d.taskSummary.overdue} Overdue</span>
              <span className="text-amber-600">● {d.taskSummary.upcoming} Upcoming</span>
              <span className="text-emerald-600">● {d.taskSummary.completed} Completed</span>
            </section>
          </div>
          <div className="space-y-5">
            <section className={card} aria-labelledby="ts"><h2 id="ts" className="p-4 pb-1 text-xl font-bold">Today’s Schedule</h2>
              {d.todaysSchedule.length === 0 ? <Empty t="No schedule entries for today." /> :
              <ul className="p-4 space-y-3">{d.todaysSchedule.map(s => (
                <li key={s.ID} className="flex gap-4"><span className="w-20 text-blue-700 text-sm">{t12(s.time)}</span>
                  <span><b>{s.description}</b><small className="block text-slate-500">{s.location}</small></span></li>))}</ul>}
            </section>
            <section className={`${card} p-4`} aria-labelledby="ai"><h2 id="ai" className="text-xl font-bold">AI Assistant</h2>
              <p className="text-sm text-slate-500 mb-2">Ask a question or check on what’s important.</p>
              {["What needs my attention today?","Show my upcoming tasks","Summarize my alerts"].map(p => (
                <button key={p} onClick={() => alert("The AI Assistant is coming soon.")} className="block w-full text-left rounded-lg bg-blue-50 px-3 py-2 mb-2 text-blue-700">{p}</button>))}
            </section>
            <section className="rounded-2xl bg-gradient-to-br from-sky-100 to-blue-200 p-5"><h2 className="font-bold">Encouragement for Today</h2>
              <p className="italic">“Cast all your anxiety on Him because He cares for you.”</p><p>1 Peter 5:7</p></section>
          </div>
        </div>)}
      </div>
    </div>
  );
}
