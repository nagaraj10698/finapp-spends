'use server';
/**
 * @fileOverview An AI agent that analyzes spending data and provides personalized savings suggestions.
 *
 * - getSpendingInsights - A function that takes spending data as input and returns personalized savings suggestions.
 * - SpendingInsightsInput - The input type for the getSpendingInsights function.
 * - SpendingInsightsOutput - The return type for the getSpendingInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SpendingDataSchema = z.object({
  expenses: z.array(
    z.object({
      category: z.string(),
      amount: z.number(),
      date: z.string().optional(),
      description: z.string().optional(),
      isRecurring: z.boolean().optional(),
    })
  ).describe('An array of expense objects, each containing the category, amount, date, description and recurring status.'),
  income: z.number().describe('The user monthly income.'),
  budget: z.array(
    z.object({
      category: z.string(),
      amount: z.number(),
      isRecurring: z.boolean().optional(),
    })
  ).optional().describe('An array of budget objects, each containing the category, amount, and recurring status.'),
  financialGoals: z.array(z.string()).optional().describe('A list of financial goals the user wants to achieve.'),
});

export type SpendingInsightsInput = z.infer<typeof SpendingDataSchema>;

const SpendingInsightsOutputSchema = z.object({
  savingsSuggestions: z.array(
    z.string().describe('A personalized suggestion for potential savings.')
  ).describe('An array of personalized savings suggestions based on the spending data.'),
  categoryBreakdown: z.record(z.string(), z.number()).describe('A breakdown of spending by category, showing the total amount spent in each category.'),
});

export type SpendingInsightsOutput = z.infer<typeof SpendingInsightsOutputSchema>;

export async function getSpendingInsights(input: SpendingInsightsInput): Promise<SpendingInsightsOutput> {
  return spendingInsightsFlow(input);
}

const spendingInsightsPrompt = ai.definePrompt({
  name: 'spendingInsightsPrompt',
  input: {schema: SpendingDataSchema},
  output: {schema: SpendingInsightsOutputSchema},
  prompt: `You are a personal finance advisor. Analyze the following spending data and provide personalized suggestions for potential savings.

Spending Data:
Expenses:
{{#each expenses}}
- Category: {{category}}, Amount: {{amount}}, Date: {{date}}, Description: {{description}}, Recurring: {{isRecurring}}
{{/each}}

Income: {{income}}

{{#if budget}}
Budget:
{{#each budget}}
- Category: {{category}}, Amount: {{amount}}, Recurring: {{isRecurring}}
{{/each}}
{{/if}}

{{#if financialGoals}}
Financial Goals:
{{#each financialGoals}}
- {{this}}
{{/each}}
{{/if}}


Provide savings suggestions and a category breakdown of spending.
`,
});

const spendingInsightsFlow = ai.defineFlow(
  {
    name: 'spendingInsightsFlow',
    inputSchema: SpendingDataSchema,
    outputSchema: SpendingInsightsOutputSchema,
  },
  async input => {
    const {output} = await spendingInsightsPrompt(input);
    return output!;
  }
);
