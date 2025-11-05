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
import { addWeeks, addMonths, addQuarters, addYears, parseISO } from 'date-fns';

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

const transactions: Transaction[] = [
  { id: 'txn-1', description: 'Monthly Rent', amount: -1200.0, date: new Date('2024-05-01'), category: 'Housing', isRecurring: true, frequency: 'monthly', type: 'expense' },
  { id: 'txn-2', description: 'Trader Joe\'s', amount: -85.2, date: new Date('2024-07-02'), category: 'Groceries', type: 'expense' },
  { id: 'txn-3', description: 'Netflix Subscription', amount: -15.49, date: new Date('2024-05-03'), category: 'Entertainment', isRecurring: true, frequency: 'monthly', type: 'expense' },
  { id: 'txn-4', description: 'Gas Fill-up', amount: -55.6, date: new Date('2024-07-04'), category: 'Transport', type: 'expense' },
  { id: 'txn-5', description: 'Dinner with friends', amount: -64.75, date: new Date('2024-07-05'), category: 'Dining Out', type: 'expense' },
  { id: 'txn-6', description: 'Pharmacy', amount: -22.0, date: new Date('2024-07-06'), category: 'Health', type: 'expense' },
  { id: 'txn-7', description: 'New T-shirt', amount: -29.99, date: new Date('2024-07-08'), category: 'Apparel', type: 'expense' },
  { id: 'txn-8', description: 'Whole Foods', amount: -124.5, date: new Date('2024-07-09'), category: 'Groceries', type: 'expense' },
  { id: 'txn-9', description: 'Movie Tickets', amount: -32.0, date: new Date('2024-07-11'), category: 'Entertainment', type: 'expense' },
  { id: 'txn-10', description: 'Coursera Course', amount: -49.0, date: new Date('2024-05-12'), category: 'Education', isRecurring: true, frequency: 'quarterly', type: 'expense'},
  { id: 'txn-11', description: 'Birthday Gift for Mom', amount: -50.0, date: new Date('2024-07-14'), category: 'Gifts', type: 'expense' },
  { id: 'txn-12', description: 'Lunch at work', amount: -12.5, date: new Date('2024-07-15'), category: 'Dining Out', type: 'expense' },
  { id: 'txn-13', description: 'Spotify Subscription', amount: -10.99, date: new Date('2024-05-16'), category: 'Entertainment', isRecurring: true, frequency: 'monthly', type: 'expense' },
  { id: 'txn-14', description: 'Electricity Bill', amount: -75.0, date: new Date('2024-05-18'), category: 'Housing', isRecurring: true, frequency: 'monthly', type: 'expense' },
  { id: 'txn-15', description: 'Farmer\'s Market', amount: -45.3, date: new Date('2024-07-20'), category: 'Groceries', type: 'expense' },
  { id: 'txn-16', description: 'Yoga Class', amount: -25, date: new Date('2024-06-01'), category: 'Health', isRecurring: true, frequency: 'weekly', type: 'expense' },
  { id: 'txn-17', description: 'Car Insurance', amount: -150, date: new Date('2024-01-15'), category: 'Transport', isRecurring: true, frequency: 'yearly', type: 'expense' },
  { id: 'inc-1', description: 'Monthly Salary', amount: 5000, date: new Date('2024-07-01'), category: 'Salary', type: 'income'},
  { id: 'inc-2', description: 'Freelance Project', amount: 750, date: new Date('2024-07-10'), category: 'Freelance', type: 'income'},
];

export function getMockIncome(): Income[] {
    const incomeTxns = transactions.filter(t => t.type === 'income');
    return incomeTxns.map(t => ({
        id: t.id,
        description: t.description,
        amount: t.amount,
        date: t.date,
    })).sort((a,b) => b.date.getTime() - a.date.getTime());
}

export function getMockExpenses(): Transaction[] {
  const expenseTxns = transactions.filter(t => t.type === 'expense');
  const allTransactions: Transaction[] = [...expenseTxns];
  const recurringTransactions = expenseTxns.filter(t => t.isRecurring && t.frequency);
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

  return allTransactions.map(t => ({...t, amount: Math.abs(t.amount) * -1, type: 'expense'})).sort((a,b) => b.date.getTime() - a.date.getTime());
}


// --- Functions that operate on live data ---

export function parseTransactions(storedTransactionsString: string | null): Transaction[] {
    if (!storedTransactionsString) return [];
    try {
        return JSON.parse(storedTransactionsString).map((t: any) => ({
            ...t,
            date: parseISO(t.date), // Use parseISO from date-fns
        }));
    } catch (e) {
        console.error("Failed to parse transactions from localStorage", e);
        return [];
    }
}

export function getRecentTransactions(allTransactions: Transaction[], count: number): Transaction[] {
  return [...allTransactions]
    .sort((a,b) => b.date.getTime() - a.date.getTime())
    .slice(0, count);
}

export function getUpcomingBills(allTransactions: Transaction[]): Transaction[] {
    const today = new Date();
    const nextMonth = addMonths(today, 1);
    const upcoming: Transaction[] = [];
    const recurring = allTransactions.filter(t => t.isRecurring && t.frequency && t.type === 'expense');

    recurring.forEach(t => {
        let nextDate = new Date(t.date);
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
    return upcoming.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 5);
}


export function getTotals(allTransactions: Transaction[]) {
  const income = allTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = allTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const savings = income + expenses; // expenses is negative
  return { income, expenses: Math.abs(expenses), savings };
}

export function getSpendingByCategory(allTransactions: Transaction[]) {
  const spendingMap = new Map<string, number>();
  
  const allExpenses = allTransactions.filter(t => t.amount < 0);
  
  allExpenses.forEach(t => {
    const absAmount = Math.abs(t.amount);
    spendingMap.set(t.category, (spendingMap.get(t.category) || 0) + absAmount);
  });
  return Array.from(spendingMap.entries()).map(([name, total]) => ({ name, total }));
}

export function getBudgets(allTransactions: Transaction[]): Budget[] {
  const today = new Date();
  const spendingThisMonth = new Map<string, number>();
  const currentMonthExpenses = allTransactions.filter(t => 
    t.date.getMonth() === today.getMonth() && 
    t.date.getFullYear() === today.getFullYear() &&
    t.amount < 0
  );

  currentMonthExpenses.forEach(t => {
      const absAmount = Math.abs(t.amount);
      spendingThisMonth.set(t.category, (spendingThisMonth.get(t.category) || 0) + absAmount);
  });

  const budgetData: { [key: string]: number } = {
    'Groceries': 400,
    'Dining Out': 200,
    'Transport': 150,
    'Entertainment': 100,
    'Housing': 1300,
    'Health': 100,
  };

  return Object.entries(budgetData).map(([name, limit], index) => {
    const spent = spendingThisMonth.get(name) || 0;
    return {
      id: `budget-${index + 1}`,
      name,
      limit,
      spent,
    };
  });
}
