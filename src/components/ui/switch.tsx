import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-pill border border-border bg-bg-soft transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 data-[state=checked]:border-gold data-[state=checked]:bg-gold",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block size-5 translate-x-0.5 rounded-full bg-fg shadow-sm transition-transform data-[state=checked]:translate-x-[22px] data-[state=checked]:bg-bg",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
