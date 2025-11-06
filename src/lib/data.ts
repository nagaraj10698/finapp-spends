

import {
  ShoppingBag,
  HeartPulse,
  Utensils,
  Car,
  Home,
  Film,
  GraduationCap,
  Shirt,
  Gift,
  LucideIcon,
  Briefcase,
  LineChart,
  Lightbulb,
  Stethoscope,
  Shapes,
  Landmark,
  Wallet,
  TrendingUp,
} from 'lucide-react';
import type { Category, Transaction, Budget, Notification, Due } from './types';
import { addWeeks, addMonths, addQuarters, addYears, format, startOfMonth, endOfMonth, isWithinInterval, eachMonthOfInterval, eachDayOfInterval, isBefore, differenceInDays, startOfDay, endOfYear } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';
import { DateRange } from 'react-day-picker';


export const defaultCategories: Omit<Category, 'id'>[] = [
    // Expenses
    { name: 'Housing', icon: 'Home', color: 'text-cyan-500', type: 'expense' },
    { name: 'Utilities', icon: 'Lightbulb', color: 'text-yellow-500', type: 'expense' },
    { name: 'Food', icon: 'Utensils', color: 'text-orange-500', type: 'expense' },
    { name: 'Groceries', icon: 'ShoppingBag', color: 'text-emerald-500', type: 'expense' },
    { name: 'Transport', icon: 'Car', color: 'text-blue-500', type: 'expense' },
    { name: 'Health & Fitness', icon: 'HeartPulse', color: 'text-red-500', type: 'expense' },
    { name: 'Family Support', icon: 'HeartPulse', color: 'text-rose-500', type: 'expense' },
    { name: 'Medical & Wellness', icon: 'Stethoscope', color: 'text-red-600', type: 'expense' },
    { name: 'Entertainment', icon: 'Film', color: 'text-purple-500', type: 'expense' },
    { name: 'Shopping', icon: 'Shirt', color: 'text-pink-500', type: 'expense' },
    { name: 'Subscription', icon: 'Wallet', color: 'text-indigo-500', type: 'expense' },
    { name: 'Loan/EMI', icon: 'Landmark', color: 'text-violet-500', type: 'expense' },
    { name: 'Miscellaneous', icon: 'Shapes', color: 'text-gray-500', type: 'expense' },
    // Income
    { name: 'Salary', icon: 'Wallet', color: 'text-green-500', type: 'income' },
    { name: 'Business / Side Hustle', icon: 'Briefcase', color: 'text-green-600', type: 'income' },
    { name: 'Investments', icon: 'LineChart', color: 'text-green-700', type: 'income' },
    { name: 'Other Income', icon: 'Gift', color: 'text-green-800', type: 'income' },
];

export const ICONS: Record<string, LucideIcon> = {
    ShoppingBag,
    HeartPulse,
    Utensils,
    Car,
    Home,
    Film,
    GraduationCap,
    Shirt,
    Gift,
    Briefcase,
    LineChart,
    Lightbulb,
    Stethoscope,
    Shapes,
    Landmark,
    Wallet,
    TrendingUp,
};

export const getIconByName = (name: string): LucideIcon => {
    return ICONS[name] || Shapes;
}

export const getCategoryByName = (name: string, categories: Category[]) => {
    if (!categories) return undefined;
    return categories.find(c => c.name === name);
}

// --- Functions that operate on live data ---

export function toDate(date: Date | Timestamp | undefined | null): Date {
    if (!date) return new Date();
    return date instanceof Date ? date : (date as Timestamp).toDate();
}


export function getRecentTransactions(allTransactions: Transaction[] | null, count: number): Transaction[] {
  if (!allTransactions) return [];
  return [...allTransactions]
    .map(t => ({...t, date: toDate(t.date)}))
    .sort((a,b) => b.date.getTime() - a.date.getTime())
    .slice(0, count);
}

export function getUpcomingBills(
  allTransactions: Transaction[] | null,
) {
  if (!allTransactions) return { bills: [], upcomingCount: 0, overdueCount: 0 };

  const today = startOfDay(new Date());
  const rangeEnd = endOfMonth(addMonths(today, 3));

  const upcoming: Transaction[] = [];
  let upcomingCount = 0;
  let overdueCount = 0;

  const unpaidExpenses = allTransactions.filter(
    (t) => t.type === 'expense'
  );

  unpaidExpenses.forEach((t) => {
    const expenseDate = toDate(t.date);
    if (isWithinInterval(expenseDate, { start: today, end: rangeEnd })) {
      upcoming.push({ ...t, date: expenseDate });
      upcomingCount++;
    } else if (isBefore(expenseDate, today)) {
       upcoming.push({ ...t, date: expenseDate });
       overdueCount++;
    }
  });

  const sortedBills = upcoming.sort((a, b) => toDate(a.date).getTime() - toDate(b.date).getTime());
  return { bills: sortedBills, upcomingCount, overdueCount };
}


export function getTotals(allTransactions: Transaction[] | null) {
  if (!allTransactions) return { income: 0, expenses: 0, savings: 0 };
  const income = allTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = allTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const savings = income - expenses;
  return { income, expenses, savings };
}

export function getSpendingByCategory(allTransactions: Transaction[] | null) {
  if (!allTransactions) return [];
  const spendingMap = new Map<string, number>();
  
  const allExpenses = allTransactions.filter(t => t.type === 'expense');
  
  allExpenses.forEach(t => {
    if (t.category) {
      const currentTotal = spendingMap.get(t.category) || 0;
      spendingMap.set(t.category, currentTotal + Math.abs(t.amount));
    }
  });
  
  return Array.from(spendingMap.entries()).map(([name, total]) => ({ name, total }));
}


export function getBudgets(budgets: Budget[] | null, allTransactions: Transaction[] | null): Budget[] {
    if (!budgets || !allTransactions) return [];

    return budgets.map(budget => {
        const spent = allTransactions
            .filter(t => t.type === 'expense' && t.category === budget.category && isWithinInterval(toDate(t.date), {start: toDate(budget.budgetStartDate), end: toDate(budget.budgetEndDate)}))
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        return {
            ...budget,
            spent,
            limit: budget.budgetAmount,
        };
    });
}

export function generateDueInstances(dues: Due[] | null): Due[] {
  if (!dues) return [];

  const instances: Due[] = [];
  const today = startOfDay(new Date());
  const defaultEndDate = addYears(today, 10); // A far-future default end date

  dues.forEach(due => {
    const startDate = toDate(due.dueDate);

    if (!due.isRecurring) {
      // For one-time dues, just add them if they are not paid.
      // We show them regardless of paid status in the table, but the logic here can be stricter if needed.
      instances.push({ ...due, instanceDate: startDate });
    } else {
      // For recurring dues, generate instances
      const recurrenceEndDate = due.recurrenceEndDate ? toDate(due.recurrenceEndDate) : defaultEndDate;
      let nextDate = startDate;
      let sanityCheck = 0; // Prevent infinite loops

      while (isBefore(nextDate, recurrenceEndDate) && sanityCheck < 360) { // Limit to ~30 years of monthly checks
        const instanceDateStr = nextDate.toISOString().split('T')[0];
        const isInstancePaid = !!due.paidInstances?.[instanceDateStr];

        // Add all instances within a reasonable future window, and all past unpaid instances
        if (isBefore(nextDate, addMonths(today, 6)) || (isBefore(nextDate, today) && !isInstancePaid)) {
            instances.push({
              ...due,
              instanceDate: new Date(nextDate), // Create new Date object
            });
        }
        
        // Increment to the next period
        switch (due.frequency) {
          case 'weekly': nextDate = addWeeks(nextDate, 1); break;
          case 'monthly': nextDate = addMonths(nextDate, 1); break;
          case 'quarterly': nextDate = addQuarters(nextDate, 1); break;
          case 'yearly': nextDate = addYears(nextDate, 1); break;
          default: sanityCheck = 360; // Should not happen, break loop
        }
        sanityCheck++;
      }
    }
  });
  return instances.sort((a,b) => (a.instanceDate || a.dueDate).getTime() - (b.instanceDate || b.dueDate).getTime());
}


export function getBudgetForecast(
  allTransactions: Transaction[] | null,
  period: 'daily' | 'monthly',
  dateRange?: DateRange
) {
  if (!allTransactions) return [];
  
  const today = startOfDay(new Date());

  const range = dateRange?.from && dateRange.to 
    ? { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to) } 
    : { start: startOfMonth(today), end: endOfMonth(addMonths(today, 3)) };
  
  const forecastMap = new Map<string, { open: number; overdue: number; closed: number }>();
  const allExpenses = allTransactions.filter(t => t.type === 'expense');

  let periods: Date[];
  let formatString: string;
  let getPeriodKey: (date: Date) => string;

  if (period === 'daily') {
      periods = eachDayOfInterval(range);
      formatString = 'dd MMM';
      getPeriodKey = (date) => format(date, formatString);
  } else { // monthly
      periods = eachMonthOfInterval(range);
      formatString = 'MMM yyyy';
      getPeriodKey = (date) => format(startOfMonth(date), formatString);
  }

  periods.forEach(p => {
    const key = getPeriodKey(p);
    forecastMap.set(key, { open: 0, overdue: 0, closed: 0 });
  });

  allExpenses.forEach(t => {
    const transactionDate = toDate(t.date);
    if (!isWithinInterval(transactionDate, range)) return;

    const periodKey = getPeriodKey(transactionDate);
    const periodData = forecastMap.get(periodKey);
    
    if (periodData) {
        const amount = Math.abs(t.amount);
        if (isBefore(transactionDate, today)) {
            periodData.overdue += amount;
        } else {
            periodData.open += amount;
        }
    }
  });

  return Array.from(forecastMap.entries()).map(([name, values]) => ({ name, ...values }));
}


export function getNotifications(
  allTransactions: Transaction[] | null,
  allBudgets: Budget[] | null,
  allDues: Due[] | null,
): Notification[] {
  const notifications: Notification[] = [];
  if (!allBudgets && !allDues && !allTransactions) return [];

  const today = startOfDay(new Date());

  // Due alerts
  if (allDues) {
    const dueInstances = generateDueInstances(allDues);
    dueInstances.forEach(due => {
      const instanceDate = toDate(due.instanceDate || due.dueDate);
      const instanceDateStr = instanceDate.toISOString().split('T')[0];
      const isInstancePaid = due.isPaid || !!due.paidInstances?.[instanceDateStr];

      if (!isInstancePaid) {
        if (isBefore(instanceDate, today)) {
           notifications.push({
            id: `due-overdue-${due.id}-${format(instanceDate, 'yyyy-MM-dd')}`,
            type: 'overdue',
            title: 'Overdue Due',
            description: `'${due.dueName}' was due on ${format(instanceDate, 'LLL dd')}.`,
            href: '/dues',
          });
        } else if (differenceInDays(instanceDate, today) <= 7) {
          notifications.push({
            id: `due-upcoming-${due.id}-${format(instanceDate, 'yyyy-MM-dd')}`,
            type: 'upcoming',
            title: 'Upcoming Due',
            description: `'${due.dueName}' is due on ${format(instanceDate, 'LLL dd')}.`,
            href: '/dues',
          });
        }
      }
    });
  }


  // Budget alerts
  if (allBudgets && allTransactions) {
    const budgetsWithSpent = getBudgets(allBudgets, allTransactions);
    budgetsWithSpent.forEach(budget => {
      const spent = budget.spent ?? 0;
      const limit = budget.budgetAmount ?? 0;
      const usage = limit > 0 ? (spent / limit) * 100 : 0;
      if (usage >= 80) {
        notifications.push({
          id: `budget-${budget.id}`,
          type: 'budget',
          title: 'Budget Alert',
          description: `You've used ${usage.toFixed(0)}% of your '${budget.name}' budget.`,
          href: '/budgets',
        });
      }
    });
  }
  
  // Sort notifications: overdue first, then upcoming
  return notifications.sort((a, b) => {
    if (a.type === 'overdue' && b.type !== 'overdue') return -1;
    if (a.type !== 'overdue' && b.type === 'overdue') return 1;
    return 0;
  });
}
