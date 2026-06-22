"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Mail, Lock, Briefcase, DollarSign, Building } from "lucide-react";
import { ActionModal } from "@/components/molecules/ActionModal";
import { TextField, PasswordField, SelectField } from "@/components/molecules/FormFields";
import { Form } from "@/components/ui/form";
import type { AddEmployeeFormValues } from "../types/employees.types";
import { useAuth } from "@/providers/AuthProvider";

const addEmployeeSchema = z.object({
  employeeName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Invalid email"),
  paymentType: z.string().min(1, "Select payment type"),
  jobTitle: z.string().min(1, "Job title is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  hourlyRate: z.string().min(1, "Rate is required"),
  currency: z.string().min(1, "Select currency"),
  company: z.string().optional(),
});

type FormValues = z.infer<typeof addEmployeeSchema>;

const PAYMENT_OPTIONS = [
  { value: "monthly", label: "Monthly" },
  { value: "hourly", label: "Hourly" }
];
const CURRENCY_OPTIONS = [
  { value: "usd", label: "USD" },
  { value: "ils", label: "ILS" },
  { value: "eur", label: "EUR" }
];
const COMPANY_OPTIONS = [
  { value: "advanced-tech", label: "Advanced Tech Company" },
  { value: "innotech", label: "Innotech Solutions" },
  { value: "nextgen", label: "NextGen Software" },
  { value: "creative-minds", label: "Creative Minds Studio" },
];

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (values: AddEmployeeFormValues) => void;
}

export default function AddEmployeeModal({ isOpen, onClose, onSubmit }: AddEmployeeModalProps) {
  const { user } = useAuth();
  const isCompanyAdmin = user?.role === "company_admin";

  const form = useForm<FormValues>({
    resolver: zodResolver(addEmployeeSchema),
    mode: "onTouched",
    defaultValues: {
      employeeName: "", email: "", paymentType: "", jobTitle: "",
      password: "", hourlyRate: "", currency: "", company: "",
    },
  });

  const handleFormSubmit = (data: FormValues) => {
    onSubmit?.(data);
    onClose();
    form.reset();
  };

  if (!isOpen) return null;

  return (
    <ActionModal 
      isOpen={isOpen} 
      onClose={() => { form.reset(); onClose(); }} 
      title="Add New Employee"
      mode="add"
      formId="add-employee-form"
      size="lg"
    >
      <div className="flex flex-col w-full">
        <Form {...form}>
          <form id="add-employee-form" onSubmit={form.handleSubmit(handleFormSubmit)} className="flex flex-col gap-5">
            <div className="rounded-2xl p-5 flex flex-col gap-5" style={{ border: "1px solid var(--color-border-form)" }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextField control={form.control} name="employeeName" label="Employee Name" placeholder="John Doe" required icon={User} />
                <TextField control={form.control} name="email" label="Email" placeholder="john@example.com" type="email" required icon={Mail} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SelectField control={form.control} name="paymentType" label="Payment Type" options={PAYMENT_OPTIONS} required placeholder="Select payment type" />
                <TextField control={form.control} name="jobTitle" label="Job Title" placeholder="Developer" required icon={Briefcase} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <PasswordField control={form.control} name="password" label="Password" placeholder="••••••••" required icon={Lock} />
                <TextField control={form.control} name="hourlyRate" label="Rate / Salary" placeholder="0.00" type="number" required icon={DollarSign} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField control={form.control} name="currency" label="Currency" options={CURRENCY_OPTIONS} required placeholder="USD" />
                {!isCompanyAdmin && (
                  <SelectField control={form.control} name="company" label="Company Name" options={COMPANY_OPTIONS} required placeholder="Select Company" />
                )}
              </div>
            </div>
          </form>
        </Form>
      </div>
    </ActionModal>
  );
}
