
'use client';

import { useEffect, useState, useMemo } from 'react';
import { getColumns } from './columns';
import { DataTable } from '@/components/ui/data-table';
import { Transaction, Category } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch, deleteDoc } from 'firebase/firestore';
import { DataTableToolbar } from './data-table-toolbar';
import AddTransactionDialog from './add-transaction-dialog';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import EditTransactionDialog from './edit-transaction-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export default function TransactionsPage() {
  const { toast } = useToast();
  const { firestore, user } = useFirebase();

  const transactionsCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'transactions') : null, [firestore, user]);
  const categoriesCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'categories') : null, [firestore, user]);
  
  const { data: allTransactions, isLoading: transactionsLoading } = useCollection<Transaction>(transactionsCollection);
  const { data: categories, isLoading: categoriesLoading } = useCollection<Category>(categoriesCollection);

  const [isEditOpen, setEditOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  const handleEdit = (transaction: Transaction) => {
    setTransactionToEdit(transaction);
    setEditOpen(true);
  };

  const handleDeleteRequest = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
  };

  const handleDeleteMany = async (transactionsToDelete: Transaction[]) => {
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
  const transactionData = useMemo(() => {
    if (!allTransactions) return [];
    return allTransactions
      .map(t => ({...t, date: (t.date as any).toDate()}))
      .sort((a,b) => b.date.getTime() - a.date.getTime())
  }, [allTransactions]);

  if (transactionsLoading || categoriesLoading) {
    return <div>Loading transactions...</div>;
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h1 className="font-headline text-2xl font-semibold">All Transactions</h1>
            <AddTransactionDialog>
                <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Transaction
                </Button>
            </AddTransactionDialog>
        </div>
        <DataTable columns={tableColumns} data={transactionData} toolbar={<DataTableToolbar onDelete={handleDeleteMany} categories={categories ?? []} />} />
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

    