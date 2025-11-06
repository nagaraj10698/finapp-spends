
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
    
    const dataToSave: { [key: string]: any } = {
        dueName: dueData.dueName,
        dueAmount: dueData.dueAmount,
        dueDate: dueData.dueDate,
        category: dueData.category,
        categoryId: dueData.categoryId,
        isRecurring: dueData.isRecurring,
        userId: userId,
    };

    if (dueData.isRecurring) {
        dataToSave.frequency = dueData.frequency;
        // Ensure recurrenceEndDate is either a valid date or null
        dataToSave.recurrenceEndDate = dueData.recurrenceEndDate || null;
    } else {
        // Use deleteField for fields that should be removed when not recurring
        dataToSave.frequency = deleteField();
        dataToSave.recurrenceEndDate = deleteField();
        dataToSave.paidInstances = deleteField();
        dataToSave.isPaid = dueData.isPaid || false; // Set initial paid status for non-recurring
    }
    
    if (isEditing) {
        const dueRef = doc(firestore, 'users', userId, 'dues', dueData.id!);
        await updateDoc(dueRef, dataToSave);
    } else {
        const duesCollection = collection(firestore, 'users', userId, 'dues');
        await addDoc(duesCollection, dataToSave);
    }
}
