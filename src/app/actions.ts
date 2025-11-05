
'use server';

import { getSpendingInsights, type SpendingInsightsInput } from "@/ai/flows/spending-insights";
import { processTransactions } from "@/ai/flows/process-transactions";
import { parseFile } from "@/lib/file-parser";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { initializeFirebase } from "@/firebase/index.server";
import { getAuth } from "firebase/auth";
import type { ProcessTransactionsInput, Transaction, Budget, Category } from "@/lib/types";
import { headers } from "next/headers";
import { cookies } from 'next/headers';

// Helper function to get user from cookies, this is a simplified example
async function getUserFromCookies() {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    // In a real app, you would verify this cookie with Firebase Admin SDK
    // For this environment, we'll assume the client SDK can pick up the session if available,
    // or we'd need a more complex setup which is beyond the scope here.
    // The key is to remove the 'next-server' import. We'll use the client-compatbile `getAuth`
    const { auth } = initializeFirebase();
    // This will rely on client-side session state being passed, which is tricky in server actions.
    // A proper solution might involve passing the user's auth token from the client.
    // For now, let's assume auth state can be resolved, if not we throw an error.
    
    // This is a simplified mock for getting user.
    // In a real scenario, you'd use Firebase Admin SDK to verify a token from cookies/headers.
    // This environment doesn't support the full admin SDK, so we'll rely on the client SDK's state.
    // The problem is that server actions create a new context.
    // Let's use a workaround for now by relying on the client to pass the necessary info.
    // But since we can't change the function signature, let's try a different approach.

    // The user has `getAuth` from `firebase-admin` in `firebase/server`. Let's use that one.
    // Wait, no, `firebase/auth/next-server` is what I used. That's wrong.
    // Looking at the files again, `firebase/index.server.ts` uses client `getAuth`.
    // The previous error was about `firebase/auth/next-server`. Let's use `firebase/auth`.

    // The core issue is that server actions are detached from the client's auth context.
    // The right way is often to use the Admin SDK to verify an ID token passed from the client,
    // but we are constrained to the client SDK here.

    // Let's get the user from the auth instance initialized on the server.
    // This will likely only work if auth state is persisted across requests, which isn't guaranteed.
    return new Promise<any>((resolve, reject) => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            unsubscribe();
            resolve(user);
        }, error => {
            unsubscribe();
            reject(error);
        });
    });
}

// A placeholder for a NextRequest-like object
function getRequestObject() {
    return {
        headers: headers(),
        cookies: cookies(),
    };
}


async function getCollectionData<T>(userId: string, collectionName: string): Promise<T[]> {
    const { firestore } = initializeFirebase();
    if (!userId) return [];

    const querySnapshot = await getDocs(collection(firestore, 'users', userId, collectionName));
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as T[];
}


export async function getSpendingInsightsAction() {
  try {
    const { auth } = initializeFirebase();
    const user = auth.currentUser; // This might be null in a server action
    if (!user) {
        // This is a common issue. We will try to make do, but a robust solution needs more setup.
        // For now, let's return an explicit auth error.
        return { success: false, error: 'Authentication required. User not found in server context.' };
    }
    
    const transactions = await getCollectionData<Transaction>(user.uid, 'transactions');
    const budgets = await getCollectionData<Budget>(user.uid, 'budgets');
    
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
    if (error instanceof Error && 'code' in error && (error as any).code === 'auth/id-token-expired') {
        return { success: false, error: 'Authentication session expired. Please log in again.' };
    }
    return { success: false, error: 'Failed to get spending insights.' };
  }
}


export async function processTransactionsAction(formData: FormData) {
    try {
        const { auth } = initializeFirebase();
        // This is not reliable on the server.
        // The user should be retrieved from the request context, which is hard here.
        // Let's assume for a moment that some auth state is available.
        // A better pattern is to use a library that integrates Next.js Auth with Firebase.
        const user = auth.currentUser; 
        
        if (!user) {
            // This is the most likely point of failure.
            return { success: false, error: 'Authentication required. User state not available on the server. Please sign in and try again.' };
        }

        const file = formData.get('file') as File;
        if (!file) {
            return { success: false, error: 'No file uploaded.' };
        }

        const fileContent = await parseFile(file);
        
        const categories = await getCollectionData<Category>(user.uid, 'categories');
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
         if (error.code === 'auth/id-token-expired') {
            return { success: false, error: 'Authentication session expired. Please log in again.' };
        }
        return { success: false, error: error.message || 'Failed to process transactions.' };
    }
}
