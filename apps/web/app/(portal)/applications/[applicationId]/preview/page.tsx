import { PreviewPage } from "@/components/application/preview-page";

export default async function PreviewRoute({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = await params;
  return <PreviewPage applicationId={applicationId} />;
}
