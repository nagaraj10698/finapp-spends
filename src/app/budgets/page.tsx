
'use client';
import { useMemo, useState } from 'react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import type { Budget, Transaction, Category } from '@/lib/types';
import BudgetCard from './budget-card';
import { getBudgets } from '@/lib/data';
import { Button, buttonVariants } from '@/components/ui/button';
import { PlusCircle, Calendar as CalendarIcon } from 'lucide-react';
import AddBudgetDialog from './add-budget-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import BudgetForecastChart from './budget-forecast-chart';
import EditBudgetDialog from './edit-budget-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, addDays, startOfMonth, endOfMonth, subMonths, isSameDay, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';

const PRESET_RANGES = [
    { label: 'This Month', getRange: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
    { label: 'Last Month', getRange: () => {
        const lastMonth = subMonths(new Date(), 1);
        return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
    }},
    { label: 'This Quarter', getRange: () => ({ from: startOfQuarter(new Date()), to: endOfQuarter(new Date()) }) },
    { label: 'This Year', getRange: () => ({ from: startOfYear(new Date()), to: endOfYear(new Date()) }) },
];


export default function BudgetsPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const [isEditOpen, setEditOpen] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState<Budget | null>(null);
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);

  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    return { from: startOfMonth(new Date()), to: endOfMonth(new Date()) };
  });
  const [activePreset, setActivePreset] = useState<string | null>('This Month');
  const [isDatePopoverOpen, setDatePopoverOpen] = useState(false);

  const budgetsCollection = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'users', user.uid, 'budgets') : null, [firestore, user]);
  const transactionsCollection = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'users', user.uid, 'transactions') : null, [firestore, user]);
  const categoriesCollection = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'users', user.uid, 'categories') : null, [firestore, user]);
  
  const { data: allBudgets, isLoading: budgetsLoading } = useCollection<Budget>(budgetsCollection);
  const { data: allTransactions, isLoading: transactionsLoading } = useCollection<Transaction>(transactionsCollection);
  const { data: categories, isLoading: categoriesLoading } = useCollection<Category>(categoriesCollection);

  const budgetsWithSpent = useMemo(() => {
    return getBudgets(allBudgets, allTransactions, dateRange);
  }, [allBudgets, allTransactions, dateRange]);
  
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

  const handlePresetClick = (label: string, getRange?: () => DateRange | undefined) => {
    if (getRange) {
        setDateRange(getRange());
    }
    setActivePreset(label);
    if(label !== 'Custom') {
        setDatePopoverOpen(false);
    }
  }


  if (budgetsLoading || transactionsLoading || categoriesLoading) {
    return <div>Loading budgets...</div>;
  }

  return (
    <>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="font-headline text-2xl font-semibold">Budgets</h1>
            <p className="text-muted-foreground">Set and track your monthly spending budgets.</p>
          </div>
          <Popover open={isDatePopoverOpen} onOpenChange={setDatePopoverOpen}>
                <PopoverTrigger asChild>
                <Button
                    id="date"
                    variant={"outline"}
                    size="sm"
                    className={cn(
                    "w-full md:w-[240px] justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                    dateRange.to ? (
                        <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                        </>
                    ) : (
                        format(dateRange.from, "LLL dd, y")
                    )
                    ) : (
                    <span>Pick a date</span>
                    )}
                </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 flex flex-col" align="end">
                    <div className='flex'>
                        <div className="flex flex-col space-y-1 p-2 border-r">
                            {PRESET_RANGES.map(({label, getRange}) => (
                                <Button 
                                    key={label}
                                    variant={activePreset === label ? 'default': 'ghost'} 
                                    className="justify-start" 
                                    onClick={() => handlePresetClick(label, getRange)}
                                >
                                    {label}
                                </Button>
                            ))}
                            <Button
                                variant={activePreset === 'Custom' ? 'default': 'ghost'}
                                className="justify-start"
                                onClick={() => handlePresetClick('Custom')}
                            >
                                Custom
                            </Button>
                        </div>
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={dateRange?.from}
                            selected={dateRange}
                            onSelect={setDateRange}
                            numberOfMonths={1}
                        />
                    </div>
                </PopoverContent>
            </Popover>
        </div>
        <div className="flex justify-end">
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
                      <CardDescription>How your spending compares to your budgets for the selected period.</CardDescription>
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
