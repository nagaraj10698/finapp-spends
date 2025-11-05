
'use client';

import { useState } from 'react';
import TransactionUpload from "./transaction-upload";
import type { ProcessTransactionsOutput } from '@/lib/types';
import TransactionsTable from './transactions-table';

export default function TransactionsPage() {
    const [processedTransactions, setProcessedTransactions] = useState<ProcessTransactionsOutput['transactions']>([]);

    const handleTransactionsProcessed = (data: ProcessTransactionsOutput) => {
        setProcessedTransactions(data.transactions);
    };

    return (
        <div className="space-y-4">
            <div className="space-y-1">
                <h1 className="font-headline text-2xl font-semibold">Transactions</h1>
                <p className="text-muted-foreground">
                    Upload your bank statement to automatically categorize your transactions.
                </p>
            </div>
            <TransactionUpload onProcess={handleTransactionsProcessed} />
            {processedTransactions.length > 0 && (
                <TransactionsTable transactions={processedTransactions} />
            )}
        </div>
    );
}
