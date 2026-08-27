import { PageHeader } from "@/components/layout/page-header";
import { SettingsPage } from "@/components/settings/settings-page";

export default function SettingsRoute() { return <div className="space-y-6"><PageHeader title="Settings" description="Language and accessibility preferences are saved locally in this browser." /><SettingsPage /></div>; }
