import { Suspense } from "react";
import { ProjectAiWorkspace } from "@/modules/project-ai/components/ProjectAiWorkspace";

export default async function Page({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  // The workspace keeps its tab in `?tab=`, which needs a boundary to read.
  return (
    <Suspense>
      <ProjectAiWorkspace projectId={projectId} />
    </Suspense>
  );
}
