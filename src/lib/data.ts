

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
import { addWeeks, addMonths, addQuarters, addYears, format, startOfMonth, endOfMonth, isWithinInterval, startOfWeek, endOfWeek, eachWeekOfInterval, eachMonthOfInterval, eachDayOfInterval, isBefore, differenceInDays, addDays, isAfter, startOfDay } from 'date-fns';
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
    if (!t.isRecurring) {
      if (isWithinInterval(expenseDate, { start: rangeStart, end: rangeEnd })) {
        upcoming.push({ ...t, date: expenseDate });
        if (isBefore(expenseDate, today)) {
          overdueCount++;
        } else {
          upcomingCount++;
        }
      }
    } else {
      let nextDate = expenseDate;
      const recurrenceEndDate = t.recurrenceEndDate ? toDate(t.recurrenceEndDate) : addYears(rangeEnd, 1);
      
      while (isBefore(nextDate, rangeStart)) {
        if(isAfter(nextDate, recurrenceEndDate)) break;
        switch (t.frequency) {
          case 'weekly': nextDate = addWeeks(nextDate, 1); break;
          case 'monthly': nextDate = addMonths(nextDate, 1); break;
          case 'quarterly': nextDate = addQuarters(nextDate, 1); break;
          case 'yearly': nextDate = addYears(nextDate, 1); break;
          default: nextDate = addYears(rangeEnd, 1);
        }
      }

      while (isWithinInterval(nextDate, { start: rangeStart, end: rangeEnd }) && isBefore(nextDate, recurrenceEndDate)) {
        upcoming.push({ ...t, id: `${t.id}-${nextDate.toISOString()}`, date: nextDate });
        if (isBefore(nextDate, today)) {
          overdueCount++;
        } else {
          upcomingCount++;
        }

        switch (t.frequency) {
          case 'weekly': nextDate = addWeeks(nextDate, 1); break;
          case 'monthly': nextDate = addMonths(nextDate, 1); break;
          case 'quarterly': nextDate = addQuarters(nextDate, 1); break;
          case 'yearly': nextDate = addYears(nextDate, 1); break;
          default: nextDate = addYears(rangeEnd, 1);
        }
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
            limit: budget.budgetAmount,
        };
    });
}

export function generateDueInstances(dues: Due[] | null): Due[] {
    if (!dues) return [];
    
    const instances: Due[] = [];
    const today = startOfDay(new Date());
    const rangeEnd = endOfMonth(addMonths(today, 6)); // Look 6 months into the future
    const defaultEndDate = addYears(rangeEnd, 5); // Default end date if none is specified

    dues.forEach(due => {
        const startDate = toDate(due.dueDate);
        
        if (!due.isRecurring) {
            // One-time due
            if (!due.isPaid || (due.paidDate && isWithinInterval(toDate(due.paidDate), {start: today, end: rangeEnd}))) {
                instances.push({
                    ...due,
                    instanceDate: startDate,
                });
            }
        } else {
            // Recurring due
            const recurrenceEndDate = due.recurrenceEndDate ? toDate(due.recurrenceEndDate) : defaultEndDate;
            
            // First, add the initial due date if it's within range
            if (isWithinInterval(startDate, { start: today, end: rangeEnd })) {
                 const instanceDateStr = startDate.toISOString().split('T')[0];
                 const isInstancePaid = !!(due as any).paidInstances?.[instanceDateStr];
                 instances.push({
                    ...due,
                    instanceDate: startDate,
                    isPaid: isInstancePaid,
                    paidDate: isInstancePaid ? startDate : null,
                });
            }
            
            let nextDate = startDate;

            // Generate subsequent instances, aligned to the 1st of the period
            let sanityCheck = 0;
            while (isBefore(nextDate, rangeEnd) && isBefore(nextDate, recurrenceEndDate) && sanityCheck < 120) { // Limit to 10 years of monthly checks
                 switch (due.frequency) {
                    case 'weekly':
                        nextDate = startOfWeek(addWeeks(nextDate, 1));
                        break;
                    case 'monthly':
                        nextDate = startOfMonth(addMonths(nextDate, 1));
                        break;
                    case 'quarterly':
                        nextDate = startOfQuarter(addQuarters(nextDate, 1));
                        break;
                    case 'yearly':
                        nextDate = startOfYear(addYears(nextDate, 1));
                        break;
                    default:
                        nextDate = addYears(rangeEnd, 1); // Should not happen
                }

                if (isBefore(nextDate, recurrenceEndDate) && isWithinInterval(nextDate, { start: today, end: rangeEnd })) {
                    const instanceDateStr = nextDate.toISOString().split('T')[0];
                    const isInstancePaid = !!(due as any).paidInstances?.[instanceDateStr];
                    
                    instances.push({
                        ...due,
                        instanceDate: nextDate,
                        isPaid: isInstancePaid,
                        paidDate: isInstancePaid ? nextDate : null,
                    });
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
          .filter(t => !t.isRecurring && isWithinInterval(toDate(t.date), interval))
          .forEach(t => {
              const amount = Math.abs(t.amount);
              if (isBefore(toDate(t.date), today)) {
                  overdueForPeriod += amount;
              } else {
                  openForPeriod += amount;
              }
          });
      
      // Handle recurring expenses
      allExpenses
          .filter(t => t.isRecurring && t.frequency)
          .forEach(t => {
              let nextDate = toDate(t.date);
              const recurrenceEndDate = t.recurrenceEndDate ? toDate(t.recurrenceEndDate) : addYears(range.end, 1);

              while(nextDate <= interval.end && nextDate <= recurrenceEndDate) {
                  if (nextDate >= interval.start) {
                      const amount = Math.abs(t.amount);
                      // Treat all future recurring items as "open" for forecasting
                      if (isBefore(nextDate, today)) {
                        overdueForPeriod += amount;
                      } else {
                        openForPeriod += amount;
                      }
                  }
                  switch (t.frequency) {
                      case 'weekly': nextDate = addWeeks(nextDate, 1); break;
                      case 'monthly': nextDate = addMonths(nextDate, 1); break;
                      case 'quarterly': nextDate = addQuarters(nextDate, 1); break;
                      case 'yearly': nextDate = addYears(nextDate, 1); break;
                      default: nextDate = addYears(interval.end, 1);
                  }
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
