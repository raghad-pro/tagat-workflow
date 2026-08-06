"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Target, Type } from "lucide-react";
import { ActionModal } from "@/components/molecules/ActionModal";
import { TextField, TextAreaField, SelectField } from "@/components/molecules/FormFields";
import { Form } from "@/components/ui/form";

const buildSchema = (t: ReturnType<typeof useTranslations>, tCommon: ReturnType<typeof useTranslations>) =>
  z
    .object({
      // `POST /sprints` rejects a missing `project_id` with a 422 the dialog had
      // no way to answer, because it had no field for it. Asked for here.
      project: z.string().min(1, tCommon("validation.required")),
      name: z.string().min(2, tCommon("validation.minLength", { min: 2 })),
      goal: z.string().optional(),
      start_date: z.string().min(1, tCommon("validation.required")),
      end_date: z.string().min(1, tCommon("validation.required")),
    })
    .superRefine((data, ctx) => {
      if (!data.start_date || !data.end_date) return;
      // Caught here rather than by the server: the API accepts a reversed range
      // and produces a sprint that is permanently overdue on the day it starts.
      if (data.end_date < data.start_date) {
        ctx.addIssue({
          code: "custom",
          message: t("validation.endBeforeStart"),
          path: ["end_date"],
        });
      }
    });

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

interface CreateSprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: FormValues) => void;
  isLoading?: boolean;
  projects: { id: number; title: string }[];
  /** Pre-selects the project the page is currently showing. */
  defaultProjectId?: number | null;
}

/** Today and today + 13 days — the common two-week default. */
function defaultRange() {
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 13);
  return { start: iso(start), end: iso(end) };
}

export default function CreateSprintModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  projects,
  defaultProjectId,
}: CreateSprintModalProps) {
  const t = useTranslations("sprint");
  const tCommon = useTranslations("common");

  const form = useForm<FormValues>({
    resolver: zodResolver(buildSchema(t, tCommon)),
    mode: "onSubmit",
    defaultValues: { project: "", name: "", goal: "", start_date: "", end_date: "" },
  });

  // Reset on each opening, so a cancelled sprint does not leak into the next.
  useEffect(() => {
    if (!isOpen) return;
    const { start, end } = defaultRange();
    form.reset({
      project: defaultProjectId ? String(defaultProjectId) : "",
      name: "",
      goal: "",
      start_date: start,
      end_date: end,
    });
  }, [isOpen, defaultProjectId, form]);

  if (!isOpen) return null;

  const projectOptions = projects.map((project) => ({
    value: String(project.id),
    label: project.title,
  }));

  return (
    <ActionModal
      isOpen={isOpen}
      onClose={onClose}
      title={t("createSprint")}
      mode="add"
      formId="create-sprint-form"
      size="lg"
      isLoading={isLoading}
    >
      <Form {...form}>
        <form
          id="create-sprint-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-5"
        >
          <div className="rounded-2xl border ds-border-form p-5 flex flex-col gap-5">
            <SelectField
              control={form.control}
              name="project"
              label={t("fields.project")}
              options={projectOptions}
              required
              placeholder={t("placeholders.project")}
            />

            <TextField
              control={form.control}
              name="name"
              label={t("fields.name")}
              placeholder={t("placeholders.name")}
              required
              icon={Type}
            />

            <TextAreaField
              control={form.control}
              name="goal"
              label={t("fields.goal")}
              placeholder={t("placeholders.goal")}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                control={form.control}
                name="start_date"
                label={t("fields.startDate")}
                type="date"
                required
                icon={Target}
              />
              <TextField
                control={form.control}
                name="end_date"
                label={t("fields.endDate")}
                type="date"
                required
                icon={Target}
              />
            </div>
          </div>
        </form>
      </Form>
    </ActionModal>
  );
}
