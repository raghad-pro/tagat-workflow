"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/atoms/Button";
import { Text } from "@/components/atoms/Text";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { TextField, PasswordField } from "@/components/molecules/FormFields";
import { useLogin } from "@/modules/auth/hooks/useLogin";
import { useState } from "react";
import {Mail,Lock} from "@/assets/icons/icons"
import { CheckboxField } from "@/components/atoms/checkboxField";
// ─── Component ─────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const t = useTranslations("auth");
  const { mutate: login, isPending } = useLogin();
  const [rememberMe, setRememberMe] = useState(false);

  // ─── Schema ──────────────────────────────────────────────────────────────────
  const loginSchema = z.object({
    email: z
      .string() 
      .min(1, { message: t("email_required") })
      .email({ message: t("email_invalid") }),
    password: z
      .string()
      .min(1, { message: t("password_required") })
      .min(8, { message: t("password_too_short") }),
  });

  type LoginFormValues = z.infer<typeof loginSchema>;

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onSubmit",
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: LoginFormValues) => {
    login({ email: data.email, password: data.password });
  };

  return (
    <main className="flex justify-center w-full mx-auto px-4">
      <div className="w-full max-w-[420px] bg-white dark:bg-[#1a1c23]/40 dark:backdrop-blur-xl dark:border dark:border-white/10 rounded-3xl px-4 sm:px-6 py-4 sm:py-6"
        style={{ boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08)" }}>
      
        {/* ── Heading ── */}
        <div className="text-center mb-3 sm:mb-4">
          <Text size="lg" weight="bold" tag="h1" className="mb-0.5 sm:mb-1 dark:text-white text-[18px] sm:text-[20px]">
            {t("welcome")} <span style={{ color: "var(--color-primary)" }}>{t("welcome_back")}</span>
          </Text>
        </div>

        {/* ── Form ── */}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
          >
            {/* Email */}
            <TextField
              control={form.control}
              name="email"
              label={t("email")}
              placeholder={t("email_placeholder")}
              type="email"
              required
              icon={Mail}
            />

            {/* Password */}
            <div className="flex flex-col gap-1">
              <PasswordField
                control={form.control}
                name="password"
                label={t("password")}
                placeholder={t("password_placeholder")}
                required
                icon={Lock}
              />

              {/* ── Remember me + Forgot password ── */}
              <div className="flex flex-row justify-between items-center mt-2 mb-4 gap-2">
                {/* Checkbox تذكرني */}
                <CheckboxField
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(!!checked)}
                  label={t("remember_me")} 
                />

                {/* Forgot password */}
                <Link href="/forgot-password">
                  <Text size="sm" tag="span" className="hover:underline text-[13px]" style={{ color: "var(--color-primary)" }}>
                    {t("forgot_password")}
                  </Text>
                </Link>
              </div>
            </div>

            {/* Submit */}
            <div className="mt-1">
              <Button
                type="submit"
                variant="solid"
                fullWidth
                loading={isPending}
                className="!rounded-xl !py-4 sm:!py-6 !text-[15px] !font-bold tracking-wide transition-all duration-300 hover:shadow-[0_8px_20px_rgba(18,194,233,0.4)] hover:-translate-y-[2px] active:scale-95 active:translate-y-0"
              >
                {t("login")}
              </Button>
            </div>

            {/* Footer */}
            <Text size="sm" className="text-center mt-2 text-[11px]" style={{ color: "#6b7280" }}>
              {t("register_text")}{" "}
              <Link href="/register">
                <Text size="sm" weight="bold" tag="span" className="hover:underline" style={{ color: "var(--color-primary)" }}>
                  {t("register")}
                </Text>
              </Link>
            </Text>

          </form>
        </Form>
      </div>
    </main>
  );
} 
