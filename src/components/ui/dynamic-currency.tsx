
'use client';
import { useCurrency } from '@/components/providers/currency-provider';
import { cn } from '@/lib/utils';

interface DynamicCurrencyProps {
    amount: number;
    className?: string;
    type?: 'symbol' | 'code' | 'full';
}

export function DynamicCurrency({ amount, className, type = 'full' }: DynamicCurrencyProps) {
    const { currency, formatCurrency } = useCurrency();

    if (type === 'symbol') {
        return <span className={className}>{currency.symbol}</span>;
    }
    
    if (type === 'code') {
         return <span className={className}>{currency.code}</span>;
    }
    
    return <span className={className}>{formatCurrency(amount)}</span>;
}

export function CurrencySymbol({ className }: { className?: string }) {
    const { currency } = useCurrency();
    return <span className={cn("text-muted-foreground", className)}>{currency.symbol}</span>
}

