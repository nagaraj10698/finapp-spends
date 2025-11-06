
'use server';

import { getFirestore, collection, getDocs, doc, updateDoc, setDoc, addDoc } from "firebase/firestore";
import { initializeFirebase } from "@/firebase/index.server";
import { getAuth, type User } from "firebase/auth";
import type { Transaction, Budget, Category } from "@/lib/types";
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';


async function getCollectionData<T>(userId: string, collectionName: string): Promise<T[]> {
    const { firestore } = initializeFirebase();
    if (!userId) return [];

    const querySnapshot = await getDocs(collection(firestore, 'users', userId, collectionName));
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as T[];
}

export async function addExpenseAction(userId: string, data: Omit<Transaction, 'id' | 'fileURL' | 'fileName'>, file?: File) {
    if (!userId) {
        throw new Error("You must be logged in to add an expense.");
    }
    const { firestore, firebaseApp } = initializeFirebase();

    try {
        const expenseCollectionRef = collection(firestore, 'users', userId, 'transactions');
        const newExpenseRef = doc(expenseCollectionRef);

        const newExpense: Omit<Transaction, 'id'> = {
            ...data
        };
        
        if (file) {
            const storage = getStorage(firebaseApp);
            const storageRef = ref(storage, `user_uploads/${userId}/${newExpenseRef.id}/${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const fileURL = await getDownloadURL(snapshot.ref);
            if (fileURL) {
                newExpense.fileURL = fileURL;
                newExpense.fileName = file.name;
            }
        }

        await setDoc(newExpenseRef, newExpense);
        
        return { success: true, id: newExpenseRef.id };
    } catch (error) {
        console.error("Error adding expense:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: errorMessage };
    }
}
