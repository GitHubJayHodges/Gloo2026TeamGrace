import "./globals.css";
import Sidebar from "@/components/Sidebar";
export const metadata = { title: "Pastor Assistant 2026" };
export default function Root({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body><div className="md:flex min-h-screen bg-[#f3f7fd]"><Sidebar /><main className="flex-1 min-w-0">{children}</main></div></body></html>);
}
