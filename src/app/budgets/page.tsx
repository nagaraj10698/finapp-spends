
'use client';
import { useMemo } from 'react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Budget, Transaction, Category } from '@/lib/types';
import BudgetCard from './budget-card';
import { getBudgets } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import AddBudgetDialog from './add-budget-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import BudgetForecastChart from './budget-forecast-chart';

export default function BudgetsPage() {
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
  
  const forecastData = useMemo(() => {
    return budgetsWithSpent.map(b => ({
      name: b.name,
      actual: b.spent ?? 0,
      expected: b.budgetAmount,
    }));
  }, [budgetsWithSpent]);


  if (budgetsLoading || transactionsLoading || categoriesLoading) {
    return <div>Loading budgets...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-semibold">Budgets</h1>
          <p className="text-muted-foreground">Set and track your monthly spending budgets.</p>
        </div>
        <AddBudgetDialog>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Budget
          </Button>
        </AddBudgetDialog>
      </div>
      
       {budgetsWithSpent && budgetsWithSpent.length > 0 ? (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Budget vs Actual</CardTitle>
                    <CardDescription>How your spending compares to your budgets this month.</CardDescription>
                </CardHeader>
                <CardContent>
                    <BudgetForecastChart data={forecastData} />
                </CardContent>
            </Card>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {budgetsWithSpent.map(budget => {
                const category = categories?.find(c => c.id === budget.categoryId);
                return <BudgetCard key={budget.id} budget={budget} category={category} />
            })}
            </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
            <h3 className="text-lg font-semibold text-muted-foreground">No budgets created yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">Get started by creating a new budget.</p>
             <AddBudgetDialog>
                <Button className="mt-6">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Budget
                </Button>
            </AddBudgetDialog>
        </div>
      )}
    </div>
  );
}
