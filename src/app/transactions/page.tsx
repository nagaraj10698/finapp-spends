import { getMockExpenses } from '@/lib/data';
import { columns } from './columns';
import { DataTable } from './data-table';
import AddExpenseDialog from './add-expense-dialog';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function TransactionsPage() {
  const data = getMockExpenses();

  return (
    <div className="space-y-4">
       <div className="flex items-center justify-between">
        <h1 className="font-headline text-2xl font-semibold">Transactions</h1>
        <AddExpenseDialog>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
        </AddExpenseDialog>
       </div>
      <DataTable columns={columns} data={data} />
    </div>
  );
}
