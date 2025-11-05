'use server';
/**
 * @fileOverview An AI agent that processes bank statements and categorizes transactions.
 *
 * - processTransactions - A function that takes the content of a bank statement and returns categorized transactions.
 * - ProcessTransactionsInput - The input type for the processTransactions function.
 * - ProcessTransactionsOutput - The return type for the processTransactions function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TransactionSchema = z.object({
    date: z.string().describe('The date of the transaction in YYYY-MM-DD format.'),
    description: z.string().describe('A brief description of the transaction.'),
    amount: z.number().describe('The transaction amount. Positive for credit (income), negative for debit (expense).'),
    category: z.string().describe('The suggested category for the transaction (e.g., "Groceries", "Salary", "Transport").'),
});

export const ProcessTransactionsInputSchema = z.object({
  fileContent: z.string().describe('The raw text content of the bank statement (CSV or PDF).'),
  categories: z.array(z.string()).describe('A list of possible expense categories to use.'),
  incomeCategories: z.array(z.string()).describe('A list of possible income categories (e.g., "Salary", "Freelance").'),
});
export type ProcessTransactionsInput = z.infer<typeof ProcessTransactionsInputSchema>;

export const ProcessTransactionsOutputSchema = z.object({
  transactions: z.array(TransactionSchema).describe('An array of categorized transactions.'),
});
export type ProcessTransactionsOutput = z.infer<typeof ProcessTransactionsOutputSchema>;

export async function processTransactions(input: ProcessTransactionsInput): Promise<ProcessTransactionsOutput> {
  return processTransactionsFlow(input);
}

const processTransactionsPrompt = ai.definePrompt({
  name: 'processTransactionsPrompt',
  input: { schema: ProcessTransactionsInputSchema },
  output: { schema: ProcessTransactionsOutputSchema },
  prompt: `You are an expert financial assistant. Your task is to analyze the raw text from a bank statement, identify all transactions, and categorize them.

  Here are the available expense categories: {{#each categories}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}.
  Here are the available income categories: {{#each incomeCategories}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}.

  Analyze the following bank statement content:
  ---
  {{fileContent}}
  ---

  For each transaction, extract the date, description, and amount.
  - If the transaction is a credit or deposit, the amount should be positive. Assign it an appropriate income category.
  - If the transaction is a debit or withdrawal, the amount should be negative. Assign it an appropriate expense category.

  Provide the result as a list of structured transaction objects.
`,
});

const processTransactionsFlow = ai.defineFlow(
  {
    name: 'processTransactionsFlow',
    inputSchema: ProcessTransactionsInputSchema,
    outputSchema: ProcessTransactionsOutputSchema,
  },
  async (input) => {
    const { output } = await processTransactionsPrompt(input);
    return output!;
  }
);
