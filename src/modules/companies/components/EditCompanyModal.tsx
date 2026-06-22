"use client";

import React, { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Upload } from "lucide-react";
import { Text } from "@/components/atoms/Text";
import { ActionModal } from "@/components/molecules/ActionModal";
import { TextField, SelectField } from "@/components/molecules/FormFields";
import { Form } from "@/components/ui/form";
import { useTranslations } from "next-intl";
import type { Company } from "@/modules/companies/types/companies.types";

const companySchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  subdomain: z.string().min(2, "Subdomain is required").regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers and hyphens"),
  fieldOfWork: z.string().min(1, "Please select field of work"),
});

export type CompanyFormValues = z.infer<typeof companySchema>;

export function EditCompanyModal({ isOpen, onClose, onUpdate, data }: { isOpen: boolean; onClose: () => void; onUpdate: (id: number, data: CompanyFormValues) => void; data: Company | null }) {
  const t = useTranslations("company");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: { email: "", companyName: "", subdomain: "", fieldOfWork: "" },
  });

  useEffect(() => {
    if (data && isOpen) {
      form.reset({
        email: data.email || "",
        companyName: data.name || "",
        subdomain: data.domain?.split(".")[0] || "",
        fieldOfWork: "technical" // Defaulting to technical for mock data since it doesn't exist
      });
      setLogoPreview(null); // Load existing logo here if available
    }
  }, [data, isOpen, form]);

  if (!data) return null;

  const FIELDS_OF_WORK = [
    { value: "technical", label: t("fields.technical") || "Technical" },
    { value: "financial", label: t("fields.financial") || "Financial" },
    { value: "educational", label: t("fields.educational") || "Educational" },
    { value: "healthcare", label: t("fields.healthcare") || "Healthcare" },
    { value: "other", label: t("fields.other") || "Other" },
  ];

  const onSubmit = async (formData: CompanyFormValues) => {
    onUpdate(data.id, formData);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { alert("File size must be less than 2MB"); return; }
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <ActionModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={t("editCompanyTitle") || "Edit Company"}
      mode="edit"
      formId="edit-company-form"
      size="xl"
      saveLabel={t("updateCompany") || "Update Company"}
    >
      <div className="flex flex-col w-full">
        <div className="mb-6 flex flex-col gap-1">
          <Text size="sm" className="ds-text-gray-200 ml-7">{t("editCompanySubtitle") || "Update company information"}</Text>
        </div>

        <Form {...form}>
          <form id="edit-company-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="ds-bg-form rounded-2xl p-6 sm:p-8 shadow-sm border ds-border-form">
              <div className="flex items-start gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(14,165,233,0.1)" }}>
                  <Building2 size={24} style={{ color: "#0ea5e9" }} />
                </div>
                <div>
                  <Text size="lg" weight="bold" className="ds-text-primary">{t("basicInfo") || "Basic Company Information"}</Text>
                  <Text size="sm" className="ds-text-gray-200 mt-0.5">{t("basicInfoSub") || "Update the company's basic details"}</Text>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <TextField 
                  control={form.control}
                  name="email"
                  label={t("labels.email") || "Email"}
                  placeholder="mahmoud.ali@gmail.com"
                  type="email"
                />
                <TextField 
                  control={form.control}
                  name="companyName"
                  label={t("labels.companyName") || "Company Name"}
                  placeholder="Example: Advanced Tech Company"
                />
                <TextField 
                  control={form.control}
                  name="subdomain"
                  label={t("labels.subdomain") || "Subdomain"}
                  placeholder="advanced-tech"
                />
                <SelectField 
                  control={form.control}
                  name="fieldOfWork"
                  label={t("labels.fieldOfWork") || "Field of Work"}
                  options={FIELDS_OF_WORK}
                  placeholder={t("placeholders.fieldOfWork") || "Choose the field of work"}
                />
              </div>

              <div className="flex flex-col gap-1.5 w-full">
                <Text size="sm" weight="bold" tag="label" className="ds-text-main capitalize">{t("labels.companyLogo") || "Company Logo"}</Text>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center py-8 rounded-xl border-2 border-dashed ds-border-form cursor-pointer hover:border-[var(--color-primary)] hover:bg-[var(--color-bg-primary-200)] transition-all"
                >
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
                  {logoPreview ? (
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden border ds-border-form">
                      <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-center">
                      <Upload size={24} className="ds-text-gray-200" />
                      <Text size="sm" weight="medium" className="ds-text-primary">{t("uploadLogo") || "Click to upload logo"}</Text>
                      <Text size="sm" className="ds-text-gray-200 text-xs">PNG, JPG, WEBP - max 2MB</Text>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </ActionModal>
  );
}
