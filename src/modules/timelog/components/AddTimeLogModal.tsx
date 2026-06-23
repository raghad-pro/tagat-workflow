"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ActionModal } from "@/components/molecules/ActionModal";
import { TextField } from "@/components/molecules/FormFields";
import { Form } from "@/components/ui/form";
import { User, Building, Clock, DollarSign } from "lucide-react";
import { useTranslations } from "next-intl";

const addTimeLogSchema = z.object({
  employee: z.string().min(2, "Employee is required"),
  company: z.string().min(1, "Company is required"),
  date: z.string().min(1, "Date is required"),
  hours: z.string().min(1, "Hours is required"),
  rateHr: z.string().min(1, "Rate per hour is required"),
});

type FormValues = z.infer<typeof addTimeLogSchema>;

export default function AddTimeLogModal({ isOpen, onClose, onSubmit = () => {} }: { isOpen: boolean, onClose: () => void, onSubmit?: (data: any) => void }) {
  const t = useTranslations("timeLog");
  
  const form = useForm<FormValues>({
    resolver: zodResolver(addTimeLogSchema),
    mode: "onTouched",
    defaultValues: { employee: "", company: "", date: "", hours: "", rateHr: "" },
  });

  const handleFormSubmit = (data: FormValues) => {
    onSubmit(data);
    onClose();
    form.reset();
  };

  if (!isOpen) return null;

  return (
    <ActionModal 
      isOpen={isOpen} 
      onClose={() => { form.reset(); onClose(); }} 
      title={t("add") || "Add Time Log"}
      mode="add"
      formId="add-timelog-form"
      size="md"
    >
      <div className="flex flex-col w-full">
        <Form {...form}>
          <form id="add-timelog-form" onSubmit={form.handleSubmit(handleFormSubmit)} className="flex flex-col gap-5">
            <div className="rounded-2xl p-5 flex flex-col gap-5 border ds-border-form">
              <TextField control={form.control} name="employee" label={t("columns.employee") || "Employee"} placeholder="" required icon={User} />
              <TextField control={form.control} name="company" label={t("columns.company") || "Company"} placeholder="" required icon={Building} />
              <TextField control={form.control} name="date" label={t("columns.date") || "Date"} placeholder="YYYY-MM-DD" required type="date" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField control={form.control} name="hours" label={t("columns.hours") || "Hours"} placeholder="e.g. 4h30m" required icon={Clock} />
                <TextField control={form.control} name="rateHr" label={t("columns.rate") || "Rate/Hr"} placeholder="e.g. ₪" required icon={DollarSign} />
              </div>
            </div>
          </form>
        </Form>
      </div>
    </ActionModal>
  );
}
