import { PaymentPage } from "@/components/application/payment-page";

export default async function PaymentRoute({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = await params;
  return <PaymentPage applicationId={applicationId} />;
}
