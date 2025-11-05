import type { Budget } from '@/lib/types';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { getCategoryByName } from '@/lib/data';

interface BudgetSummaryProps {
  budgets: Budget[];
}

export default function BudgetSummary({ budgets }: BudgetSummaryProps) {
  return (
    <div className="space-y-4">
      {budgets.map((budget) => {
        const category = getCategoryByName(budget.name);
        const progress = (budget.spent / budget.limit) * 100;
        return (
          <div key={budget.id} className="space-y-1">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {category && <category.icon className={cn("h-4 w-4", category.color)} />}
                <span className="font-medium">{budget.name}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                د.إ{budget.spent.toFixed(0)} / د.إ{budget.limit}
              </span>
            </div>
            <Progress value={progress} />
          </div>
        );
      })}
    </div>
  );
}
