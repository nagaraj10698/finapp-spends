
'use client';
import { useMemo, useState } from 'react';
import { getBudgets, getBudgetForecast } from '@/lib/data';
import BudgetCard from './budget-card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import AddBudgetDialog from './add-budget-dialog';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Budget, Transaction, Category } from '@/lib/types';
import BudgetForecastChart from './budget-forecast-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';

type ForecastPeriod = 'weekly' | 'monthly';

export default function BudgetsPage() {
  const { firestore, user } = useFirebase();
  const budgetsCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'budgets') : null, [firestore, user]);
  const transactionsCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'transactions') : null, [firestore, user]);
  const categoriesCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'categories') : null, [firestore, user]);
  
  const { data: budgets, isLoading: budgetsLoading } = useCollection<Budget>(budgetsCollection);
  const { data: transactions, isLoading: transactionsLoading } = useCollection<Transaction>(transactionsCollection);
  const { data: categories, isLoading: categoriesLoading } = useCollection<Category>(categoriesCollection);

  const [period, setPeriod] = useState<ForecastPeriod>('monthly');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 30),
  });

  const processedBudgets = useMemo(() => {
    if (!budgets) return [];
    return getBudgets(budgets, transactions);
  }, [budgets, transactions]);
  
  const forecastData = useMemo(() => {
    return getBudgetForecast(transactions, period, dateRange);
  }, [transactions, period, dateRange]);


  if (budgetsLoading || transactionsLoading || categoriesLoading) {
    return <div>Loading budgets...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-2xl font-semibold">Cash Flow Forecast</h1>
        <p className="text-muted-foreground">A projection of your upcoming and unpaid expenses.</p>
      </div>

       <Card>
        <CardHeader>
            <div className='flex justify-between items-start'>
                <div>
                    <CardTitle>Expense Forecast</CardTitle>
                    <CardDescription>This chart shows your unpaid and upcoming recurring expenses.</CardDescription>
                </div>
                <div className='flex items-center gap-2'>
                     <Button variant={period === 'weekly' ? 'default' : 'outline'} size="sm" onClick={() => setPeriod('weekly')}>Weekly</Button>
                    <Button variant={period === 'monthly' ? 'default' : 'outline'} size="sm" onClick={() => setPeriod('monthly')}>Monthly</Button>
                    <Popover>
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
                        <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={dateRange?.from}
                            selected={dateRange}
                            onSelect={setDateRange}
                            numberOfMonths={2}
                        />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <BudgetForecastChart data={forecastData} />
        </CardContent>
       </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="font-headline text-2xl font-semibold">Planned Budgets</h2>
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
    </div>
  );
}
