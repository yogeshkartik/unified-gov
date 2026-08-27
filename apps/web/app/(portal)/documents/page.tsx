import { DocumentsPage } from "@/components/documents/documents-page";
import { PageHeader } from "@/components/layout/page-header";

export default function DocumentsRoute() { return <div className="space-y-6"><PageHeader title="My documents" description="Profile and mock DigiLocker documents available for this synthetic citizen." /><DocumentsPage /></div>; }
