import { formHandlers } from "@/lib/formRoute";
import { BAPTISM_FLOW } from "@/lib/forms";
export const dynamic = "force-dynamic";
const h = formHandlers(BAPTISM_FLOW);
export const GET = h.GET;
export const PUT = h.PUT;
