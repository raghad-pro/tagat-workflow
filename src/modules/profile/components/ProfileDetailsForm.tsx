"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { updateProfileSchema, type UpdateProfileValues } from "../types/profile.schema";
import { useUpdateProfile } from "../hooks/useUpdateProfile";
import { useGetProfile } from "../hooks/useGetProfile";
import { useAuth } from "@/providers/AuthProvider";

export const ProfileDetailsForm = () => {
  const t = useTranslations("common");
  const { user } = useAuth();
  const { data: profileResponse, isLoading } = useGetProfile();
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  const profile = (profileResponse as any)?.data || profileResponse;

  const form = useForm<UpdateProfileValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
      });
    }
  }, [profile, form]);

  const onSubmit = (values: UpdateProfileValues) => {
    updateProfile(values);
  };

  if (isLoading) return <div>Loading profile...</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex gap-8">
      {/* Profile Image Section */}
      <div className="flex flex-col items-center gap-4 w-1/4 min-w-[200px]">
        <div className="w-32 h-32 rounded-lg bg-gray-200 overflow-hidden flex items-center justify-center relative">
          {profile?.avatar || profile?.image || user?.image ? (
            <img 
              src={profile?.avatar || profile?.image || user?.image || ""} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-4xl text-gray-400">👤</div>
          )}
          <button className="absolute bottom-2 right-2 bg-teal-500 text-white rounded-full p-1 text-xs w-6 h-6 flex items-center justify-center hover:bg-teal-600 transition">
            📷
          </button>
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-lg">{profile?.name}</h3>
          <p className="text-sm text-gray-500 capitalize">{user?.role?.replace("_", " ")}</p>
        </div>
        <Button variant="outline" className="w-full text-teal-500 border-teal-500 hover:bg-teal-50">
          Upload New Image
        </Button>
      </div>

      {/* Form Section */}
      <div className="flex-1">
        <h2 className="text-xl font-bold mb-6">Personal information</h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter email" {...field} />
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
    </div>
  );
};
