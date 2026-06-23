// "use client";

// import React, { useEffect } from "react";
// import { ActionModal } from "@/components/molecules/ActionModal";
// import { Text } from "@/components/atoms/Text";
// import { ClientAvatar } from "@/components/atoms/Clientavatar";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import type { UpdateClientStatusRequest } from "@/modules/clients/types/clients.types";
// import { useAuth } from "@/providers/AuthProvider";

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
// };

// interface EditClientModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   data: ClientData | null;
//   onUpdate: (id: number, data: UpdateClientStatusRequest) => void;
//   isPending?: boolean;
// }

// // ─── Status option button ──────────────────────────────────────────────────────
// const STATUS_OPTIONS: Array<{
//   value: PivotStatus;
//   label: string;
//   bg: string;
//   color: string;
//   border: string;
// }> = [
//   {
//     value:  "approved",
//     label:  "Approved",
//     bg:     "rgba(52,211,153,0.10)",
//     color:  "#059669",
//     border: "#34d399",
//   },
//   {
//     value:  "pending",
//     label:  "Pending",
//     bg:     "rgba(251,191,36,0.10)",
//     color:  "#d97706",
//     border: "#f59e0b",
//   },
//   {
//     value:  "rejected",
//     label:  "Rejected",
//     bg:     "rgba(239,68,68,0.10)",
//     color:  "#dc2626",
//     border: "#ef4444",
//   },
// ];

// // ─── Component ─────────────────────────────────────────────────────────────────
// export function EditClientModal({
//   isOpen,
//   onClose,
//   data,
//   onUpdate,
//   isPending = false,
// }: EditClientModalProps) {
//   const { user } = useAuth();
//   const isCompanyAdmin = user?.role === "company_admin";

//   const [selectedCompanyId, setSelectedCompanyId] = React.useState<number | null>(null);
//   const [selectedStatus, setSelectedStatus]       = React.useState<PivotStatus>("pending");

//   // عند فتح الـ modal نملأ القيم من أول شركة
//   useEffect(() => {
//     if (data && isOpen && data.companies.length > 0) {
//       const first = data.companies[0];
//       setSelectedCompanyId(first.id);
//       setSelectedStatus(first.pivot.status);
//     }
//   }, [data, isOpen]);

//   if (!isOpen || !data) return null;

//   // الـ company_admin بيشوف شركته فقط
//   const companies = isCompanyAdmin
//     ? data.companies.filter((c) => c.id === user?.company_id)
//     : data.companies;

//   const handleSubmit = () => {
//     if (!selectedCompanyId) return;
//     onUpdate(data.id, {
//       company_id: selectedCompanyId,
//       status:     selectedStatus,
//     });
//   };

//   return (
//     <ActionModal
//       isOpen={isOpen}
//       onClose={onClose}
//       title="Update Client Status"
//       mode="edit"
//       size="md"
//       saveLabel="Update Status"
//       isLoading={isPending}
//       onSubmit={handleSubmit}
//     >
//       <div className="flex flex-col gap-5">

//         {/* ── Client Info ── */}
//         <div
//           className="flex items-center gap-3 p-4 rounded-xl"
//           style={{ background: "var(--color-bg)" }}
//         >
//           <ClientAvatar name={data.name} size="md" />
//           <div>
//             <Text size="sm" weight="bold" tag="p">{data.name}</Text>
//             <Text size="sm" color="gray-200" tag="p">{data.email}</Text>
//           </div>
//         </div>

//         {/* ── Company selector (super_admin بس) ── */}
//         {!isCompanyAdmin && companies.length > 1 && (
//           <div className="flex flex-col gap-2">
//             <Text size="sm" weight="bold" tag="p">Select Company</Text>
//             <div className="flex flex-col gap-2">
//               {companies.map((c) => (
//                 <button
//                   key={c.id}
//                   type="button"
//                   onClick={() => {
//                     setSelectedCompanyId(c.id);
//                     setSelectedStatus(c.pivot.status);
//                   }}
//                   className="flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-start"
//                   style={{
//                     borderColor:
//                       selectedCompanyId === c.id
//                         ? "var(--color-primary)"
//                         : "var(--color-border-inputs)",
//                     background:
//                       selectedCompanyId === c.id
//                         ? "var(--color-bg-primary-200)"
//                         : "var(--color-bg-form)",
//                   }}
//                 >
//                   <Text size="sm" weight={selectedCompanyId === c.id ? "bold" : "regular"} tag="span">
//                     {c.name}
//                   </Text>
//                   <span
//                     className="text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize"
//                     style={{
//                       background: STATUS_OPTIONS.find((s) => s.value === c.pivot.status)?.bg,
//                       color:      STATUS_OPTIONS.find((s) => s.value === c.pivot.status)?.color,
//                     }}
//                   >
//                     {c.pivot.status}
//                   </span>
//                 </button>
//               ))}
//             </div>
//           </div>
//         )}

//         {/* ── Status selector ── */}
//         <div className="flex flex-col gap-2 pb-32">
//           <Text size="sm" weight="bold" tag="p">New Status</Text>
//           <Select
//             value={selectedStatus}
//             onValueChange={(val: PivotStatus) => setSelectedStatus(val)}
//           >
//             <SelectTrigger className="w-full bg-[var(--color-bg-form)] border border-[var(--color-border-inputs)] rounded-xl py-6 px-4 shadow-sm">
//               <SelectValue placeholder="Select Status" />
//             </SelectTrigger>
//             <SelectContent position="popper" side="bottom" className="bg-[var(--color-bg-form)] border-none shadow-xl rounded-xl overflow-hidden p-0">
//               {STATUS_OPTIONS.map((opt, index) => (
//                 <div key={opt.value} className={index !== STATUS_OPTIONS.length - 1 ? "border-b border-[var(--color-border-inputs)]" : ""}>
//                   <SelectItem value={opt.value} className="py-3.5 px-4 cursor-pointer focus:bg-[var(--color-bg-primary-200)] focus:text-primary rounded-none">
//                     <Text size="sm" tag="span" weight="medium" className="ds-text-main">
//                       {opt.label}
//                     </Text>
//                   </SelectItem>
//                 </div>
//               ))}
//             </SelectContent>
//           </Select>
//         </div>

//       </div>
//     </ActionModal>
//   );
// }
"use client";

import React, { useEffect } from "react";
import { ActionModal } from "@/components/molecules/ActionModal";
import { Text } from "@/components/atoms/Text";
import { ClientAvatar } from "@/components/atoms/Clientavatar";
import type { UpdateClientStatusRequest } from "@/modules/clients/types/clients.types";

// ─── types ─────────────────────────────────────────────────────────────────────
type PivotStatus = "pending" | "approved" | "rejected";

type ClientData = {
  id: number;
  name: string;
  email: string;
  companies: Array<{
    id: number;
    name: string;
    pivot: { status: PivotStatus };
  }>;
};

// ─── props — تطابق ما بتمرره الـ page ─────────────────────────────────────────
interface EditClientModalProps {
  isOpen:          boolean;
  onClose:         () => void;
  client:          ClientData | null;          // ← client (اسم الـ page)
  onSave:          (id: number, data: UpdateClientStatusRequest) => void; // ← onSave
  isPending?:      boolean;
  isCompanyAdmin?: boolean;
  userCompanyId?:  number;
}

// ─── status options ────────────────────────────────────────────────────────────
const STATUS_OPTIONS: Array<{
  value: PivotStatus;
  label: string;
  bg: string;
  color: string;
  border: string;
}> = [
  { value: "approved", label: "Approved", bg: "rgba(52,211,153,0.10)", color: "#059669", border: "#34d399" },
  { value: "pending",  label: "Pending",  bg: "rgba(251,191,36,0.10)", color: "#d97706", border: "#f59e0b" },
  { value: "rejected", label: "Rejected", bg: "rgba(239,68,68,0.10)", color: "#dc2626", border: "#ef4444" },
];

// ─── Component ─────────────────────────────────────────────────────────────────
export function EditClientModal({
  isOpen,
  onClose,
  client,
  onSave,
  isPending = false,
  isCompanyAdmin = false,
  userCompanyId,
}: EditClientModalProps) {
  const [selectedCompanyId, setSelectedCompanyId] = React.useState<number | null>(null);
  const [selectedStatus, setSelectedStatus]       = React.useState<PivotStatus>("pending");

  useEffect(() => {
    if (client && isOpen && client.companies.length > 0) {
      // company_admin بيشوف شركته فقط
      const first = isCompanyAdmin && userCompanyId
        ? (client.companies.find((c) => c.id === userCompanyId) ?? client.companies[0])
        : client.companies[0];
      setSelectedCompanyId(first.id);
      setSelectedStatus(first.pivot.status);
    }
  }, [client, isOpen, isCompanyAdmin, userCompanyId]);

  if (!isOpen || !client) return null;

  const companies = isCompanyAdmin && userCompanyId
    ? client.companies.filter((c) => c.id === userCompanyId)
    : client.companies;

  const handleSubmit = () => {
    if (!selectedCompanyId) return;
    onSave(client.id, {
      company_id: selectedCompanyId,
      status:     selectedStatus,
    });
  };

  return (
    <ActionModal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Client Status"
      mode="edit"
      size="md"
      saveLabel="Update Status"
      isLoading={isPending}
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col gap-5">

        {/* ── Client Info ── */}
        <div
          className="flex items-center gap-3 p-4 rounded-xl"
          style={{ background: "var(--color-bg)" }}
        >
          <ClientAvatar name={client.name} size="md" />
          <div>
            <Text size="sm" weight="bold" tag="p">{client.name}</Text>
            <Text size="sm" color="gray-200" tag="p">{client.email}</Text>
          </div>
        </div>

        {/* ── Company selector — super_admin + أكثر من شركة ── */}
        {!isCompanyAdmin && companies.length > 1 && (
          <div className="flex flex-col gap-2">
            <Text size="sm" weight="bold" tag="p">Select Company</Text>
            <div className="flex flex-col gap-2">
              {companies.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSelectedCompanyId(c.id);
                    setSelectedStatus(c.pivot.status);
                  }}
                  className="flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-start"
                  style={{
                    borderColor: selectedCompanyId === c.id ? "var(--color-primary)" : "var(--color-border-inputs)",
                    background:  selectedCompanyId === c.id ? "var(--color-bg-primary-200)" : "var(--color-bg-form)",
                  }}
                >
                  <Text size="sm" weight={selectedCompanyId === c.id ? "bold" : "regular"} tag="span">
                    {c.name}
                  </Text>
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize"
                    style={{
                      background: STATUS_OPTIONS.find((s) => s.value === c.pivot.status)?.bg,
                      color:      STATUS_OPTIONS.find((s) => s.value === c.pivot.status)?.color,
                    }}
                  >
                    {c.pivot.status}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Status selector ── */}
        <div className="flex flex-col gap-2">
          <Text size="sm" weight="bold" tag="p">New Status</Text>
          <div className="grid grid-cols-3 gap-2">
            {STATUS_OPTIONS.map((opt) => {
              const isSelected = selectedStatus === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedStatus(opt.value)}
                  className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all"
                  style={{
                    borderColor: isSelected ? opt.border : "var(--color-border-inputs)",
                    background:  isSelected ? opt.bg     : "var(--color-bg-form)",
                  }}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: opt.color }} />
                  <Text
                    size="sm"
                    weight={isSelected ? "bold" : "regular"}
                    tag="span"
                    style={{ color: isSelected ? opt.color : undefined }}
                  >
                    {opt.label}
                  </Text>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </ActionModal>
  );
}