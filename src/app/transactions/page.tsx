
'use client';

import { useEffect, useState, useMemo } from 'react';
import { columns } from './columns';
import { DataTable } from './data-table';
import { Transaction } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';

export default function TransactionsPage() {
  const { toast } = useToast();
  const { firestore, user } = useFirebase();

  const transactionsCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'transactions') : null, [firestore, user]);
  const { data: allTransactions, isLoading } = useCollection<Transaction>(transactionsCollection);

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

  const tableColumns = useMemo(() => columns, []);
  const transactionData = useMemo(() => allTransactions?.map(t => ({...t, date: (t.date as any).toDate()})) ?? [], [allTransactions]);

  if (isLoading) {
    return <div>Loading transactions...</div>;
  }

  return (
    <div className="space-y-4">
       <div className="flex items-center justify-between">
        <h1 className="font-headline text-2xl font-semibold">All Transactions</h1>
       </div>
      <DataTable columns={tableColumns} data={transactionData} onDelete={handleDelete} />
    </div>
  );
}
