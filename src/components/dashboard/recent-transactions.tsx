import type { Transaction } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getCategoryByName } from '@/lib/data';
import { cn } from '@/lib/utils';
import { DhiramSymbol } from '../ui/dhiram-symbol';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export default function RecentTransactions({
  transactions,
}: RecentTransactionsProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Description</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="hidden sm:table-cell">Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => {
          const category = getCategoryByName(transaction.category);
          const amount = transaction.amount;
          return (
            <TableRow key={transaction.id}>
              <TableCell className="font-medium">
                {transaction.description}
              </TableCell>
              <TableCell>
                {category && (
                  <Badge
                    variant="outline"
                    className="flex w-fit items-center gap-2"
                  >
                    <category.icon className={cn('h-3 w-3', category.color)} />
                    {transaction.category}
                  </Badge>
                )}
              </TableCell>
              <TableCell className={cn("text-right flex items-center justify-end gap-1", amount < 0 ? 'text-red-500' : 'text-green-500')}>
                <DhiramSymbol />{Math.abs(amount).toFixed(2)}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {transaction.date.toLocaleDateString()}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
