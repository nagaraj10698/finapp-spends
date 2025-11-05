
'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import type { ProcessTransactionsOutput } from "@/lib/types";

interface TransactionsTableProps {
    transactions: ProcessTransactionsOutput['transactions'];
}

export default function TransactionsTable({ transactions }: TransactionsTableProps) {
    const tableData = transactions.map(t => ({
        id: t.description + t.date + t.amount,
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
