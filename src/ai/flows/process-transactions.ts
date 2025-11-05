
'use server';
/**
 * @fileOverview An AI agent that processes bank statements and categorizes transactions.
 *
 * - processTransactions - A function that takes the content of a bank statement and returns categorized transactions.
 * - ProcessTransactionsInput - The input type for the processTransactionsInput function.
 * - ProcessTransactionsOutput - The return type for the processTransactionsInput function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { ProcessTransactionsInputSchema, ProcessTransactionsOutputSchema, type ProcessTransactionsInput, type ProcessTransactionsOutput } from '@/lib/types';


export async function processTransactions(input: ProcessTransactionsInput): Promise<ProcessTransactionsOutput> {
  return processTransactionsFlow(input);
}

const processTransactionsPrompt = ai.definePrompt({
  name: 'processTransactionsPrompt',
  input: { schema: ProcessTransactionsInputSchema },
  output: { schema: ProcessTransactionsOutputSchema },
  prompt: `You are an expert financial assistant specializing in parsing bank statements. Your task is to analyze the raw text from a bank statement, identify all individual transactions, and categorize them accurately.

  **Instructions:**
  1.  **Identify Transaction Rows:** Scan the document for lines that represent financial transactions. These lines typically contain a date, a description, and an amount.
  2.  **Extract Key Information:** For each transaction, extract the following fields:
      *   date: The date the transaction occurred. Standardize it to YYYY-MM-DD format.
      *   description: The full description of the transaction.
      *   amount: The monetary value.
  3.  **Determine Transaction Type (Debit/Credit):**
      *   Look for keywords like "Debit", "DR", "Withdrawal" or a negative sign (-) to identify expenses. Convert these amounts to **negative** numbers (e.g., -1200.00).
      *   Look for keywords like "Credit", "CR", "Deposit", or a positive sign (+) to identify income. These amounts should be **positive** numbers (e.g., 1190.00).
      *   If no explicit sign is present, infer the type from the context or column headers.
  4.  **Assign Categories:**
      *   For negative amounts (expenses), assign a category from the provided expense category list.
      *   For positive amounts (income), assign a category from the provided income category list.
      *   If a category is ambiguous, use your best judgment.
  5.  **Ignore Non-Transactional Data:** Do not include summary lines, opening/closing balances, headers, footers, or any text that is not a distinct transaction.

  **Category Lists:**
  - Expense Categories: {{#each categories}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}.
  - Income Categories: {{#each incomeCategories}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}.

  **Analyze the following bank statement content:**
  ---
  {{fileContent}}
  ---

  Provide the result as a JSON array of structured transaction objects.
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
