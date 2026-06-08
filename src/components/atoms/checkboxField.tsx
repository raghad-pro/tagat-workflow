"use client"

import * as React from "react"
import { Checkbox } from "@/components/ui/checkbox" // استيراد الـ UI اللي عدلنا شكله سوا

interface CheckboxFieldProps extends React.ComponentPropsWithoutRef<typeof Checkbox> {
  label?: string;
  children?: React.ReactNode;
}

export function CheckboxField({
  id,
  label,
  children,
  checked,
  onCheckedChange,
  className,
  ...props
}: CheckboxFieldProps) {
  const generatedId = React.useId();
  const inputId = id || generatedId;

  return (
    <div className="flex items-start gap-2 w-auto text-start select-none">      {/* الـ UI المربع الصافي */}
      <Checkbox
        id={inputId}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className={className}
        {...props}
      />
      
      {(label || children) && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium ds-text-gray-100 cursor-pointer leading-tight w-full"
        >
          {label ? <span>{label}</span> : children}
        </label>
      )}
    </div>
  )
}