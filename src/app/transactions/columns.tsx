
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Transaction } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { getCategoryByName, categories } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DhiramSymbol } from '@/components/ui/dhiram-symbol';
import { Checkbox } from "@/components/ui/checkbox"

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

export const columns: ColumnDef<Transaction>[] = [
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
      const category = getCategoryByName(categoryName);
      if (!category) {
        return <Badge variant="secondary">{categoryName}</Badge>;
      }
      return (
        <Badge variant="outline" className="flex w-fit items-center gap-2">
          <category.icon className={cn('h-3 w-3', category.color)} />
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
      return <div className="pl-4">{date.toLocaleDateString()}</div>;
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
    accessorKey: 'credit',
    header: () => <div className="text-right">Credit</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.original.amount as any);
      if (amount <= 0) return null;
      const formatted = formatCurrency(amount);
      return (
        <div className="text-right font-medium text-green-500 pr-4 flex items-center justify-end gap-1">
          <DhiramSymbol />{formatted}
        </div>
      );
    }
  },
    {
    accessorKey: 'debit',
    header: () => <div className="text-right">Debit</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.original.amount as any);
      if (amount >= 0) return null;
      const formatted = formatCurrency(Math.abs(amount));
      return (
        <div className="text-right font-medium text-red-500 pr-4 flex items-center justify-end gap-1">
          <DhiramSymbol />{formatted}
        </div>
      );
    }
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
            <DropdownMenuItem>Edit transaction</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              Delete transaction
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
