
'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DataTable } from "../expenses/data-table";
import { columns } from "../expenses/columns";
import type { ProcessTransactionsOutput, Transaction } from "@/lib/types";

interface TransactionsTableProps {
    transactions: ProcessTransactionsOutput['transactions'];
}

export default function TransactionsTable({ transactions }: TransactionsTableProps) {
    const tableData: Transaction[] = transactions.map((t, i) => ({
        id: `${t.description}-${t.date}-${t.amount}-${i}`,
        description: t.description,
        amount: t.amount,
        date: new Date(t.date),
        category: t.category,
    }));

    return (
        <Card>
            <CardHeader>
                <CardTitle>Processed Transactions</CardTitle>
            </CardHeader>
            <CardContent>
                <DataTable columns={columns} data={tableData} />
            </CardContent>
        </Card>
    );
}
