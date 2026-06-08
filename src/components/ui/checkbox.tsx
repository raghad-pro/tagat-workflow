"use client"

import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { CheckIcon } from "lucide-react"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
     className={cn(
  "peer relative flex size-5 shrink-0 items-center justify-center rounded-md border border-none  outline-none ds-bg-primary-200 ",
  className
)}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none [&>svg]:size-3.5"
      >
        <CheckIcon 
          className="ds-text-brand" 
          strokeWidth={3}
        />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }