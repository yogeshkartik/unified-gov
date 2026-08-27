import { PageHeader } from "@/components/layout/page-header";
import { ServicesCatalog } from "@/components/services/services-catalog";

export default function ServicesPage() { return <div className="space-y-6"><PageHeader title="Government services" description="Browse the seeded demo catalog. Service details and applications are intentionally outside this foundation slice." /><ServicesCatalog /></div>; }
