
'use client';

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { currencies, getCurrency, type Currency } from '@/lib/currencies';
import { Skeleton } from '../ui/skeleton';

interface CurrencyContextType {
  currency: Currency;
  formatCurrency: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { firestore, user } = useFirebase();

  const userDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userProfile, isLoading } = useDoc<UserProfile>(userDocRef);

  const currency = useMemo(() => {
    return getCurrency(userProfile?.currency) ?? currencies[0];
  }, [userProfile]);

  const formatCurrency = (amount: number) => {
    const formattedAmount = new Intl.NumberFormat(undefined, {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    return `${currency.code} ${formattedAmount}`;
  };

  const value = useMemo(() => ({
    currency,
    formatCurrency,
  }), [currency, formatCurrency]);

  if (isLoading) {
    return (
        // You might want to show a loading state for the whole app
        <div className="flex min-h-screen items-center justify-center">
            <Skeleton className="h-8 w-1/2" />
        </div>
    );
  }

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextType {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
