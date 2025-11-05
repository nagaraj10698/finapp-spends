import { cn } from "@/lib/utils"

export function DhiramSymbol({ className }: { className?: string }) {
  return (
    <svg
      className={cn("inline-block h-4 w-4 fill-current", className)}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      strokeWidth="0.5"
      fill="currentColor"
    >
        <path d="M15.2,5.2H8.8V2.8h10.8v18.4H8.8V18.8h6.4c3.3,0,6-2.7,6-6V11.2C21.2,7.9,18.5,5.2,15.2,5.2z M18.8,11.2v2.4 c0,1.9-1.6,3.6-3.6,3.6H8.8V8h6.4C17.2,8,18.8,9.4,18.8,11.2z" />
        <path d="M6 10.1c4.6-0.4 9.2-0.4 13.8 0v1.2c-4.6 0.4-9.2 0.4-13.8 0v-1.2z" />
        <path d="M6 12.8c4.6-0.4 9.2-0.4 13.8 0v1.2c-4.6 0.4-9.2 0.4-13.8 0v-1.2z" />
    </svg>
  );
}
