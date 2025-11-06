
'use client';
import { useMemo, useState } from 'react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import type { Budget, Transaction, Category } from '@/lib/types';
import BudgetCard from './budget-card';
import { getBudgets } from '@/lib/data';
import { Button, buttonVariants } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import AddBudgetDialog from './add-budget-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import BudgetForecastChart from './budget-forecast-chart';
import EditBudgetDialog from './edit-budget-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function BudgetsPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const [isEditOpen, setEditOpen] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState<Budget | null>(null);
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);

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

  const handleEditRequest = (budget: Budget) => {
    setBudgetToEdit(budget);
    setEditOpen(true);
  };

  const handleDeleteRequest = (budget: Budget) => {
    setBudgetToDelete(budget);
  };

  const handleDeleteConfirm = async () => {
    if (!budgetToDelete || !user || !firestore) return;
    try {
      await deleteDoc(doc(firestore, 'users', user.uid, 'budgets', budgetToDelete.id));
      toast({
        title: 'Budget Deleted',
        description: `The budget for "${budgetToDelete.name}" has been deleted.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Could not delete the budget.",
      });
    } finally {
      setBudgetToDelete(null);
    }
  };


  if (budgetsLoading || transactionsLoading || categoriesLoading) {
    return <div>Loading budgets...</div>;
  }

  return (
    <>
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
                  return (
                    <BudgetCard 
                      key={budget.id} 
                      budget={budget} 
                      category={category} 
                      onEdit={() => handleEditRequest(budget)}
                      onDelete={() => handleDeleteRequest(budget)}
                    />
                  )
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

      {budgetToEdit && (
        <EditBudgetDialog 
          isOpen={isEditOpen}
          onClose={() => {
            setEditOpen(false);
            setBudgetToEdit(null);
          }}
          budget={budgetToEdit}
        />
      )}

      <AlertDialog open={!!budgetToDelete} onOpenChange={(open) => !open && setBudgetToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to delete this budget?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the budget for 
                    <span className="font-bold"> &quot;{budgetToDelete?.name}&quot;</span>.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setBudgetToDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteConfirm} className={cn(buttonVariants({variant: 'destructive'}))}>
                    Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
