
'use server';

import { getSpendingInsights, type SpendingInsightsInput } from "@/ai/flows/spending-insights";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { initializeFirebase } from "@/firebase/index.server";
import { getAuth, type User } from "firebase/auth";
import type { Transaction, Budget, Category } from "@/lib/types";


async function getCollectionData<T>(userId: string, collectionName: string): Promise<T[]> {
    const { firestore } = initializeFirebase();
    if (!userId) return [];

    const querySnapshot = await getDocs(collection(firestore, 'users', userId, collectionName));
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as T[];
}

export async function updateTransactionStatus(transactionId: string, status: 'Paid' | 'Un-paid', userId: string) {
    if (!userId) {
        return { success: false, error: 'Authentication required.' };
    }
    try {
        const { firestore } = initializeFirebase();
        const transactionRef = doc(firestore, 'users', userId, 'transactions', transactionId);
        await updateDoc(transactionRef, { status: status });
        return { success: true };
    } catch (error) {
        console.error("Error updating transaction status:", error);
        return { success: false, error: 'Failed to update transaction status.' };
    }
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
        amount: b.budgetAmount,
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
