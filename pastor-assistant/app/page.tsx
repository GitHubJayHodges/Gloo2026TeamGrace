import Dashboard from "@/components/Dashboard";
export default function Page() { return <Dashboard name={process.env.PASTOR_DISPLAY_NAME ?? "Pastor"} />; }
