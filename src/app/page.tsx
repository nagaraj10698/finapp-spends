
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
import BudgetSummary from '@/components/dashboard/budget-summary';
import RecentTransactions from '@/components/dashboard/recent-transactions';
import {
  getBudgets,
  getRecentTransactions,
  getSpendingByCategory,
  getTotals,
  getUpcomingBills,
} from '@/lib/data';
import UpcomingBills from '@/components/dashboard/upcoming-bills';
import type { Transaction, Budget } from '@/lib/types';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

export default function DashboardPage() {
    const { firestore, user } = useFirebase();
    const transactionsCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'transactions') : null, [firestore, user]);
    const budgetsCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'budgets') : null, [firestore, user]);
    
    const { data: transactions, isLoading: transactionsLoading } = useCollection<Transaction>(transactionsCollection);
    const { data: rawBudgets, isLoading: budgetsLoading } = useCollection<Budget>(budgetsCollection);


    // Memoize derived data to prevent re-computation on every render
    const totals = useMemo(() => getTotals(transactions), [transactions]);
    const spendingByCategory = useMemo(() => getSpendingByCategory(transactions), [transactions]);
    const budgets = useMemo(() => getBudgets(rawBudgets ?? [], transactions), [rawBudgets, transactions]);
    const recentTransactions = useMemo(() => getRecentTransactions(transactions ?? [], 5), [transactions]);
    const upcomingBills = useMemo(() => getUpcomingBills(transactions ?? []), [transactions]);

    if (transactionsLoading || budgetsLoading) {
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
            <CardTitle className="font-headline">Spending Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <SpendingChart data={spendingByCategory} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="font-headline">Budget Summary</CardTitle>
            <CardDescription>
              Your spending progress for this month.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BudgetSummary budgets={budgets} />
          </CardContent>
        </Card>
      </div>
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="font-headline">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentTransactions transactions={recentTransactions} />
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
            <UpcomingBills bills={upcomingBills} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
