import { LocalizedPageHeader } from "@/components/layout/localized-page-header";
import { SettingsPage } from "@/components/settings/settings-page";

export default function SettingsRoute() { return <div className="space-y-6"><LocalizedPageHeader titleKey="settings" descriptionKey="settingsDescription" /><SettingsPage /></div>; }
