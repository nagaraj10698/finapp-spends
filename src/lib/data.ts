

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
  if (!allTransactions) return { income: 0, expenses: 0, savings: 0, totalTransactions: 0 };
  const income = allTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = allTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const savings = income - expenses;
  return { income, expenses, savings, totalTransactions: allTransactions.length };
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

const addPeriod = (date: Date, frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly'): Date => {
    switch (frequency) {
        case 'weekly': return addWeeks(date, 1);
        case 'monthly': return addMonths(date, 1);
        case 'quarterly': return addQuarters(date, 1);
        case 'yearly': return addYears(date, 1);
    }
};

export function getBudgets(
  budgets: Budget[] | null,
  allTransactions: Transaction[] | null,
  dateRange?: DateRange,
): Budget[] {
    if (!budgets) return [];

    const range = dateRange?.from && dateRange.to
        ? { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to) }
        : { start: startOfMonth(new Date()), end: endOfMonth(new Date()) };

    const manualTransactions = (allTransactions || []).filter(t => !t.isRecurring);
    const recurringTransactions = (allTransactions || []).filter(t => t.isRecurring);

    return budgets.map(budget => {
        if (!budget || !budget.categoryId) return budget;

        let totalAmount = 0;

        if (budget.type === 'Expense') {
            // 1. Sum up manual transactions within the range
            const manualSpent = manualTransactions
                .filter(t => t.type === 'expense' && t.categoryId === budget.categoryId && isWithinInterval(toDate(t.date), range))
                .reduce((sum, t) => sum + Math.abs(t.amount), 0);
            totalAmount += manualSpent;

            // 2. Calculate and sum up all recurring instances within the range
            const recurringTemplates = recurringTransactions.filter(t => t.type === 'expense' && t.categoryId === budget.categoryId);
            
            recurringTemplates.forEach(template => {
                if (!template.frequency) return;
                
                let nextDueDate = toDate(template.date);
                const endDate = template.recurrenceEndDate ? toDate(template.recurrenceEndDate) : null;

                while (!endDate || isBefore(nextDueDate, endDate) || isSameDay(nextDueDate, endDate)) {
                    // Check if this instance falls within the budget period
                    if (isWithinInterval(nextDueDate, range)) {
                        totalAmount += Math.abs(template.amount);
                    }

                    // Stop if the next due date is after the budget period ends
                    if (isAfter(nextDueDate, range.end)) {
                        break;
                    }

                    nextDueDate = addPeriod(nextDueDate, template.frequency);
                }
            });
            
            return {
                ...budget,
                spent: totalAmount,
            };

        } else { // Income budget
            const received = manualTransactions
                .filter(t => t.type === 'income' && t.categoryId === budget.categoryId && isWithinInterval(toDate(t.date), range))
                .reduce((sum, t) => sum + Math.abs(t.amount), 0);
            
            // Note: Recurring income projection could be added here following the expense pattern if needed.
            return {
                ...budget,
                received: received,
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
    const manualTransactions = transactions.filter(t => !t.isRecurring);
    
    const owedInstances: Owed[] = [];

    recurringExpenses.forEach((template) => {
        if (!template.frequency) return;

        let nextDueDate = toDate(template.date);
        const endDate = template.recurrenceEndDate ? toDate(template.recurrenceEndDate) : null;
        const today = startOfDay(new Date());

        // Loop until we find the *first* upcoming or overdue unpaid instance
        while (endDate === null || isBefore(nextDueDate, endDate) || isSameDay(nextDueDate, endDate)) {
            const isPaid = manualTransactions.some(p => 
                p.categoryId === template.categoryId &&
                p.description === template.description &&
                isSameDay(toDate(p.date), nextDueDate)
            );
            
            // If it's not paid AND it's on or after today, it's the one we're looking for.
            if (!isPaid && (isAfter(nextDueDate, today) || isSameDay(nextDueDate, today))) {
                owedInstances.push({ ...template, instanceDate: nextDueDate });
                return; // Exit the inner loop for this template
            }

            // If it's not paid AND it's before today, it's overdue.
             if (!isPaid && isBefore(nextDueDate, today)) {
                owedInstances.push({ ...template, instanceDate: nextDueDate });
                 // Continue checking for more overdue payments for the same bill
            }

            // Move to the next period.
            nextDueDate = addPeriod(nextDueDate, template.frequency);

            // If we've jumped past today and haven't found an unpaid one, the next one is the one we want.
            if (isAfter(nextDueDate, today) && isBefore(addPeriod(startOfDay(new Date()), `-${template.frequency}`), nextDueDate)) {
                 const isNextPaid = manualTransactions.some(p => 
                    p.categoryId === template.categoryId &&
                    p.description === template.description &&
                    isSameDay(toDate(p.date), nextDueDate)
                );
                if (!isNextPaid) {
                    owedInstances.push({ ...template, instanceDate: nextDueDate });
                    return;
                }
            }
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
          id: `budget-over-${budget.id}-${monthStart.toISOString()}`,
          type: 'budget',
          title: 'Budget Exceeded',
          description: `You are over budget for '${budget.name}' this month.`,
          href: '/budgets',
        });
      } else if (usage >= 80) {
        notifications.push({
          id: `budget-alert-${budget.id}-${monthStart.toISOString()}`,
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


    
