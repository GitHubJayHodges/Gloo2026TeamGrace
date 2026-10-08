import { NextResponse } from "next/server";
import { getFormRow, saveFormRow, type FormRow } from "./repo";
import { type FormDef, fieldNames, MAX_LEN } from "./forms";

// GET/PUT handlers for a single-row form page.
export function formHandlers(d: FormDef) {
  const fail = (what: string, e: unknown) => { console.error(`${d.key} ${what} failed`, (e as Error).message);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 }); };

  async function GET() {
    try { return NextResponse.json(await getFormRow(d)); } catch (e) { return fail("query", e); }
  }

  async function PUT(req: Request) {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    const row: FormRow = {};
    for (const f of fieldNames(d)) {
      const v = body[f];
      if (v != null && typeof v !== "string") return NextResponse.json({ error: `${f} must be text` }, { status: 400 });
      const t = (v ?? "").trim();
      if (t.length > MAX_LEN) return NextResponse.json({ error: `Each value must be ${MAX_LEN} characters or fewer` }, { status: 400 });
      row[f] = t || null; // blank boxes are stored as NULL
    }
    try { await saveFormRow(d, row); return NextResponse.json(row); } catch (e) { return fail("save", e); }
  }

  return { GET, PUT };
}
