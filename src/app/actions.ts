
'use server';

import { getSpendingInsights, type SpendingInsightsInput } from "@/ai/flows/spending-insights";
import { processTransactions } from "@/ai/flows/process-transactions";
import { categories, getBudgets, getMockExpenses, getMockIncome, getTotals } from "@/lib/data";
import type { ProcessTransactionsInput } from "@/lib/types";
import { parseFile } from "@/lib/file-parser";

export async function getSpendingInsightsAction() {
  try {
    const expenses = getMockExpenses();
    const totals = getTotals();
    const budgets = getBudgets();

    const input: SpendingInsightsInput = {
      expenses: expenses.map(e => ({
        category: e.category,
        amount: e.amount,
        date: e.date.toISOString(),
        description: e.description,
        isRecurring: e.isRecurring,
      })),
      income: totals.income,
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
    return { success: false, error: 'Failed to get spending insights.' };
  }
}


export async function processTransactionsAction(formData: FormData) {
    try {
        const file = formData.get('file') as File;
        if (!file) {
            return { success: false, error: 'No file uploaded.' };
        }

        const fileContent = await parseFile(file);

        const input: ProcessTransactionsInput = {
            fileContent,
            categories: categories.map(c => c.name),
            incomeCategories: ['Salary', 'Freelance', 'Investment', 'Other Income'],
        };
        const result = await processTransactions(input);
        return { success: true, data: result };
    } catch (error: any) {
        console.error(error);
        return { success: false, error: error.message || 'Failed to process transactions.' };
    }
}
