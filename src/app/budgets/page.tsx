
'use client';
import { useMemo, useState, useEffect } from 'react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc } from 'firebase/firestore';
import type { Budget, Transaction, Category } from '@/lib/types';
import BudgetCard from './budget-card';
import { getBudgets, toDate } from '@/lib/data';
import { Button, buttonVariants } from '@/components/ui/button';
import { PlusCircle, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import EditBudgetDialog from './edit-budget-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, subMonths, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, addDays, isSameDay, isWithinInterval } from 'date-fns';
import SetAllBudgetsCard from './set-all-budgets-card';
import { CurrencySymbol } from '@/components/ui/dynamic-currency';
import { Progress } from '@/components/ui/progress';
import { generateBudgetInsight } from '@/ai/flows/budget-insights-flow';


const PRESET_RANGES = [
    { label: 'Today', getRange: () => ({ from: new Date(), to: new Date() }) },
    { label: 'Last 7 days', getRange: () => ({ from: addDays(new Date(), -6), to: new Date() }) },
    { label: 'Last 30 days', getRange: () => ({ from: addDays(new Date(), -29), to: new Date() }) },
    { label: 'This Month', getRange: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
    { label: 'Last Month', getRange: () => {
        const lastMonth = subMonths(new Date(), 1);
        return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
    }},
    { label: 'This Quarter', getRange: () => ({ from: startOfQuarter(new Date()), to: endOfQuarter(new Date()) }) },
    { label: 'This Year', getRange: () => ({ from: startOfYear(new Date()), to: endOfYear(new Date()) }) },
    { label: 'All Time', getRange: () => undefined },
];


export default function BudgetsPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const [isEditOpen, setEditOpen] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState<Budget | null>(null);
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);


  const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) });
  const [activePreset, setActivePreset] = useState<string | null>('This Month');
  const [isDatePopoverOpen, setDatePopoverOpen] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [isInsightLoading, setIsInsightLoading] = useState(false);

  const budgetsCollection = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'users', user.uid, 'budgets') : null, [firestore, user]);
  const transactionsCollection = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'users', user.uid, 'transactions') : null, [firestore, user]);
  const categoriesCollection = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'users', user.uid, 'categories') : null, [firestore, user]);
  
  const { data: allBudgets, isLoading: budgetsLoading } = useCollection<Budget>(budgetsCollection);
  const { data: allTransactions, isLoading: transactionsLoading } = useCollection<Transaction>(transactionsCollection);
  const { data: categories, isLoading: categoriesLoading } = useCollection<Category>(categoriesCollection);

  const budgetsWithCalculations = useMemo(() => {
    return getBudgets(allBudgets, allTransactions, dateRange);
  }, [allBudgets, allTransactions, dateRange]);
  
  const expenseBudgets = useMemo(() => budgetsWithCalculations.filter(b => b.type === 'Expense'), [budgetsWithCalculations]);
  const incomeBudgets = useMemo(() => budgetsWithCalculations.filter(b => b.type === 'Income'), [budgetsWithCalculations]);

  const summary = useMemo(() => {
    const totalBudgeted = expenseBudgets.reduce((acc, b) => acc + b.budgetAmount, 0);
    const totalSpent = expenseBudgets.reduce((acc, b) => acc + (b.spent ?? 0), 0);
    const remaining = totalBudgeted - totalSpent;
    const progress = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
    
    return {
        totalBudgeted,
        totalSpent,
        remaining,
        progress
    };
  }, [expenseBudgets]);

  useEffect(() => {
    if (summary.totalBudgeted > 0 && expenseBudgets.length > 0 && allTransactions) {
      setIsInsightLoading(true);

      const previousMonthsData = Array.from({ length: 3 }).map((_, i) => {
        const month = subMonths(new Date(), i + 1);
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);

        const monthTransactions = allTransactions.filter(t => isWithinInterval(toDate(t.date), { start: monthStart, end: monthEnd }));
        
        const totalSpent = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0);
        
        const spendingByCategory: Record<string, number> = {};
        monthTransactions.filter(t => t.type === 'expense' && t.category).forEach(t => {
            spendingByCategory[t.category] = (spendingByCategory[t.category] || 0) + Math.abs(t.amount);
        });

        return {
          month: format(monthStart, 'MMMM yyyy'),
          totalSpent,
          spendingByCategory,
        };
      });

      generateBudgetInsight({
        totalBudgeted: summary.totalBudgeted,
        totalSpent: summary.totalSpent,
        budgets: expenseBudgets.map(b => ({
          name: b.name,
          budgetAmount: b.budgetAmount,
          spent: b.spent ?? 0,
        })),
        previousMonthsData: previousMonthsData,
      }).then(setInsight).finally(() => setIsInsightLoading(false));
    } else {
      setInsight("You don't have any expense budgets set up yet. Create some to get started!");
    }
  }, [summary, expenseBudgets, allTransactions]);


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
        } else {
            setDateRange(undefined);
        }
        setActivePreset(label);
    }
    
    useMemo(() => {
        if (dateRange?.from && dateRange.to) {
          const matchedPreset = PRESET_RANGES.find(p => {
            if (!p.getRange) return false;
            const range = p.getRange();
            return range?.from && range?.to && dateRange?.from && dateRange?.to && isSameDay(range.from, dateRange.from) && isSameDay(range.to, dateRange.to)
          });
          setActivePreset(matchedPreset ? matchedPreset.label : 'Custom');
        } else {
             const allTimePreset = PRESET_RANGES.find(p => p.label === 'All Time');
            if (!dateRange && allTimePreset) {
                setActivePreset(allTimePreset.label);
            } else {
                setActivePreset(null);
            }
        }
    }, [dateRange]);

  const hasBudgets = allBudgets && allBudgets.length > 0;

  const unbudgetedCategories = useMemo(() => {
    if (!categories || !allBudgets) return [];
    const budgetedCategoryIds = new Set(allBudgets.map(b => b.categoryId));
    return categories.filter(c => !budgetedCategoryIds.has(c.id));
  }, [categories, allBudgets]);

  const hasUnbudgeted = unbudgetedCategories.length > 0;

  if (budgetsLoading || transactionsLoading || categoriesLoading) {
    return <div>Loading budgets...</div>;
  }

  return (
    <>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="font-headline text-2xl font-semibold">Budgets</h1>
            <p className="text-muted-foreground">Set and track your spending and income budgets.</p>
          </div>
          <div className="flex w-full md:w-auto items-center gap-2">
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
                    <span>All Time</span>
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
                            numberOfMonths={2}
                        />
                    </div>
                     <div className="flex justify-end p-2 border-t">
                        <Button size="sm" onClick={() => setDatePopoverOpen(false)}>Apply</Button>
                    </div>
                </PopoverContent>
            </Popover>
          </div>
        </div>
        
        {hasBudgets && (
             <Card>
                <CardHeader>
                    <CardTitle>Budget Summary</CardTitle>
                    <CardDescription className="flex items-center gap-2 pt-1">
                        {isInsightLoading ? (
                            <>
                                <Sparkles className="h-4 w-4 animate-pulse" /> 
                                Generating insights...
                            </>
                        ) : (
                            insight
                        )}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between items-baseline">
                            <span className="text-muted-foreground">Spent</span>
                            <span className="text-muted-foreground">
                                <span className={cn(summary.remaining < 0 && "text-destructive font-semibold")}>
                                    {summary.remaining >= 0 ? "Remaining" : "Overspent"}
                                </span>
                                <span className="font-semibold flex items-baseline gap-1">
                                    <CurrencySymbol className="text-sm" />
                                    {Math.abs(summary.remaining).toFixed(2)}
                                </span>
                            </span>
                        </div>
                        <Progress value={summary.progress} className={cn(summary.progress > 100 && "[&>div]:bg-destructive")} />
                        <div className="flex items-baseline gap-1">
                            <div className="text-2xl font-bold flex items-baseline gap-1">
                                <CurrencySymbol className="text-xl" />
                                {summary.totalSpent.toFixed(2)}
                            </div>
                            <span className="text-sm text-muted-foreground font-normal">of</span>
                            <div className="flex items-baseline gap-1">
                                <CurrencySymbol className="text-sm" />
                                {summary.totalBudgeted.toFixed(2)}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )}

        {hasBudgets || hasUnbudgeted ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {hasUnbudgeted && (
              <div className="lg:col-span-1">
                <SetAllBudgetsCard categories={unbudgetedCategories} />
              </div>
            )}
            <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-8 items-start", hasUnbudgeted ? "lg:col-span-2" : "lg:col-span-3")}>
                <div>
                  <h2 className="font-headline text-xl font-semibold mb-4">Income Budgets</h2>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {incomeBudgets.map(budget => {
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
                  {incomeBudgets.length === 0 && <p className="text-muted-foreground text-sm mt-4">No income budgets set for this period.</p>}
                </div>
                <div>
                  <h2 className="font-headline text-xl font-semibold mb-4">Expense Budgets</h2>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {expenseBudgets.map(budget => {
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
                  {expenseBudgets.length === 0 && <p className="text-muted-foreground text-sm mt-4">No expense budgets set for this period.</p>}
                </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
              <h3 className="text-lg font-semibold text-muted-foreground">No budgets created yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">Set budgets for your categories to get started.</p>
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
