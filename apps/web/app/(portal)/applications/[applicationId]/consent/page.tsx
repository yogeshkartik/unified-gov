import { ConsentPage } from "@/components/application/consent-page";

export default async function ConsentRoute({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = await params;
  return <ConsentPage applicationId={applicationId} />;
}
