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
} from 'lucide-react';
import type { Category, Transaction, Budget, Income } from './types';
import { addWeeks, addMonths, addQuarters, addYears } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';


export const categories: Category[] = [
  { id: 'cat-1', name: 'Groceries', icon: ShoppingBag, color: 'text-emerald-500' },
  { id: 'cat-2', name: 'Health', icon: HeartPulse, color: 'text-red-500' },
  { id: 'cat-3', name: 'Dining Out', icon: Utensils, color: 'text-orange-500' },
  { id: 'cat-4', name: 'Transport', icon: Car, color: 'text-blue-500' },
  { id: 'cat-5', name: 'Housing', icon: Home, color: 'text-cyan-500' },
  { id: 'cat-6', name: 'Entertainment', icon: Film, color: 'text-purple-500' },
  { id: 'cat-7', name: 'Education', icon: GraduationCap, color: 'text-indigo-500' },
  { id: 'cat-8', name: 'Apparel', icon: Shirt, color: 'text-pink-500' },
  { id: 'cat-9', name: 'Gifts', icon: Gift, color: 'text-yellow-500' },
  { id: 'cat-10', name: 'Salary', icon: Gift, color: 'text-green-500' },
  { id: 'cat-11', name: 'Freelance', icon: Gift, color: 'text-green-500' },
  { id: 'cat-12', name: 'Investment', icon: Gift, color: 'text-green-500' },
  { id: 'cat-13', name: 'Other Income', icon: Gift, color: 'text-green-500' },
];

export const getCategoryByName = (name: string) => categories.find(c => c.name === name);

// --- Functions that operate on live data ---

function toDate(date: Date | Timestamp): Date {
    return date instanceof Date ? date : (date as Timestamp).toDate();
}


export function getRecentTransactions(allTransactions: Transaction[], count: number): Transaction[] {
  if (!allTransactions) return [];
  return [...allTransactions]
    .sort((a,b) => toDate(b.date).getTime() - toDate(a.date).getTime())
    .slice(0, count);
}

export function getUpcomingBills(allTransactions: Transaction[]): Transaction[] {
    if (!allTransactions) return [];
    const today = new Date();
    const nextMonth = addMonths(today, 1);
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
        
        if (nextDate >= today && nextDate <= nextMonth) {
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
    .reduce((sum, t) => sum + t.amount, 0);

  const savings = income + expenses; // expenses is negative
  return { income, expenses: Math.abs(expenses), savings };
}

export function getSpendingByCategory(allTransactions: Transaction[] | null) {
  if (!allTransactions) return [];
  const spendingMap = new Map<string, number>();
  
  const allExpenses = allTransactions.filter(t => t.type === 'expense');
  
  allExpenses.forEach(t => {
    const absAmount = Math.abs(t.amount);
    spendingMap.set(t.category, (spendingMap.get(t.category) || 0) + absAmount);
  });
  return Array.from(spendingMap.entries()).map(([name, total]) => ({ name, total }));
}

export function getBudgets(budgets: Budget[], allTransactions: Transaction[] | null): Budget[] {
    const today = new Date();
    if (!allTransactions || !budgets) return [];

    const spendingThisMonth = new Map<string, number>();
    const currentMonthExpenses = allTransactions.filter(t => {
      const d = toDate(t.date);
      return d.getMonth() === today.getMonth() && 
      d.getFullYear() === today.getFullYear() &&
      t.type === 'expense'
    });

    currentMonthExpenses.forEach(t => {
        const absAmount = Math.abs(t.amount);
        spendingThisMonth.set(t.category, (spendingThisMonth.get(t.category) || 0) + absAmount);
    });


    return budgets.map((budget) => {
        const spent = spendingThisMonth.get(budget.name) || 0;
        return {
          ...budget,
          spent,
        };
      });
}
