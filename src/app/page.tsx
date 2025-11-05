
'use client';
import { useMemo, useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import OverviewCards from '@/components/dashboard/overview-cards';
import SpendingChart from '@/components/dashboard/spending-chart';
import {
  getRecentTransactions,
  getSpendingByCategory,
  getTotals,
  getUpcomingBills,
  getBudgets
} from '@/lib/data';
import type { Transaction, Budget, Category } from '@/lib/types';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { addDays, startOfMonth, endOfMonth, subMonths, isSameDay, format, isSameMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, MinusCircle, PlusCircle } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import AddIncomeDialog from '@/components/dashboard/add-income-dialog';
import AddExpenseDialog from '@/app/expenses/add-expense-dialog';
import UpcomingBillsTimeline from '@/components/dashboard/upcoming-bills-timeline';
import BudgetSummary from '@/components/dashboard/budget-summary';
import RecentTransactions from '@/components/dashboard/recent-transactions';

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
    { label: 'Last 6 Months', getRange: () => ({ from: subMonths(new Date(), 6), to: new Date() }) },
    { label: 'This Year', getRange: () => ({ from: startOfYear(new Date()), to: endOfYear(new Date()) }) },
];


export default function DashboardPage() {
    const { firestore, user } = useFirebase();
    const transactionsCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'transactions') : null, [firestore, user]);
    const categoriesCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'categories') : null, [firestore, user]);
    const budgetsCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'budgets') : null, [firestore, user]);
    
    const { data: allTransactions, isLoading: transactionsLoading } = useCollection<Transaction>(transactionsCollection);
    const { data: categories, isLoading: categoriesLoading } = useCollection<Category>(categoriesCollection);
    const { data: allBudgets, isLoading: budgetsLoading } = useCollection<Budget>(budgetsCollection);

    const [dateRange, setDateRange] = useState<DateRange | undefined>({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    });
    const [activePreset, setActivePreset] = useState<string | null>('This Month');
    const [isDatePopoverOpen, setDatePopoverOpen] = useState(false);

    useEffect(() => {
        if (dateRange?.from && dateRange?.to) {
          const matchedPreset = PRESET_RANGES.find(p => {
            const range = p.getRange();
            return range.from && range.to && dateRange.from && dateRange.to && isSameDay(range.from, dateRange.from) && isSameDay(range.to, dateRange.to)
          });
          setActivePreset(matchedPreset ? matchedPreset.label : 'Custom');
        } else {
            setActivePreset(null);
        }
    }, [dateRange]);

    const handlePresetClick = (label: string, getRange?: () => DateRange | undefined) => {
        if (getRange) {
            setDateRange(getRange());
        }
        setActivePreset(label);
    }
    
    const filteredTransactions = useMemo(() => {
        if (!allTransactions) return [];
        if (!dateRange?.from || !dateRange.to) return allTransactions;
    
        return allTransactions.filter(t => {
            const transactionDate = (t.date as any).toDate ? (t.date as any).toDate() : new Date(t.date as any);
            return transactionDate >= dateRange.from! && transactionDate <= dateRange.to!;
        });
    }, [allTransactions, dateRange]);


    const totals = useMemo(() => getTotals(filteredTransactions), [filteredTransactions]);
    const spendingByCategory = useMemo(() => getSpendingByCategory(filteredTransactions), [filteredTransactions]);
    const upcomingBills = useMemo(() => getUpcomingBills(allTransactions), [allTransactions]);
    const recentTransactions = useMemo(() => getRecentTransactions(allTransactions, 5), [allTransactions]);
    const budgetData = useMemo(() => getBudgets(allBudgets, allTransactions), [allBudgets, allTransactions]);


    if (transactionsLoading || categoriesLoading || budgetsLoading) {
        return <div>Loading...</div>
    }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="font-headline text-2xl font-semibold">Dashboard</h1>
        <div className='flex items-center gap-2'>
            <AddIncomeDialog>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Income
                </Button>
            </AddIncomeDialog>
            <AddExpenseDialog>
                <Button variant="secondary" className="bg-orange-400 text-white hover:bg-orange-500">
                    <MinusCircle className="mr-2 h-4 w-4" />
                    Add Expense
                </Button>
            </AddExpenseDialog>
            <Popover open={isDatePopoverOpen} onOpenChange={setDatePopoverOpen}>
                <PopoverTrigger asChild>
                <Button
                    id="date"
                    variant={"outline"}
                    size="sm"
                    className={cn(
                    "w-[240px] justify-start text-left font-normal",
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <OverviewCards totals={totals} />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="font-headline">Spent by category</CardTitle>
          </CardHeader>
          <CardContent>
            <SpendingChart data={spendingByCategory} categories={categories ?? []}/>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="font-headline">Budget</CardTitle>
             <CardDescription>
              Your spending budget for this month.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BudgetSummary budgets={budgetData} categories={categories ?? []} />
          </CardContent>
        </Card>
      </div>
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
         <Card className="lg:col-span-3 h-full flex flex-col">
          <CardHeader>
            <CardTitle className="font-headline">Upcoming Bills</CardTitle>
             <CardDescription>
              Your upcoming recurring payments.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <UpcomingBillsTimeline bills={upcomingBills} categories={categories ?? []} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-4">
            <CardHeader>
                <CardTitle className="font-headline">Recent Transactions</CardTitle>
                <CardDescription>Your most recent transactions.</CardDescription>
            </CardHeader>
            <CardContent>
                <RecentTransactions transactions={recentTransactions} categories={categories ?? []} />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
