"use client";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { changePasswordSchema, type ChangePasswordValues } from "../types/profile.schema";
import { useChangePassword } from "../hooks/useChangePassword";

export const ChangePasswordForm = () => {
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const { mutate: changePassword, isPending } = useChangePassword();

  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      old_password: "",
      new_password: "",
      new_password_confirmation: "",
    },
  });

  const onSubmit = (values: ChangePasswordValues) => {
    changePassword(values, {
      onSuccess: () => {
        form.reset();
      },
    });
  };

  return (
    <div className="ds-bg-form p-6 rounded-lg shadow-sm border ds-border-form mt-6">
      <h2 className="text-xl font-bold mb-2">{t("changePassword")}</h2>
      <p className="text-sm text-gray-500 mb-6">{t("changePasswordSubtitle")}</p>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="old_password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("labels.currentPassword")}</FormLabel>
                <FormControl>
                  <Input type="password" placeholder={t("placeholders.currentPassword")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="new_password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("labels.newPassword")}</FormLabel>
                <FormControl>
                  <Input type="password" placeholder={t("placeholders.newPassword")} {...field} />
                </FormControl>
                <FormDescription>
                  {t("passwordHint")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="new_password_confirmation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("labels.confirmPassword")}</FormLabel>
                <FormControl>
                  <Input type="password" placeholder={t("placeholders.confirmPassword")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-3 mt-8">
            <Button type="button" variant="outline" onClick={() => form.reset()}>
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={isPending} className="bg-teal-500 hover:bg-teal-600 text-white min-w-[100px]">
              {isPending ? tc("saving") : tc("save")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
