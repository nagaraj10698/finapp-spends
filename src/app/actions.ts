
'use server';

import { getSpendingInsights, type SpendingInsightsInput } from "@/ai/flows/spending-insights";
import { processTransactions } from "@/ai/flows/process-transactions";
import { categories } from "@/lib/data";
import type { ProcessTransactionsInput, Transaction, Budget } from "@/lib/types";
import { parseFile } from "@/lib/file-parser";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { initializeFirebase }from "@/firebase/server";
import { getAuth } from "firebase/auth";

async function getCollectionData<T>(collectionName: string): Promise<T[]> {
    const { firestore } = initializeFirebase();
    const { currentUser } = getAuth();
    if (!currentUser) return [];

    const querySnapshot = await getDocs(collection(firestore, 'users', currentUser.uid, collectionName));
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as T[];
}


export async function getSpendingInsightsAction() {
  try {
    const transactions = await getCollectionData<Transaction>('transactions');
    const budgets = await getCollectionData<Budget>('budgets');
    
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
    return { success: false, error: 'Failed to get spending insights.' };
  }
}


export async function processTransactionsAction(formData: FormData) {
    try {
        const file = formData.get('file') as File;
        if (!file) {
            return { success: false, error: 'No file uploaded.' };
        }

        const fileContent = await parseFile(file);

        const input: ProcessTransactionsInput = {
            fileContent,
            categories: categories.map(c => c.name),
            incomeCategories: ['Salary', 'Freelance', 'Investment', 'Other Income'],
        };
        const result = await processTransactions(input);
        return { success: true, data: result };
    } catch (error: any) {
        console.error(error);
        return { success: false, error: error.message || 'Failed to process transactions.' };
    }
}

