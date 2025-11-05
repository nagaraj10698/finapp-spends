import type { Transaction } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getCategoryByName } from '@/lib/data';
import { cn } from '@/lib/utils';
import { DhiramSymbol } from '../ui/dhiram-symbol';

interface UpcomingBillsProps {
  bills: Transaction[];
}

export default function UpcomingBills({ bills }: UpcomingBillsProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Description</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bills.map((bill) => {
          const category = getCategoryByName(bill.category);
          return (
            <TableRow key={bill.id}>
              <TableCell className="font-medium">
                {bill.description}
              </TableCell>
              <TableCell>
                {category && (
                    <span className={cn('text-sm', category.color)}>
                        {bill.category}
                    </span>
                )}
              </TableCell>
              <TableCell className="text-right flex items-center justify-end gap-1">
                <DhiramSymbol />{Math.abs(bill.amount).toFixed(2)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
