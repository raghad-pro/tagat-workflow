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
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { User, Briefcase, Building2, Mail, Lock, Upload, X, Globe, ArrowLeft, Plus } from "lucide-react";
import { CheckboxField } from "@/components/atoms/checkboxField";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useVerifyEmailOtp } from "@/modules/auth/hooks/useVerifyEmailOtp";
import { useResendVerificationCode } from "@/modules/auth/hooks/useResendVerificationCode";
import { cn } from "@/lib/utils";


type AccountType = "company" | "client" | null;

interface FormProps {
  onBack: () => void;
  isPending: boolean;
  onRegister: ReturnType<typeof useRegister>["mutate"];
  onSuccessRegister: (email: string) => void;
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
  const cardBase = "flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] active:scale-95";

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => onSelect("client")}
          className={cn(
            cardBase,
            selected === "client"
              ? "shadow-[0_8px_30px_rgba(37,198,218,0.3)] bg-[var(--color-btn-brand)] border-[var(--color-btn-brand)] text-white"
              : "hover:border-gray-300 bg-white dark:bg-[#1a1c23] border-gray-200 dark:border-gray-700 text-black dark:text-white"
          )}
        >
          <div className={`transition-transform duration-300 ${selected === "client" ? "scale-110" : "scale-100"}`}>
            <User size={30} strokeWidth={1.5} />
          </div>
          <div className="text-center mt-1">
            <Text size="base" weight="bold" className={selected === "client" ? "!text-white" : "!text-black dark:!text-white"}>
              {t("client")}
            </Text>
            <p className="text-[10px] mt-2 leading-snug"
              style={{ color: selected === "client" ? "rgba(255,255,255,0.9)" : "#6b7280" }}>
              {t("client_desc")}
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelect("company")}
          className={cn(
            cardBase,
            selected === "company"
              ? "shadow-[0_8px_30px_rgba(37,198,218,0.3)] bg-[var(--color-btn-brand)] border-[var(--color-btn-brand)] text-white"
              : "hover:border-gray-300 bg-white dark:bg-[#1a1c23] border-gray-200 dark:border-gray-700 text-black dark:text-white"
          )}
        >
          <div className={`transition-transform duration-300 ${selected === "company" ? "scale-110" : "scale-100"}`}>
            <Briefcase size={30} strokeWidth={1.5} />
          </div>
          <div className="text-center mt-1">
            <Text size="base" weight="bold" className={selected === "company" ? "!text-white" : "!text-black dark:!text-white"}>
              {t("company")}
            </Text>
            <p className="text-[10px] mt-2 leading-snug"
              style={{ color: selected === "company" ? "rgba(255,255,255,0.9)" : "#6b7280" }}>
              {t("company_desc")}
            </p>
          </div>
        </button>
      </div>

      <div className="mt-1 flex justify-center">
        <div className="w-full">
          <Button 
            type="button" 
            variant="solid" 
            disabled={!selected} 
            onClick={onNext} 
            fullWidth 
            className="!rounded-xl !py-3 sm:!py-3.5 !text-[15px]"
          >
            {t("next")}
          </Button>
        </div>
      </div>
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
    <div className="flex flex-col gap-1.5">
      <Text size="sm" weight="bold" tag="p">
        {t("company_logo")} <span className="ds-text-sub font-normal text-[12px]">({t("optional")})</span>
      </Text>
      <label
        htmlFor="logo"
        className="relative flex flex-row items-center justify-center gap-3 p-3 rounded-xl border-2 border-dashed cursor-pointer transition-all"
        style={{
          borderColor: preview ? "var(--color-primary)" : "var(--color-border-inputs)",
          background: "var(--color-bg)",
        }}
      >
        {preview ? (
          <div className="relative w-full h-16 rounded-lg overflow-hidden group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Logo preview" className="w-full h-full object-contain" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
              <Text size="sm" weight="bold" className="text-white">{t("change_logo")}</Text>
            </div>
          </div>
        ) : (
          <div className="flex flex-row items-center gap-3">
            <div className="p-2 bg-[var(--color-bg-primary-100)] rounded-full text-[var(--color-primary)]">
              <Upload size={18} />
            </div>
            <div className="text-start">
              <Text size="sm" weight="bold" className="mb-0.5 text-gray-900 dark:text-gray-100">{t("upload_logo")}</Text>
              <Text size="sm" className="text-xs text-gray-500">PNG, JPG, WebP — max 2MB</Text>
            </div>
          </div>
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
function CompanyForm({ onBack, isPending, onRegister, onSuccessRegister }: FormProps) {
  const t = useTranslations("auth");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoError, setLogoError] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const companySchema = z.object({
    companyName: z.string().min(2, t("company_name_required")),
    domain: z.string().min(2, "Domain is required").regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers and hyphens"),
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
    companyName: "", domain: "", email: "", password: "", password_confirmation: "",
  });

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    mode: "onSubmit",
    defaultValues: getInitialValues(),
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setLogoError(t("logo_too_large")); return; }
    setLogoError("");
    setLogoPreview(URL.createObjectURL(file));
    setLogoFile(file);
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
        domain: data.domain,
        logo: logoFile,
      },
      {
        onSuccess: () => { onSuccessRegister(data.email); },
        onError: (error: any) => { 
          const data = error?.response?.data;
          if (data?.errors) {
            Object.keys(data.errors).forEach((key) => {
              if (key === "logo") {
                setLogoError(data.errors[key][0]);
                return;
              }
              let formKey = key;
              if (key === "name" || key === "company_name") {
                formKey = "companyName";
              }
              form.setError(formKey as keyof CompanyFormValues, { type: "server", message: data.errors[key][0] });
            });
          }
        },
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-2">
        <TextField control={form.control} name="companyName" label={t("company_name")} placeholder={t("company_name_placeholder")} required icon={Building2} />
        <TextField control={form.control} name="domain" label="Domain / Subdomain" placeholder="example-company" required icon={Globe} />
        <TextField control={form.control} name="email" label={t("email")} placeholder={t("email_placeholder")} type="email" required icon={Mail} />
        <PasswordField control={form.control} name="password" label={t("password_new")} placeholder={t("password_new_placeholder")} required icon={Lock} />
        <PasswordField control={form.control} name="password_confirmation" label={t("password_confirm")} placeholder={t("password_confirm_placeholder")} required icon={Lock} />
        <LogoUpload
          preview={logoPreview}
          error={logoError}
          onChange={handleLogoChange}
          onRemove={() => { setLogoPreview(null); setLogoError(""); setLogoFile(null); }}
        />
        <CheckboxField checked={agreeToTerms} onCheckedChange={(checked) => setAgreeToTerms(!!checked)}>
          I agree to the{" "}
          <Link href="/terms" className="ds-text-primary hover:underline">Terms</Link>{" "}
          and{" "}
          <Link href="/conditions" className="ds-text-primary hover:underline">Conditions</Link>
        </CheckboxField>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <Button 
            type="button" 
            variant="ghost"
            fullWidth
            onClick={onBack} 
            className="!rounded-xl h-11 font-bold text-[13px] sm:text-sm cursor-pointer border-none px-1 sm:px-3 text-center"
          >
            {t("back")}
          </Button>
          <Button 
            type="submit" 
            variant="solid"
            fullWidth
            disabled={!agreeToTerms || isPending} 
            className="!rounded-xl h-11 text-[12px] sm:text-sm font-bold cursor-pointer px-1 sm:px-3 text-center"
          >
            {isPending ? t("loading") : t("create_account")}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// ─── Step 2: Client Form ───────────────────────────────────────────────────────
function ClientForm({ onBack, isPending, onRegister, onSuccessRegister }: FormProps) {
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
    mode: "onSubmit",
    defaultValues: { fullName: "", email: "", password: "", password_confirmation: "" },
  });

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
        onSuccess: () => { onSuccessRegister(data.email); },
        onError: (error: any) => { 
          const data = error?.response?.data;
          if (data?.errors) {
            Object.keys(data.errors).forEach((key) => {
              let formKey = key;
              if (key === "name" || key === "full_name") {
                formKey = "fullName";
              }
              form.setError(formKey as keyof ClientFormValues, { type: "server", message: data.errors[key][0] });
            });
          }
        },
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3">
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
        <div className="grid grid-cols-2 gap-3 mt-4">
          <Button 
            type="button" 
            variant="ghost"
            fullWidth
            onClick={onBack} 
            className="!rounded-xl h-11 font-bold text-[13px] sm:text-sm cursor-pointer border-none px-1 sm:px-3 text-center"
          >
            {t("back")}
          </Button>
          <Button 
            type="submit" 
            variant="solid"
            fullWidth
            disabled={!agreeToTerms || isPending} 
            className="!rounded-xl h-11 text-[12px] sm:text-sm font-bold cursor-pointer px-1 sm:px-3 text-center"
          >
            {isPending ? t("loading") : t("create_account")}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

function OtpStep({ email, onSuccess }: { email: string; onSuccess: () => void }) {
  const t = useTranslations("auth");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<"invalid" | "required" | "">("");
  const { mutate: verifyOtp, isPending } = useVerifyEmailOtp();

  const handleVerify = () => {
    if (otp.length < 6) {
      setOtpError("required");
      return;
    }
    setOtpError("");
    verifyOtp(
      { email, otp },
      {
        onSuccess: () => {
          toast.success("Account verified successfully!");
          onSuccess();
        },
        onError: () => setOtpError("invalid"),
      }
    );
  };

  const errorMessage = otpError === "invalid" ? t("otp_invalid") : otpError === "required" ? t("otp_required") : "";
  const isInvalid = otpError === "invalid";

  return (
    <>
      <div className="text-center mb-6">
        <Text size="xl" weight="bold" tag="h1" className="mb-2 dark:text-white">{t("fp_title_step2") || "Verify Account"}</Text>
        <Text size="sm" color="gray-200" className="leading-relaxed">
          {t("fp_otp_desc") || "Please enter the OTP sent to"} <span className="ds-text-brand font-semibold">{email}</span>
        </Text>
      </div>

      <div className="flex flex-col items-center gap-3 mb-6">
        <InputOTP maxLength={6} value={otp} onChange={(val) => { setOtp(val); if (otpError) setOtpError(""); }}>
          <InputOTPGroup className="gap-3 rtl:flex-row-reverse">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <InputOTPSlot key={i} index={i} className={[
                  "w-12 h-12 rounded-xl border-0 text-lg font-bold ds-text-primary transition-all duration-200 bg-gray-50 dark:bg-[#1a1c23] dark:border dark:border-gray-800",
                  isInvalid ? "ds-text-error border-red-500" : "",
                ].join(" ")}
                style={{
                  boxShadow: isInvalid ? "0 2px 8px rgba(239,68,68,0.18)" : "0 2px 8px rgba(0,0,0,0.08)",
                }}
              />
            ))}
          </InputOTPGroup>
        </InputOTP>
        {errorMessage && <Text size="sm" color="error" className="text-center">{errorMessage}</Text>}
      </div>

      <Button type="button" variant="solid" fullWidth loading={isPending} disabled={otp.length < 6} onClick={handleVerify} className="mb-4">
        {t("fp_verify_otp") || "Verify"}
      </Button>
    </>
  );
}

export default function RegisterPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const { mutate: register, isPending } = useRegister();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [registeredEmail, setRegisteredEmail] = useState("");

  const rawStep = Number(searchParams.get("step"));
  const rawType = searchParams.get("type");
  const step = rawStep === 1 || rawStep === 2 || rawStep === 3 ? rawStep : 1;
  const accountType: AccountType = rawType === "company" || rawType === "client" ? rawType : null;

  useEffect(() => {
    if (step === 2 && !accountType) router.replace("?step=1");
  }, [step, accountType, router]); 

  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <main className="flex justify-center w-full mx-auto px-4">
      <div className="w-full max-w-[420px] bg-white dark:bg-[#1a1c23]/40 dark:backdrop-blur-xl dark:border dark:border-white/10 rounded-3xl px-4 sm:px-6 py-4 sm:py-6"
        style={{ boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08)" }} dir={dir}>

        {step === 1 ? (
          <h1 className="text-left text-[18px] sm:text-[20px] font-bold text-black dark:text-white mb-4 sm:mb-6 px-1">
            {t("account_type") || "Account Type"}
          </h1>
        ) : (
          <>
            <Text size="xl" weight="bold" tag="h1" className="text-center mb-1">
              {t("register")}{" "}
              <span style={{ color: "var(--color-primary)" }}>{t("account")}</span>
            </Text>
          </>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: dir === 'rtl' ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir === 'rtl' ? 20 : -20 }} transition={{ duration: 0.2, ease: "easeOut" }}>
              <AccountTypeStep
                selected={accountType}
                onSelect={(type) => router.push(`?step=1&type=${type}`)}
                onNext={() => router.push(`?step=2&type=${accountType}`)}
              />
            </motion.div>
          )}
          {step === 2 && accountType === "company" && (
            <motion.div key="step2-company" initial={{ opacity: 0, x: dir === 'rtl' ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir === 'rtl' ? 20 : -20 }} transition={{ duration: 0.2, ease: "easeOut" }}>
              <CompanyForm onBack={() => router.push("?step=1&type=company")} isPending={isPending} onRegister={register} onSuccessRegister={(em) => { setRegisteredEmail(em); router.replace("/verify?email=" + encodeURIComponent(em)); }} />
            </motion.div>
          )}
          {step === 2 && accountType === "client" && (
            <motion.div key="step2-client" initial={{ opacity: 0, x: dir === 'rtl' ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir === 'rtl' ? 20 : -20 }} transition={{ duration: 0.2, ease: "easeOut" }}>
              <ClientForm onBack={() => router.push("?step=1&type=client")} isPending={isPending} onRegister={register} onSuccessRegister={(em) => { setRegisteredEmail(em); router.replace("/verify?email=" + encodeURIComponent(em)); }} />
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: dir === 'rtl' ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir === 'rtl' ? 20 : -20 }} transition={{ duration: 0.2, ease: "easeOut" }}>
              <OtpStep email={registeredEmail} onSuccess={() => router.replace("/login")} />
            </motion.div>
          )}
        </AnimatePresence>


        {step !== 3 && (
          <Text size="sm" className="text-center mt-6 text-[11px]" style={{ color: "#6b7280" }}>
            {t("login_text") || "Already not have an account?"}{" "}
            <Link href="/login">
              <Text size="sm" weight="bold" tag="span" className="hover:underline" style={{ color: "var(--color-primary)" }}>
                {t("login") || "login"}
              </Text>
            </Link>
          </Text>
        )}
      </div>
    </main>
  );
}
