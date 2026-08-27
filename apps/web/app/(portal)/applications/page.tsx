import { ApplicationsPage } from "@/components/application/applications-page";
import { PageHeader } from "@/components/layout/page-header";

export default function ApplicationsRoute() { return <div className="space-y-6"><PageHeader title="My applications" description="Review and continue your service applications." /><ApplicationsPage /></div>; }
