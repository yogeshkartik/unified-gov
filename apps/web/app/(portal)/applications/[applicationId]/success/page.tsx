import { SuccessPage } from "@/components/application/success-page";

export default async function SuccessRoute({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = await params;
  return <SuccessPage applicationId={applicationId} />;
}
