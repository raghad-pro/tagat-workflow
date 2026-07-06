import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
});

export const changePasswordSchema = z.object({
  old_password: z.string().optional(),
  new_password: z.string().min(8, "Password must be at least 8 characters"),
  new_password_confirmation: z.string().min(8, "Password must be at least 8 characters"),
}).refine((data) => data.new_password === data.new_password_confirmation, {
  message: "Passwords do not match",
  path: ["new_password_confirmation"],
});

export type UpdateProfileValues = z.infer<typeof updateProfileSchema>;
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
