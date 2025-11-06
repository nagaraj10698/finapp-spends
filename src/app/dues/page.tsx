
'use client';
import { useMemo, useState } from 'react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, writeBatch } from 'firebase/firestore';
import type { Due, Transaction, Category } from '@/lib/types';
import { Button, buttonVariants } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import AddDueDialog from './add-due-dialog';
import { useToast } from '@/hooks/use-toast';
import { generateDueInstances, toDate } from '@/lib/data';
import { DataTable } from '@/components/ui/data-table';
import { getColumns } from './columns';
import { DataTableToolbar } from './data-table-toolbar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

export default function DuesPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  
  const duesCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'dues') : null, [firestore, user]);
  const transactionsCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'transactions') : null, [firestore, user]);
  const categoriesCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'categories') : null, [firestore, user]);

  const { data: dues, isLoading: duesLoading } = useCollection<Due>(duesCollection);
  const { data: transactions, isLoading: transactionsLoading } = useCollection<Transaction>(transactionsCollection);
  const { data: categories, isLoading: categoriesLoading } = useCollection<Category>(categoriesCollection);

  const [dueToPay, setDueToPay] = useState<Due | null>(null);

  const handlePaymentRequest = (due: Due) => {
    if (due.isPaid) {
       toast({
        variant: 'destructive',
        title: 'Already Paid',
        description: 'This due has already been marked as paid.',
      });
      return;
    }
    setDueToPay(due);
  }

  const handleConfirmPayment = async () => {
    if (!dueToPay || !user || !firestore || !transactionsCollection) return;
    
    const dueInstance = dueToPay;
    const dueRef = doc(firestore, 'users', user.uid, 'dues', dueInstance.id);
    
    try {
        const batch = writeBatch(firestore);

        // 1. Create a new transaction
        const newTransactionRef = doc(transactionsCollection);
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
        if (dueInstance.isRecurring && dueInstance.instanceDate) {
            const instanceDateStr = toDate(dueInstance.instanceDate).toISOString().split('T')[0]; // YYYY-MM-DD
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
    } finally {
        setDueToPay(null);
    }
  };
  
  const dueInstances = useMemo(() => {
    if (!dues) return [];
    return generateDueInstances(dues);
  }, [dues]);

  const tableColumns = useMemo(() => getColumns(categories ?? [], handlePaymentRequest), [categories]);


  if (duesLoading || transactionsLoading || categoriesLoading) {
    return <div>Loading dues...</div>;
  }

  return (
    <>
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

      {dueInstances.length > 0 ? (
        <DataTable columns={tableColumns} data={dueInstances} toolbar={<DataTableToolbar categories={categories?.filter(c => c.type === 'expense') ?? []} />} />
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

     <AlertDialog open={!!dueToPay} onOpenChange={(open) => !open && setDueToPay(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirm Payment</AlertDialogTitle>
                <AlertDialogDescription>
                    This will mark <span className='font-bold'>&quot;{dueToPay?.dueName}&quot;</span> as paid and create a corresponding expense entry. This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDueToPay(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmPayment}>
                    Mark as Paid
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
