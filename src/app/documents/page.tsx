
'use client';

import { useState } from 'react';
import DocumentList from "./document-list";
import TransactionUpload from '../transactions/transaction-upload';
import type { ProcessTransactionsOutput } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function DocumentsPage() {
    const { toast } = useToast();
    const router = useRouter();
    // This state is to trigger a re-render of DocumentList when new files are added.
    const [_, setUploadedFilesVersion] = useState(0);


    const handleTransactionsProcessed = (data: ProcessTransactionsOutput) => {
        setUploadedFilesVersion(v => v + 1);
        toast({
            title: "Processing Complete",
            description: `Successfully processed ${data.transactions.length} transactions.`,
            action: (
                <Button onClick={() => router.push('/transactions')}>
                    View Transactions
                </Button>
            ),
        });
    };

    return (
        <div className="space-y-4">
            <div className="space-y-1">
                <h1 className="font-headline text-2xl font-semibold">Documents</h1>
                <p className="text-muted-foreground">
                    Upload your bank statements to automatically categorize your transactions, and manage your uploaded documents.
                </p>
            </div>
            <TransactionUpload onProcess={handleTransactionsProcessed} />
            <DocumentList key={_} />
        </div>
    );
}
