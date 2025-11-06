
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Due, Category } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { getCategoryByName, getIconByName, toDate } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, MoreHorizontal, Check, AlertTriangle } from 'lucide-react';
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
import { format, isBefore, startOfToday } from 'date-fns';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  
const StatusCell = ({ row }: { row: any }) => {
    const due = row.original as Due;
    const displayDate = due.instanceDate ? toDate(due.instanceDate) : toDate(due.dueDate);
    const isOverdue = !due.isPaid && isBefore(displayDate, startOfToday());

    if (due.isPaid) {
        return <Badge variant="secondary">Paid</Badge>
    }
    if (isOverdue) {
        return <Badge variant="destructive" className='gap-1.5'><AlertTriangle className='h-3 w-3'/>Overdue</Badge>
    }
    return <Badge variant="outline" className='border-primary text-primary'>Upcoming</Badge>
}

// This is a dynamic column definition that accepts categories
export const getColumns = (
    categories: Category[],
    onPay: (due: Due) => void,
    ): ColumnDef<Due>[] => [
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
    accessorKey: 'dueName',
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
  },
  {
    accessorKey: 'dueDate',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Due Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const due = row.original;
      const date = due.instanceDate ? toDate(due.instanceDate) : toDate(due.dueDate);
      return <div className="text-left pl-4">{format(date, 'LLL dd, yyyy')}</div>;
    },
  },
   {
    id: 'status',
    header: 'Status',
    cell: StatusCell,
  },
  {
    accessorKey: 'dueAmount',
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
      const amount = parseFloat(row.getValue('dueAmount'));
      const formatted = formatCurrency(Math.abs(amount));

      return (
        <div className={'text-right font-medium pr-4 flex items-center justify-end gap-1'}>
          <DhiramSymbol />
          {formatted}
        </div>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const due = row.original;

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
            <DropdownMenuItem onClick={() => onPay(due)} disabled={due.isPaid}>
                <Check className="mr-2 h-4 w-4" />
                Mark as Paid
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
