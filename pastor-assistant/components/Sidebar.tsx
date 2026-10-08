import Link from "next/link";
const nav = [["Dashboard","/"],["Baptism Flow","/baptism-flow"],["Settings","/settings"]];
export default function Sidebar() {
  return (
    <aside className="md:w-64 shrink-0 bg-gradient-to-b from-[#12327f] to-[#0a1b4d] text-white md:min-h-screen">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/PastorAssistant1.png" alt="Pastor Assistant 2026" className="w-full" />
      <nav aria-label="Main" className="p-3 flex md:block gap-1 overflow-x-auto">
        {nav.map(([l, h]) => (<Link key={h} href={h} className="block rounded-lg px-4 py-3 font-medium hover:bg-white/15">{l}</Link>))}
      </nav>

<div className="hidden md:block p-6">
  <p className="text-sm italic opacity-80">“The Lord will guide you always.” — Isaiah 58:11</p>
  {/* eslint-disable-next-line @next/next/no-img-element */}
  <img src="/GlooHackathon1.png" alt="Gloo AI Hackathon 2026" className="mt-6 w-40 rounded-lg" />
</div>

    </aside>
  );
}
