import { Suspense } from "react";
import ConversationsManagementPage from "@/modules/conversations/components/ConversationsManagementPage";
import { ConversationListSkeleton } from "@/modules/conversations/components/ConversationSkeleton";

export default function Page() {
  // The page reads `?c=<id>` to open a conversation the navbar linked to, and
  // `useSearchParams` has to sit inside a Suspense boundary.
  return (
    <Suspense fallback={<ConversationListSkeleton />}>
      <ConversationsManagementPage />
    </Suspense>
  );
}
