

import type { Budget, Category } from '@/lib/types';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { getBudgets, getIconByName } from '@/lib/data';
import { CurrencySymbol } from '../ui/dynamic-currency';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Transaction } from '@/lib/types';
import { useMemo } from 'react';

export default function BudgetSummary() {
    const { firestore, user } = useFirebase();
    const budgetsCollection = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'users', user.uid, 'budgets') : null, [firestore, user]);
    const transactionsCollection = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'users', user.uid, 'transactions') : null, [firestore, user]);
    const categoriesCollection = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'users', user.uid, 'categories') : null, [firestore, user]);

    const { data: allBudgets, isLoading: budgetsLoading } = useCollection<Budget>(budgetsCollection);
    const { data: allTransactions, isLoading: transactionsLoading } = useCollection<Transaction>(transactionsCollection);
    const { data: categories, isLoading: categoriesLoading } = useCollection<Category>(categoriesCollection);

    const budgetsWithSpent = useMemo(() => {
        return getBudgets(allBudgets, allTransactions);
    }, [allBudgets, allTransactions]);

    if (budgetsLoading || transactionsLoading || categoriesLoading) {
        return <div>Loading budgets...</div>;
    }
    
    if (!budgetsWithSpent || budgetsWithSpent.length === 0) {
        return <div className="text-sm text-muted-foreground">No budgets set yet.</div>;
    }


  return (
    <div className="space-y-4">
      {budgetsWithSpent.map((budget) => {
        const category = categories?.find(c => c.name === budget.category);
        const Icon = category ? getIconByName(category.icon) : null;
        const spent = budget.spent ?? 0;
        const limit = budget.limit ?? 0;
        const progress = limit > 0 ? (spent / limit) * 100 : 0;
        return (
          <div key={budget.id} className="space-y-1">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {category && Icon && <Icon className={cn("h-4 w-4", category.color)} />}
                <span className="font-medium">{budget.name}</span>
              </div>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <CurrencySymbol className="h-3 w-3" />{spent.toFixed(0)} / <CurrencySymbol className="h-3 w-3" />{limit}
              </span>
            </div>
            <Progress value={progress} />
          </div>
        );
      })}
    </div>
  );
}
