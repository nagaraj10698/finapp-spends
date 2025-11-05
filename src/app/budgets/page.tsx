import { getBudgets } from '@/lib/data';
import BudgetCard from './budget-card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import AddBudgetDialog from './add-budget-dialog';

export default function BudgetsPage() {
  const budgets = getBudgets();

  return (
    <div className="space-y-4">
       <div className="flex items-center justify-between">
        <h1 className="font-headline text-2xl font-semibold">Budgets</h1>
        <AddBudgetDialog>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Budget
          </Button>
        </AddBudgetDialog>
       </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {budgets.map((budget) => (
          <BudgetCard key={budget.id} budget={budget} />
        ))}
      </div>
    </div>
  );
}
