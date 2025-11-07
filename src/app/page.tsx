
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
import {
  getRecentTransactions,
  getTotals,
  getMoneyFlow,
  generateDueInstances,
  getBudgets,
} from '@/lib/data';
import type { Transaction, Category, Due, Budget } from '@/lib/types';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { endOfDay, startOfDay, isBefore, isAfter, subMonths, isSameDay, format, differenceInDays, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, addDays } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, MinusCircle, PlusCircle } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import AddIncomeDialog from '@/components/dashboard/add-income-dialog';
import AddExpenseDialog from '@/app/expenses/add-expense-dialog';
import RecentTransactions from '@/components/dashboard/recent-transactions';
import { toDate } from '@/lib/data';
import MoneyFlowChart from '@/components/dashboard/money-flow-chart';
import BudgetSummaryChart from '@/components/dashboard/budget-summary-chart';


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
    { label: 'All Time', getRange: () => undefined },
];


export default function DashboardPage() {
    const { firestore, user } = useFirebase();
    const transactionsCollection = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'users', user.uid, 'transactions') : null, [firestore, user]);
    const categoriesCollection = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'users', user.uid, 'categories') : null, [firestore, user]);
    const duesCollection = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'users', user.uid, 'dues') : null, [firestore, user]);
    const budgetsCollection = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'users', user.uid, 'budgets') : null, [firestore, user]);
    
    const { data: allTransactions, isLoading: transactionsLoading } = useCollection<Transaction>(transactionsCollection);
    const { data: categories, isLoading: categoriesLoading } = useCollection<Category>(categoriesCollection);
    const { data: allDues, isLoading: duesLoading } = useCollection<Due>(duesCollection);
    const { data: allBudgets, isLoading: budgetsLoading } = useCollection<Budget>(budgetsCollection);

    const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
        return { from: startOfMonth(new Date()), to: endOfMonth(new Date()) };
    });
    const [activePreset, setActivePreset] = useState<string | null>('This Month');
    const [isDatePopoverOpen, setDatePopoverOpen] = useState(false);
    const [period, setPeriod] = useState<'daily' | 'monthly' | 'yearly'>('monthly');

    useEffect(() => {
        if (dateRange?.from && dateRange.to) {
          const matchedPreset = PRESET_RANGES.find(p => {
            if (!p.getRange) return false;
            const range = p.getRange();
            return range?.from && range?.to && dateRange?.from && dateRange?.to && isSameDay(range.from, dateRange.from) && isSameDay(range.to, dateRange.to)
          });
          setActivePreset(matchedPreset ? matchedPreset.label : 'Custom');
          
          const diff = differenceInDays(dateRange.to, dateRange.from);
          if (diff > 730) {
            setPeriod('yearly');
          } else if (diff > 62) {
            setPeriod('monthly');
          } else {
            setPeriod('daily');
          }
        } else {
             const allTimePreset = PRESET_RANGES.find(p => p.label === 'All Time');
            if (!dateRange && allTimePreset) {
                setActivePreset(allTimePreset.label);
                setPeriod('yearly');
            } else {
                setActivePreset(null);
            }
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
        if (!dateRange?.from || !dateRange.to) return allTransactions.map(t => ({...t, date: toDate(t.date)}));
    
        const rangeEnd = endOfDay(dateRange.to);
        return allTransactions.filter(t => {
            const transactionDate = toDate(t.date);
            return transactionDate >= dateRange.from! && transactionDate <= rangeEnd;
        }).map(t => ({...t, date: toDate(t.date)}));
    }, [allTransactions, dateRange]);


    const totals = useMemo(() => getTotals(filteredTransactions), [filteredTransactions]);
    const recentTransactions = useMemo(() => getRecentTransactions(allTransactions, 5), [allTransactions]);
    const moneyFlowData = useMemo(() => getMoneyFlow(filteredTransactions, period, dateRange), [filteredTransactions, period, dateRange]);

    const expenseBudgetsChartData = useMemo(() => {
        if (!allBudgets) return [];
        return allBudgets
            .filter(b => b.type === 'Expense' && b.budgetAmount > 0)
            .map(b => ({ name: b.name, total: b.budgetAmount }));
    }, [allBudgets]);


    if (transactionsLoading || categoriesLoading || duesLoading || budgetsLoading) {
        return <div>Loading...</div>
    }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h1 className="font-headline text-2xl font-semibold">Dashboard</h1>
        <div className='flex flex-col md:flex-row items-center gap-2'>
            <div className="flex w-full md:w-auto gap-2">
              <AddIncomeDialog>
                  <Button className="w-full">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Income
                  </Button>
              </AddIncomeDialog>
              <AddExpenseDialog>
                  <Button variant="secondary" className="w-full">
                      <MinusCircle className="mr-2 h-4 w-4" />
                      Add Expense
                  </Button>
              </AddExpenseDialog>
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <OverviewCards totals={totals} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="font-headline">Money Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <MoneyFlowChart data={moneyFlowData} />
          </CardContent>
        </Card>
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="font-headline">Budgeted Spending</CardTitle>
             <CardDescription>
              A breakdown of your budgeted expenses.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <BudgetSummaryChart data={expenseBudgetsChartData} categories={categories ?? []} />
          </CardContent>
        </Card>
      </div>
       <div className="grid gap-4">
        <Card>
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
