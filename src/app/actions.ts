
'use server';

import { getFirestore, collection, getDocs, doc, updateDoc, setDoc, addDoc, writeBatch, deleteField, Timestamp } from "firebase/firestore";
import { initializeFirebase } from "@/firebase/index.server";
import { getAuth, type User } from "firebase/auth";
import type { Transaction, Budget, Due, Category } from "@/lib/types";
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { startOfYear, endOfYear, eachDayOfInterval, format } from 'date-fns';
import { defaultCategories } from "@/lib/data";


async function getCollectionData<T>(userId: string, collectionName: string): Promise<T[]> {
    const { firestore } = initializeFirebase();
    if (!userId) return [];

    const querySnapshot = await getDocs(collection(firestore, 'users', userId, collectionName));
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as T[];
}

export async function generateMockTransactionsForYear(userId: string) {
    const { firestore } = initializeFirebase();
    let batch = writeBatch(firestore);

    // 1. Ensure categories exist
    let categories = await getCollectionData<Category>(userId, 'categories');
    if (categories.length === 0) {
        const categoriesRef = collection(firestore, `users/${userId}/categories`);
        defaultCategories.forEach(category => {
            const categoryDoc = doc(categoriesRef);
            const newCat: Omit<Category, 'id'> = {
                name: category.name,
                icon: category.icon,
                color: category.color,
                type: category.type,
                userId: userId,
            }
            batch.set(categoryDoc, newCat);
        });
        // We need to commit the categories first and then refetch them.
        await batch.commit(); 
        // After committing, we need a new batch for transactions.
        batch = writeBatch(firestore);
        categories = await getCollectionData<Category>(userId, 'categories');
    }
    
    await generateTransactions(userId, categories, batch);
}


async function generateTransactions(userId: string, categories: Category[], batch: ReturnType<typeof writeBatch>) {
    const { firestore } = initializeFirebase();
    const transactionsRef = collection(firestore, 'users', userId, 'transactions');
    
    const expenseCategories = categories.filter(c => c.type === 'expense');
    const incomeCategory = categories.find(c => c.name === 'Salary');

    if (expenseCategories.length === 0) {
        console.error("No expense categories found for user. Cannot generate mock expenses.");
        // We can still try to generate income
    }

    const today = new Date();
    const start = startOfYear(today);
    const days = eachDayOfInterval({ start, end: today });

    let commitCounter = 0;
    for (const day of days) {
        // Add monthly salary
        if (day.getDate() === 1 && incomeCategory) {
            const salaryDocRef = doc(transactionsRef);
            batch.set(salaryDocRef, {
                userId,
                description: 'Monthly Salary',
                amount: 25000 + (Math.random() * 2000 - 1000),
                date: Timestamp.fromDate(day),
                category: incomeCategory.name,
                categoryId: incomeCategory.id,
                type: 'income',
            });
            commitCounter++;
        }

        // Add random expenses
        if (expenseCategories.length > 0) {
            const numExpenses = Math.floor(Math.random() * 6); // 0 to 5 expenses per day
            for (let i = 0; i < numExpenses; i++) {
                const randomCategory = expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
                const amount = Math.random() * 200 + 5; // 5 to 205
                
                const newTransactionDocRef = doc(transactionsRef);
                batch.set(newTransactionDocRef, {
                    userId,
                    description: `${randomCategory.name} purchase`,
                    amount: -amount, // Expenses are negative
                    date: Timestamp.fromDate(day),
                    category: randomCategory.name,
                    categoryId: randomCategory.id,
                    type: 'expense',
                });
                commitCounter++;
            }
        }
        
        // Firestore batch has a limit of 500 operations.
        if (commitCounter >= 450) {
            await batch.commit();
            batch = writeBatch(firestore); // Start a new batch
            commitCounter = 0;
        }
    }
    
    // Commit any remaining operations in the last batch.
    if (commitCounter > 0) {
        await batch.commit();
    }
}


export async function processDuePayment(userId: string, due: Due) {
    const { firestore } = initializeFirebase();
    const batch = writeBatch(firestore);
    const dueRef = doc(firestore, 'users', userId, 'dues', due.id);

    const instanceDate = due.instanceDate ? new Date(due.instanceDate) : new Date();
    const instanceDateStr = instanceDate?.toISOString().split('T')[0];

    // Create a new transaction for the payment
    const transactionsCollection = collection(firestore, 'users', userId, 'transactions');
    const newTransactionDocRef = doc(transactionsCollection); // Create a new doc ref for the transaction
    const newTransaction: Omit<Transaction, 'id'> = {
      description: due.dueName,
      amount: -Math.abs(due.dueAmount),
      date: new Date(),
      category: due.category,
      categoryId: due.categoryId,
      type: 'expense',
      userId: userId,
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
        const dataToCreate: Omit<Due, 'id'> = {
            userId: userId,
            dueName: dueData.dueName!,
            dueAmount: dueData.dueAmount!,
            dueDate: dueData.dueDate!,
            category: dueData.category!,
            categoryId: dueData.categoryId!,
            isRecurring: dueData.isRecurring!,
            isPaid: false, // Default for new non-recurring dues
        };

        if (dueData.isRecurring) {
            dataToCreate.frequency = dueData.frequency;
            dataToCreate.recurrenceEndDate = dueData.recurrenceEndDate || null;
            // for new recurring dues, isPaid is not relevant at the top level
            delete (dataToCreate as Partial<Due>).isPaid; 
        }
        
        await addDoc(duesCollection, dataToCreate);
    }
}
