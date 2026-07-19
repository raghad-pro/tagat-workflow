"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock } from "@/assets/icons/icons";
import { useTranslations, useLocale } from "next-intl";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/atoms/Button";
import { Text } from "@/components/atoms/Text";
import { TextField, PasswordField } from "@/components/molecules/FormFields";
import { useForgotPassword } from "@/modules/auth/hooks/useForgotPassword";
import { useResetPassword } from "@/modules/auth/hooks/useResetPassword";
import { useVerifyOtpForgotPassword } from "@/modules/auth/hooks/useVerifyOtpForgotPassword";
import toast from "react-hot-toast";

// ─── Step 1: Email ────────────────────────────────────────────────────────────
function EmailStep({ onSuccess }: { onSuccess: (email: string) => void }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const { mutate: forgotPassword, isPending } = useForgotPassword();

  const schema = z.object({
    email: z.string().min(1, t("email_required")).email(t("email_invalid")),
  });
  type FormValues = z.infer<typeof schema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    defaultValues: { email: "" },
  });

  const onSubmit = (data: FormValues) => {
    forgotPassword(
      { email: data.email },
      { onSuccess: () => onSuccess(data.email) }
    );
  };

  return (
    <>
      <div className="text-center mb-6">
        <Text size="xl" weight="bold" tag="h1" className="mb-2">
          {t("fp_title_step1")}
        </Text>
        <Text size="sm" color="gray-200" className="leading-relaxed">
          {t("fp_email_desc")}
        </Text>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <TextField
            control={form.control}
            name="email"
            label={t("email")}
            placeholder={t("email_placeholder")}
            type="email"
            required
            icon={Mail}
          />

          <Button type="submit" variant="solid" fullWidth loading={isPending}>
            {t("fp_send_otp")}
          </Button>

          <button
            type="button"
            onClick={() => router.push("/login")}
            className="cursor-pointer text-center ds-text-sm ds-text-gray-200 hover:text-[var(--color-primary)] transition-colors"
          >
            {t("back_to_login")}
          </button>
        </form>
      </Form>
    </>
  );
}

// ─── Step 2: OTP (Verify) ───────────────────────────────────────────────────
function OtpStep({
  email,
  onSuccess,
}: {
  email: string;
  onSuccess: (otp: string) => void;
}) {
  const t = useTranslations("auth");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const { mutate: resendCode, isPending: isResending } = useForgotPassword();
  const { mutate: verifyOtp, isPending } = useVerifyOtpForgotPassword();

  const handleVerify = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (otp.length < 6) {
      setOtpError(t("otp_required"));
      return;
    }
    setOtpError("");

    verifyOtp(
      { email, otp },
      {
        onSuccess: () => {
          onSuccess(otp);
        },
        onError: (error: any) => {
          const errStr = JSON.stringify(error?.response?.data || {}).toLowerCase();
          if (
            errStr.includes("otp") ||
            errStr.includes("token") ||
            errStr.includes("code") ||
            errStr.includes("expired") ||
            errStr.includes("رمز") ||
            errStr.includes("منتهي")
          ) {
            setOtpError(t("otp_invalid"));
          } else {
            setOtpError(t("generic_error"));
          }
        },
      }
    );
  };

  const handleResend = () => {
    setOtp("");
    setOtpError("");
    resendCode(
      { email },
      {
        onSuccess: () => {
          toast.success(t("fp_resend_success"), { id: "otp-resend" });
        },
        onError: () => {
          toast.error(t("generic_error"), { id: "otp-resend" });
        },
      }
    );
  };

  const isOtpInvalid = !!otpError;

  return (
    <>
      <div className="text-center mb-6">
        <Text size="xl" weight="bold" tag="h1" className="mb-2">
          {t("fp_title_step2")}
        </Text>
        <Text size="sm" color="gray-200" className="leading-relaxed">
          {t("fp_otp_desc")}{" "}
          <span className="ds-text-brand font-semibold">{email}</span>
        </Text>
      </div>

      <form onSubmit={handleVerify} className="flex flex-col gap-5">
        <div className="flex flex-col items-center gap-3">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={(val) => {
              setOtp(val);
              if (otpError) setOtpError("");
            }}
          >
            <InputOTPGroup className="gap-3 rtl:flex-row-reverse">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <InputOTPSlot
                  key={i}
                  index={i}
                  className={[
                    "w-12 h-12 rounded-xl border-0 text-lg font-bold ds-text-primary transition-all duration-300",
                    isOtpInvalid 
                      ? "ds-text-error shadow-[0_2px_8px_rgba(239,68,68,0.18)]" 
                      : "shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_var(--color-primary)] hover:-translate-y-0.5",
                  ].join(" ")}
                  style={{
                    background: isOtpInvalid
                      ? "rgba(239,68,68,0.06)"
                      : "var(--color-bg-form)",
                  }}
                />
              ))}
            </InputOTPGroup>
          </InputOTP>

          {otpError && (
            <Text size="sm" color="error" className="text-center mt-2">
              {otpError}
            </Text>
          )}

          <Text size="sm" color="gray-200" className="text-center mt-2">
            {t("fp_no_otp")}{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="ds-text-brand font-semibold hover:underline disabled:opacity-50"
            >
              {isResending ? t("fp_resending") : t("fp_resend")}
            </button>
          </Text>
        </div>

        <Button
          type="submit"
          variant="solid"
          fullWidth
          loading={isPending}
          className="mt-4"
        >
          {t("fp_verify_otp")}
        </Button>
      </form>
    </>
  );
}

// ─── Step 3: New Password ───────────────────────────────────────────────────
function ResetStep({
  otp,
  onSuccess,
}: {
  otp: string;
  onSuccess: () => void;
}) {
  const t = useTranslations("auth");
  const { mutate: resetPassword, isPending } = useResetPassword();

  const schema = z
    .object({
      password: z
        .string()
        .min(8, t("password_too_short"))
        .regex(/[A-Z]/, t("password_uppercase"))
        .regex(/[a-z]/, t("password_lowercase"))
        .regex(/[0-9]/, t("password_number"))
        .regex(/[^A-Za-z0-9]/, t("password_special")),
      password_confirmation: z.string().min(1, t("password_confirm_required")),
    })
    .refine((d) => d.password === d.password_confirmation, {
      message: t("passwords_dont_match"),
      path: ["password_confirmation"],
    });

  type FormValues = z.infer<typeof schema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    defaultValues: { password: "", password_confirmation: "" },
  });

  const onSubmit = (data: FormValues) => {
    resetPassword(
      {
        otp,
        password: data.password,
        password_confirmation: data.password_confirmation,
      },
      {
        onSuccess,
        onError: () => {
          toast.error(t("generic_error"));
        },
      }
    );
  };

  return (
    <>
      <div className="text-center mb-6">
        <Text size="xl" weight="bold" tag="h1" className="mb-2">
          {t("fp_title_step3")}
        </Text>
        <Text size="sm" color="gray-200" className="leading-relaxed">
          {t("fp_new_password_desc")}
        </Text>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <PasswordField
            control={form.control}
            name="password"
            label={t("password_new")}
            placeholder={t("password_new_placeholder")}
            required
            icon={Lock}
          />
          <PasswordField
            control={form.control}
            name="password_confirmation"
            label={t("password_confirm")}
            placeholder={t("password_confirm_placeholder")}
            required
            icon={Lock}
          />

          <Button
            type="submit"
            variant="solid"
            fullWidth
            loading={isPending}
            className="mt-2"
          >
            {t("fp_reset_password")}
          </Button>
        </form>
      </Form>
    </>
  );
}

// ─── Step 4: Success ──────────────────────────────────────────────────────────
function SuccessStep() {
  const t = useTranslations("auth");
  const router = useRouter();

  return (
    <div className="flex flex-col items-center gap-6 text-center py-4">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{ background: "var(--color-primary-200, #e9f9fb)" }}
      >
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 18L14 25L29 11" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="flex flex-col gap-2">
        <Text size="xl" weight="bold" tag="h1">
          {t("password_reset_success_title")}
        </Text>
        <Text size="sm" color="gray-200" className="leading-relaxed">
          {t("password_reset_success_desc")}
        </Text>
      </div>

      <Button type="button" variant="solid" fullWidth onClick={() => router.push("/login")}>
        {t("login")}
      </Button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ForgotPasswordPage() {
  const locale = useLocale();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <main className="ds-bg flex justify-center overflow-y-auto w-full max-w-lg mx-auto rounded-2xl" dir={dir}>
      <div className="w-full rounded-2xl bg-white dark:bg-[#1a1c23]/40 dark:backdrop-blur-xl border border-gray-100 dark:border-white/10 px-10 py-12 ds-shadow-sm">

        {step === 1 && (
          <EmailStep
            onSuccess={(em) => {
              setEmail(em);
              setStep(2);
            }}
          />
        )}

        {step === 2 && (
          <OtpStep
            email={email}
            onSuccess={(code) => {
              setOtp(code);
              setStep(3);
            }}
          />
        )}

        {step === 3 && (
          <ResetStep
            otp={otp}
            onSuccess={() => setStep(4)}
          />
        )}

        {step === 4 && <SuccessStep />}

      </div>
    </main>
  );
}
