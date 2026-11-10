import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-pill border px-2.5 py-0.5 text-[0.68rem] font-medium uppercase tracking-[0.14em]",
  {
    variants: {
      variant: {
        default: "border-gold/30 bg-gold/10 text-gold",
        muted: "border-border bg-glass text-muted",
        outline: "border-border text-fg",
        danger: "border-danger/40 bg-danger/15 text-danger",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
