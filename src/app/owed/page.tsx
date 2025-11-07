
'use client';
import { useMemo, useState } from 'react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Owed, Transaction, Category } from '@/lib/types';
import OwedCard from './owed-card';
import { getOwedExpenses } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { processOwedPayment } from '../actions';

export default function OwedPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const transactionsCollection = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'users', user.uid, 'transactions') : null, [firestore, user]);
  const categoriesCollection = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'users', user.uid, 'categories') : null, [firestore, user]);
  
  const { data: allTransactions, isLoading: transactionsLoading } = useCollection<Transaction>(transactionsCollection);
  const { data: categories, isLoading: categoriesLoading } = useCollection<Category>(categoriesCollection);

  const upcomingDues = useMemo(() => {
    return getOwedExpenses(allTransactions);
  }, [allTransactions]);

  const hasDues = upcomingDues && upcomingDues.length > 0;
  
  const handlePayOwed = async (owed: Owed) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
        return;
    }
    const owedInstanceId = `${owed.id}-${owed.instanceDate.toISOString()}`;
    setProcessingId(owedInstanceId);
    try {
        await processOwedPayment(user.uid, owed);
        toast({ title: 'Payment Processed', description: `${owed.description} has been marked as paid and a transaction was created.`});
    } catch (error) {
        console.error("Failed to process payment:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to process payment.' });
    } finally {
        setProcessingId(null);
    }
  }


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
                const owedInstanceId = `${owed.id}-${owed.instanceDate.toISOString()}`;
                return (
                    <OwedCard
                        key={owedInstanceId}
                        owed={owed}
                        category={category}
                        onPay={handlePayOwed}
                        isProcessing={processingId === owedInstanceId}
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
