
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Transaction, Category } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { getCategoryByName, getIconByName } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, MoreHorizontal, Check, Circle, Edit, Trash2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DhiramSymbol } from '@/components/ui/dhiram-symbol';
import { Checkbox } from "@/components/ui/checkbox";
import StatusDropdown from './status-dropdown';


const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  

// This is a dynamic column definition that accepts categories
export const getColumns = (
    categories: Category[],
    onEdit: (transaction: Transaction) => void,
    onDelete: (transaction: Transaction) => void
    ): ColumnDef<Transaction>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'description',
    header: 'Description',
  },
  {
    accessorKey: 'category',
    header: 'Category',
    cell: ({ row }) => {
      const categoryName = row.getValue('category') as string;
      const category = getCategoryByName(categoryName, categories);
      const Icon = category ? getIconByName(category.icon) : null;
      if (!category || !Icon) {
        return <Badge variant="secondary">{categoryName}</Badge>;
      }
      return (
        <Badge variant="outline" className="flex w-fit items-center gap-2">
          <Icon className={cn('h-3 w-3', category.color)} />
          {categoryName}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: 'date',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.getValue('date') as Date;
      return <div className="text-left pl-4">{date.toLocaleDateString()}</div>;
    },
    filterFn: (row, id, value) => {
        const rowDate = new Date(row.getValue(id));
        const [from, to] = value as [Date, Date];
        return rowDate >= from && rowDate <= to;
    }
  },
   {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => {
      const type = row.getValue('type') as string;
       const label = type === 'income' ? 'Credit' : 'Debit';
      return <Badge variant={type === 'income' ? 'default' : 'destructive'} className="capitalize">{label}</Badge>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: 'status',
    header: 'Payment Status',
    cell: ({ row }) => {
      const transaction = row.original;
      if (transaction.type !== 'expense' || !transaction.status) return null;
      
      return <StatusDropdown transaction={transaction} />;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    id: 'bill',
    header: 'Bill',
    cell: ({ row }) => {
        const transaction = row.original;
        if (transaction.type !== 'expense') return null;

        const status = transaction.status;
        // The date from firestore might be a timestamp, so we convert it.
        const date = (transaction.date as any).toDate ? (transaction.date as any).toDate() : new Date(transaction.date as any);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Compare dates only

        let billStatus: 'Open' | 'Closed' | 'Overdue' | null = null;
        let badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' = 'secondary';
        let icon: React.ReactNode | null = null;

        if (status === 'Paid') {
            billStatus = 'Closed';
            badgeVariant = 'default';
            icon = <CheckCircle2 className="h-3 w-3" />;
        } else if (status === 'Un-paid') {
            if (date < today) {
                billStatus = 'Overdue';
                badgeVariant = 'destructive';
                icon = <XCircle className="h-3 w-3" />;
            } else {
                billStatus = 'Open';
                badgeVariant = 'outline';
                icon = <AlertCircle className="h-3 w-3" />;
            }
        }

        if (!billStatus) return null;

        return (
            <Badge variant={badgeVariant} className="flex w-fit items-center gap-1.5">
                {icon}
                {billStatus}
            </Badge>
        );
    },
  },
  {
    accessorKey: 'amount',
    header: ({ column }) => (
      <div className="text-right">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Amount
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('amount'));
      const formatted = formatCurrency(Math.abs(amount));

      return (
        <div
          className={cn(
            'text-right font-medium pr-4 flex items-center justify-end gap-1',
            amount < 0 ? 'text-red-500' : 'text-green-500'
          )}
        >
          <DhiramSymbol />
          {formatted}
        </div>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const transaction = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(transaction.id)}
            >
              Copy transaction ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit(transaction)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit transaction
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(transaction)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete transaction
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export const columns = getColumns([], () => {}, () => {}); // export a default
