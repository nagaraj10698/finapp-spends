
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
import { addDays, addWeeks, addMonths, addQuarters, addYears, format, startOfMonth, endOfMonth, isWithinInterval, eachMonthOfInterval, eachDayOfInterval, isBefore, differenceInDays, startOfDay, endOfDay, isSameDay, isAfter, subDays, startOfWeek, endOfWeek, subWeeks, subMonths, startOfYear, endOfYear, startOfQuarter, endOfQuarter } from 'date-fns';
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


export function getBudgets(budgets: Budget[] | null, allTransactions: Transaction[] | null): Budget[] {
    if (!budgets) return [];

    const currentMonthStart = startOfMonth(new Date());
    const currentMonthEnd = endOfMonth(new Date());

    const safeTransactions = allTransactions || [];

    return budgets.map(budget => {
        if (!budget || !budget.categoryId) return budget;

        const spent = safeTransactions
            .filter(t => 
                t.type === 'expense' && 
                t.categoryId === budget.categoryId && 
                isWithinInterval(toDate(t.date), { start: currentMonthStart, end: currentMonthEnd })
            )
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        
        return {
            ...budget,
            spent,
        };
    });
}

export function generateDueInstances(dues: Due[] | null): Due[] {
  if (!dues) return [];

  const instances: Due[] = [];
  const today = startOfDay(new Date());
  // Generate a wider range to catch overdue and upcoming items for the timeline
  const rangeStart = subDays(today, 30);
  const rangeEnd = addDays(today, 60);

  dues.forEach(due => {
    const startDate = toDate(due.dueDate);

    if (!due.isRecurring) {
      if (isWithinInterval(startDate, { start: rangeStart, end: rangeEnd })) {
        instances.push({ ...due, instanceDate: startDate });
      }
    } else {
      const recurrenceEndDate = due.recurrenceEndDate ? toDate(due.recurrenceEndDate) : addYears(today, 10);
      let nextDate = startDate;
      let sanityCheck = 0;
      
      // Fast-forward to the relevant range
      while (isBefore(nextDate, rangeStart) && isBefore(nextDate, recurrenceEndDate) && sanityCheck < 500) {
           switch (due.frequency) {
            case 'weekly': nextDate = addWeeks(nextDate, 1); break;
            case 'monthly': nextDate = addMonths(nextDate, 1); break;
            case 'quarterly': nextDate = addQuarters(nextDate, 1); break;
            case 'yearly': nextDate = addYears(nextDate, 1); break;
            default: sanityCheck = 500; break;
          }
          sanityCheck++;
      }
      
      sanityCheck=0; // reset sanity check

      while (isBefore(nextDate, recurrenceEndDate) && isBefore(nextDate, rangeEnd) && sanityCheck < 100) {
        instances.push({
          ...due,
          instanceDate: new Date(nextDate),
        });

        switch (due.frequency) {
          case 'weekly': nextDate = addWeeks(nextDate, 1); break;
          case 'monthly': nextDate = addMonths(nextDate, 1); break;
          case 'quarterly': nextDate = addQuarters(nextDate, 1); break;
          case 'yearly': nextDate = addYears(nextDate, 1); break;
          default: sanityCheck = 100; break;
        }
        sanityCheck++;
      }
    }
  });
  return instances.sort((a,b) => (a.instanceDate || toDate(a.dueDate)).getTime() - (b.instanceDate || toDate(b.dueDate)).getTime());
}


export function getBudgetForecast(
  allTransactions: Transaction[] | null,
  allDues: Due[],
  period: 'daily' | 'monthly',
  dateRange?: DateRange
) {
  if (!allTransactions) return [];
  
  const today = startOfDay(new Date());

  const range = dateRange?.from && dateRange.to 
    ? { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to) } 
    : { start: startOfMonth(today), end: endOfMonth(today) };
  
  const forecastMap = new Map<string, { actual: number; expected: number }>();
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
    forecastMap.set(key, { actual: 0, expected: 0 });
  });

  // Calculate actual spending from transactions
  allTransactions.forEach(t => {
    if (t.type !== 'expense') return;
    const transactionDate = toDate(t.date);
    if (!isWithinInterval(transactionDate, range)) return;

    const periodKey = getPeriodKey(transactionDate);
    const periodData = forecastMap.get(periodKey);
    
    if (periodData) {
        periodData.actual += Math.abs(t.amount);
    }
  });

  // Calculate expected spending from dues
  const dueInstances = generateDueInstances(allDues);
  dueInstances.forEach(due => {
      const instanceDate = toDate(due.instanceDate || due.dueDate);
      if (!isWithinInterval(instanceDate, range)) return;

      const periodKey = getPeriodKey(instanceDate);
      const periodData = forecastMap.get(periodKey);

      if (periodData) {
        periodData.expected += Math.abs(due.dueAmount);
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
        } else if (differenceInDays(instanceDate, today) <= 7 && isAfter(instanceDate, subDays(today,1))) {
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
      if (!budget) return;
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
