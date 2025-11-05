
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
}

export interface Budget {
  id: string;
  name: string;
  limit: number;
  spent: number;
  isRecurring?: boolean;
}

export interface Income {
  id: string;
  description: string;
  amount: number;
  date: Date;
}

export interface UploadedFile {
  id: string;
  name: string;
  uploadDate: Date | Timestamp;
  fileSize: number;
  fileType: string;
}

const TransactionSchema = z.object({
    date: z.string().describe('The date of the transaction in YYYY-MM-DD format.'),
    description: z.string().describe('A brief description of the transaction.'),
    amount: z.number().describe('The transaction amount. Positive for credit (income), negative for debit (expense).'),
    category: z.string().describe('The suggested category for the transaction (e.g., "Groceries", "Salary", "Transport").'),
});

export const ProcessTransactionsInputSchema = z.object({
  fileContent: z.string().describe('The raw text content of the bank statement (CSV or PDF).'),
  categories: z.array(z.string()).describe('A list of possible expense categories to use.'),
  incomeCategories: z.array(z.string()).describe('A list of possible income categories (e.g., "Salary", "Freelance").'),
});
export type ProcessTransactionsInput = z.infer<typeof ProcessTransactionsInputSchema>;

export const ProcessTransactionsOutputSchema = z.object({
  transactions: z.array(TransactionSchema).describe('An array of categorized transactions.'),
});
export type ProcessTransactionsOutput = z.infer<typeof ProcessTransactionsOutputSchema>;
