"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Mail, Lock } from "lucide-react";
import { Text } from "@/components/atoms/Text";
import { ActionModal } from "@/components/molecules/ActionModal";
import { TextField, PasswordField } from "@/components/molecules/FormFields";
import { Form } from "@/components/ui/form";
import type { AddClientFormValues } from "@/modules/clients/types/clients.types";

// ─── Schema ────────────────────────────────────────────────────────────────────
const schema = z.object({
  name:       z.string().min(2, "Name must be at least 2 characters"),
  email:      z.string().min(1, "Email is required").email("Invalid email address"),
  password:   z.string().min(8, "Password must be at least 8 characters"),
  company_id: z.number().optional(),
});

type FormValues = z.infer<typeof schema>;

// ─── Props ─────────────────────────────────────────────────────────────────────
interface AddClientModalProps {
  isOpen:        boolean;
  onClose:       () => void;
  onAdd:         (data: AddClientFormValues) => void;
  isPending?:    boolean;
  isSuperAdmin?: boolean;
  companies?:    Array<{ id: number; name: string }>;
}

// ─── Component ─────────────────────────────────────────────────────────────────
export function AddClientModal({
  isOpen,
  onClose,
  onAdd,
  isPending    = false,
  isSuperAdmin = false,
  companies    = [],
}: AddClientModalProps) {
  const form = useForm<FormValues>({
    resolver:      zodResolver(schema),
    mode:          "onTouched",
    defaultValues: { name: "", email: "", password: "", company_id: undefined },
  });

  const onSubmit = (data: FormValues) => {
    onAdd({
      name:     data.name,
      email:    data.email,
      password: data.password,
      ...(isSuperAdmin && data.company_id != null ? { company_id: data.company_id } : {}),
    });
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ActionModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add New Client"
      mode="add"
      formId="add-client-form"
      size="md"
      saveLabel="Save Client"
      isLoading={isPending}
    >
      <div className="flex flex-col gap-5">

        {/* Section header */}
        <div
          className="flex items-center gap-3 p-4 rounded-xl"
          style={{ background: "var(--color-bg)" }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "var(--color-bg-primary-200)" }}
          >
            <User size={16} style={{ color: "var(--color-primary)" }} />
          </div>
          <div>
            <Text size="sm" weight="bold" tag="p">Basic Client Information</Text>
            <Text size="sm" color="gray-200" tag="p">Enter the client's basic details</Text>
          </div>
        </div>

        {/* Form */}
        <Form {...form}>
          <form
            id="add-client-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                control={form.control}
                name="name"
                label="Client Name"
                placeholder="e.g. Ahmed Ali"
                required
                icon={User}
              />
              <TextField
                control={form.control}
                name="email"
                label="Email Address"
                placeholder="client@example.com"
                type="email"
                required
                icon={Mail}
              />
            </div>

            <PasswordField
              control={form.control}
              name="password"
              label="Password"
              placeholder="At least 8 characters"
              required
              icon={Lock}
            />

            {/* Company selector — super_admin only */}
            {isSuperAdmin && companies.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <Text size="sm" weight="bold" tag="label" htmlFor="company_id">
                  Assign to Company
                  <Text tag="span" size="sm" color="gray-200" className="text-[12px] ms-1">
                    (optional)
                  </Text>
                </Text>
                <div className="relative">
                  <select
                    id="company_id"
                    {...form.register("company_id", { valueAsNumber: true })}
                    className="w-full appearance-none rounded-xl ds-text-sm ds-text-primary px-4 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                    style={{
                      height:     "var(--input-height)",
                      border:     "1px solid var(--color-border-inputs)",
                      background: "var(--color-bg-form)",
                    }}
                  >
                    <option value="">— Select a company —</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M3 5L7 9L11 5"
                        stroke="var(--color-text-gray-200)"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </form>
        </Form>
      </div>
    </ActionModal>
  );
}