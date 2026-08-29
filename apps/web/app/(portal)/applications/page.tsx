import { ApplicationsPage } from "@/components/application/applications-page";
import { LocalizedPageHeader } from "@/components/layout/localized-page-header";

export default function ApplicationsRoute() { return <div className="space-y-6"><LocalizedPageHeader titleKey="applications" descriptionKey="applicationsDescription" /><ApplicationsPage /></div>; }
