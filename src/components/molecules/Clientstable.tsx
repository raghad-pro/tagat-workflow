"use client";

import { Mail, Trash2, Pencil } from "lucide-react";
import { Text } from "@/components/atoms/Text";
import { StatusBadge } from "@/components/atoms/Statusbadge";
import { ClientAvatar } from "@/components/atoms/Clientavatar";
import type { Client } from "@/modules/clients/types/clients.types";

interface ClientsTableProps {
  clients: Client[];
  onEdit?: (client: Client) => void;
  onDelete?: (client: Client) => void;
  onMessage?: (client: Client) => void;
}

// ─── Action Icon Button ────────────────────────────────────────────────────────
function ActionBtn({
  onClick,
  children,
  title,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="w-8 h-8 flex items-center justify-center rounded-lg ds-text-gray-200 hover:ds-text-primary hover:bg-[var(--color-bg)] transition-all"
    >
      {children}
    </button>
  );
}

// ─── Desktop Table ─────────────────────────────────────────────────────────────
function DesktopTable({
  clients,
  onEdit,
  onDelete,
  onMessage,
}: ClientsTableProps) {
  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full min-w-[700px] border-collapse">
        {/* Head */}
        <thead>
          <tr style={{ borderBottom: "1px solid var(--color-border-form)" }}>
            {[
              "Customer Name",
              "Phone Number",
              "Subsidiary Company",
              "Contract Value",
              "Status",
              "Actions",
            ].map((h) => (
              <th
                key={h}
                className="text-start px-4 py-3 ds-text-sm ds-font-medium ds-text-gray-200 whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {clients.map((client) => (
            <tr
              key={client.id}
              className="group transition-colors hover:bg-[var(--color-bg-primary-200)]/30"
              style={{ borderBottom: "1px solid var(--color-border-form)" }}
            >
              {/* Name + email */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <ClientAvatar name={client.name} />
                  <div className="min-w-0">
                    <Text size="sm" weight="medium" tag="p" className="truncate">
                      {client.name}
                    </Text>
                    <Text
                      size="sm"
                      color="gray-200"
                      tag="p"
                      className="truncate text-[12px]"
                    >
                      {client.email}
                    </Text>
                  </div>
                </div>
              </td>

              {/* Phone */}
              <td className="px-4 py-3">
                <Text size="sm" color="gray-100" tag="p">
                  {client.phone}
                </Text>
              </td>

              {/* Company */}
              <td className="px-4 py-3">
                <Text size="sm" tag="p">
                  {client.company ?? "—"}
                </Text>
              </td>

              {/* Contract value */}
              <td className="px-4 py-3">
                <Text size="sm" weight="medium" tag="p">
                  ${client.contractValue.toLocaleString('en-US')}
                </Text>
              </td>

              {/* Status */}
              <td className="px-4 py-3">
                <StatusBadge status={client.status} />
              </td>

              {/* Actions */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  <ActionBtn title="Send message" onClick={() => onMessage?.(client)}>
                    <Mail size={15} />
                  </ActionBtn>
                  <ActionBtn title="Delete" onClick={() => onDelete?.(client)}>
                    <Trash2 size={15} />
                  </ActionBtn>
                  <ActionBtn title="Edit" onClick={() => onEdit?.(client)}>
                    <Pencil size={15} />
                  </ActionBtn>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Mobile Cards ──────────────────────────────────────────────────────────────
function MobileCards({
  clients,
  onEdit,
  onDelete,
  onMessage,
}: ClientsTableProps) {
  return (
    <div className="flex flex-col gap-3 md:hidden">
      {clients.map((client) => (
        <div
          key={client.id}
          className="rounded-xl ds-bg-form ds-border-form p-4"
          style={{ boxShadow: "var(--shadow-sm)" }}
        >
          {/* Top row */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <ClientAvatar name={client.name} />
              <div className="min-w-0">
                <Text size="sm" weight="medium" tag="p" className="truncate">
                  {client.name}
                </Text>
                <Text size="sm" color="gray-200" tag="p" className="text-[12px] truncate">
                  {client.email}
                </Text>
              </div>
            </div>
            <StatusBadge status={client.status} />
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <Text size="sm" color="gray-200" tag="p" className="text-[11px] mb-0.5">Phone</Text>
              <Text size="sm" tag="p">{client.phone}</Text>
            </div>
            <div>
              <Text size="sm" color="gray-200" tag="p" className="text-[11px] mb-0.5">Contract</Text>
              <Text size="sm" weight="medium" tag="p">${client.contractValue.toLocaleString('en-US')}</Text>
            </div>
            <div className="col-span-2">
              <Text size="sm" color="gray-200" tag="p" className="text-[11px] mb-0.5">Company</Text>
              <Text size="sm" tag="p">{client.company ?? "—"}</Text>
            </div>
          </div>

          {/* Actions */}
          <div
            className="flex items-center gap-2 pt-3"
            style={{ borderTop: "1px solid var(--color-border-form)" }}
          >
            <ActionBtn title="Message" onClick={() => onMessage?.(client)}>
              <Mail size={15} />
            </ActionBtn>
            <ActionBtn title="Delete" onClick={() => onDelete?.(client)}>
              <Trash2 size={15} />
            </ActionBtn>
            <ActionBtn title="Edit" onClick={() => onEdit?.(client)}>
              <Pencil size={15} />
            </ActionBtn>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export function ClientsTable(props: ClientsTableProps) {
  if (!props.clients.length) {
    return (
      <div className="py-16 text-center">
        <Text color="gray-200" size="sm" tag="p">
          No clients found.
        </Text>
      </div>
    );
  }

  return (
    <>
      <DesktopTable {...props} />
      <MobileCards {...props} />
    </>
  );
}
