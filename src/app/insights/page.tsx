import InsightsDisplay from "./insights-display";

export default function InsightsPage() {
    return (
        <div className="space-y-4">
            <h1 className="font-headline text-2xl font-semibold">Spending Insights</h1>
            <p className="text-muted-foreground">
                Use our AI-powered tool to analyze your spending and get personalized suggestions for potential savings.
            </p>
            <InsightsDisplay />
        </div>
    );
}
