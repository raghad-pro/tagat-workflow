"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/atoms/Button";
import { Text } from "@/components/atoms/Text";
import { TextField, PasswordField } from "@/components/molecules/FormFields";
import { useRegister } from "@/modules/auth/hooks/useRegister";
import toast from "react-hot-toast";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { User, Mail, Building2, Briefcase, Upload, X, Lock } from "@/assets/icons/icons";
import { CheckboxField } from "@/components/atoms/checkboxField";

type AccountType = "company" | "client" | null;

interface FormProps {
  onBack: () => void;
  isPending: boolean;
  onRegister: ReturnType<typeof useRegister>["mutate"];
}

// ─── Step 1: Account Type ──────────────────────────────────────────────────────
function AccountTypeStep({
  selected,
  onSelect,
  onNext,
}: {
  selected: AccountType;
  onSelect: (type: AccountType) => void;
  onNext: () => void;
}) {
  const t = useTranslations("auth");
  const cardBase = "flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 transition-all cursor-pointer";

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => onSelect("client")}
          className={cardBase}
          style={{
            background: selected === "client" ? "var(--color-bg-primary)" : "var(--color-bg-form)",
            borderColor: selected === "client" ? "var(--color-primary)" : "var(--color-border-inputs)",
            color: selected === "client" ? "var(--color-text-button)" : "var(--color-text-primary)",
          }}
        >
          <Briefcase size={28} />
          <div className="text-center">
            <Text size="sm" weight="bold" color={selected === "client" ? "primary" : "primary"}
              className={selected === "client" ? "!text-white" : ""}>
              {t("client")}
            </Text>
            <p className="text-[11px] mt-1 ds-leading-normal"
              style={{ color: selected === "client" ? "rgba(255,255,255,0.8)" : "var(--color-text-gray-200)" }}>
              {t("client_desc")}
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelect("company")}
          className={cardBase}
          style={{
            background: selected === "company" ? "var(--color-bg-primary)" : "var(--color-bg-form)",
            borderColor: selected === "company" ? "var(--color-primary)" : "var(--color-border-inputs)",
            color: selected === "company" ? "var(--color-text-button)" : "var(--color-text-primary)",
          }}
        >
          <Building2 size={28} />
          <div className="text-center">
            <Text size="sm" weight="bold" className={selected === "company" ? "!text-white" : ""}>
              {t("company")}
            </Text>
            <p className="text-[11px] mt-1 ds-leading-normal"
              style={{ color: selected === "company" ? "rgba(255,255,255,0.8)" : "var(--color-text-gray-200)" }}>
              {t("company_desc")}
            </p>
          </div>
        </button>
      </div>

      <Button type="button" variant="solid" disabled={!selected} onClick={onNext} fullWidth>
        {t("next")}
      </Button>
    </div>
  );
}

// ─── Logo Upload ───────────────────────────────────────────────────────────────
function LogoUpload({ preview, error, onChange, onRemove }: {
  preview: string | null;
  error: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}) {
  const t = useTranslations("auth");
  return (
    <div className="flex flex-col gap-2">
      <Text size="sm" weight="bold" tag="p">
        {t("company_logo")}
        <Text tag="span" size="sm" color="gray-200" className="text-[11px] ms-1">
          ({t("optional")})
        </Text>
      </Text>
      <label
        htmlFor="logo"
        className="relative flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 border-dashed cursor-pointer transition-all"
        style={{
          borderColor: preview ? "var(--color-primary)" : "var(--color-border-inputs)",
          background: "var(--color-bg)",
        }}
      >
        {preview ? (
          <>
            <img src={preview} alt="logo preview" className="w-16 h-16 rounded-full object-cover"
              style={{ outline: "2px solid var(--color-primary)" }} />
            <Text size="sm" color="gray-200">{t("change_logo")}</Text>
          </>
        ) : (
          <>
            <Upload size={22} style={{ color: "var(--color-text-gray-200)" }} />
            <Text size="sm" color="gray-200">{t("upload_logo")}</Text>
            <Text size="sm" color="gray-200" className="text-[11px]">PNG, JPG, WebP — max 2MB</Text>
          </>
        )}
        <input id="logo" type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onChange} />
      </label>
      {preview && (
        <button type="button" onClick={onRemove}
          className="flex items-center gap-1 ds-text-sm hover:underline self-start"
          style={{ color: "var(--color-error)" }}>
          <X size={13} />{t("remove_logo")}
        </button>
      )}
      {error && <Text size="sm" color="error">{error}</Text>}
    </div>
  );
}

// ─── Step 2: Company Form ──────────────────────────────────────────────────────
function CompanyForm({ onBack, isPending, onRegister }: FormProps) {
  const t = useTranslations("auth");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const companySchema = z.object({
    companyName: z.string().min(2, t("company_name_required")),
    email: z.string().min(1, t("email_required")).email(t("email_invalid")),
    password: z.string().min(8, t("password_too_short"))
      .regex(/[A-Z]/, t("password_uppercase"))
      .regex(/[a-z]/, t("password_lowercase"))
      .regex(/[0-9]/, t("password_number"))
      .regex(/[^A-Za-z0-9]/, t("password_special")),
    password_confirmation: z.string().min(1, t("password_confirm_required")),
  }).refine((d) => d.password === d.password_confirmation, {
    message: t("passwords_dont_match"),
    path: ["password_confirmation"],
  });

  type CompanyFormValues = z.infer<typeof companySchema>;

  const getInitialValues = (): CompanyFormValues => ({
    companyName: "", email: "", password: "", password_confirmation: "",
  });

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    mode: "onTouched",
    defaultValues: getInitialValues(),
  });

  // ── Draft save ──
  const companyName = form.watch("companyName");
  const email = form.watch("email");
  useEffect(() => {
    if (typeof window !== "undefined" && (email || companyName)) {
      localStorage.setItem("company_form_draft", JSON.stringify({ companyName, email }));
    }
  }, [companyName, email]);

  // ── Load draft ──
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("company_form_draft");
      if (saved) {
        try {
          const draft = JSON.parse(saved);
          if (draft.companyName) form.setValue("companyName", draft.companyName);
          if (draft.email) form.setValue("email", draft.email);
        } catch {}
      }
    }
  }, []);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setLogoError(t("logo_too_large")); return; }
    setLogoError("");
    setLogoPreview(URL.createObjectURL(file));
  };

  const onSubmit = (data: CompanyFormValues) => {
    onRegister(
      {
        name: data.companyName,
        email: data.email,
        password: data.password,
        password_confirmation: data.password_confirmation,
        account_type: "company",        
        company_name: data.companyName,  
      },
      {
        onSuccess: () => { localStorage.removeItem("company_form_draft"); },
        onError: () => { toast.error(t("registerError")); },
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <TextField control={form.control} name="companyName" label={t("company_name")} placeholder={t("company_name_placeholder")} required icon={Building2} />
        <TextField control={form.control} name="email" label={t("email")} placeholder={t("email_placeholder")} type="email" required icon={Mail} />
        <PasswordField control={form.control} name="password" label={t("password_new")} placeholder={t("password_new_placeholder")} required icon={Lock} />
        <PasswordField control={form.control} name="password_confirmation" label={t("password_confirm")} placeholder={t("password_confirm_placeholder")} required />
        <LogoUpload
          preview={logoPreview}
          error={logoError}
          onChange={handleLogoChange}
          onRemove={() => { setLogoPreview(null); setLogoError(""); }}
        />
        <CheckboxField checked={agreeToTerms} onCheckedChange={(checked) => setAgreeToTerms(!!checked)}>
          I agree to the{" "}
          <Link href="/terms" className="ds-text-primary hover:underline">Terms</Link>{" "}
          and{" "}
          <Link href="/conditions" className="ds-text-primary hover:underline">Conditions</Link>
        </CheckboxField>
        <div className="flex flex-col gap-3 mt-2">
          <Button type="button" variant="outline" onClick={onBack} fullWidth>{t("back")}</Button>
          <Button type="submit" variant="solid" loading={isPending} fullWidth disabled={!agreeToTerms}>{t("create_account")}</Button>
        </div>
      </form>
    </Form>
  );
}

// ─── Step 2: Client Form ───────────────────────────────────────────────────────
function ClientForm({ onBack, isPending, onRegister }: FormProps) {
  const t = useTranslations("auth");
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const clientSchema = z.object({
    fullName: z.string().min(3, t("full_name_required")),
    email: z.string().min(1, t("email_required")).email(t("email_invalid")),
    password: z.string().min(8, t("password_too_short"))
      .regex(/[A-Z]/, t("password_uppercase"))
      .regex(/[a-z]/, t("password_lowercase"))
      .regex(/[0-9]/, t("password_number"))
      .regex(/[^A-Za-z0-9]/, t("password_special")),
    password_confirmation: z.string().min(1, t("password_confirm_required")),
  }).refine((d) => d.password === d.password_confirmation, {
    message: t("passwords_dont_match"),
    path: ["password_confirmation"],
  });

  type ClientFormValues = z.infer<typeof clientSchema>;

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    mode: "onTouched",
    defaultValues: { fullName: "", email: "", password: "", password_confirmation: "" },
  });

  // ── Draft save ──
  const fullName = form.watch("fullName");
  const email = form.watch("email");
  useEffect(() => {
    if (typeof window !== "undefined" && (fullName || email)) {
      localStorage.setItem("client_form_draft", JSON.stringify({ fullName, email }));
    }
  }, [fullName, email]);

  // ── Load draft ──
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("client_form_draft");
      if (saved) {
        try {
          const draft = JSON.parse(saved);
          if (draft.fullName) form.setValue("fullName", draft.fullName);
          if (draft.email) form.setValue("email", draft.email);
        } catch {}
      }
    }
  }, []);

  const onSubmit = (data: ClientFormValues) => {
    onRegister(
      {
        name: data.fullName,
        email: data.email,
        password: data.password,
        password_confirmation: data.password_confirmation,
        account_type: "client",
      },
      {
        onSuccess: () => { localStorage.removeItem("client_form_draft"); },
        onError: () => { toast.error(t("registerError")); },
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <TextField control={form.control} name="fullName" label={t("full_name")} placeholder={t("full_name_placeholder")} required icon={User} />
        <TextField control={form.control} name="email" label={t("email")} placeholder={t("email_placeholder")} type="email" required icon={Mail} />
        <PasswordField control={form.control} name="password" label={t("password_new")} placeholder={t("password_new_placeholder")} required icon={Lock} />
        <PasswordField control={form.control} name="password_confirmation" label={t("password_confirm")} placeholder={t("password_confirm_placeholder")} required icon={Lock} />
        <CheckboxField checked={agreeToTerms} onCheckedChange={(checked) => setAgreeToTerms(!!checked)}>
          I agree to the{" "}
          <Link href="/terms" className="ds-text-brand hover:underline">Terms</Link>{" "}
          and{" "}
          <Link href="/conditions" className="ds-text-brand hover:underline">Conditions</Link>
        </CheckboxField>
        <div className="flex flex-col gap-3 mt-2">
          <Button type="button" variant="outline" onClick={onBack} fullWidth>{t("back")}</Button>
          <Button type="submit" variant="solid" loading={isPending} fullWidth disabled={!agreeToTerms}>{t("create_account")}</Button>
        </div>
      </form>
    </Form>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const { mutate: register, isPending } = useRegister();
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawStep = Number(searchParams.get("step"));
  const rawType = searchParams.get("type");
  const step = rawStep === 1 || rawStep === 2 ? rawStep : 1;
  const accountType: AccountType = rawType === "company" || rawType === "client" ? rawType : null;

  useEffect(() => {
    if (step === 2 && !accountType) router.replace("?step=1");
  }, [step, accountType, router]);

  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <main className="ds-bg flex  justify-center overflow-y-auto  w-full max-w-lg mx-auto min-h-screen ">
      <div className="w-full  rounded-2xl ds-bg-form ds-border-form px-10 py-12"
        style={{ boxShadow: "var(--shadow-sm)" }} dir={dir}>

        {step === 1 ? (
          <Text size="xl" weight="bold" tag="h1" className="text-center mb-6">
            {t("account_type")}
          </Text>
        ) : (
          <>
            <Text size="xl" weight="bold" tag="h1" className="text-center mb-1">
              {t("register")}{" "}
              <span className="ds-text-brand">{t("account")}</span>
            </Text>
            {/* <Text size="base" color="gray-200" className="text-center mb-6"></Text> */}
          </>
        )}

        {step === 1 && (
          <AccountTypeStep
            selected={accountType}
            onSelect={(type) => router.push(`?step=1&type=${type}`)}
            onNext={() => router.push(`?step=2&type=${accountType}`)}
          />
        )}
        {step === 2 && accountType === "company" && (
          <CompanyForm onBack={() => router.push("?step=1&type=company")} isPending={isPending} onRegister={register} />
        )}
        {step === 2 && accountType === "client" && (
          <ClientForm onBack={() => router.push("?step=1&type=client")} isPending={isPending} onRegister={register} />
        )}

        <Text size="sm" color="gray-200" className="text-center mt-6">
          {t("login_text")}{" "}
          <Link href="/login">
            <Text size="sm" color="brand" weight="bold" tag="span" className="hover:underline">
              {t("login")}
            </Text>
          </Link>
        </Text>
      </div>
    </main>
  );
}