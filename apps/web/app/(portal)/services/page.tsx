import { LocalizedPageHeader } from "@/components/layout/localized-page-header";
import { ServicesCatalog } from "@/components/services/services-catalog";

export default function ServicesPage() { return <div className="space-y-6"><LocalizedPageHeader titleKey="services" descriptionKey="servicesDescription" /><ServicesCatalog /></div>; }
