
'use client';
import { cn } from "@/lib/utils";

// A utility component to render country flags based on their code
export function Flag({ code, className }: { code: string, className?: string }) {
    if (!code) return null;
    const flagUrl = `https://flagcdn.com/${code.toLowerCase()}.svg`;
    return (
        // Using an img tag with the CDN URL for simplicity.
        // For production apps, consider hosting these assets locally or using a more robust solution.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={flagUrl} alt={`${code} flag`} className={cn("w-6 h-auto", className)} />
    );
}
