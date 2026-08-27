import { ApplicationDetailPage } from "@/components/application/application-detail-page";

export default async function ApplicationDetailRoute({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = await params;
  return <ApplicationDetailPage applicationId={applicationId} />;
}
