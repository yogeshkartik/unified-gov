import { redirect } from "next/navigation";

export default async function SuccessRoute({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = await params;
  redirect(`/applications/${applicationId}/apply?step=success`);
}
