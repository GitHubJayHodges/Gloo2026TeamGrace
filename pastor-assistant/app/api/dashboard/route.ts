import { NextResponse } from "next/server";
import { getDashboard } from "@/lib/repo";
export const dynamic = "force-dynamic";
export async function GET() {
  try { return NextResponse.json(await getDashboard()); }
  catch (e) { console.error("dashboard query failed", (e as Error).message);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 }); }
}
