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
import { useForgotPassword } from "@/modules/auth/hooks/useForgotpassword";
import { useVerifyOtp } from "@/modules/auth/hooks/useVerifyotp";
import { useResetPassword } from "@/modules/auth/hooks/useResetpassword";
import toast from "react-hot-toast";

// ─── Types ────────────────────────────────────────────────────────────────────
type Step = 1 | 2 | 3 | 4; // 4 = success screen

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
    mode: "onTouched",
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
      {/* Heading */}
      <div className="text-center mb-6">
        <Text size="xl" weight="bold" tag="h1" className="mb-2">
          {t("fp_title_step1")}
        </Text>
        <Text size="sm" color="gray-200" className="leading-relaxed">
          {t("fp_email_desc")}
        </Text>
      </div>

      {/* Form */}
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

          {/* Back to login */}
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="text-center ds-text-sm ds-text-gray-200 hover:ds-text-brand transition-colors"
          >
            {t("back_to_login")}
          </button>
        </form>
      </Form>
    </>
  );
}

// ─── Step 2: OTP ──────────────────────────────────────────────────────────────
function OtpStep({
  email,
  onSuccess,
}: {
  email: string;
  onSuccess: (resetToken: string) => void;
}) {
  const t = useTranslations("auth");
  const [otp, setOtp] = useState("");

  // ── حالتان للـ error:
  // "invalid"  → الرمز غلط (من الـ API) → مربعات حمراء + نص تحتها
  // ""         → لا خطأ
  const [otpError, setOtpError] = useState<"invalid" | "required" | "">("");

  const { mutate: verifyOtp, isPending } = useVerifyOtp();
  const { mutate: forgotPassword, isPending: isResending } = useForgotPassword();

  // ── التحقق من الرمز ────────────────────────────────────────────────────────
  const handleVerify = () => {
    // validation محلي: الحقل فاضي
    if (otp.length < 4) {
      setOtpError("required");
      return;
    }

    setOtpError("");

    verifyOtp(
      { email, otp },
      {
        // ✅ نجح → نروح للـ step التالي
        onSuccess: (data) => onSuccess(data.data.reset_token),

        // ❌ فشل من الـ API → نحمّر المربعات ونكتب الخطأ تحتها
        //    (الـ hook ما بيطلع toast في هاد الحالة لأنا عم نتعامل معها هنا)
        onError: () => {
          setOtpError("invalid");
        },
      }
    );
  };

  // ── إعادة إرسال الرمز ─────────────────────────────────────────────────────
  const handleResend = () => {
    setOtp("");
    setOtpError("");

    forgotPassword(
      { email },
      {
        // ✅ أُعيد الإرسال بنجاح → toast.success
        onSuccess: () => {
          toast.success(t("fp_resend_success"), { id: "otp-resend" });
        },
        // ❌ فشل → الـ hook بيطلع toast.error بنفسه (موجود بالفعل)
      }
    );
  };

  // ── رسالة الخطأ النصية حسب النوع ─────────────────────────────────────────
  const errorMessage =
    otpError === "invalid"
      ? t("otp_invalid")
      : otpError === "required"
      ? t("otp_required")
      : "";

  // ── هل المربعات حمراء؟ (فقط لما الرمز غلط من الـ API) ──────────────────
  const isInvalid = otpError === "invalid";

  return (
    <>
      {/* Heading */}
      <div className="text-center mb-6">
        <Text size="xl" weight="bold" tag="h1" className="mb-2">
          {t("fp_title_step2")}
        </Text>
        <Text size="sm" color="gray-200" className="leading-relaxed">
          {t("fp_otp_desc")}{" "}
          <span className="ds-text-brand font-semibold">{email}</span>
        </Text>
      </div>

      {/* OTP Slots */}
      <div className="flex flex-col items-center gap-3 mb-6">
        <InputOTP
          maxLength={4}
          value={otp}
          onChange={(val) => {
            setOtp(val);
            // ← لما المستخدم يبدأ يكتب، يختفي الـ error فوراً
            if (otpError) setOtpError("");
          }}
        >
          <InputOTPGroup className="gap-3 rtl:flex-row-reverse  ">
            {[0, 1, 2, 3].map((i) => (
              <InputOTPSlot
                key={i}
                index={i}
                className={[
                  "w-12 h-12 rounded-xl border-0 text-lg font-bold ds-text-primary transition-all duration-200 ds-bg ",
                  // ← أحمر فقط لما الرمز غلط من الـ API
                  isInvalid
                    ? " ds-text-error"
                    : "",
                ].join(" ")}
                style={{
                  background: isInvalid
                    ? "rgba(239,68,68,0.06)"  
                    : "ds-bg-form",
                  boxShadow: isInvalid
                    ? "0 2px 8px rgba(239,68,68,0.18)"
                    : "0 2px 8px rgba(0,0,0,0.08)",
                }}
              />
            ))}
          </InputOTPGroup>
        </InputOTP>

        {/* نص الخطأ — يظهر تحت المربعات مباشرة */}
        {errorMessage && (
          <Text size="sm" color="error" className="text-center">
            {errorMessage}
          </Text>
        )}
      </div>

      {/* Verify Button */}
      <Button
        type="button"
        variant="solid"
        fullWidth
        loading={isPending}
        disabled={otp.length < 4}
        onClick={handleVerify}
        className="mb-4"
      >
        {t("fp_verify_otp")}
      </Button>

      {/* Resend */}
      <Text size="sm" color="gray-200" className="text-center">
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
    </>
  );
}

// ─── Step 3: New Password ─────────────────────────────────────────────────────
function NewPasswordStep({
  email,
  resetToken,
  onSuccess,
}: {
  email: string;
  resetToken: string;
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
    mode: "onTouched",
    defaultValues: { password: "", password_confirmation: "" },
  });

  const onSubmit = (data: FormValues) => {
    resetPassword(
      {
        email,
        reset_token: resetToken,
        password: data.password,
        password_confirmation: data.password_confirmation,
      },
      {
        onSuccess,
      }
    );
  };

  return (
    <>
      {/* Heading */}
      <div className="text-center mb-6">
        <Text size="xl" weight="bold" tag="h1" className="mb-2">
          {t("fp_title_step3")}
        </Text>
        <Text size="sm" color="gray-200" className="leading-relaxed">
          {t("fp_new_password_desc")}
        </Text>
      </div>

      {/* Form */}
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

      {/* Success Icon */}
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{ background: "var(--color-primary-200, #e9f9fb)" }}
      >
        {/* Checkmark SVG */}
        <svg
          width="36"
          height="36"
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7 18L14 25L29 11"
            stroke="var(--color-primary)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Text */}
      <div className="flex flex-col gap-2">
        <Text size="xl" weight="bold" tag="h1">
          {t("password_reset_success_title")}
        </Text>
        <Text size="sm" color="gray-200" className="leading-relaxed">
          {t("password_reset_success_desc")}
        </Text>
      </div>

      {/* Back to login */}
      <Button
        type="button"
        variant="solid"
        fullWidth
        onClick={() => router.push("/login")}
      >
        {t("login")}
      </Button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ForgotPasswordPage() {
  const locale = useLocale();
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");

  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
   
   <main className="ds-bg flex  justify-center overflow-y-auto  w-full max-w-lg mx-auto  rounded-2xl"
      dir={dir}
    >
        
      <div className="w-full  rounded-2xl ds-bg-form ds-border-form px-10 py-12 ds-shadow-sm">

        {/* ── Step 1: Email ── */}
        {step === 1 && (
          <EmailStep
            onSuccess={(em) => {
              setEmail(em);
              setStep(2);
            }}
          />
        )}

        {/* ── Step 2: OTP ── */}
        {step === 2 && (
          <OtpStep
            email={email}
            onSuccess={(token) => {
              setResetToken(token);
              setStep(3);
            }}
          />
        )}

        {/* ── Step 3: New Password ── */}
        {step === 3 && (
          <NewPasswordStep
            email={email}
            resetToken={resetToken}
            onSuccess={() => setStep(4)}
          />
        )}

        {/* ── Step 4: Success ── */}
        {step === 4 && <SuccessStep />}

      </div>
    </main>
  );
}

