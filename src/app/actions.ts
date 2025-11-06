
'use server';

import { getFirestore, collection, getDocs, doc, updateDoc, setDoc, addDoc, writeBatch } from "firebase/firestore";
import { initializeFirebase } from "@/firebase/index.server";
import { getAuth, type User } from "firebase/auth";
import type { Transaction, Budget, Category, Due } from "@/lib/types";
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';


async function getCollectionData<T>(userId: string, collectionName: string): Promise<T[]> {
    const { firestore } = initializeFirebase();
    if (!userId) return [];

    const querySnapshot = await getDocs(collection(firestore, 'users', userId, collectionName));
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as T[];
}

export async function updateDue(userId: string, due: Due, updatedData: Partial<Due>, wasPaid: boolean, isNowPaid: boolean, instanceDateStr: string | null) {
  const { firestore } = initializeFirebase();
  const batch = writeBatch(firestore);

  const dueRef = doc(firestore, 'users', userId, 'dues', due.id);
  batch.update(dueRef, updatedData);

  if (isNowPaid && !wasPaid) {
    const transactionsCollection = collection(firestore, 'users', userId, 'transactions');
    const newTransaction: Omit<Transaction, 'id'> = {
      description: updatedData.dueName || due.dueName,
      amount: -Math.abs(updatedData.dueAmount || due.dueAmount),
      date: new Date(),
      category: updatedData.category || due.category,
      categoryId: updatedData.categoryId === undefined ? due.categoryId : updatedData.categoryId,
      type: 'expense',
    };
    batch.set(doc(transactionsCollection), newTransaction);

    if (due.isRecurring && instanceDateStr) {
      batch.update(dueRef, { [`paidInstances.${instanceDateStr}`]: true });
    } else {
      batch.update(dueRef, { isPaid: true, paidDate: new Date() });
    }
  } else if (!isNowPaid && wasPaid) {
    if (due.isRecurring && instanceDateStr) {
      batch.update(dueRef, { [`paidInstances.${instanceDateStr}`]: false });
    } else {
      batch.update(dueRef, { isPaid: false, paidDate: null });
    }
  }

  await batch.commit();
}
