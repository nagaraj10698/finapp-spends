
'use client';
import { cn } from '@/lib/utils';
import Image from 'next/image';

function DefaultLogo() {
    return (
        <svg
            width="110"
            height="32"
            viewBox="0 0 110 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-auto"
        >
            <g clipPath="url(#clip0_123_456)">
            <path
                d="M5.19219 0.5H26.8078C30.3424 0.5 31.5 1.65764 31.5 5.19219V26.8078C31.5 30.3424 30.3424 31.5 26.8078 31.5H5.19219C1.65764 31.5 0.5 30.3424 0.5 26.8078V5.19219C0.5 1.65764 1.65764 0.5 5.19219 0.5Z"
                fill="hsl(var(--primary))"
            />
            <path
                d="M26.25 15.75V20.25C26.25 21.4926 25.2426 22.5 24 22.5H8.25C7.00736 22.5 6 21.4926 6 20.25V11.25C6 10.0074 7.00736 9 8.25 9H15"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M20.25 18.75C21.0784 18.75 21.75 18.0784 21.75 17.25C21.75 16.4216 21.0784 15.75 20.25 15.75C19.4216 15.75 18.75 16.4216 18.75 17.25C18.75 18.0784 19.4216 18.75 20.25 18.75Z"
                fill="white"
            />
            <path
                d="M9 13.5L14.25 18L18.75 12.75L22.5 16.5L25.5 10.5"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            </g>
            <text
            x="38"
            y="23"
            fontFamily="Space Grotesk, sans-serif"
            fontSize="22"
            fontWeight="bold"
            fill="hsl(var(--foreground))"
            className="font-headline"
            >
            Spends
            </text>
            <defs>
            <clipPath id="clip0_123_456">
                <rect width="32" height="32" fill="white" />
            </clipPath>
            </defs>
        </svg>
    )
}

export default function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
        <DefaultLogo />
    </div>
  );
}
