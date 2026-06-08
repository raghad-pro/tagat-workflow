"use client";
import { LucideIcon } from "lucide-react";
import { Control, FieldPath, FieldValues } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/molecules/PasswordInput";
import { Text } from "@/components/atoms/Text";
import { cn } from "@/lib/utils";

// ─── Shared styles ─────────────────────────────────────────────────────────────
const inputBase = cn(
  "ds-border-input-color ds-text-sm ds-text-primary",
  "focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:shadow-none",
  "focus-visible:border-[var(--color-primary)]"
);

// ─── Base Props ────────────────────────────────────────────────────────────────
interface BaseFieldProps<T extends FieldValues> {
  control:      Control<T>;
  name:         FieldPath<T>;
  label:        string;
  placeholder?: string;
  required?:    boolean;
  icon?:        LucideIcon
}

// ─── TextField ─────────────────────────────────────────────────────────────────
interface TextFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  type?: "text" | "email";
}
 
export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  required,
  type = "text",
  icon: Icon,
}: TextFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className="flex flex-col gap-1.5 w-full">
       
          <FormLabel>
            <Text size="sm" weight="bold" tag="label" htmlFor={name}>
              {label}
              {required && <span className="ds-text-error ms-1">*</span>}
            </Text>
          </FormLabel>

          <div className="relative flex items-center">
           
          
            {Icon && (
              <Icon 
                size={18} 
                className={cn(
                  "absolute ms-3  top-1/2 -translate-y-1/2  pointer-events-none ds-text-primary" ,
                  fieldState.error ? " ds-text-error" : "ds-text-primary"
                )}
              />
            )}

            <Input
              id={name}
              type={type}
              placeholder={placeholder}
              className={cn(
                inputBase,
                Icon && "ps-10",
                fieldState.error && "ds-border-error"
              )}
              style={{ height: "var(--input-height)" }}
              aria-invalid={!!fieldState.error}
              {...field}
            />
           
          </div>

         
    {fieldState.error && (
            <Text size="sm" color="error" className="mt-1 block">
              {fieldState.error.message}
            </Text>
    )}

        </FormItem>
      )}
    />
  );
}

// ─── PasswordField ─────────────────────────────────────────────────────────────
export function PasswordField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  required,
 icon: Icon,
  
}: BaseFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className="flex flex-col gap-1.5 w-full">

          <FormLabel>
            <Text size="sm" weight="bold" tag="label" htmlFor={name}>
              {label}
              {required && <span className="ds-text-error ms-1">*</span>}
            </Text>
          </FormLabel>

         <div className="relative w-full ">
           
            {Icon && (
              <Icon 
                size={18} 
                className={cn(
                  "absolute ms-3  top-1/2 -translate-y-1/2  pointer-events-none ds-text-primary" ,
                  fieldState.error ? "text-destructive ds-text-error" : "ds-text-primary"
                )}
              />
            )}
            <PasswordInput
              id={name}
              placeholder={placeholder}
              hasError={!!fieldState.error}
              aria-invalid={!!fieldState.error}
              {...field}
                className={cn(
                Icon && "ps-10",
                )}
            />
          </div>

          
            {fieldState.error && (
            <Text size="sm" color="error" className="mt-1 block">
              {fieldState.error.message}
            </Text>
    )}
         

        </FormItem>
      )}
    />
  );
}