
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Transaction, Category } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { getCategoryByName, getIconByName } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, MoreHorizontal, Check, Circle, Edit, Trash2 } from 'lucide-react';
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
import { updateTransactionStatus } from '../actions';
import { useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { doc, deleteDoc } from 'firebase/firestore';


const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  
const StatusDropdown = ({ transaction }: { transaction: Transaction }) => {
    const { user } = useFirebase();
    const { toast } = useToast();
  
    const handleStatusChange = async (status: 'Paid' | 'Un-paid') => {
      if (!user) return;
      
      const result = await updateTransactionStatus(transaction.id, status, user.uid);
      if (result.success) {
        toast({
          title: "Status Updated",
          description: `Transaction status changed to ${status}.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Update Failed",
          description: result.error,
        });
      }
    };
  
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
           <Button
            variant="outline"
            size="sm"
            className={cn(
                "h-8 capitalize w-20 justify-start",
                transaction.status === 'Paid' 
                ? 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100 hover:text-green-800' 
                : 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100 hover:text-red-800'
            )}
            >
            <span className='flex items-center gap-2'>
                {transaction.status === 'Paid' ? <Check className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                {transaction.status}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Change Status</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => handleStatusChange('Paid')}>
            <Check className="mr-2 h-4 w-4" />
            Paid
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handleStatusChange('Un-paid')}>
            <Circle className="mr-2 h-4 w-4" />
            Un-paid
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
};

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
    header: 'Status',
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

    