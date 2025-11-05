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
import type { Category, Transaction, Budget } from './types';
import { addWeeks, addMonths, addQuarters, addYears } from 'date-fns';

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
];

export const getCategoryByName = (name: string) => categories.find(c => c.name === name);

const transactions: Transaction[] = [
  { id: 'txn-1', description: 'Monthly Rent', amount: 1200.0, date: new Date('2024-05-01'), category: 'Housing', isRecurring: true, frequency: 'monthly' },
  { id: 'txn-2', description: 'Trader Joe\'s', amount: 85.2, date: new Date('2024-07-02'), category: 'Groceries' },
  { id: 'txn-3', description: 'Netflix Subscription', amount: 15.49, date: new Date('2024-05-03'), category: 'Entertainment', isRecurring: true, frequency: 'monthly' },
  { id: 'txn-4', description: 'Gas Fill-up', amount: 55.6, date: new Date('2024-07-04'), category: 'Transport' },
  { id: 'txn-5', description: 'Dinner with friends', amount: 64.75, date: new Date('2024-07-05'), category: 'Dining Out' },
  { id: 'txn-6', description: 'Pharmacy', amount: 22.0, date: new Date('2024-07-06'), category: 'Health' },
  { id: 'txn-7', description: 'New T-shirt', amount: 29.99, date: new Date('2024-07-08'), category: 'Apparel' },
  { id: 'txn-8', description: 'Whole Foods', amount: 124.5, date: new Date('2024-07-09'), category: 'Groceries' },
  { id: 'txn-9', description: 'Movie Tickets', amount: 32.0, date: new Date('2024-07-11'), category: 'Entertainment' },
  { id: 'txn-10', description: 'Coursera Course', amount: 49.0, date: new Date('2024-05-12'), category: 'Education', isRecurring: true, frequency: 'quarterly'},
  { id: 'txn-11', description: 'Birthday Gift for Mom', amount: 50.0, date: new Date('2024-07-14'), category: 'Gifts' },
  { id: 'txn-12', description: 'Lunch at work', amount: 12.5, date: new Date('2024-07-15'), category: 'Dining Out' },
  { id: 'txn-13', description: 'Spotify Subscription', amount: 10.99, date: new Date('2024-05-16'), category: 'Entertainment', isRecurring: true, frequency: 'monthly' },
  { id: 'txn-14', description: 'Electricity Bill', amount: 75.0, date: new Date('2024-05-18'), category: 'Housing', isRecurring: true, frequency: 'monthly' },
  { id: 'txn-15', description: 'Farmer\'s Market', amount: 45.3, date: new Date('2024-07-20'), category: 'Groceries' },
  { id: 'txn-16', description: 'Yoga Class', amount: 25, date: new Date('2024-06-01'), category: 'Health', isRecurring: true, frequency: 'weekly' },
  { id: 'txn-17', description: 'Car Insurance', amount: 150, date: new Date('2024-01-15'), category: 'Transport', isRecurring: true, frequency: 'yearly' },
];

export function getMockExpenses(): Transaction[] {
  const allTransactions: Transaction[] = [...transactions];
  const recurringTransactions = transactions.filter(t => t.isRecurring && t.frequency);
  const today = new Date();
  
  recurringTransactions.forEach(t => {
    let nextDate = new Date(t.date);
    
    while(nextDate < today) {
      let incrementedDate: Date;
      switch (t.frequency) {
        case 'weekly':
          incrementedDate = addWeeks(nextDate, 1);
          break;
        case 'monthly':
          incrementedDate = addMonths(nextDate, 1);
          break;
        case 'quarterly':
          incrementedDate = addQuarters(nextDate, 1);
          break;
        case 'yearly':
          incrementedDate = addYears(nextDate, 1);
          break;
        default:
          incrementedDate = new Date(today.getFullYear() + 100, 1, 1); // stop loop
          break;
      }

      if (incrementedDate < today) {
          allTransactions.push({
              ...t,
              id: `${t.id}-${nextDate.toISOString()}`,
              date: incrementedDate,
          });
      }
      nextDate = incrementedDate;
    }
  });

  return allTransactions.sort((a,b) => b.date.getTime() - a.date.getTime());
}

export function getRecentTransactions(count: number): Transaction[] {
  return getMockExpenses().slice(0, count);
}

export function getUpcomingBills(): Transaction[] {
    const today = new Date();
    const nextMonth = addMonths(today, 1);
    const upcoming: Transaction[] = [];
    const recurring = transactions.filter(t => t.isRecurring && t.frequency);

    recurring.forEach(t => {
        let nextDate = new Date(t.date);
        while(nextDate <= nextMonth) {
             if (nextDate >= today) {
                upcoming.push({
                    ...t,
                    id: `${t.id}-upcoming-${nextDate.toISOString()}`,
                    date: nextDate,
                });
             }
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
                    nextDate = new Date(nextMonth.getFullYear() + 1, 1, 1); // stop loop
                    break;
             }
        }
    });
    return upcoming.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 5);
}


export function getTotals() {
  const income = 5000;
  // Consider only expenses from the current month for totals
  const today = new Date();
  const currentMonthExpenses = getMockExpenses().filter(t => t.date.getMonth() === today.getMonth() && t.date.getFullYear() === today.getFullYear())
  const expenses = currentMonthExpenses.reduce((sum, t) => sum + t.amount, 0);
  const savings = income - expenses;
  return { income, expenses, savings };
}

export function getSpendingByCategory() {
  const spendingMap = new Map<string, number>();
  // Consider only expenses from the current month
  const today = new Date();
  const currentMonthExpenses = getMockExpenses().filter(t => t.date.getMonth() === today.getMonth() && t.date.getFullYear() === today.getFullYear())
  
  currentMonthExpenses.forEach(t => {
    spendingMap.set(t.category, (spendingMap.get(t.category) || 0) + t.amount);
  });
  return Array.from(spendingMap.entries()).map(([name, total]) => ({ name, total }));
}

export function getBudgets(): Budget[] {
  const spending = getSpendingByCategory();
  const budgetData: { [key: string]: number } = {
    'Groceries': 400,
    'Dining Out': 200,
    'Transport': 150,
    'Entertainment': 100,
    'Housing': 1300,
    'Health': 100,
  };

  return Object.entries(budgetData).map(([name, limit], index) => {
    const spent = spending.find(s => s.name === name)?.total || 0;
    return {
      id: `budget-${index + 1}`,
      name,
      limit,
      spent,
    };
  });
}
