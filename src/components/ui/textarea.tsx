import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-28 w-full rounded-lg border border-border bg-bg-soft px-3 py-2.5 text-sm text-fg outline-none transition-colors duration-200 placeholder:text-muted/70 focus-visible:border-gold focus-visible:ring-2 focus-visible:ring-gold/30 disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
