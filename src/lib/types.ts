
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
}

export interface Budget {
  id: string;
  name: string;
  limit: number;
  spent: number;
  type: 'Bills' | 'Subscription' | 'Expense';
  isRecurring?: boolean;
  category: string;
  categoryId?: string;
}

export interface Income {
  id: string;
  description: string;
  amount: number;
  date: Date | Timestamp;
}
