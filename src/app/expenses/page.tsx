
'use client';

import { useMemo } from 'react';
import { columns } from '../transactions/columns';
import { DataTable } from '../transactions/data-table';
import AddExpenseDialog from './add-expense-dialog';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import type { Transaction } from '@/lib/types';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function ExpensesPage() {
    const { toast } = useToast();
    const { firestore, user } = useFirebase();

    const transactionsCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'transactions') : null, [firestore, user]);
    const { data: allTransactions, isLoading } = useCollection<Transaction>(transactionsCollection);

    const expenseData = useMemo(() => {
        if (!allTransactions) return [];
        return allTransactions
            .filter(t => t.type === 'expense')
            .map(t => ({ ...t, date: (t.date as any).toDate() }))
            .sort((a,b) => b.date.getTime() - a.date.getTime());
    }, [allTransactions]);
    
    const handleDelete = async (transactionsToDelete: Transaction[]) => {
        if (!user || !firestore || transactionsToDelete.length === 0) return;

        const batch = writeBatch(firestore);
        transactionsToDelete.forEach(transaction => {
        const docRef = doc(firestore, 'users', user.uid, 'transactions', transaction.id);
        batch.delete(docRef);
        });

        try {
        await batch.commit();
        toast({
            title: "Transactions Deleted",
            description: `${transactionsToDelete.length} transaction(s) have been deleted.`,
        });
        } catch (error) {
        toast({
            variant: "destructive",
            title: "Error Deleting Transactions",
            description: "An error occurred while deleting transactions.",
        });
        console.error("Error deleting transactions: ", error);
        }
    };


    if (isLoading) {
        return <div>Loading...</div>;
    }

  return (
    <div className="space-y-4">
       <div className="flex items-center justify-between">
        <h1 className="font-headline text-2xl font-semibold">Expenses</h1>
        <AddExpenseDialog>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
        </AddExpenseDialog>
       </div>
      <DataTable columns={columns} data={expenseData} onDelete={handleDelete} />
    </div>
  );
}
