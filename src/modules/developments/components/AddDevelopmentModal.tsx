"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ActionModal } from "@/components/molecules/ActionModal";
import { TextField, SelectField } from "@/components/molecules/FormFields";
import { Form } from "@/components/ui/form";
import { useCreateDevelopment } from "../hooks/useDevelopments";
import { useProjects } from "@/modules/projects/hooks/useProjects";
import { useTranslations } from "next-intl";

const addDevelopmentSchema = z.object({
  project_id: z.coerce.number().min(1, "Project is required"),
  client_id: z.coerce.number().min(1, "Client is required"),
  currency_id: z.coerce.number().min(1, "Currency is required"),
  title: z.string().min(2, "Title is required"),
  description: z.string().min(1, "Description is required"),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]),
  cost: z.coerce.number().min(0, "Cost is required"),
});

type FormValues = z.infer<typeof addDevelopmentSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (v: any) => void;
}

export default function AddDevelopmentModal({ isOpen, onClose, onSubmit }: Props) {
  const { mutate: createDevelopment, isPending } = useCreateDevelopment();
  const t = useTranslations("development");
  const tCommon = useTranslations("common");

  const form = useForm<FormValues>({
    resolver: zodResolver(addDevelopmentSchema) as any,
    mode: "onSubmit",
    defaultValues: {
      project_id: "" as any,
      client_id: "" as any,
      currency_id: "" as any,
      title: "",
      description: "",
      status: "" as any,
      cost: "" as any,
    },
  });

  const { data: projectsRes } = useProjects({ page: 1, per_page: 100 } as any);
  const projectsList = projectsRes?.data || [];
  const projectOptions = projectsList.map((p: any) => ({
    value: p.id.toString(),
    label: p.title || p.name || `Project ${p.id}`,
  }));

  const selectedProjectId = form.watch("project_id");
  const selectedProject = projectsList.find((p: any) => p.id.toString() === selectedProjectId?.toString());

  // Derive client options from the selected project
  let clientOptions: { value: string; label: string }[] = [];
  if (selectedProject) {
    if (Array.isArray(selectedProject.clients)) {
      clientOptions = selectedProject.clients.map((c: any) => ({
        value: c.id.toString(),
        label: c.name || `Client ${c.id}`
      }));
    } else if (typeof selectedProject.client === "object" && selectedProject.client !== null) {
      clientOptions = [{
        value: (selectedProject.client.id || selectedProject.client_id).toString(),
        label: selectedProject.client.name || `Client ${selectedProject.client.id || selectedProject.client_id}`
      }];
    } else if (selectedProject.client_id) {
      clientOptions = [{
        value: selectedProject.client_id.toString(),
        label: typeof selectedProject.client === "string" ? selectedProject.client : `Client ${selectedProject.client_id}`
      }];
    }
  }

  if (selectedProjectId && clientOptions.length === 0) {
    clientOptions = [{ value: "no-data", label: tCommon("noClients") || "No clients" }];
  }

  // Derive currency options from the selected project
  let currencyOptions: { value: string; label: string }[] = [];
  if (selectedProject) {
    if (typeof selectedProject.currency === "object" && selectedProject.currency !== null) {
      currencyOptions = [{
        value: (selectedProject.currency.id || selectedProject.currency_id).toString(),
        label: selectedProject.currency.name || selectedProject.currency.code || `Currency ${selectedProject.currency.id || selectedProject.currency_id}`
      }];
    } else if (selectedProject.currency_id) {
      currencyOptions = [{
        value: selectedProject.currency_id.toString(),
        label: typeof selectedProject.currency === "string" ? selectedProject.currency : `Currency ${selectedProject.currency_id}`
      }];
    }
  }

  if (selectedProjectId && currencyOptions.length === 0) {
    currencyOptions = [{ value: "no-data", label: "No currencies" }];
  }

  // Reset and auto-select client when project changes
  useEffect(() => {
    if (!selectedProjectId) {
      form.setValue("client_id", "" as any, { shouldValidate: true, shouldDirty: true });
    } else if (clientOptions.length === 1 && clientOptions[0].value !== "no-data") {
      form.setValue("client_id", Number(clientOptions[0].value), { shouldValidate: true, shouldDirty: true });
    } else {
      form.setValue("client_id", "" as any, { shouldValidate: true, shouldDirty: true });
    }
  }, [selectedProjectId, form]); // Removed clientOptions.length from deps to run only on project change

  // Reset and auto-select currency when project changes
  useEffect(() => {
    if (!selectedProjectId) {
      form.setValue("currency_id", "" as any, { shouldValidate: true, shouldDirty: true });
    } else if (currencyOptions.length === 1 && currencyOptions[0].value !== "no-data") {
      form.setValue("currency_id", Number(currencyOptions[0].value), { shouldValidate: true, shouldDirty: true });
    } else {
      form.setValue("currency_id", "" as any, { shouldValidate: true, shouldDirty: true });
    }
  }, [selectedProjectId, form]);

  const handleFormSubmit = (data: FormValues) => {
    createDevelopment(data, {
      onSuccess: (result) => {
        form.reset();
        onClose();
        onSubmit?.(result);
      },
    });
  };

  if (!isOpen) return null;

  return (
    <ActionModal
      isOpen={isOpen}
      onClose={() => { form.reset(); onClose(); }}
      title="Add Development"
      mode="add"
      formId="add-development-form"
      size="lg"
      isLoading={isPending}
    >
      <div className="flex flex-col w-full">
        <Form {...form}>
          <form id="add-development-form" onSubmit={form.handleSubmit(handleFormSubmit)} className="flex flex-col gap-5">
            <div className="rounded-2xl p-5 flex flex-col gap-5 border ds-border-form bg-white dark:bg-transparent">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField
                  control={form.control}
                  name="project_id"
                  label={t("columns.project") || "Project"}
                  placeholder={tCommon("selectProject") || "Select Project"}
                  required
                  options={projectOptions}
                />
                <SelectField
                  control={form.control}
                  name="status"
                  label={t("columns.status") || "Status"}
                  required
                  placeholder={tCommon("selectStatus") || "Select Status"}
                  options={[
                    { value: "pending", label: "Pending" },
                    { value: "in_progress", label: "In Progress" },
                    { value: "completed", label: "Completed" },
                  ]}
                />
              </div>

              {!!selectedProjectId && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SelectField
                    control={form.control}
                    name="client_id"
                    label="Client"
                    placeholder={
                      clientOptions[0]?.value === "no-data" 
                        ? tCommon("noClients") || "No clients"
                        : "Select Client"
                    }
                    required
                    options={clientOptions}
                    disabled={clientOptions[0]?.value === "no-data"}
                  />
                  <SelectField
                    control={form.control}
                    name="currency_id"
                    label="Currency"
                    placeholder={
                      currencyOptions[0]?.value === "no-data" 
                        ? "No currencies"
                        : "Select Currency"
                    }
                    required
                    options={currencyOptions}
                    disabled={currencyOptions[0]?.value === "no-data"}
                  />
                </div>
              )}

              <TextField
                control={form.control}
                name="title"
                label="Title"
                placeholder=""
                required
              />

              <TextField
                control={form.control}
                name="description"
                label="Description"
                placeholder=""
                required
              />

              <TextField
                control={form.control}
                name="cost"
                label="Cost"
                placeholder=""
                required
                type="number"
              />
            </div>
          </form>
        </Form>
      </div>
    </ActionModal>
  );
}
