import { formHandlers } from "@/lib/formRoute";
import { SETTINGS } from "@/lib/forms";
export const dynamic = "force-dynamic";
const h = formHandlers(SETTINGS);
export const GET = h.GET;
export const PUT = h.PUT;
