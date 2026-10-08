import SettingsForm from "@/components/SettingsForm";
import { BAPTISM_FLOW } from "@/lib/forms";
export const metadata = { title: "Baptism Flow · Pastor Assistant 2026" };
export default function Page() { return <SettingsForm def={BAPTISM_FLOW} />; }
