
'use server';
/**
 * @fileOverview An AI flow to generate insights on budget performance.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

const BudgetInsightInputSchema = z.object({
  totalBudgeted: z.number().describe('The total amount budgeted for all expense categories.'),
  totalSpent: z.number().describe('The total amount spent across all expense categories.'),
  budgets: z.array(z.object({
    name: z.string().describe('The name of the budget category.'),
    budgetAmount: z.number().describe('The amount budgeted for this category.'),
    spent: z.number().describe('The amount spent in this category.'),
  })).describe('A list of individual budgets and their performance.'),
});

export type BudgetInsightInput = z.infer<typeof BudgetInsightInputSchema>;

export async function generateBudgetInsight(input: BudgetInsightInput): Promise<string> {
    if (input.totalBudgeted === 0) {
        return "You don't have any expense budgets set up yet. Create some to get started!";
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
    const { output } = await ai.generate({
        prompt: `You are a friendly and helpful financial assistant. 
        Your goal is to provide a single, concise, and encouraging insight based on the user's budget performance for the current period.
        The currency is AED (United Arab Emirates Dirham). Do not mention the currency symbol.

        Analyze the following budget data:
        - Total Budgeted: ${input.totalBudgeted.toFixed(2)}
        - Total Spent: ${input.totalSpent.toFixed(2)}
        - Budget Breakdown: ${JSON.stringify(input.budgets.map(b => ({ category: b.name, budgeted: b.budgetAmount, spent: b.spent })))}

        Based on the data, provide one clear and actionable insight. 
        - If the user is doing well (under budget overall), praise them and point out a success.
        - If the user is over budget overall, be gentle and highlight the category with the most overspending as a place to focus.
        - If they are close to the budget, offer encouragement.
        - If a specific category is significantly overspent, mention it specifically.
        - If they have spent nothing, encourage them to start tracking.
        - Keep the response to a single, short sentence. It should be friendly and conversational.
        
        Example outputs:
        - "Great job staying under budget! You're doing especially well with your 'Food' spending."
        - "You're a bit over budget, mainly due to 'Shopping'. It might be a good area to watch."
        - "You're on track this month! Keep up the great work."
        - "You haven't logged any spending yet. Let's get started!"
        `,
        });
        
    return output || "Here's a look at your budget summary for the period.";
  }
);
