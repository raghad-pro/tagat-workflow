"use client";
import React, { useState, useRef } from "react";
import { useFormContext } from "react-hook-form";
import apiClient from "@/services/apiClient";
import { LucideIcon, ChevronsUpDown, Loader2 } from "lucide-react";
import { Control, FieldPath, FieldValues } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PasswordInput } from "@/components/molecules/PasswordInput";
import { Text } from "@/components/atoms/Text";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// ─── Shared styles ─────────────────────────────────────────────────────────────
const inputBase = cn(
  "w-full ds-border-input-color ds-text-sm ds-text-primary",
  "transition-all duration-300 rounded-xl",
  "hover:border-[var(--color-primary)] hover:shadow-[0_0_10px_rgba(18,194,233,0.15)]",
  "focus-visible:ring-0 focus-visible:ring-offset-0",
  "focus-visible:border-[var(--color-primary)] focus-visible:shadow-[0_0_15px_rgba(18,194,233,0.25)]"
);

// ─── Base Props ────────────────────────────────────────────────────────────────
interface BaseFieldProps<T extends FieldValues> {
  control:      Control<T>;
  name:         FieldPath<T>;
  label:        string;
  placeholder?: string;
  required?:    boolean;
  icon?:        LucideIcon;
  disabled?:    boolean;
}

// ─── TextField ─────────────────────────────────────────────────────────────────
interface TextFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  type?: "text" | "email" | "number" | "date" | "password" | "tel" | "time";
  checkExistsUrl?: string;
}
 
export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  required,
  type = "text",
  icon: Icon,
  checkExistsUrl,
  disabled,
}: TextFieldProps<T>) {
  const formContext = useFormContext<T>();
  const [asyncError, setAsyncError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleChange = (field: any, e: React.ChangeEvent<HTMLInputElement>) => {
    field.onChange(e);
    
    if (checkExistsUrl) {
      const value = e.target.value;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      
      if (!value) {
        setAsyncError(null);
        formContext.clearErrors(name);
        return;
      }
      
      debounceRef.current = setTimeout(async () => {
        try {
          const res: any = await apiClient.post(checkExistsUrl, { [name]: value });
          const errorMessage = type === "email" ? "قيمة الحقل البريد الالكتروني مُستخدمة من قبل" : "قيمة الحقل مُستخدمة من قبل";
          
          if (res?.exists || res?.data?.exists || res?.is_used) {
            setAsyncError(errorMessage);
            formContext.setError(name, { type: "server", message: errorMessage });
          } else {
            setAsyncError(null);
            formContext.clearErrors(name);
          }
        } catch (error: any) {
          const errorMessage = type === "email" ? "قيمة الحقل البريد الالكتروني مُستخدمة من قبل" : "قيمة الحقل مُستخدمة من قبل";
          // Backend returns 422 if it exists
          if (error?.response?.status === 422 || error?.response?.status === 400 || (error?.response?.status === 200 && error?.response?.data?.exists)) {
            setAsyncError(errorMessage);
            formContext.setError(name, { type: "server", message: errorMessage });
          } else {
            setAsyncError(null);
            formContext.clearErrors(name);
          }
        }
      }, 500);
    }
  };

  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className="flex flex-col gap-1 w-full">
       
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
                  (fieldState.error || asyncError) ? " ds-text-error" : "ds-text-primary"
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
                (fieldState.error || asyncError) && "ds-border-error",
                disabled && "opacity-50 cursor-not-allowed bg-[var(--color-bg-primary-100)]"
              )}
              style={{ height: "var(--input-height)" }}
              aria-invalid={!!(fieldState.error || asyncError)}
              disabled={disabled}
              autoComplete="off"
              {...field}
              onChange={(e) => handleChange(field, e)}
              onBlur={field.onBlur}
            />
           
          </div>

         
    {(fieldState.error || asyncError) && (
            <Text size="sm" color="error" className="mt-1 block">
              {asyncError || fieldState.error?.message}
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
        <FormItem className="flex flex-col gap-1 w-full">

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
              autoComplete="new-password"
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
// ?????????????????????????????????????????????????????????????????????????????????????????????????
// ??? SelectField ?????????????????????????????????????????????????????????????????????????????????
// ?????????????????????????????????????????????????????????????????????????????????????????????????
interface Option {
  label: string;
  value: string;
}

interface SelectFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  options: Option[];
}

export function SelectField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  required,
  options,
  icon: Icon,
  disabled,
}: SelectFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className="flex flex-col gap-1 w-full">
          <FormLabel>
            <Text size="sm" weight="bold" tag="label">
              {label}
              {required && <span className="ds-text-error ms-1">*</span>}
            </Text>
          </FormLabel>

          <Select onValueChange={field.onChange} defaultValue={(!field.value || field.value === "" || field.value === 0) ? undefined : field.value?.toString()} value={(!field.value || field.value === "" || field.value === 0) ? undefined : field.value?.toString()} disabled={disabled}>
            <FormControl>
              <SelectTrigger
                className={cn(
                  inputBase,
                  Icon && "ps-10",
                  fieldState.error && "ds-border-error",
                  !field.value && "ds-text-sub"
                )}
                style={{ height: "var(--input-height)" }}
              >
                {Icon && (
                  <Icon
                    size={18}
                    className={cn(
                      "absolute ms-3 top-1/2 -translate-y-1/2 pointer-events-none",
                      fieldState.error ? "ds-text-error" : "ds-text-primary"
                    )}
                  />
                )}
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent usePortal={false} position="popper" sideOffset={4} className="ds-bg-form shadow-lg overflow-y-auto max-h-[250px] custom-scrollbar w-[var(--radix-select-trigger-width)]" style={{ border: "1px solid var(--color-border-form)", borderRadius: "8px" }}>
              {options.length > 0 ? (
                options.map((option) => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    className="ds-text-main py-3 px-3 mx-1 border-b ds-border-form last:border-b-0 hover:bg-[var(--color-bg-primary-200)] focus:bg-[var(--color-bg-primary-200)] cursor-pointer rounded-none text-sm font-medium transition-colors"
                  >
                    {option.label}
                  </SelectItem>
                ))
              ) : (
                <SelectItem 
                  value="no-data" 
                  disabled
                  className="ds-text-main py-3 px-3 mx-1 border-b ds-border-form last:border-b-0 cursor-not-allowed rounded-none text-sm font-medium opacity-50"
                >
                  {placeholder || "No options available"}
                </SelectItem>
              )}
            </SelectContent>
          </Select>

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

// ?????????????????????????????????????????????????????????????????????????????????????????????????
// ??? TextAreaField ???????????????????????????????????????????????????????????????????????????????
// ?????????????????????????????????????????????????????????????????????????????????????????????????
interface TextAreaFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  rows?: number;
}

export function TextAreaField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  required,
  rows = 4,
}: TextAreaFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className="flex flex-col gap-1 w-full">
          <FormLabel>
            <Text size="sm" weight="bold" tag="label" htmlFor={name}>
              {label}
              {required && <span className="ds-text-error ms-1">*</span>}
            </Text>
          </FormLabel>

          <FormControl>
            <Textarea
              id={name}
              placeholder={placeholder}
              rows={rows}
              className={cn(
                inputBase,
                fieldState.error && "ds-border-error"
              )}
              {...field}
            />
          </FormControl>

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

// ─────────────────────────────────────────────────────────────────────────────
// ── MultiSelectField ─────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
export function MultiSelectField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  required,
  options,
  icon: Icon,
  disabled,
}: SelectFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className="flex flex-col gap-1 w-full">
          <FormLabel>
            <Text size="sm" weight="bold" tag="label">
              {label}
              {required && <span className="ds-text-error ms-1">*</span>}
            </Text>
          </FormLabel>

          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  role="combobox"
                  disabled={disabled}
                  className={cn(
                    inputBase,
                    "justify-between h-12 w-full bg-transparent text-left font-normal",
                    Icon && "pl-10",
                    !(field.value && field.value.length > 0) && "text-muted-foreground",
                    fieldState.error && "ds-border-error"
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    {Icon && <Icon className="absolute left-3 h-5 w-5 opacity-50" />}
                    {field.value && field.value.length > 0
                      ? `${field.value.length} selected`
                      : placeholder || "Select options"}
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0 border-none rounded-xl shadow-lg ds-bg-form" align="start" style={{ border: "1px solid var(--color-border-form)", borderRadius: "8px" }}>
              <div className="max-h-60 overflow-y-auto p-2 flex flex-col gap-1 rounded-xl">
                {options.map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-[var(--color-bg-primary-200)] cursor-pointer rounded-lg transition-colors"
                    onClick={() => {
                      const current: any[] = Array.isArray(field.value) ? field.value : [];
                      const selected = current.includes(option.value);
                      const newValue = selected
                        ? current.filter((val: string) => val !== option.value)
                        : [...current, option.value];
                      field.onChange(newValue);
                    }}
                  >
                    <Checkbox checked={Array.isArray(field.value) ? (field.value as any[]).includes(option.value) : false} />
                    <span className="text-sm">{option.label}</span>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          
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
