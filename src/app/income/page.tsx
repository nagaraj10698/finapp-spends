
'use client';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/ui/data-table';
import AddIncomeDialog from '@/components/dashboard/add-income-dialog';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import type { Transaction, Income, Category } from '@/lib/types';
import { collection, writeBatch, doc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { DataTableToolbar } from './data-table-toolbar';
import { getColumns } from '../transactions/columns';
import EditTransactionDialog from '../transactions/edit-transaction-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { columns as incomeColumns } from './columns';


export default function IncomePage() {
  const { toast } = useToast();
  const { firestore, user } = useFirebase();

  const transactionsCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'transactions') : null, [firestore, user]);
  const categoriesCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'categories') : null, [firestore, user]);

  const { data: allTransactions, isLoading: transactionsLoading } = useCollection<Transaction>(transactionsCollection);
  const { data: categories, isLoading: categoriesLoading } = useCollection<Category>(categoriesCollection);

  const [isEditOpen, setEditOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  const incomeData = useMemo(() => {
    if (!allTransactions) return [];
    return allTransactions
        .filter(t => t.type === 'income')
        .map(t => ({ ...t, date: (t.date as any).toDate() }))
        .sort((a,b) => b.date.getTime() - a.date.getTime());
    }, [allTransactions]);

  const handleEdit = (transaction: Transaction) => {
    setTransactionToEdit(transaction);
    setEditOpen(true);
  };

  const handleDeleteRequest = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
  };

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

  const handleDeleteConfirm = async () => {
    if (!transactionToDelete || !user || !firestore) return;
    try {
      await deleteDoc(doc(firestore, 'users', user.uid, 'transactions', transactionToDelete.id));
      toast({
        title: 'Transaction Deleted',
        description: `The transaction has been deleted.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: 'Could not delete the transaction.',
      });
    } finally {
      setTransactionToDelete(null);
    }
  };
  
  const tableColumns = useMemo(() => getColumns(categories ?? [], handleEdit, handleDeleteRequest), [categories]);


  if (transactionsLoading || categoriesLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
    <div className="space-y-4">
       <div className="flex items-center justify-between">
        <h1 className="font-headline text-2xl font-semibold">Income</h1>
        <AddIncomeDialog>
            <Button className="mt-4">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Income
            </Button>
        </AddIncomeDialog>
       </div>
      <DataTable columns={tableColumns} data={incomeData} toolbar={<DataTableToolbar onDelete={handleDelete as any}/>} />
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

    <AlertDialog open={!!transactionToDelete} onOpenChange={(open) => !open && setTransactionToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to delete this transaction?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the transaction.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setTransactionToDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteConfirm} className={cn(buttonVariants({variant: 'destructive'}))}>
                    Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
