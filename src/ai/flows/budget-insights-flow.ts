
'use server';
/**
 * @fileOverview An AI flow to generate insights on budget performance.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

const BudgetInsightInputSchema = z.object({
  totalBudgeted: z.number().describe('The total amount budgeted for all expense categories for the current period.'),
  totalSpent: z.number().describe('The total amount spent across all expense categories for the current period.'),
  budgets: z.array(z.object({
    name: z.string().describe('The name of the budget category.'),
    budgetAmount: z.number().describe('The amount budgeted for this category.'),
    spent: z.number().describe('The amount spent in this category.'),
  })).describe('A list of individual budgets and their performance for the current period.'),
  previousMonthsData: z.array(z.object({
      month: z.string().describe('The month for the historical data (e.g., "July 2024").'),
      totalSpent: z.number().describe('The total amount spent in that month.'),
      spendingByCategory: z.record(z.string(), z.number()).describe('A map of category name to amount spent for that month.'),
  })).describe('Historical spending data for the last 3 months for comparison.'),
});

export type BudgetInsightInput = z.infer<typeof BudgetInsightInputSchema>;

export async function generateBudgetInsight(input: BudgetInsightInput): Promise<string> {
    if (input.totalBudgeted === 0) {
        return "You don't have any expense budgets set up yet. Create some to get started!";
    }
    if (input.totalSpent === 0) {
        return "You haven't logged any spending for this period yet. Let's get tracking!";
    }
    const result = await budgetInsightFlow(input);
    return result;
}

const budgetInsightFlow = ai.defineFlow(
  {
    name: 'budgetInsightFlow',
    inputSchema: BudgetInsightInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const historicalDataJSON = JSON.stringify(input.previousMonthsData);
    const currentBudgetsJSON = JSON.stringify(input.budgets.map(b => ({ category: b.name, budgeted: b.budgetAmount, spent: b.spent })));

    const { output } = await ai.generate({
        prompt: `You are a friendly and sharp financial assistant. Your goal is to provide a single, concise, and actionable insight based on the user's budget performance.
        The user wants insights like "overspent on Transport budget", "80% spent on Shopping", "compared to last 3 months spent more on entertainment", or "try to reduce the spending on food to save".
        Keep the response to a single, short, and impactful sentence. Be conversational. The currency is AED (United Arab Emirates Dirham), but do not mention the currency symbol.

        Here is the user's data:
        - Current Period Total Budgeted: ${input.totalBudgeted.toFixed(2)}
        - Current Period Total Spent: ${input.totalSpent.toFixed(2)}
        - Current Period Budget Breakdown: ${currentBudgetsJSON}
        - Last 3 Months' Spending: ${historicalDataJSON}

        Analyze the data and provide ONE of the following types of insights, in order of priority:
        1.  **Major Overspending:** If any category is significantly over budget, point it out. (e.g., "You've gone over your 'Shopping' budget. It might be a good area to watch.")
        2.  **Historical Trend:** If spending in a major category is significantly higher than the last 3 months' average, highlight it. (e.g., "Your 'Entertainment' spending is higher than usual this month.")
        3.  **Approaching Limit:** If a category is close to its limit (e.g., >80% spent), give a heads-up. (e.g., "Heads up, you've used up 85% of your 'Food' budget for the period.")
        4.  **Savings Suggestion:** If overall spending is high, suggest a specific, high-spending category to cut back on. (e.g., "Cutting back a little on 'Food' could help you save more this month.")
        5.  **Positive Reinforcement:** If the user is well under budget overall, praise them. (e.g., "Great job staying under budget! You're doing especially well with your 'Groceries' spending.")

        Generate only ONE insight based on the most important finding from the data. Be specific and helpful.
        `,
    });
        
    return output || "Here's a look at your budget summary for the period.";
  }
);
