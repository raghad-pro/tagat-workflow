"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/atoms/Button";
import { Text } from "@/components/atoms/Text";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useVerifyEmailOtp } from "@/modules/auth/hooks/useVerifyEmailOtp";
import { useResendVerificationCode } from "@/modules/auth/hooks/useResendVerificationCode";
import toast from "react-hot-toast";

export default function VerifyAccountPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<"invalid" | "required" | "">("");
  const { mutate: verifyOtp, isPending } = useVerifyEmailOtp();
  const { mutate: resendCode, isPending: isResending } = useResendVerificationCode();

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
          toast.success(t("registerSuccess") || "Account verified successfully!");
          router.replace("/login");
        },
        onError: (error: any) => {
          setOtpError("invalid");
          const backendMsg = error?.response?.data?.message || error?.message;
          if (backendMsg) toast.error(backendMsg);
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
          toast.success(t("fp_resend_success") || "Verification code resent successfully");
        }
      }
    );
  };

  const errorMessage = otpError === "invalid" ? t("otp_invalid") : otpError === "required" ? t("otp_required") : "";
  const isInvalid = otpError === "invalid";

  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <main className="ds-bg flex justify-center overflow-y-auto w-full max-w-lg mx-auto rounded-2xl" dir={dir}>
      <div className="w-full rounded-2xl bg-white dark:bg-[#1a1c23]/40 dark:backdrop-blur-xl border border-gray-100 dark:border-white/10 px-10 py-12" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="text-center mb-6">
          <Text size="xl" weight="bold" tag="h1" className="mb-2">{t("fp_title_step2") || "Verify Account"}</Text>
          <Text size="sm" color="gray-200" className="leading-relaxed">
            {t("fp_otp_desc") || "Please enter the OTP sent to"} <span className="ds-text-brand font-semibold">{email}</span>
          </Text>
        </div>

        <div className="flex flex-col items-center gap-3 mb-6">
          <InputOTP maxLength={6} value={otp} onChange={(val) => { setOtp(val); if (otpError) setOtpError(""); }}>
            <InputOTPGroup className="gap-3 rtl:flex-row-reverse">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <InputOTPSlot key={i} index={i} className={[
                    "w-12 h-12 rounded-xl border-0 text-lg font-bold ds-text-primary transition-all duration-200 ds-bg",
                    isInvalid ? "ds-text-error" : "",
                  ].join(" ")}
                  style={{
                    background: isInvalid ? "rgba(239,68,68,0.06)" : "var(--ds-bg-form)",
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

        <Text size="sm" color="gray-200" className="text-center">
          {t("fp_no_otp") || "Didn't receive a verification code?"}{" "}
          <button type="button" onClick={handleResend} disabled={isResending} className="ds-text-brand font-semibold hover:underline disabled:opacity-50">
            {isResending ? (t("fp_resending") || "Resending...") : (t("fp_resend") || "Resend")}
          </button>
        </Text>
      </div>
    </main>
  );
}
