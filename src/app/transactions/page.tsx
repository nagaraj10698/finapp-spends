'use client';

import { useEffect, useState } from 'react';
import { getMockExpenses, getMockIncome } from '@/lib/data';
import { columns } from './columns';
import { DataTable } from './data-table';
import { Transaction } from '@/lib/types';

export default function TransactionsPage() {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const expenses = getMockExpenses().map(e => ({...e, type: 'expense' as const}));
    const income = getMockIncome().map(i => ({
        id: i.id,
        description: i.description,
        amount: i.amount,
        date: i.date,
        category: 'Income',
        type: 'income' as const
    }));
    
    const storedTransactionsString = localStorage.getItem('processedTransactions');
    const storedTransactions = storedTransactionsString ? JSON.parse(storedTransactionsString).map((t: any) => ({...t, date: new Date(t.date)})) : [];

    const combined = [...expenses, ...income, ...storedTransactions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
