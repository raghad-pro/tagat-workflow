import { ImportWizard } from "@/modules/data-import/components/wizard/ImportWizard";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ImportWizard sessionId={id} />;
}
