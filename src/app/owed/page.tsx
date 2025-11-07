
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
import { isBefore, startOfToday } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import EditTransactionDialog from '@/app/transactions/edit-transaction-dialog';

export default function OwedPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isEditOpen, setEditOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);

  const transactionsCollection = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'users', user.uid, 'transactions') : null, [firestore, user]);
  const categoriesCollection = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'users', user.uid, 'categories') : null, [firestore, user]);
  
  const { data: allTransactions, isLoading: transactionsLoading } = useCollection<Transaction>(transactionsCollection);
  const { data: categories, isLoading: categoriesLoading } = useCollection<Category>(categoriesCollection);

  const { overdueDues, futureDues } = useMemo(() => {
    const allDues = getOwedExpenses(allTransactions);
    const today = startOfToday();
    const overdue: Owed[] = [];
    const future: Owed[] = [];

    allDues.forEach(due => {
      // Check if a payment for this specific instance has already been made
      const isPaid = allTransactions?.some(t => 
        !t.isRecurring &&
        t.description === due.description &&
        t.categoryId === due.categoryId &&
        isBefore(startOfToday(t.date as Date), startOfToday(due.instanceDate)) &&
        isBefore(startOfToday(due.instanceDate), endOfDay(t.date as Date))
      );

      if (isPaid) return; // Don't show paid dues

      if (isBefore(due.instanceDate, today)) {
        overdue.push(due);
      } else {
        future.push(due);
      }
    });

    // Sort both arrays by date
    overdue.sort((a, b) => a.instanceDate.getTime() - b.instanceDate.getTime());
    future.sort((a, b) => a.instanceDate.getTime() - b.instanceDate.getTime());
    
    return { overdueDues: overdue, futureDues: future };
  }, [allTransactions]);

  const hasDues = overdueDues.length > 0 || futureDues.length > 0;
  
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

  const handleEditRequest = (owed: Owed) => {
    // The 'owed' object is derived from a transaction, so we find the source.
    const sourceTransaction = allTransactions?.find(t => t.id === owed.id);
    if (sourceTransaction) {
        setTransactionToEdit(sourceTransaction);
        setEditOpen(true);
    }
  };


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
          <div className="space-y-8">
            {overdueDues.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-4">
                         <AlertTriangle className="h-6 w-6 text-destructive" />
                        <h2 className="font-headline text-xl font-semibold text-destructive">Overdue</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {overdueDues.map((owed) => {
                            const category = categories?.find(c => c.id === owed.categoryId);
                            const owedInstanceId = `${owed.id}-${owed.instanceDate.toISOString()}`;
                            return (
                                <OwedCard
                                    key={owedInstanceId}
                                    owed={owed}
                                    category={category}
                                    onPay={handlePayOwed}
                                    onEdit={() => handleEditRequest(owed)}
                                    isProcessing={processingId === owedInstanceId}
                                />
                            )
                        })}
                    </div>
                </div>
            )}
            {futureDues.length > 0 && (
                <div>
                    <h2 className="font-headline text-xl font-semibold mb-4">Upcoming Dues</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {futureDues.map((owed) => {
                            const category = categories?.find(c => c.id === owed.categoryId);
                            const owedInstanceId = `${owed.id}-${owed.instanceDate.toISOString()}`;
                            return (
                                <OwedCard
                                    key={owedInstanceId}
                                    owed={owed}
                                    category={category}
                                    onPay={handlePayOwed}
                                    onEdit={() => handleEditRequest(owed)}
                                    isProcessing={processingId === owedInstanceId}
                                />
                            )
                        })}
                    </div>
                </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
              <h3 className="text-lg font-semibold text-muted-foreground">No upcoming expenses</h3>
              <p className="mt-2 text-sm text-muted-foreground">You have no recurring expenses set up.</p>
          </div>
        )}
      </div>

       {transactionToEdit && (
        <EditTransactionDialog
          isOpen={isEditOpen}
          onClose={() => {
            setEditOpen(false);
            setTransactionToEdit(null);
          }}
          transaction={transactionToEdit}
        />
      )}
    </>
  );
}
