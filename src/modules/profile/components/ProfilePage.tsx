"use client";

import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { PageContainer } from "@/components/template/PageContainer";
import { PageHeader } from "@/components/molecules/Pageheader";
import { Text } from "@/components/atoms/Text";
import { Button } from "@/components/atoms/Button";
import { TextField, PasswordField } from "@/components/molecules/FormFields";
import { Form } from "@/components/ui/form";
import { StatusBadge } from "@/components/atoms/Statusbadge";
import { useAuth } from "@/providers/AuthProvider";
import {
  useProfile,
  useUpdateProfile,
  useUpdatePassword,
  useDeleteAccount,
} from "@/modules/profile/hooks/useProfile";
import {
  User,
  Mail,
  Lock,
  Upload,
  AlertTriangle,
  Building2,
  Briefcase,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { GenericStatus } from "@/types/Shared.types";

// ─── Section Card wrapper ─────────────────────────────────────────────────────
function SectionCard({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl ds-bg-form ds-border-form p-6 sm:p-8 ds-shadow-sm",
        className
      )}
    >
      <div className="mb-6">
        <Text size="lg" weight="bold" tag="h2">
          {title}
        </Text>
        {subtitle && (
          <Text size="sm" color="gray-200" tag="p" className="mt-1">
            {subtitle}
          </Text>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Info Row (read-only display) ─────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div
      className="flex items-center justify-between py-3"
      style={{ borderBottom: "1px solid var(--color-border-form)" }}
    >
      <Text size="sm" color="gray-200" tag="span">
        {label}
      </Text>
      <Text size="sm" weight="medium" tag="span">
        {value || "—"}
      </Text>
    </div>
  );
}

// ─── Avatar Upload ────────────────────────────────────────────────────────────
function AvatarSection({
  name,
  imageUrl,
  role,
  onUpload,
}: {
  name: string;
  imageUrl?: string | null;
  role: string;
  onUpload?: (file: File) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(imageUrl || null);

  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }
    setPreview(URL.createObjectURL(file));
    onUpload?.(file);
  };

  const roleLabel: Record<string, string> = {
    super_admin: "System Administrator",
    company: "Company Administrator",
    employee: "Employee",
    client: "Client",
  };
  const t = useTranslations("profile");

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar circle */}
      <div className="relative">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold overflow-hidden"
          style={{
            background: preview
              ? "transparent"
              : "var(--color-bg-primary)",
            color: "var(--color-text-button)",
          }}
        >
          {preview ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt={name}
                className="w-full h-full object-cover"
              />
            </>
          ) : (
            initials
          )}
        </div>
        {/* Upload button overlay */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="absolute bottom-0 end-0 w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-90"
          style={{
            background: "var(--color-bg-primary)",
            color: "var(--color-text-button)",
          }}
          title="Upload image"
        >
          <Upload size={14} />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFile}
        />
      </div>

      {/* Name + role */}
      <div className="text-center">
        <Text size="base" weight="bold" tag="p">
          {name}
        </Text>
        <Text size="sm" color="gray-200" tag="p">
          {roleLabel[role] || role}
        </Text>
      </div>

      {/* Upload button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => fileRef.current?.click()}
        licon={<Upload size={14} />}
      >
        {t("labels.uploadImage")}
      </Button>
    </div>
  );
}

const getPersonalSchema = (tCommon: any) => z.object({
  name: z.string().min(2, tCommon("validation.minLength", { min: 2 })),
  email: z.string().email(tCommon("validation.email")),
});
type PersonalValues = z.infer<ReturnType<typeof getPersonalSchema>>;

function PersonalInfoForm({
  defaultName,
  defaultEmail,
  isPending,
  onSubmit,
}: {
  defaultName: string;
  defaultEmail: string;
  isPending: boolean;
  onSubmit: (data: PersonalValues) => void;
}) {
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");

  const form = useForm<PersonalValues>({
    resolver: zodResolver(getPersonalSchema(tCommon)),
    defaultValues: { name: defaultName, email: defaultEmail },
  });

  // sync when data loads
  useEffect(() => {
    form.reset({ name: defaultName, email: defaultEmail });
  }, [defaultName, defaultEmail]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField
            control={form.control}
            name="name"
            label={t("labels.fullName")}
            placeholder={t("placeholders.fullName")}
            required
            icon={User}
          />
          <TextField
            control={form.control}
            name="email"
            label={t("labels.email")}
            placeholder={t("placeholders.email")}
            type="email"
            required
            icon={Mail}
          />
        </div>

        <div className="flex gap-3 justify-end mt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => form.reset()}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            type="submit"
            variant="solid"
            loading={isPending}
            licon={<User size={15} />}
          >
            {tCommon("save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// ─── Change Password Form ─────────────────────────────────────────────────────
const getPasswordSchema = (tCommon: any) => z
  .object({
    current_password: z.string().min(1, tCommon("validation.required")),
    password: z
      .string()
      .min(8, tCommon("validation.minLength", { min: 8 }))
      .regex(/[A-Z]/, tCommon("validation.passwordUppercase"))
      .regex(/[a-z]/, tCommon("validation.passwordLowercase"))
      .regex(/[0-9]/, tCommon("validation.passwordNumber"))
      .regex(/[^A-Za-z0-9]/, tCommon("validation.passwordSpecial")),
    password_confirmation: z.string().min(1, tCommon("validation.required")),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: tCommon("validation.passwordsMatch"),
    path: ["password_confirmation"],
  });

type PasswordValues = z.infer<ReturnType<typeof getPasswordSchema>>;

function ChangePasswordForm({
  isPending,
  onSubmit,
}: {
  isPending: boolean;
  onSubmit: (data: PasswordValues) => void;
}) {
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");

  const form = useForm<PasswordValues>({
    resolver: zodResolver(getPasswordSchema(tCommon)),
    defaultValues: {
      current_password: "",
      password: "",
      password_confirmation: "",
    },
  });

  const handleSubmit = (data: PasswordValues) => {
    onSubmit(data);
    form.reset();
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-4"
      >
        <PasswordField
          control={form.control}
          name="current_password"
          label={t("labels.currentPassword")}
          placeholder={t("placeholders.currentPassword")}
          required
          icon={Lock}
        />
        <PasswordField
          control={form.control}
          name="password"
          label={t("labels.newPassword")}
          placeholder={t("placeholders.newPassword")}
          required
          icon={Lock}
        />
        <Text size="sm" color="gray-200" tag="p" className="-mt-2">
          {t("passwordHint")}
        </Text>
        <PasswordField
          control={form.control}
          name="password_confirmation"
          label={t("labels.confirmPassword")}
          placeholder={t("placeholders.confirmPassword")}
          required
          icon={Lock}
        />
        <div className="flex gap-3 justify-end mt-2">
          <Button type="button" variant="ghost" onClick={() => form.reset()}>
            {tCommon("cancel")}
          </Button>
          <Button
            type="submit"
            variant="solid"
            loading={isPending}
            licon={<Lock size={15} />}
          >
            {tCommon("save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// ─── Delete Account Section ───────────────────────────────────────────────────
function DeleteAccountSection({
  isPending,
  onConfirm,
}: {
  isPending: boolean;
  onConfirm: () => void;
}) {
  const t = useTranslations("profile");
  const [checked, setChecked] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {/* Warning banner */}
      <div
        className="flex items-start gap-3 rounded-xl px-4 py-3"
        style={{
          background: "rgba(239,68,68,0.06)",
          border: "1px solid rgba(239,68,68,0.2)",
        }}
      >
        <AlertTriangle
          size={18}
          className="shrink-0 mt-0.5"
          style={{ color: "var(--color-error)" }}
        />
        <div>
          <Text size="sm" weight="bold" tag="p" color="error">
            {t("dangerZone")}
          </Text>
          <Text size="sm" color="gray-200" tag="p" className="mt-0.5">
            {t("deleteWarning")}
          </Text>
        </div>
      </div>

      {/* Confirm checkbox */}
      <label className="flex items-start gap-2.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded accent-[var(--color-primary)]"
        />
        <div>
          <Text size="sm" weight="bold" tag="span">
            {t("confirmDeletion")}
          </Text>
          <Text size="sm" color="gray-200" tag="p">
            {t("deletionUnderstood")}
          </Text>
        </div>
      </label>

      {/* Delete button */}
      <div className="flex justify-end">
        <button
          type="button"
          disabled={!checked || isPending}
          onClick={onConfirm}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
            "disabled:opacity-40 disabled:cursor-not-allowed"
          )}
          style={{
            background: checked
              ? "var(--color-error)"
              : "rgba(239,68,68,0.15)",
            color: checked ? "#fff" : "var(--color-error)",
          }}
        >
          {isPending ? (
            <svg
              className="animate-spin h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          ) : (
            <AlertTriangle size={15} />
          )}
          Delete
        </button>
      </div>
    </div>
  );
}

// ─── Role-specific read-only info ─────────────────────────────────────────────
function RoleInfoPanel({ profile, role }: { profile: any; role: string }) {
  const t = useTranslations("profile");
  if (role === "company") {
    return (
      <div className="flex flex-col">
        <InfoRow label={t("labels.companyDomain")} value={profile?.domain} />
        <InfoRow
          label={t("labels.memberSince")}
          value={
            profile?.created_at
              ? new Date(profile.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : undefined
          }
        />
      </div>
    );
  }

  if (role === "employee") {
    const empName =
      profile?.employee_name ||
      profile?.name ||
      profile?.user?.name;
    const jobTitle = profile?.job_title || profile?.jobTitle;
    const paymentType = profile?.payment_type || profile?.paymentType;
    const salary = profile?.salary || profile?.hourly_rate;
    const currencyCode =
      typeof profile?.currency === "object"
        ? profile?.currency?.code || profile?.currency?.name
        : profile?.currency;
    const companyName =
      typeof profile?.company === "object"
        ? profile?.company?.name
        : profile?.company;

    return (
      <div className="flex flex-col">
        <InfoRow label={t("labels.jobTitle")} value={jobTitle} />
        <InfoRow label={t("labels.company")} value={companyName} />
        <InfoRow label={t("labels.paymentType")} value={paymentType} />
        <InfoRow
          label={t("labels.salary")}
          value={salary ? `${salary} ${currencyCode || ""}` : undefined}
        />
        <InfoRow
          label={t("labels.status")}
          value={profile?.status}
        />
      </div>
    );
  }

  if (role === "client") {
    const companies = profile?.companies ?? [];
    return (
      <div className="flex flex-col">
        <InfoRow
          label={t("labels.creditLimit")}
          value={
            profile?.credit_limit != null
              ? `$${Number(profile.credit_limit).toLocaleString("en-US")}`
              : "No Limit"
          }
        />
        <InfoRow
          label={t("labels.memberSince")}
          value={
            profile?.created_at
              ? new Date(profile.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : undefined
          }
        />
        {companies.length > 0 && (
          <div className="py-3">
            <Text size="sm" color="gray-200" tag="p" className="mb-2">
              Associated Companies
            </Text>
            <div className="flex flex-col gap-2">
              {companies.map((c: any) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between px-3 py-2 rounded-xl"
                  style={{ background: "var(--color-bg)" }}
                >
                  <Text size="sm" tag="span">
                    {c.name}
                  </Text>
                  {c.pivot?.status && (
                    <StatusBadge
                      status={
                        c.pivot.status === "approved"
                          ? "active"
                          : (c.pivot.status as GenericStatus)
                      }
                      label={
                        c.pivot.status.charAt(0).toUpperCase() +
                        c.pivot.status.slice(1)
                      }
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // super_admin
  return (
    <div className="flex flex-col">
      <InfoRow
        label={t("labels.role")}
        value={
          typeof profile?.role === "string"
            ? profile.role
                .replace("_", " ")
                .replace(/\b\w/g, (c: string) => c.toUpperCase())
            : "Super Admin"
        }
      />
      <InfoRow
        label={t("labels.memberSince")}
        value={
          profile?.created_at
            ? new Date(profile.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : undefined
        }
      />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const t = useTranslations("profile");
  const { user } = useAuth();
  const role = user?.role ?? "super_admin";

  const { data: profileData, isLoading } = useProfile();
  const { mutate: updateProfile, isPending: isUpdatingProfile } =
    useUpdateProfile();
  const { mutate: updatePassword, isPending: isUpdatingPassword } =
    useUpdatePassword();
  const { mutate: deleteAccount, isPending: isDeletingAccount } =
    useDeleteAccount();

  // Normalize profile regardless of role
  const profile = profileData as any;

  const displayName =
    profile?.employee_name ||
    profile?.name ||
    profile?.user?.name ||
    user?.name ||
    "";

  const displayEmail =
    profile?.email || profile?.user?.email || user?.email || "";

  const displayImage =
    profile?.image || profile?.logo || profile?.user?.image || null;

  const handleUpdateProfile = (data: { name: string; email: string }) => {
    updateProfile({ name: data.name, email: data.email });
  };

  const handleUpdatePassword = (data: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }) => {
    updatePassword(data);
  };

  return (
    <PageContainer isLoading={isLoading} skeletonVariant="form">
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left column: avatar + role info ── */}
        <div className="flex flex-col gap-6">
          <SectionCard title="" subtitle="">
            <AvatarSection
              name={displayName}
              imageUrl={displayImage}
              role={role}
              onUpload={(file) => {
                // Fire & forget — upload image via FormData
                const fd = new FormData();
                fd.append("image", file);
                // profileApi.updateImage(role as Role, fd);
              }}
            />
          </SectionCard>

          {/* Role-specific details */}
          {role !== "employee" && (
            <SectionCard
              title={
                role === "company"
                  ? t("companyInfo")
                  : t("accountInfo")
              }
            >
              <RoleInfoPanel profile={profile} role={role} />
            </SectionCard>
          )}
        </div>

        {/* ── Right column: forms ── */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Personal Info */}
          <SectionCard
            title={t("profileDetails")}
            subtitle={t("profileDetailsSubtitle")}
          >
            <PersonalInfoForm
              defaultName={displayName}
              defaultEmail={displayEmail}
              isPending={isUpdatingProfile}
              onSubmit={handleUpdateProfile}
            />
          </SectionCard>

          {/* Change Password */}
          <SectionCard
            title={t("changePassword")}
            subtitle={t("changePasswordSubtitle")}
          >
            <ChangePasswordForm
              isPending={isUpdatingPassword}
              onSubmit={handleUpdatePassword}
            />
          </SectionCard>

          {/* Delete Account */}
          <SectionCard
            title={t("deleteAccount")}
            subtitle={t("deleteAccountSubtitle")}
          >
            <DeleteAccountSection
              isPending={isDeletingAccount}
              onConfirm={() => deleteAccount()}
            />
          </SectionCard>
        </div>
      </div>
    </PageContainer>
  );
}