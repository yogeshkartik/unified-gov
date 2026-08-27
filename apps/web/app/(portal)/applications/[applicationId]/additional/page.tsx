import { AdditionalInformation } from "@/components/application/additional-information";

export default async function AdditionalInformationPage({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = await params;
  return <AdditionalInformation applicationId={applicationId} />;
}
