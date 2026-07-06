"use client";

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
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mt-6">
      <h2 className="text-xl font-bold mb-2">Change Password</h2>
      <p className="text-sm text-gray-500 mb-6">Update your account password to maintain security.</p>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="old_password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Enter current password" {...field} />
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
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Enter new password" {...field} />
                </FormControl>
                <FormDescription>
                  Password must be at least 8 characters long and include a mix of letters, numbers, and symbols.
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
                <FormLabel>Confirm New Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Confirm new password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-3 mt-8">
            <Button type="button" variant="outline" onClick={() => form.reset()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="bg-teal-500 hover:bg-teal-600 text-white min-w-[100px]">
              {isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
