

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
import { addWeeks, addMonths, addQuarters, addYears, format, startOfMonth, endOfMonth, isWithinInterval, startOfWeek, endOfWeek, eachWeekOfInterval, eachMonthOfInterval, eachDayOfInterval, isBefore, differenceInDays, addDays, isAfter, startOfDay, startOfQuarter, startOfYear, endOfQuarter, endOfYear } from 'date-fns';
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

export const getCategoryByName = (name: string, categories: Category[]) => categories.find(c => c.name === name);

// --- Functions that operate on live data ---

export function toDate(date: Date | Timestamp): Date {
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
  dateRange?: DateRange
) {
  if (!allTransactions) return { bills: [], upcomingCount: 0, overdueCount: 0 };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rangeEnd = dateRange?.to ? toDate(dateRange.to) : endOfMonth(addMonths(today, 3));
  const rangeStart = dateRange?.from ? toDate(dateRange.from) : today;

  const upcoming: Transaction[] = [];
  let upcomingCount = 0;
  let overdueCount = 0;

  const unpaidExpenses = allTransactions.filter(
    (t) => t.type === 'expense'
  );

  unpaidExpenses.forEach((t) => {
    const expenseDate = toDate(t.date);
    if (isWithinInterval(expenseDate, { start: rangeStart, end: rangeEnd })) {
      upcoming.push({ ...t, date: expenseDate });
      if (isBefore(expenseDate, today)) {
        overdueCount++;
      } else {
        upcomingCount++;
      }
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
    const currentTotal = spendingMap.get(t.category) || 0;
    spendingMap.set(t.category, currentTotal + Math.abs(t.amount));
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
            limit: budget.limit,
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
      if (!due.isPaid) {
        instances.push({ ...due, instanceDate: startDate });
      }
    } else {
      // For recurring dues, find all past unpaid and the single next upcoming instance.
      const recurrenceEndDate = due.recurrenceEndDate ? toDate(due.recurrenceEndDate) : defaultEndDate;
      let nextDate = startDate;
      let foundNextUpcoming = false;
      let sanityCheck = 0; // Prevent infinite loops

      while (isBefore(nextDate, recurrenceEndDate) && sanityCheck < 360) { // Limit to ~30 years of monthly checks
        const instanceDateStr = nextDate.toISOString().split('T')[0];
        const isInstancePaid = !!(due as any).paidInstances?.[instanceDateStr];

        if (!isInstancePaid) {
          if (isBefore(nextDate, today)) {
            // This is an overdue, unpaid instance. Add it.
            instances.push({
              ...due,
              instanceDate: nextDate,
              isPaid: false,
            });
          } else if (!foundNextUpcoming) {
            // This is the first upcoming, unpaid instance. Add it and stop looking for this due.
            instances.push({
              ...due,
              instanceDate: nextDate,
              isPaid: false,
            });
            foundNextUpcoming = true;
          }
        }
        
        if (foundNextUpcoming && !isBefore(nextDate, today)) {
             break; // Exit loop once we have found the next upcoming due
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
  return instances;
}


export function getBudgetForecast(
  allTransactions: Transaction[] | null,
  period: 'daily' | 'monthly',
  dateRange?: DateRange
) {
  if (!allTransactions) return [];
  
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize today to the start of the day

  const range = dateRange?.from && dateRange.to 
    ? { start: dateRange.from, end: dateRange.to } 
    : { start: startOfMonth(today), end: endOfMonth(addMonths(today, 3)) };
  
  const forecastData: { name: string; open: number; overdue: number; closed: number; }[] = [];
  const allExpenses = allTransactions.filter(t => t.type === 'expense');

  let periods: {start: Date, end: Date}[];
  let formatString: string;

  if (period === 'daily') {
      periods = eachDayOfInterval(range).map(d => ({start: d, end: d}));
      formatString = 'dd MMM';
  } else { // monthly
      periods = eachMonthOfInterval(range).map(d => ({start: d, end: endOfMonth(d)}));
      formatString = 'MMM yyyy';
  }

  periods.forEach(interval => {
      const periodName = format(interval.start, formatString);
      let openForPeriod = 0;
      let overdueForPeriod = 0;

      // Handle one-time expenses
      allExpenses
          .filter(t => isWithinInterval(toDate(t.date), interval))
          .forEach(t => {
              const amount = Math.abs(t.amount);
              if (isBefore(toDate(t.date), today)) {
                  overdueForPeriod += amount;
              } else {
                  openForPeriod += amount;
              }
          });
      
      if (openForPeriod > 0 || overdueForPeriod > 0) {
          forecastData.push({ 
              name: periodName, 
              open: openForPeriod, 
              overdue: overdueForPeriod, 
              closed: 0
            });
      }
  });

  return forecastData;
}


export function getNotifications(
  allTransactions: Transaction[] | null,
  allBudgets: Budget[] | null,
  allDues: Due[] | null,
): Notification[] {
  const notifications: Notification[] = [];
  if (!allBudgets && !allDues) return [];

  const today = startOfDay(new Date());

  // Due alerts
  if (allDues) {
    const dueInstances = generateDueInstances(allDues);
    dueInstances.forEach(due => {
      const instanceDate = toDate(due.instanceDate || due.dueDate);
      if (!due.isPaid) {
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
      const limit = budget.limit ?? 0;
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
