
'use client';
import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import OverviewCards from '@/components/dashboard/overview-cards';
import SpendingChart from '@/components/dashboard/spending-chart';
import RecentTransactions from '@/components/dashboard/recent-transactions';
import {
  getRecentTransactions,
  getSpendingByCategory,
  getTotals,
  getUpcomingBills,
  getBudgetForecast,
} from '@/lib/data';
import UpcomingBills from '@/components/dashboard/upcoming-bills';
import type { Transaction, Budget, Category } from '@/lib/types';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import BudgetForecastChart from '@/app/budgets/budget-forecast-chart';
import { startOfMonth, endOfMonth } from 'date-fns';

export default function DashboardPage() {
    const { firestore, user } = useFirebase();
    const transactionsCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'transactions') : null, [firestore, user]);
    const budgetsCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'budgets') : null, [firestore, user]);
    const categoriesCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'categories') : null, [firestore, user]);
    
    const { data: transactions, isLoading: transactionsLoading } = useCollection<Transaction>(transactionsCollection);
    const { data: rawBudgets, isLoading: budgetsLoading } = useCollection<Budget>(budgetsCollection);
    const { data: categories, isLoading: categoriesLoading } = useCollection<Category>(categoriesCollection);


    // Memoize derived data to prevent re-computation on every render
    const totals = useMemo(() => getTotals(transactions), [transactions]);
    const spendingByCategory = useMemo(() => getSpendingByCategory(transactions), [transactions]);
    const recentTransactions = useMemo(() => getRecentTransactions(transactions ?? [], 5), [transactions]);
    const upcomingBills = useMemo(() => getUpcomingBills(transactions ?? []), [transactions]);

    const budgetForecastData = useMemo(() => {
        const thisMonth = {
            from: startOfMonth(new Date()),
            to: endOfMonth(new Date()),
        };
        return getBudgetForecast(transactions, 'weekly', thisMonth);
    }, [transactions]);


    if (transactionsLoading || budgetsLoading || categoriesLoading) {
        return <div>Loading...</div>
    }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-headline text-2xl font-semibold">Dashboard</h1>
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
                <CardTitle className="font-headline">Budget Forecast</CardTitle>
                <CardDescription>
                Your expense forecast for this month.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <BudgetForecastChart data={budgetForecastData} />
            </CardContent>
        </Card>
      </div>
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="font-headline">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentTransactions transactions={recentTransactions} categories={categories ?? []} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="font-headline">Upcoming Bills</CardTitle>
             <CardDescription>
              Your upcoming recurring payments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UpcomingBills bills={upcomingBills} categories={categories ?? []} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
