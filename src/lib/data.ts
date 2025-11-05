

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
import type { Category, Transaction, Budget, Income } from './types';
import { addWeeks, addMonths, addQuarters, addYears, format, startOfMonth, endOfMonth, isWithinInterval, startOfWeek, endOfWeek, eachWeekOfInterval, eachMonthOfInterval, eachDayOfInterval, isBefore, differenceInDays } from 'date-fns';
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

function toDate(date: Date | Timestamp): Date {
    return date instanceof Date ? date : (date as Timestamp).toDate();
}


export function getRecentTransactions(allTransactions: Transaction[] | null, count: number): Transaction[] {
  if (!allTransactions) return [];
  return [...allTransactions]
    .map(t => ({...t, date: toDate(t.date)}))
    .sort((a,b) => b.date.getTime() - a.date.getTime())
    .slice(0, count);
}

export function getUpcomingBills(allTransactions: Transaction[] | null, dateRange?: DateRange): Transaction[] {
    if (!allTransactions) return [];
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const rangeEnd = dateRange?.to ? toDate(dateRange.to) : addMonths(today, 1);

    const upcoming: Transaction[] = [];
    const recurring = allTransactions.filter(t => t.isRecurring && t.frequency && t.type === 'expense');

    recurring.forEach(t => {
        let nextDate = toDate(t.date);
        // Find the next occurrence after today
        while(nextDate < today) {
             switch (t.frequency) {
                case 'weekly':
                    nextDate = addWeeks(nextDate, 1);
                    break;
                case 'monthly':
                    nextDate = addMonths(nextDate, 1);
                    break;
                case 'quarterly':
                    nextDate = addQuarters(nextDate, 1);
                    break;
                case 'yearly':
                    nextDate = addYears(nextDate, 1);
                    break;
                default:
                     nextDate = new Date(today.getFullYear() + 100, 1, 1); // stop loop
                    break;
             }
        }
        
        if (nextDate >= today && nextDate <= rangeEnd) {
            upcoming.push({
                ...t,
                id: `${t.id}-upcoming-${nextDate.toISOString()}`,
                date: nextDate,
            });
        }
    });
    return upcoming.sort((a, b) => toDate(a.date).getTime() - toDate(b.date).getTime()).slice(0, 5);
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


export function getBudgets(budgets: Budget[], allTransactions: Transaction[] | null): Budget[] {
    if (!budgets) return [];

    // The new logic simply returns the budgets as they are planned expenses.
    // The `spent` calculation is no longer needed for forecasting.
    return budgets.map(budget => ({
        ...budget,
        // Ensure dates are JS Date objects
        budgetStartDate: toDate(budget.budgetStartDate),
        budgetEndDate: toDate(budget.budgetEndDate),
    }));
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
      let closedForPeriod = 0;

      // Handle one-time expenses
      allExpenses
          .filter(t => !t.isRecurring && isWithinInterval(toDate(t.date), interval))
          .forEach(t => {
              const amount = Math.abs(t.amount);
              if (t.status === 'Paid') {
                  closedForPeriod += amount;
              } else {
                  if (isBefore(toDate(t.date), today)) {
                      overdueForPeriod += amount;
                  } else {
                      openForPeriod += amount;
                  }
              }
          });
      
      // Handle recurring expenses
      allExpenses
          .filter(t => t.isRecurring && t.frequency)
          .forEach(t => {
              let nextDate = toDate(t.date);
              while(nextDate <= interval.end) {
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
      
      if (openForPeriod > 0 || overdueForPeriod > 0 || closedForPeriod > 0) {
          forecastData.push({ 
              name: periodName, 
              open: openForPeriod, 
              overdue: overdueForPeriod, 
              closed: closedForPeriod 
            });
      }
  });

  return forecastData;
}
