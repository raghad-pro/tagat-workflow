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
    mode: "onTouched",
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: LoginFormValues) => {
    login({ email: data.email, password: data.password });
  };

  return (
    <main className="ds-bg flex  justify-center overflow-y-auto  w-full max-w-lg mx-auto  rounded-2xl">
      <div className="w-full  rounded-2xl ds-bg-form ds-border-form px-10 py-12"
        style={{ boxShadow: "var(--shadow-sm)" }}>
      

        {/* ── Heading ── */}
        <Text size="xl" weight="bold" tag="h1" className="text-start mb-1">
          {t("welcome")} <span className="ds-text-brand">{t("welcome_back")}</span>
        </Text>
        <Text size="base" color="primary" weight="bold" className="text-center mb-8">
          {t("login")}
        </Text>

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
              <div className="flex items-center justify-between mt-1 w-full">

                {/* Checkbox تذكرني */}
            <CheckboxField
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(!!checked)}
              label={t("remember_me")} 
            />

                {/* Forgot password */}
                <Link href="/forgot-password">
                  <Text size="sm" color="brand" tag="span" className="hover:underline" >
                    {t("forgot_password")}
                  </Text>
                </Link>

              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              variant="solid"
              size="lg"
              fullWidth
              loading={isPending}
            >
              {t("login")}
            </Button>

            {/* Footer */}
            <Text size="sm" color="gray-200" className="text-center">
              {t("register_text")}{" "}
              <Link href="/register">
                <Text size="sm" color="brand" weight="bold" tag="span" className="hover:underline">
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
