"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ActionModal } from "@/components/molecules/ActionModal";
import { TextField, SelectField } from "@/components/molecules/FormFields";
import { Form } from "@/components/ui/form";
import { User, Building, Clock, DollarSign } from "lucide-react";

const editTimeLogSchema = z.object({
  employee: z.string().min(2, "Employee is required"),
  company: z.string().min(1, "Company is required"),
  date: z.string().min(1, "Date is required"),
  hours: z.string().min(1, "Hours is required"),
  rateHr: z.string().min(1, "Rate per hour is required"),
  status: z.enum(["pending", "completed"]).optional(),
});

type FormValues = z.infer<typeof editTimeLogSchema>;

export default function EditTimeLogModal({ isOpen, onClose, onUpdate, data }: { isOpen: boolean, onClose: () => void, onUpdate: (id: number, data: any) => void, data: any | null }) {
  const form = useForm<FormValues>({
    resolver: zodResolver(editTimeLogSchema),
    mode: "onTouched",
    defaultValues: { employee: "", company: "", date: "", hours: "", rateHr: "", status: "pending" },
  });

  useEffect(() => {
    if (data && isOpen) {
      form.reset({
        employee: data.employee || "",
        company: data.company || "",
        date: data.date || "",
        hours: data.hours || "",
        rateHr: data.rateHr || "",
        status: data.status as any || "pending",
      });
    }
  }, [data, isOpen, form]);

  const handleFormSubmit = (formData: FormValues) => {
    if (!data) return;
    onUpdate(data.id, formData);
  };

  if (!isOpen || !data) return null;

  return (
    <ActionModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Edit Time Log"
      mode="edit"
      formId="edit-timelog-form"
      size="md"
    >
      <div className="flex flex-col w-full">
        <Form {...form}>
          <form id="edit-timelog-form" onSubmit={form.handleSubmit(handleFormSubmit)} className="flex flex-col gap-5">
            <div className="rounded-2xl p-5 flex flex-col gap-5 border ds-border-form">
              <TextField control={form.control} name="employee" label="Employee" placeholder="Enter employee name" required icon={User} />
              <TextField control={form.control} name="company" label="Company" placeholder="Enter company name" required icon={Building} />
              <TextField control={form.control} name="date" label="Date" placeholder="YYYY-MM-DD" required type="date" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField control={form.control} name="hours" label="Hours" placeholder="e.g. 4h30m" required icon={Clock} />
                <TextField control={form.control} name="rateHr" label="Rate/Hr" placeholder="e.g. ₪" required icon={DollarSign} />
              </div>
              <SelectField control={form.control} name="status" label="Status" options={[{value:"pending", label:"Pending"}, {value:"completed", label:"Completed"}]} required placeholder="Select status" />
            </div>
          </form>
        </Form>
      </div>
    </ActionModal>
  );
}
