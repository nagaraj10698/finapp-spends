
'use client';

import { useEffect, useState } from 'react';
import { columns } from './columns';
import { DataTable } from './data-table';
import { Transaction } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TransactionsPage() {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const storedTransactionsString = localStorage.getItem('processedTransactions');
    const storedTransactions = storedTransactionsString ? JSON.parse(storedTransactionsString).map((t: any) => ({...t, date: new Date(t.date)})) : [];

    const combined = [...storedTransactions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setAllTransactions(combined);
  }, []);

  return (
    <div className="space-y-4">
       <div className="flex items-center justify-between">
        <h1 className="font-headline text-2xl font-semibold">All Transactions</h1>
       </div>
      <DataTable columns={columns} data={allTransactions} />
    </div>
  );
}
