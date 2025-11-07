
'use client';
import { useMemo } from 'react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Owed, Transaction, Category } from '@/lib/types';
import OwedCard from './owed-card';
import { getOwedExpenses } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function OwedPage() {
  const { firestore, user } = useFirebase();

  const transactionsCollection = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'users', user.uid, 'transactions') : null, [firestore, user]);
  const categoriesCollection = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'users', user.uid, 'categories') : null, [firestore, user]);
  
  const { data: allTransactions, isLoading: transactionsLoading } = useCollection<Transaction>(transactionsCollection);
  const { data: categories, isLoading: categoriesLoading } = useCollection<Category>(categoriesCollection);

  const upcomingDues = useMemo(() => {
    return getOwedExpenses(allTransactions);
  }, [allTransactions]);

  const hasDues = upcomingDues && upcomingDues.length > 0;
  
  if (transactionsLoading || categoriesLoading) {
    return <div>Loading owed expenses...</div>;
  }

  return (
    <>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="font-headline text-2xl font-semibold">Owed</h1>
            <p className="text-muted-foreground">A list of your upcoming recurring expenses.</p>
          </div>
        </div>
        
        {hasDues ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {upcomingDues.map((owed, index) => {
                const category = categories?.find(c => c.id === owed.categoryId);
                return (
                    <OwedCard
                        key={`${owed.id}-${index}`}
                        owed={owed}
                        category={category}
                    />
                )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
              <h3 className="text-lg font-semibold text-muted-foreground">No upcoming expenses</h3>
              <p className="mt-2 text-sm text-muted-foreground">You have no recurring expenses set up.</p>
          </div>
        )}
      </div>
    </>
  );
}
