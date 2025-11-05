import { Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Wallet className="h-6 w-6 text-primary" />
      <span className="font-headline text-xl font-bold">Spends</span>
    </div>
  );
}
