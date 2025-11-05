
'use client';
import { useMemo } from 'react';
import { getBudgets } from '@/lib/data';
import BudgetCard from './budget-card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import AddBudgetDialog from './add-budget-dialog';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Budget, Transaction, Category } from '@/lib/types';


export default function BudgetsPage() {
  const { firestore, user } = useFirebase();
  const budgetsCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'budgets') : null, [firestore, user]);
  const transactionsCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'transactions') : null, [firestore, user]);
  const categoriesCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'categories') : null, [firestore, user]);
  
  const { data: budgets, isLoading: budgetsLoading } = useCollection<Budget>(budgetsCollection);
  const { data: transactions, isLoading: transactionsLoading } = useCollection<Transaction>(transactionsCollection);
  const { data: categories, isLoading: categoriesLoading } = useCollection<Category>(categoriesCollection);

  const processedBudgets = useMemo(() => {
    if (!budgets) return [];
    return getBudgets(budgets, transactions);
  }, [budgets, transactions]);


  if (budgetsLoading || transactionsLoading || categoriesLoading) {
    return <div>Loading budgets...</div>;
  }

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
        {processedBudgets.map((budget) => {
          const category = categories?.find(c => c.name === budget.category);
          return (
            <BudgetCard key={budget.id} budget={budget} category={category} />
          )
        })}
      </div>
    </div>
  );
}
