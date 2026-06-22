"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Mail, Lock, Briefcase, DollarSign } from "lucide-react";
import { ActionModal } from "@/components/molecules/ActionModal";
import { TextField, PasswordField, SelectField } from "@/components/molecules/FormFields";
import { Form } from "@/components/ui/form";
import type { Employee } from "../types/employees.types";

const editEmployeeSchema = z.object({
  employeeName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Invalid email"),
  paymentType: z.string().min(1, "Select payment type"),
  jobTitle: z.string().min(1, "Job title is required"),
  password: z.string().optional(),
  hourlyRate: z.string().min(1, "Rate is required"),
  currency: z.string().min(1, "Select currency"),
  company: z.string().min(1, "Select company"),
});

type FormValues = z.infer<typeof editEmployeeSchema>;

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

interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: number, data: any) => void;
  data: Employee | null;
}

export default function EditEmployeeModal({ isOpen, onClose, onUpdate, data }: EditEmployeeModalProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(editEmployeeSchema),
    mode: "onTouched",
    defaultValues: {
      employeeName: "", email: "", paymentType: "", jobTitle: "",
      password: "", hourlyRate: "", currency: "", company: "",
    },
  });

  useEffect(() => {
    if (data && isOpen) {
      form.reset({
        employeeName: data.name || "",
        email: "", // Not available in mock data directly, would be in real data
        paymentType: data.paymentType.toLowerCase(),
        jobTitle: data.job || "",
        password: "",
        hourlyRate: data.salary.replace(/[^0-9.]/g, '') || "",
        currency: data.currency.toLowerCase(),
        company: "advanced-tech", // using mock mapped
      });
    }
  }, [data, isOpen, form]);

  const handleFormSubmit = (formData: FormValues) => {
    if (!data) return;
    onUpdate(data.id, formData);
    onClose();
  };

  if (!isOpen || !data) return null;

  return (
    <ActionModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Edit Employee"
      mode="edit"
      formId="edit-employee-form"
      size="lg"
    >
      <div className="flex flex-col w-full">
        <Form {...form}>
          <form id="edit-employee-form" onSubmit={form.handleSubmit(handleFormSubmit)} className="flex flex-col gap-5">
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
                <PasswordField control={form.control} name="password" label="New Password (optional)" placeholder="••••••••" icon={Lock} />
                <TextField control={form.control} name="hourlyRate" label="Rate / Salary" placeholder="0.00" type="number" required icon={DollarSign} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SelectField control={form.control} name="currency" label="Currency" options={CURRENCY_OPTIONS} required placeholder="Select currency" />
                <SelectField control={form.control} name="company" label="Company" options={COMPANY_OPTIONS} required placeholder="Select company" />
              </div>
            </div>
          </form>
        </Form>
      </div>
    </ActionModal>
  );
}
