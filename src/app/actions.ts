'use server';

import { getFirestore, collection, getDocs, doc, updateDoc, setDoc, addDoc, writeBatch, deleteField } from "firebase/firestore";
import { initializeFirebase } from "@/firebase/index.server";
import { getAuth, type User } from "firebase/auth";
import type { Transaction, Budget, Due } from "@/lib/types";
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';


async function getCollectionData<T>(userId: string, collectionName: string): Promise<T[]> {
    const { firestore } = initializeFirebase();
    if (!userId) return [];

    const querySnapshot = await getDocs(collection(firestore, 'users', userId, collectionName));
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as T[];
}

export async function processDuePayment(userId: string, due: Due) {
    const { firestore } = initializeFirebase();
    const batch = writeBatch(firestore);
    const dueRef = doc(firestore, 'users', userId, 'dues', due.id);

    const instanceDate = due.instanceDate ? new Date(due.instanceDate) : null;
    const instanceDateStr = instanceDate?.toISOString().split('T')[0];

    // Create a new transaction for the payment
    const transactionsCollection = collection(firestore, 'users', userId, 'transactions');
    const newTransactionDocRef = doc(transactionsCollection); // Create a new doc ref for the transaction
    const newTransaction: Omit<Transaction, 'id'|'userId'> = {
      description: due.dueName,
      amount: -Math.abs(due.dueAmount),
      date: new Date(),
      category: due.category,
      categoryId: due.categoryId,
      type: 'expense',
    };
    batch.set(newTransactionDocRef, newTransaction);


    // Update the due's paid status
    if (due.isRecurring && instanceDateStr) {
      batch.update(dueRef, { [`paidInstances.${instanceDateStr}`]: true });
    } else {
      batch.update(dueRef, { isPaid: true, paidDate: new Date() });
    }

    await batch.commit();
}


export async function updateDue(userId: string, dueId: string, updatedData: Partial<Due>) {
    const { firestore } = initializeFirebase();
    const dueRef = doc(firestore, 'users', userId, 'dues', dueId);

    // Build a clean update object
    const dataToUpdate: { [key: string]: any } = {
        dueName: updatedData.dueName,
        dueAmount: updatedData.dueAmount,
        dueDate: updatedData.dueDate,
        category: updatedData.category,
        categoryId: updatedData.categoryId,
        isRecurring: updatedData.isRecurring,
    };

    if (updatedData.isRecurring) {
        dataToUpdate.frequency = updatedData.frequency;
        // Firestore can accept null for a date field
        dataToUpdate.recurrenceEndDate = updatedData.recurrenceEndDate || null;
    } else {
        // Use deleteField for fields that should not exist on non-recurring dues
        dataToUpdate.frequency = deleteField();
        dataToUpdate.recurrenceEndDate = deleteField();
        dataToUpdate.paidInstances = deleteField();
    }

    await updateDoc(dueRef, dataToUpdate);
}
