"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Upload, Building2 } from "@/assets/icons/icons";
import { Button } from "@/components/atoms/Button";
import { Text } from "@/components/atoms/Text";
import { TextField } from "@/components/molecules/FormFields";
import { Form } from "@/components/ui/form";
import type { AddCompanyRequest, CompanyPlan } from "../types/company.types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AddCompanyRequest) => Promise<void>;
  isPending: boolean;
}

const schema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters"),
  subdomain: z
    .string()
    .min(2, "Subdomain is required")
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only"),
  email: z.string().email("Invalid email"),
  plan: z.enum(["Basic", "Pro", "Enterprise"]),
  monthly_revenue: z.string().optional(),
  renewal_date: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function AddCompanyModal({ open, onClose, onSubmit, isPending }: Props) {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoError, setLogoError] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", subdomain: "", email: "", plan: "Basic" },
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setLogoError("Max 2MB"); return; }
    setLogoError("");
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (data: FormValues) => {
    await onSubmit({
      ...data,
      plan: data.plan as CompanyPlan,
      monthly_revenue: data.monthly_revenue ? Number(data.monthly_revenue) : undefined,
      logo: logoFile,
    });
    form.reset();
    setLogoPreview(null);
    setLogoFile(null);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded-2xl ds-bg-form ds-border-form ds-shadow-sm overflow-y-auto max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b ds-border-form">
          <Text size="lg" weight="bold">Add a new company</Text>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:ds-bg-gray-200 transition-colors ds-text-gray-200"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4">

              {/* Logo Upload */}
              <div className="flex flex-col gap-1.5">
                <Text size="sm" weight="bold" tag="p">
                  Company Logo
                  <Text tag="span" size="sm" color="gray-200" className="ms-1 text-[11px]">(Optional)</Text>
                </Text>
                <label
                  htmlFor="company-logo"
                  className="flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 border-dashed cursor-pointer transition-all"
                  style={{
                    borderColor: logoPreview ? "var(--color-primary)" : "var(--color-border-inputs)",
                    background: "var(--color-bg)",
                  }}
                >
                  {logoPreview ? (
                    <>
                      <img src={logoPreview} alt="preview" className="w-14 h-14 rounded-full object-cover" />
                      <Text size="sm" color="gray-200">Click to change</Text>
                    </>
                  ) : (
                    <>
                      <Upload size={20} className="ds-text-gray-200" />
                      <Text size="sm" color="gray-200">Upload company logo</Text>
                      <Text size="sm" color="gray-200" className="text-[11px]">PNG, JPG, WebP — max 2MB</Text>
                    </>
                  )}
                  <input id="company-logo" type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                </label>
                {logoError && <Text size="sm" color="error">{logoError}</Text>}
              </div>

              {/* Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextField control={form.control} name="name" label="Company Name" placeholder="Advanced Tech Company" required icon={Building2} />
                <TextField control={form.control} name="subdomain" label="Subdomain" placeholder="advanced-tech" required />
                <TextField control={form.control} name="email" label="Email" placeholder="admin@company.com" type="email" required />

                {/* Plan */}
                <div className="flex flex-col gap-1.5">
                  <Text size="sm" weight="bold" tag="label" htmlFor="plan">
                    Plan <span className="ds-text-error ms-1">*</span>
                  </Text>
                  <select
                    id="plan"
                    {...form.register("plan")}
                    className="h-12 px-4 rounded-xl ds-border-input-color ds-bg ds-text-sm ds-text-primary focus:outline-none focus:border-[var(--color-primary)]"
                  >
                    <option value="Basic">Basic</option>
                    <option value="Pro">Pro</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>

                <TextField control={form.control} name="monthly_revenue" label="Monthly Revenue ($)" placeholder="499" />
                <TextField control={form.control} name="renewal_date" label="Renewal Date" placeholder="2026-12-15" />
              </div>

              {/* Footer */}
              <div className="flex gap-3 justify-end pt-2 mt-2 border-t ds-border-form">
                <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                <Button type="submit" variant="solid" loading={isPending}>Add Company</Button>
              </div>

            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}