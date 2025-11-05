
'use client';
import { useMemo } from 'react';
import { columns } from './columns';
import { DataTable } from '@/components/ui/data-table';
import AddIncomeDialog from '@/components/dashboard/add-income-dialog';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import type { Transaction, Income } from '@/lib/types';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { DataTableToolbar } from './data-table-toolbar';


export default function IncomePage() {
  const { toast } = useToast();
  const { firestore, user } = useFirebase();

  const transactionsCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'transactions') : null, [firestore, user]);
  const { data: allTransactions, isLoading } = useCollection<Transaction>(transactionsCollection);

  const incomeData = useMemo(() => {
    if (!allTransactions) return [];
    return allTransactions
        .filter(t => t.type === 'income')
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
        <h1 className="font-headline text-2xl font-semibold">Income</h1>
        <AddIncomeDialog>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Income
            </Button>
        </AddIncomeDialog>
       </div>
      <DataTable columns={columns} data={incomeData as unknown as Income[]} toolbar={<DataTableToolbar onDelete={handleDelete as any}/>} />
    </div>
  );
}
