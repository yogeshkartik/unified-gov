import { redirect } from "next/navigation";

export default async function PreviewRoute({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = await params;
  redirect(`/applications/${applicationId}/apply?step=preview`);
}
