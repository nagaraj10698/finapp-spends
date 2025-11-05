
'use server';

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
