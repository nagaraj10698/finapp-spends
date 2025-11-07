

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
import { addDays, addWeeks, addMonths, addQuarters, addYears, format, startOfMonth, endOfMonth, isWithinInterval, eachMonthOfInterval, eachDayOfInterval, isBefore, differenceInDays, startOfDay, endOfDay, isSameDay, isAfter, subDays, startOfWeek, endOfWeek, subWeeks, startOfQuarter, endOfQuarter, eachYearOfInterval, getYear } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';
import { DateRange } from 'react-day-picker';


export const defaultCategories: Omit<Category, 'id' | 'userId'>[] = [
    // Expenses
    { name: 'Housing', icon: 'Home', color: 'text-cyan-500', type: 'expense', userId: '' },
    { name: 'Utilities', icon: 'Lightbulb', color: 'text-yellow-500', type: 'expense', userId: '' },
    { name: 'Food', icon: 'Utensils', color: 'text-orange-500', type: 'expense', userId: '' },
    { name: 'Groceries', icon: 'ShoppingBag', color: 'text-emerald-500', type: 'expense', userId: '' },
    { name: 'Transport', icon: 'Car', color: 'text-blue-500', type: 'expense', userId: '' },
    { name: 'Health & Fitness', icon: 'HeartPulse', color: 'text-red-500', type: 'expense', userId: '' },
    { name: 'Family Support', icon: 'HeartPulse', color: 'text-rose-500', type: 'expense', userId: '' },
    { name: 'Medical & Wellness', icon: 'Stethoscope', color: 'text-red-600', type: 'expense', userId: '' },
    { name: 'Entertainment', icon: 'Film', color: 'text-purple-500', type: 'expense', userId: '' },
    { name: 'Shopping', icon: 'Shirt', color: 'text-pink-500', type: 'expense', userId: '' },
    { name: 'Subscription', icon: 'Wallet', color: 'text-indigo-500', type: 'expense', userId: '' },
    { name: 'Loan/EMI', icon: 'Landmark', color: 'text-violet-500', type: 'expense', userId: '' },
    { name: 'Investment', icon: 'TrendingUp', color: 'text-sky-500', type: 'expense', userId: '' },
    { name: 'Miscellaneous', icon: 'Shapes', color: 'text-gray-500', type: 'expense', userId: '' },
    // Income
    { name: 'Salary', icon: 'Wallet', color: 'text-green-500', type: 'income', userId: '' },
    { name: 'Business / Side Hustle', icon: 'Briefcase', color: 'text-green-600', type: 'income', userId: '' },
    { name: 'Investments', icon: 'LineChart', color: 'text-green-700', type: 'income', userId: '' },
    { name: 'Other Income', icon: 'Gift', color: 'text-green-800', type: 'income', userId: '' },
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

    let relevantTransactions = allTransactions || [];

    // If a date range is provided, filter transactions by it.
    if (dateRange?.from && dateRange.to) {
        const range = { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to) };
        relevantTransactions = relevantTransactions.filter(t => isWithinInterval(toDate(t.date), range));
    }

    return budgets.map(budget => {
        if (!budget || !budget.categoryId) return budget;
        
        if (budget.type === 'Expense') {
            const spent = relevantTransactions
                .filter(t => t.type === 'expense' && t.categoryId === budget.categoryId)
                .reduce((sum, t) => sum + Math.abs(t.amount), 0);
            
            return {
                ...budget,
                spent,
            };
        } else { // Income budget
             const received = relevantTransactions
                .filter(t => t.type === 'income' && t.categoryId === budget.categoryId)
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
  
  // Determine the range. If no dateRange is provided (e.g., for 'All Time'), find the min and max dates from transactions.
  const range = dateRange?.from && dateRange.to 
    ? { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to) } 
    : (() => {
        if (transactions.length === 0) return { start: startOfMonth(new Date()), end: endOfMonth(new Date()) };
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
      getPeriodKey = (date) => format(startOfMonth(date), 'MMM yyyy');
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
    const today = startOfDay(new Date());
    const owedInstances: Owed[] = [];

    const addPeriod = (date: Date, frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly') => {
        switch (frequency) {
            case 'weekly': return addWeeks(date, 1);
            case 'monthly': return addMonths(date, 1);
            case 'quarterly': return addQuarters(date, 1);
            case 'yearly': return addYears(date, 1);
        }
    };

    recurringExpenses.forEach((t) => {
        if (!t.frequency) return;

        let nextDueDate = toDate(t.date);
        
        // Immediately find the first occurrence *after* the start date
        nextDueDate = addPeriod(nextDueDate, t.frequency);

        // Fast-forward to the first due date that is on or after today
        while (isBefore(nextDueDate, today)) {
            nextDueDate = addPeriod(nextDueDate, t.frequency);
        }
        
        const endDate = t.recurrenceEndDate ? toDate(t.recurrenceEndDate) : null;
        
        // Check if this upcoming due date is valid
        if (!endDate || isBefore(nextDueDate, endDate) || isSameDay(nextDueDate, endDate)) {
             // Check if this specific instance has already been paid
            const isPaid = transactions.some(p => 
                !p.isRecurring &&
                p.categoryId === t.categoryId &&
                p.description === t.description &&
                isSameDay(toDate(p.date), nextDueDate)
            );

            if (!isPaid) {
                 owedInstances.push({
                    ...t,
                    instanceDate: nextDueDate,
                });
            }
        }
    });

    // Handle overdue items separately
     recurringExpenses.forEach((t) => {
        if (!t.frequency) return;
        let pastDueDate = toDate(t.date);
        
        while(isBefore(pastDueDate, today)) {
            const isPastPaid = transactions.some(p => 
                !p.isRecurring &&
                p.categoryId === t.categoryId &&
                p.description === t.description &&
                isSameDay(toDate(p.date), pastDueDate)
            );
            if (!isPastPaid) {
                const alreadyInOwed = owedInstances.some(o => isSameDay(o.instanceDate, pastDueDate) && o.id === t.id);
                if (!alreadyInOwed) {
                    owedInstances.push({
                        ...t,
                        instanceDate: pastDueDate
                    });
                }
            }
            pastDueDate = addPeriod(pastDueDate, t.frequency);
        }
    });

    const uniqueDues = Array.from(
        new Map(
            owedInstances.map(due => [`${due.id}-${due.instanceDate.toISOString()}`, due])
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
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    // We pass the current month date range to getBudgets 
    const budgetsWithSpent = getBudgets(allBudgets, allTransactions, {from: monthStart, to: monthEnd}); 
    budgetsWithSpent.forEach(budget => {
      if (!budget || budget.type === 'Income') return; // Only alert for expense budgets
      const spent = budget.spent ?? 0;
      const limit = budget.budgetAmount ?? 0;
      const usage = limit > 0 ? (spent / limit) * 100 : 0;

      if (usage >= 100) {
        notifications.push({
          id: `budget-over-${budget.id}`,
          type: 'budget',
          title: 'Budget Exceeded',
          description: `You are over budget for '${budget.name}' this month.`,
          href: '/budgets',
        });
      } else if (usage >= 80) {
        notifications.push({
          id: `budget-alert-${budget.id}`,
          type: 'budget',
          title: 'Budget Alert',
          description: `You've used ${usage.toFixed(0)}% of your '${budget.name}' budget.`,
          href: '/budgets',
        });
      }
    });
  }
  
  // Overdue alerts
  if(allTransactions) {
    const owed = getOwedExpenses(allTransactions);
    owed.forEach(item => {
        if(isBefore(item.instanceDate, today)) {
             notifications.push({
                id: `overdue-${item.id}-${item.instanceDate.toISOString()}`,
                type: 'overdue',
                title: 'Overdue Payment',
                description: `'${item.description}' was due on ${format(item.instanceDate, 'MMM d')}.`,
                href: '/owed',
            });
        }
    });
  }

  const uniqueNotifications = Array.from(new Map(notifications.map(n => [n.id, n])).values());
  
  return uniqueNotifications.sort((a, b) => {
    if (a.type === 'overdue' && b.type !== 'overdue') return -1;
    if (a.type !== 'overdue' && b.type === 'overdue') return 1;
    return 0;
  });
}
