import { ServiceDetail } from "@/components/services/service-detail";

export default async function ServiceDetailPage({ params }: { params: Promise<{ serviceId: string }> }) {
  const { serviceId } = await params;
  return <ServiceDetail serviceId={serviceId} />;
}
