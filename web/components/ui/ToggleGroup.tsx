import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { cn } from "@/lib/utils"; // Utility to merge class names (optional but common)

const ToggleGroup = ToggleGroupPrimitive.Root;

const ToggleGroupItem = ({
  className,
  ...props
}: ToggleGroupPrimitive.ToggleGroupItemProps) => {
  return (
    <ToggleGroupPrimitive.Item
      className={cn(
        "flex h-10 w-full items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium shadow-sm transition-all hover:bg-accent hover:text-accent-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground",
        className,
      )}
      {...props}
    />
  );
};

export { ToggleGroup, ToggleGroupItem };
