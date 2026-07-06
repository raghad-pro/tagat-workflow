// "use client";

// import React from "react";
// import { ActionModal } from "@/components/molecules/ActionModal";
// import { Text } from "@/components/atoms/Text";
// import { ClientAvatar } from "@/components/atoms/Clientavatar";

// // ─── types ─────────────────────────────────────────────────────────────────────
// type PivotStatus = "pending" | "approved" | "rejected";

// type ClientData = {
//   id: number;
//   name: string;
//   email: string;
//   companies: Array<{
//     id: number;
//     name: string;
//     pivot: { status: PivotStatus };
//   }>;
//   createdAt: string;
// };

// interface ViewClientModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   data: ClientData | null;
// }

// // ─── status pill ───────────────────────────────────────────────────────────────
// const STATUS_CONFIG: Record<PivotStatus, { bg: string; color: string; dot: string }> = {
//   approved: { bg: "rgba(52,211,153,0.12)", color: "#059669",           dot: "#34d399" },
//   pending:  { bg: "rgba(251,191,36,0.12)", color: "#d97706",           dot: "#f59e0b" },
//   rejected: { bg: "rgba(239,68,68,0.10)", color: "var(--color-error)", dot: "#ef4444" },
// };

// function StatusPill({ status }: { status: PivotStatus }) {
//   const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
//   const label = status.charAt(0).toUpperCase() + status.slice(1);
//   return (
//     <span
//       className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
//       style={{ background: cfg.bg, color: cfg.color }}
//     >
//       <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
//       {label}
//     </span>
//   );
// }

// // ─── row helper ────────────────────────────────────────────────────────────────
// function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
//   return (
//     <div
//       className="flex items-start justify-between gap-4 py-3"
//       style={{ borderBottom: "1px solid var(--color-border-form)" }}
//     >
//       <Text size="sm" color="gray-200" tag="span" className="shrink-0 w-28">
//         {label}
//       </Text>
//       <div className="text-end">{children}</div>
//     </div>
//   );
// }

// // ─── Component ─────────────────────────────────────────────────────────────────
// export function ViewClientModal({ isOpen, onClose, data }: ViewClientModalProps) {
//   if (!isOpen || !data) return null;

//   return (
//     <ActionModal
//       isOpen={isOpen}
//       onClose={onClose}
//       title="Client Details"
//       mode="view"
//       size="md"
//     >
//       <div className="flex flex-col gap-5">

//         {/* ── Avatar + name ── */}
//         <div
//           className="flex items-center gap-4 p-4 rounded-xl"
//           style={{ background: "var(--color-bg)" }}
//         >
//           <ClientAvatar name={data.name} size="md" />
//           <div>
//             <Text size="base" weight="bold" tag="p">{data.name}</Text>
//             <Text size="sm" color="gray-200" tag="p">{data.email}</Text>
//           </div>
//         </div>

//         {/* ── Info rows ── */}
//         <div className="flex flex-col">
//           <InfoRow label="Email">
//             <Text size="sm" tag="span">{data.email}</Text>
//           </InfoRow>

//           <InfoRow label="Member since">
//             <Text size="sm" tag="span">
//               {data.createdAt ? new Date(data.createdAt).toLocaleDateString() : "—"}
//             </Text>
//           </InfoRow>

//           <InfoRow label="Companies">
//             {data.companies.length === 0 ? (
//               <Text size="sm" color="gray-200" tag="span">No companies</Text>
//             ) : (
//               <div className="flex flex-col gap-2 items-end">
//                 {data.companies.map((c) => (
//                   <div key={c.id} className="flex items-center gap-2">
//                     <Text size="sm" tag="span">{c.name}</Text>
//                     <StatusPill status={c.pivot.status} />
//                   </div>
//                 ))}
//               </div>
//             )}
//           </InfoRow>
//         </div>

//       </div>
//     </ActionModal>
//   );
// }
"use client";

import React from "react";
import { Text } from "@/components/atoms/Text";
import { ViewDetailsLayout, InfoRow, StatusPill } from "@/components/molecules/ViewDetailsLayout";
import { useAuth } from "@/providers/AuthProvider";

// ─── Types ─────────────────────────────────────────────────────────────────────
type PivotStatus = "pending" | "approved" | "rejected";

interface ClientCompany {
  id:    number;
  name:  string;
  pivot: { status: PivotStatus };
}

interface ClientData {
  id:        number;
  name:      string;
  email:     string;
  companies: ClientCompany[];
  createdAt: string;
}

interface ViewClientModalProps {
  isOpen:  boolean;
  onClose: () => void;
  client:  ClientData | null;
}

// ─── Component ─────────────────────────────────────────────────────────────────
export function ViewClientModal({ isOpen, onClose, client }: ViewClientModalProps) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  if (!isOpen || !client) return null;

  return (
    <ViewDetailsLayout
      isOpen={isOpen}
      onClose={onClose}
      title="Client Details"
      avatarName={client.name}
      headerTitle={client.name}
      headerSubtitle={client.email}
    >
      <InfoRow label="Email">
        <Text size="sm" tag="span">{client.email}</Text>
      </InfoRow>

      <InfoRow label="Member since">
        <Text size="sm" tag="span">
          {client.createdAt
            ? new Date(client.createdAt).toLocaleDateString()
            : "—"}
        </Text>
      </InfoRow>

      {isSuperAdmin && (
        <InfoRow label="Companies">
          {client.companies.length === 0 ? (
            <Text size="sm" color="gray-200" tag="span">No companies</Text>
          ) : (
            <div className="flex flex-col gap-2 items-end">
              {client.companies.map((c) => (
                <div key={c.id} className="flex items-center gap-2">
                  <Text size="sm" tag="span">{c.name}</Text>
                  <StatusPill status={c.pivot.status} />
                </div>
              ))}
            </div>
          )}
        </InfoRow>
      )}
    </ViewDetailsLayout>
  );
}