import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full rounded-md border border-border bg-bg-soft px-3 text-sm text-fg shadow-none outline-none transition-colors duration-200 placeholder:text-muted/70 focus-visible:border-gold focus-visible:ring-2 focus-visible:ring-gold/30 disabled:opacity-50 file:border-0 file:bg-transparent file:text-sm file:text-fg",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
