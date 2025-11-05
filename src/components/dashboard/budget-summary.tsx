
import type { Budget, Category } from '@/lib/types';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { getCategoryByName, getIconByName } from '@/lib/data';
import { DhiramSymbol } from '../ui/dhiram-symbol';

interface BudgetSummaryProps {
  budgets: Budget[];
  categories: Category[];
}

export default function BudgetSummary({ budgets, categories }: BudgetSummaryProps) {
  return (
    <div className="space-y-4">
      {budgets.map((budget) => {
        const category = getCategoryByName(budget.name, categories);
        const Icon = category ? getIconByName(category.icon) : null;
        const progress = (budget.spent / budget.limit) * 100;
        return (
          <div key={budget.id} className="space-y-1">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {category && Icon && <Icon className={cn("h-4 w-4", category.color)} />}
                <span className="font-medium">{budget.name}</span>
              </div>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <DhiramSymbol className="h-3 w-3" />{budget.spent.toFixed(0)} / <DhiramSymbol className="h-3 w-3" />{budget.limit}
              </span>
            </div>
            <Progress value={progress} />
          </div>
        );
      })}
    </div>
  );
}
