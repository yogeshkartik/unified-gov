import { Suspense } from "react";
import { ApplicationFlowPage } from "@/components/application/application-flow-page";

export default async function ApplyPage({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = await params;
  return <Suspense fallback={null}><ApplicationFlowPage applicationId={applicationId} /></Suspense>;
}
