import TransactionUpload from "./transaction-upload";

export default function TransactionsPage() {
    return (
        <div className="space-y-4">
            <h1 className="font-headline text-2xl font-semibold">Transactions</h1>
            <p className="text-muted-foreground">
                Upload your bank statement to automatically categorize your transactions.
            </p>
            <TransactionUpload />
        </div>
    );
}