
'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DataTable } from "../expenses/data-table";
import { columns } from "../transactions/columns";
import type { ProcessTransactionsOutput, Transaction } from "@/lib/types";

interface TransactionsTableProps {
    transactions: Transaction[];
}

export default function TransactionsTable({ transactions }: TransactionsTableProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Processed Transactions</CardTitle>
            </CardHeader>
            <CardContent>
                <DataTable columns={columns} data={transactions} />
            </CardContent>
        </Card>
    );
}
