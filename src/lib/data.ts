

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
import type { Category, Transaction, Budget, Notification, Owed } from './types';
import { addDays, addWeeks, addMonths, addQuarters, addYears, format, startOfMonth, endOfMonth, isWithinInterval, eachMonthOfInterval, eachDayOfInterval, isBefore, differenceInDays, startOfDay, endOfDay, isSameDay, isAfter, subDays, startOfWeek, endOfWeek, subWeeks, subMonths, startOfYear, endOfYear, startOfQuarter, endOfQuarter, eachYearOfInterval, getYear } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';
import { DateRange } from 'react-day-picker';


export const defaultCategories: Omit<Category, 'id' | 'userId'>[] = [
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
    { name: 'Investment', icon: 'TrendingUp', color: 'text-sky-500', type: 'expense' },
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

export const getCategoryByName = (name: string, categories: Category[] | undefined) => {
    if (!categories) return undefined;
    return categories.find(c => c.name === name);
}

// --- Functions that operate on live data ---

export function toDate(date: Date | Timestamp | undefined | null): Date {
    if (!date) return new Date();
    if (date instanceof Date) return date;
    if ('toDate' in date && typeof date.toDate === 'function') return date.toDate();
    return new Date(date as any);
}


export function getRecentTransactions(allTransactions: Transaction[] | null, count: number): Transaction[] {
  if (!allTransactions) return [];
  return [...allTransactions]
    .map(t => ({...t, date: toDate(t.date)}))
    .sort((a,b) => b.date.getTime() - a.date.getTime())
    .slice(0, count);
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


export function getBudgets(
  budgets: Budget[] | null,
  allTransactions: Transaction[] | null,
  dateRange?: DateRange,
): Budget[] {
    if (!budgets) return [];

    const range = dateRange?.from && dateRange.to 
        ? { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to) }
        : undefined;

    const safeTransactions = allTransactions || [];

    return budgets.map(budget => {
        if (!budget || !budget.categoryId) return budget;
        
        const budgetInterval = range ?? { start: startOfMonth(new Date()), end: endOfMonth(new Date()) };

        if (budget.type === 'Expense') {
            const spent = safeTransactions
                .filter(t => 
                    t.type === 'expense' && 
                    t.categoryId === budget.categoryId && 
                    isWithinInterval(toDate(t.date), budgetInterval)
                )
                .reduce((sum, t) => sum + Math.abs(t.amount), 0);
            
            return {
                ...budget,
                spent,
            };
        } else { // Income budget
             const received = safeTransactions
                .filter(t => 
                    t.type === 'income' && 
                    t.categoryId === budget.categoryId && 
                    isWithinInterval(toDate(t.date), budgetInterval)
                )
                .reduce((sum, t) => sum + Math.abs(t.amount), 0);
            
            return {
                ...budget,
                received,
            };
        }
    });
}

export function getMoneyFlow(
  transactions: Transaction[] | null,
  period: 'daily' | 'monthly' | 'yearly',
  dateRange?: DateRange
) {
  if (!transactions || transactions.length === 0) return [];
  
  const today = startOfDay(new Date());

  // Determine the range. If no dateRange is provided (e.g., for 'All Time'), find the min and max dates from transactions.
  const range = dateRange?.from && dateRange.to 
    ? { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to) } 
    : (() => {
        const dates = transactions.map(t => toDate(t.date));
        const start = new Date(Math.min(...dates.map(d => d.getTime())));
        const end = new Date(Math.max(...dates.map(d => d.getTime())));
        return { start, end };
    })();
  
  const flowMap = new Map<string, { income: number; expense: number }>();
  let periods: Date[];
  let getPeriodKey: (date: Date) => string;

  if (period === 'daily') {
      periods = eachDayOfInterval(range);
      getPeriodKey = (date) => format(date, 'd MMM');
  } else if (period === 'monthly') {
      periods = eachMonthOfInterval(range);
      getPeriodKey = (date) => format(startOfMonth(date), 'MMM');
  } else { // yearly
      periods = eachYearOfInterval(range);
      getPeriodKey = (date) => format(date, 'yyyy');
  }

  periods.forEach(p => {
    const key = getPeriodKey(p);
    flowMap.set(key, { income: 0, expense: 0 });
  });

  transactions.forEach(t => {
    const transactionDate = toDate(t.date);
    if (!isWithinInterval(transactionDate, range)) return;

    const periodKey = getPeriodKey(transactionDate);
    const periodData = flowMap.get(periodKey);
    
    if (periodData) {
      if (t.type === 'income') {
        periodData.income += t.amount;
      } else {
        periodData.expense += Math.abs(t.amount);
      }
    }
  });
  
  return Array.from(flowMap.entries()).map(([name, values]) => ({ name, ...values }));
}

export function getOwedExpenses(transactions: Transaction[] | null): Owed[] {
    if (!transactions) return [];

    const recurringExpenses = transactions.filter(
        (t) => t.isRecurring && t.type === 'expense' && t.frequency
    );

    const upcomingDues: Owed[] = [];
    const today = startOfDay(new Date());

    recurringExpenses.forEach((t) => {
        let nextDueDate = toDate(t.date);

        // Fast-forward to the first due date that is on or after today
        while (isBefore(nextDueDate, today)) {
            switch (t.frequency) {
                case 'weekly':
                    nextDueDate = addWeeks(nextDueDate, 1);
                    break;
                case 'monthly':
                    nextDueDate = addMonths(nextDueDate, 1);
                    break;
                case 'quarterly':
                    nextDueDate = addQuarters(nextDueDate, 1);
                    break;
                case 'yearly':
                    nextDueDate = addYears(nextDueDate, 1);
                    break;
                default:
                    return; // Should not happen
            }
        }
        
        // Check if this calculated next due date is valid
        const endDate = t.recurrenceEndDate ? toDate(t.recurrenceEndDate) : null;
        if (endDate && isAfter(nextDueDate, endDate)) {
            return; // This recurring expense has ended
        }

        // Check if a payment for this specific instance has already been made
        const isPaid = transactions.some(p => 
            !p.isRecurring && // it's an actual transaction
            p.description === t.description &&
            p.categoryId === t.categoryId &&
            isSameDay(toDate(p.date), nextDueDate)
        );

        if (!isPaid) {
            upcomingDues.push({
                ...t,
                instanceDate: nextDueDate,
            });
        }

        // Add overdue payments
        let potentialOverdueDate = nextDueDate;
        // Move backwards from the next due date to find any missed payments
        while(true) {
             switch (t.frequency) {
                case 'weekly':
                    potentialOverdueDate = subWeeks(potentialOverdueDate, 1);
                    break;
                case 'monthly':
                    potentialOverdueDate = subMonths(potentialOverdueDate, 1);
                    break;
                case 'quarterly':
                    potentialOverdueDate = subQuarters(potentialOverdueDate, 1);
                    break;
                case 'yearly':
                    potentialOverdueDate = subYears(potentialOverdueDate, 1);
                    break;
            }
            
            // Stop if we go past the original start date
            if (isBefore(potentialOverdueDate, toDate(t.date))) {
                break;
            }

            const isOverduePaid = transactions.some(p => 
                !p.isRecurring &&
                p.description === t.description &&
                p.categoryId === t.categoryId &&
                isSameDay(toDate(p.date), potentialOverdueDate)
            );

            if (!isOverduePaid) {
                 upcomingDues.push({
                    ...t,
                    instanceDate: potentialOverdueDate,
                });
            }
        }


    });
    
    // Remove duplicates by creating a unique key for each due instance
    const uniqueDues = Array.from(
        new Map(
            upcomingDues.map(due => [`${due.id}-${due.instanceDate.toISOString()}`, due])
        ).values()
    );


    return uniqueDues;
}



export function getNotifications(
  allTransactions: Transaction[] | null,
  allBudgets: Budget[] | null
): Notification[] {
  const notifications: Notification[] = [];
  if (!allBudgets && !allTransactions) return [];

  const today = startOfDay(new Date());

  // Budget alerts
  if (allBudgets && allTransactions) {
    const budgetsWithSpent = getBudgets(allBudgets, allTransactions);
    budgetsWithSpent.forEach(budget => {
      if (!budget || budget.type === 'Income') return; // Only alert for expense budgets
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
  const uniqueNotifications = Array.from(new Map(notifications.map(n => [n.id, n])).values());
  
  return uniqueNotifications.sort((a, b) => {
    if (a.type === 'overdue' && b.type !== 'overdue') return -1;
    if (a.type !== 'overdue' && b.type === 'overdue') return 1;
    return 0;
  });
}

