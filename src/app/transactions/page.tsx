
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toDate } from '@/lib/data';


export default function TransactionsPage() {
  const { toast } = useToast();
  const { firestore, user } = useFirebase();

  const transactionsCollection = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'users', user.uid, 'transactions') : null, [firestore, user]);
  const categoriesCollection = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'users', user.uid, 'categories') : null, [firestore, user]);
  
  const { data: allTransactions, isLoading: transactionsLoading } = useCollection<Transaction>(transactionsCollection);
  const { data: categories, isLoading: categoriesLoading } = useCollection<Category>(categoriesCollection);

  const [isEditOpen, setEditOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [transactionsToDelete, setTransactionsToDelete] = useState<Transaction[] | null>(null);

  
  const handleEdit = (transaction: Transaction) => {
    setTransactionToEdit(transaction);
    setEditOpen(true);
  };

  const handleDeleteRequest = (transactions: Transaction[]) => {
    setTransactionsToDelete(transactions);
  };
  
  const handleDeleteConfirm = async () => {
    if (!transactionsToDelete || !user || !firestore) return;

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
    } finally {
        setTransactionsToDelete(null);
    }
  };

  const tableColumns = useMemo(() => getColumns(categories ?? [], handleEdit, (t) => handleDeleteRequest([t])), [categories]);
  
  const transactionData = useMemo(() => {
    if (!allTransactions) return [];
    return allTransactions
      .map(t => ({...t, date: toDate(t.date)}))
      .sort((a,b) => b.date.getTime() - a.date.getTime())
  }, [allTransactions]);

  const incomeData = useMemo(() => transactionData.filter(t => t.type === 'income'), [transactionData]);
  const expenseData = useMemo(() => transactionData.filter(t => t.type === 'expense'), [transactionData]);
  
  const incomeCategories = useMemo(() => categories?.filter(c => c.type === 'income') ?? [], [categories]);
  const expenseCategories = useMemo(() => categories?.filter(c => c.type === 'expense') ?? [], [categories]);

  if (transactionsLoading || categoriesLoading) {
    return <div>Loading transactions...</div>;
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h1 className="font-headline text-2xl font-semibold">Transactions</h1>
            <AddTransactionDialog>
                <Button className="mt-4">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Transaction
                </Button>
            </AddTransactionDialog>
        </div>
        
        <Card>
            <CardContent className="p-0">
                <Tabs defaultValue="all">
                    <div className="p-4 border-b">
                        <TabsList>
                            <TabsTrigger value="all">All Transactions</TabsTrigger>
                            <TabsTrigger value="income">Income</TabsTrigger>
                            <TabsTrigger value="expenses">Expenses</TabsTrigger>
                        </TabsList>
                    </div>
                    <TabsContent value="all" className="p-4">
                         <DataTable columns={tableColumns} data={transactionData} toolbar={<DataTableToolbar onDelete={handleDeleteRequest} categories={categories ?? []} />} />
                    </TabsContent>
                    <TabsContent value="income" className="p-4">
                        <DataTable columns={tableColumns} data={incomeData} toolbar={<DataTableToolbar onDelete={handleDeleteRequest} categories={incomeCategories} />} />
                    </TabsContent>
                    <TabsContent value="expenses" className="p-4">
                         <DataTable columns={tableColumns} data={expenseData} toolbar={<DataTableToolbar onDelete={handleDeleteRequest} categories={expenseCategories} />} />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
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

      <AlertDialog open={!!transactionsToDelete} onOpenChange={(open) => !open && setTransactionsToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to delete this?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete {transactionsToDelete?.length} transaction(s).
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setTransactionsToDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteConfirm} className={cn(buttonVariants({variant: 'destructive'}))}>
                    Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
