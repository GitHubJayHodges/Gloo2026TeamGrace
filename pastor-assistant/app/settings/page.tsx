import SettingsForm from "@/components/SettingsForm";
import { SETTINGS } from "@/lib/forms";
export const metadata = { title: "Settings · Pastor Assistant 2026" };
export default function Page() { return <SettingsForm def={SETTINGS} />; }
