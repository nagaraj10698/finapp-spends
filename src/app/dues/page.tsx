
'use client';
import { useMemo } from 'react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, writeBatch } from 'firebase/firestore';
import type { Due, Transaction } from '@/lib/types';
import DueCard from './due-card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import AddDueDialog from './add-due-dialog';
import { useToast } from '@/hooks/use-toast';
import { generateDueInstances, toDate } from '@/lib/data';

export default function DuesPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  
  const duesCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'dues') : null, [firestore, user]);
  const transactionsCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'transactions') : null, [firestore, user]);

  const { data: dues, isLoading: duesLoading } = useCollection<Due>(duesCollection);
  const { data: transactions, isLoading: transactionsLoading } = useCollection<Transaction>(transactionsCollection);

  const handleTogglePaid = async (dueInstance: Due) => {
    if (!user || !firestore) return;
    
    // For recurring dues, we find the original due document
    // For one-time dues, the instance ID is the document ID
    const dueRef = doc(firestore, 'users', user.uid, 'dues', dueInstance.id);
    
    try {
        const batch = writeBatch(firestore);

        if (dueInstance.isPaid) {
            // Logic to handle "un-paying" is complex (e.g., delete the transaction)
            // For now, we'll prevent it and toast a message.
            toast({
                variant: 'destructive',
                title: 'Action Not Supported',
                description: 'Un-marking a due as paid is not currently supported.',
            });
            return;
        }

        // 1. Create a new transaction
        const newTransactionRef = doc(transactionsCollection!);
        const newTransaction: Omit<Transaction, 'id'> = {
            description: dueInstance.dueName,
            amount: -Math.abs(dueInstance.dueAmount),
            date: dueInstance.instanceDate || toDate(dueInstance.dueDate),
            category: dueInstance.category,
            categoryId: dueInstance.categoryId,
            type: 'expense',
        };
        batch.set(newTransactionRef, newTransaction);
        
        // 2. Update the original due document
        // We add the paid date to a map of paid instances for recurring dues
        if (dueInstance.isRecurring && dueInstance.instanceDate) {
            const instanceDateStr = dueInstance.instanceDate.toISOString().split('T')[0]; // YYYY-MM-DD
            batch.update(dueRef, {
                [`paidInstances.${instanceDateStr}`]: true
            });
        } else {
             batch.update(dueRef, { isPaid: true, paidDate: new Date() });
        }
        
        await batch.commit();

        toast({
            title: 'Due Paid!',
            description: `${dueInstance.dueName} marked as paid and an expense has been logged.`,
        });

    } catch (error) {
      console.error("Error marking due as paid:", error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Could not update the due.',
      });
    }
  };
  
  const dueInstances = useMemo(() => {
    if (!dues) return [];
    return generateDueInstances(dues);
  }, [dues]);


  if (duesLoading || transactionsLoading) {
    return <div>Loading dues...</div>;
  }

  const sortedDues = dueInstances
    ? [...dueInstances]
        .sort((a, b) => toDate(a.dueDate).getTime() - toDate(b.dueDate).getTime())
        .sort((a,b) => (a.isPaid === b.isPaid) ? 0 : a.isPaid ? 1 : -1)
    : [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="font-headline text-2xl font-semibold">Dues</h1>
            <p className="text-muted-foreground">Manage your upcoming bills and subscription dues.</p>
        </div>
        <AddDueDialog>
            <Button className="mt-4">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Due
            </Button>
        </AddDueDialog>
      </div>

      {sortedDues.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedDues.map((due, index) => (
                <DueCard key={`${due.id}-${index}`} due={due} onTogglePaid={handleTogglePaid} />
            ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
          <h3 className="text-lg font-semibold text-muted-foreground">No dues yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">Add a due to get started.</p>
          <AddDueDialog>
            <Button className="mt-6">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Due
            </Button>
          </AddDueDialog>
        </div>
      )}
    </div>
  );
}
