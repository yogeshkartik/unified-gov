import { PageHeader } from "@/components/layout/page-header";
import { ServicesCatalog } from "@/components/services/services-catalog";

export default function ServicesPage() { return <div className="space-y-6"><PageHeader title="Government services" description="Find and apply for government services." /><ServicesCatalog /></div>; }
