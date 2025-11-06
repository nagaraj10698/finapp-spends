
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


export async function saveDue(userId: string, dueData: Partial<Due>) {
    const { firestore } = initializeFirebase();
    const isEditing = !!dueData.id;

    if (isEditing) {
        const dueRef = doc(firestore, 'users', userId, 'dues', dueData.id!);
        const dataToUpdate: { [key: string]: any } = {
            dueName: dueData.dueName,
            dueAmount: dueData.dueAmount,
            dueDate: dueData.dueDate,
            category: dueData.category,
            categoryId: dueData.categoryId,
            isRecurring: dueData.isRecurring,
        };

        if (dueData.isRecurring) {
            dataToUpdate.frequency = dueData.frequency;
            // Ensure recurrenceEndDate is either a valid date or null
            dataToUpdate.recurrenceEndDate = dueData.recurrenceEndDate || null;
        } else {
            // Use deleteField for fields that should be removed when not recurring
            dataToUpdate.frequency = deleteField();
            dataToUpdate.recurrenceEndDate = deleteField();
            dataToUpdate.paidInstances = deleteField();
            dataToUpdate.isPaid = dueData.isPaid || false; // Keep existing or set for non-recurring
        }
        await updateDoc(dueRef, dataToUpdate);

    } else {
        // Creating a new due
        const duesCollection = collection(firestore, 'users', userId, 'dues');
        const dataToCreate: { [key: string]: any } = {
            dueName: dueData.dueName,
            dueAmount: dueData.dueAmount,
            dueDate: dueData.dueDate,
            category: dueData.category,
            categoryId: dueData.categoryId,
            isRecurring: dueData.isRecurring,
            userId: userId,
        };

        if (dueData.isRecurring) {
            dataToCreate.frequency = dueData.frequency;
            dataToCreate.recurrenceEndDate = dueData.recurrenceEndDate || null;
        } else {
            dataToCreate.isPaid = false;
        }
        await addDoc(duesCollection, dataToCreate);
    }
}
