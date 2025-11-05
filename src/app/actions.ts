
'use server';

import { getSpendingInsights, type SpendingInsightsInput } from "@/ai/flows/spending-insights";
import { processTransactions } from "@/ai/flows/process-transactions";
import { parseFile } from "@/lib/file-parser";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { initializeFirebase } from "@/firebase/server";
import { getAuth } from "firebase/auth/next-server";
import type { ProcessTransactionsInput, Transaction, Budget, Category } from "@/lib/types";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

// This is a placeholder for a real request object.
const req = {
    headers: headers(),
} as NextRequest;


async function getCollectionData<T>(userId: string, collectionName: string): Promise<T[]> {
    const { firestore } = initializeFirebase();
    if (!userId) return [];

    const querySnapshot = await getDocs(collection(firestore, 'users', userId, collectionName));
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as T[];
}


export async function getSpendingInsightsAction() {
  try {
    const user = await getAuth(req).getUser();
    if (!user) {
        return { success: false, error: 'Authentication required.' };
    }
    
    const transactions = await getCollectionData<Transaction>(user.uid, 'transactions');
    const budgets = await getCollectionData<Budget>(user.uid, 'budgets');
    
    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'expense').map(e => ({
        category: e.category,
        amount: e.amount,
        date: (e.date as any).toDate().toISOString(),
        description: e.description,
        isRecurring: e.isRecurring,
    }));


    const input: SpendingInsightsInput = {
      expenses,
      income: income,
      budget: budgets.map(b => ({
        category: b.name,
        amount: b.limit,
      })),
      financialGoals: ['Save for a vacation', 'Pay off credit card debt'],
    };
    
    const insights = await getSpendingInsights(input);
    return { success: true, data: insights };
  } catch (error) {
    console.error(error);
    if (error instanceof Error && 'code' in error && (error as any).code === 'auth/id-token-expired') {
        return { success: false, error: 'Authentication session expired. Please log in again.' };
    }
    return { success: false, error: 'Failed to get spending insights.' };
  }
}


export async function processTransactionsAction(formData: FormData) {
    try {
        const user = await getAuth(req).getUser();
        if (!user) {
            return { success: false, error: 'Authentication required.' };
        }

        const file = formData.get('file') as File;
        if (!file) {
            return { success: false, error: 'No file uploaded.' };
        }

        const fileContent = await parseFile(file);
        
        const categories = await getCollectionData<Category>(user.uid, 'categories');
        const expenseCategories = categories.filter(c => c.type === 'expense').map(c => c.name);
        const incomeCategories = categories.filter(c => c.type === 'income').map(c => c.name);

        const input: ProcessTransactionsInput = {
            fileContent,
            categories: expenseCategories,
            incomeCategories: incomeCategories,
        };
        const result = await processTransactions(input);
        return { success: true, data: result };
    } catch (error: any) {
        console.error('Error in processTransactionsAction:', error);
         if (error.code === 'auth/id-token-expired') {
            return { success: false, error: 'Authentication session expired. Please log in again.' };
        }
        return { success: false, error: error.message || 'Failed to process transactions.' };
    }
}
