
import type { LucideIcon } from "lucide-react";
import { z } from 'zod';
import type { Timestamp } from 'firebase/firestore';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
  userId: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: Date | Timestamp;
  category: string;
  categoryId?: string | null;
  type: 'income' | 'expense';
  userId: string;
}

export interface Budget {
  id: string;
  userId: string;
  name: string;
  budgetAmount: number;
  type: 'Expense' | 'Income';
  categoryId: string;
  // These are calculated fields, not in Firestore
  spent?: number;
  received?: number;
}


export interface Income {
  id: string;
  description: string;
  amount: number;
  date: Date | Timestamp;
}

export interface Due {
    id: string;
    userId: string;
    dueName: string;
    dueAmount: number;
    dueDate: Date | Timestamp; // Represents the START date for recurring dues
    isPaid: boolean;
    isRecurring: boolean;
    frequency?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    recurrenceEndDate?: Date | Timestamp;
    category: string;
    categoryId: string | null;
    paidDate?: Date | Timestamp | null;
    // For recurring instances
    instanceDate?: Date; // The specific date for this instance of a recurring due
    paidInstances?: { [date: string]: boolean };
}

export interface Notification {
  id: string;
  type: 'overdue' | 'upcoming' | 'budget';
  title: string;
  description: string;
  href: string;
}

export interface AppSettings {
    logoUrl?: string;
}

export interface UserProfile {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    photoURL?: string;
}
