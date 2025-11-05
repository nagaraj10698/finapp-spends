import { cn } from "@/lib/utils"

export function DhiramSymbol({ className }: { className?: string }) {
  return (
    <span className={cn("text-muted-foreground", className)}>AED</span>
  );
}
