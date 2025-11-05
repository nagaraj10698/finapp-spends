
'use client';

import { useEffect, useState, useMemo } from 'react';
import { columns } from './columns';
import { DataTable } from './data-table';
import { Transaction } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { parseISO } from 'date-fns';

export default function TransactionsPage() {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const storedTransactionsString = localStorage.getItem('processedTransactions');
    if (storedTransactionsString) {
      try {
        const storedTransactions = JSON.parse(storedTransactionsString).map((t: any) => ({...t, date: parseISO(t.date)}));
        const sorted = [...storedTransactions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setAllTransactions(sorted);
      } catch (e) {
        console.error("Failed to parse transactions from localStorage", e);
        setAllTransactions([]);
      }
    }
  }, []);

  const handleDelete = (transactionsToDelete: Transaction[]) => {
    const updatedTransactions = allTransactions.filter(
      (t) => !transactionsToDelete.some(toDelete => toDelete.id === t.id)
    );
    setAllTransactions(updatedTransactions);
    localStorage.setItem('processedTransactions', JSON.stringify(updatedTransactions));
    toast({
      title: "Transactions Deleted",
      description: `${transactionsToDelete.length} transaction(s) have been deleted.`,
    });
  };

  const tableColumns = useMemo(() => columns, []);

  return (
    <div className="space-y-4">
       <div className="flex items-center justify-between">
        <h1 className="font-headline text-2xl font-semibold">All Transactions</h1>
       </div>
      <DataTable columns={tableColumns} data={allTransactions} onDelete={handleDelete} />
    </div>
  );
}
