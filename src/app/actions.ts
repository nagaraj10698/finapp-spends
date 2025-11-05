
'use server';

import { getSpendingInsights, type SpendingInsightsInput } from "@/ai/flows/spending-insights";
import { getBudgets, getMockExpenses, getTotals } from "@/lib/data";

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
