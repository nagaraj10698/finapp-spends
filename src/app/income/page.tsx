import { getMockIncome } from '@/lib/data';
import { columns } from './columns';
import { DataTable } from '../transactions/data-table';
import AddIncomeDialog from '@/components/dashboard/add-income-dialog';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function IncomePage() {
  const data = getMockIncome();

  return (
    <div className="space-y-4">
       <div className="flex items-center justify-between">
        <h1 className="font-headline text-2xl font-semibold">Income</h1>
        <AddIncomeDialog>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Income
            </Button>
        </AddIncomeDialog>
       </div>
      <DataTable columns={columns} data={data} />
    </div>
  );
}
