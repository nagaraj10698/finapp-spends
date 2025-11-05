
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getSpendingInsightsAction } from '../actions';
import { WandSparkles, Loader2, ListChecks } from 'lucide-react';
import type { SpendingInsightsOutput } from '@/ai/flows/spending-insights';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { useFirebase } from '@/firebase';

export default function InsightsDisplay() {
  const { user } = useFirebase();
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<SpendingInsightsOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGetInsights = async () => {
    if (!user) {
        setError("You must be logged in to get insights.");
        return;
    }
    setLoading(true);
    setError(null);
    setInsights(null);
    const result = await getSpendingInsightsAction(user.uid);
    if (result.success) {
      setInsights(result.data);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };
  
  const categoryChartData = insights ? Object.entries(insights.categoryBreakdown).map(([name, total]) => ({ name, total })) : [];
  const chartConfig = { total: { label: "Total" } };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Generate Your Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGetInsights} disabled={loading || !user}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <WandSparkles className="mr-2 h-4 w-4" />
            )}
            Analyze My Spending
          </Button>
        </CardContent>
      </Card>
      {error && (
         <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
         </Alert>
      )}
      {insights && (
        <div className="grid gap-6 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                        <ListChecks />
                        Savings Suggestions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3 list-disc pl-5 text-sm">
                        {insights.savingsSuggestions.map((suggestion, index) => (
                            <li key={index}>{suggestion}</li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Category Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={categoryChartData} layout="vertical" margin={{ left: 10, right: 30 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} stroke="#888888" fontSize={12} width={100} />
                                <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent />} />
                                <Bar dataKey="total" radius={5} fill="hsl(var(--primary))" />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}
