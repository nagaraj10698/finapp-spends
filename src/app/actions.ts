
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

export async function updateDue(userId: string, dueId: string, updatedData: Partial<Due>) {
  const { firestore } = initializeFirebase();
  const dueRef = doc(firestore, 'users', userId, 'dues', dueId);

  const dataToUpdate: { [key: string]: any } = {};

  // Copy basic fields
  if (updatedData.dueName) dataToUpdate.dueName = updatedData.dueName;
  if (updatedData.dueAmount) dataToUpdate.dueAmount = updatedData.dueAmount;
  if (updatedData.dueDate) dataToUpdate.dueDate = updatedData.dueDate;
  if (updatedData.category) dataToUpdate.category = updatedData.category;
  if (updatedData.categoryId !== undefined) dataToUpdate.categoryId = updatedData.categoryId;
  if (updatedData.isRecurring !== undefined) dataToUpdate.isRecurring = updatedData.isRecurring;
  
  if (updatedData.isRecurring) {
    dataToUpdate.frequency = updatedData.frequency;
    if (updatedData.recurrenceEndDate) {
      dataToUpdate.recurrenceEndDate = updatedData.recurrenceEndDate;
    } else {
      // If it is recurring but no end date is provided, remove it from Firestore
      dataToUpdate.recurrenceEndDate = deleteField();
    }
  } else {
    // If it's not recurring, remove the frequency and end date fields
    dataToUpdate.frequency = deleteField();
    dataToUpdate.recurrenceEndDate = deleteField();
  }

  await updateDoc(dueRef, dataToUpdate);
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
