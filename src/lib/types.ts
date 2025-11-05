
import type { LucideIcon } from "lucide-react";
import { z } from 'zod';
import type { Timestamp } from 'firebase/firestore';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: Date | Timestamp;
  category: string;
  isRecurring?: boolean;
  frequency?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  type: 'income' | 'expense';
  fileURL?: string;
  fileName?: string;
  status?: 'Paid' | 'Un-paid' | 'Received' | 'Pending';
}

export interface Budget {
  id: string;
  name: string;
  budgetAmount: number;
  budgetStartDate: Date | Timestamp;
  budgetEndDate: Date | Timestamp;
  isRecurring?: boolean;
  type: 'Bills' | 'Subscription' | 'Expense';
  category: string;
  categoryId?: string;
  // These are calculated fields, not in Firestore
  spent?: number;
  limit?: number;
}


export interface Income {
  id: string;
  description: string;
  amount: number;
  date: Date | Timestamp;
  status?: 'Received' | 'Pending';
}

export interface Reminder {
  id: string;
  reminderName: string;
  reminderDate: Date | Timestamp;
  reminderAmount: number;
  isPaid: boolean;
}


export interface Notification {
  id: string;
  type: 'overdue' | 'upcoming' | 'budget';
  title: string;
  description: string;
  href: string;
}
