
'use server';

import { getSpendingInsights, type SpendingInsightsInput } from "@/ai/flows/spending-insights";
import { processTransactions } from "@/ai/flows/process-transactions";
import { parseFile } from "@/lib/file-parser";
import { getFirestore, collection, getDocs, doc } from "firebase/firestore";
import { initializeFirebase } from "@/firebase/index.server";
import { getAuth, type User } from "firebase/auth";
import type { ProcessTransactionsInput, Transaction, Budget, Category } from "@/lib/types";


async function getUserId(): Promise<string | null> {
    const { auth } = initializeFirebase();
    return new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            unsubscribe();
            resolve(user?.uid || null);
        });
    });
}

async function getCollectionData<T>(userId: string, collectionName: string): Promise<T[]> {
    const { firestore } = initializeFirebase();
    if (!userId) return [];

    const querySnapshot = await getDocs(collection(firestore, 'users', userId, collectionName));
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as T[];
}


export async function getSpendingInsightsAction(userId: string) {
  try {
    if (!userId) {
        return { success: false, error: 'Authentication required. Please sign in and try again.' };
    }
    
    const transactions = await getCollectionData<Transaction>(userId, 'transactions');
    const budgets = await getCollectionData<Budget>(userId, 'budgets');
    
    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'expense').map(e => ({
        category: e.category,
        amount: e.amount,
        date: (e.date as any).toDate ? (e.date as any).toDate().toISOString() : new Date(e.date as any).toISOString(),
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
    return { success: false, error: 'Failed to get spending insights.' };
  }
}


export async function processTransactionsAction(formData: FormData, userId: string) {
    try {
        if (!userId) {
            return { success: false, error: 'Authentication required. User state not available on the server. Please sign in and try again.' };
        }

        const file = formData.get('file') as File;
        if (!file) {
            return { success: false, error: 'No file uploaded.' };
        }

        const fileContent = await parseFile(file);
        
        const categories = await getCollectionData<Category>(userId, 'categories');
        const expenseCategories = categories.filter(c => c.type === 'expense').map(c => c.name);
        const incomeCategories = categories.filter(c => c.type === 'income').map(c => c.name);

        if (expenseCategories.length === 0 && incomeCategories.length === 0) {
            return { success: false, error: 'No categories found for this user. Cannot process transactions.' };
        }

        const input: ProcessTransactionsInput = {
            fileContent,
            categories: expenseCategories,
            incomeCategories: incomeCategories,
        };

        const result = await processTransactions(input);
        
        return { success: true, data: result };

    } catch (error: any) {
        console.error('Error in processTransactionsAction:', error);
        return { success: false, error: error.message || 'Failed to process transactions.' };
    }
}
