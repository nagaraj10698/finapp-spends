
'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { DhiramSymbol } from '@/components/ui/dhiram-symbol';

interface MoneyFlowChartProps {
  data: {
    name: string;
    income: number;
    expense: number;
  }[];
}

const chartConfig = {
  income: {
    label: "Income",
    color: "hsl(var(--chart-1))",
  },
  expense: {
    label: "Expense",
    color: "hsl(var(--chart-2))",
  },
};

export default function MoneyFlowChart({ data }: MoneyFlowChartProps) {
  return (
    <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
      <ResponsiveContainer width="100%" height={250}>
        <BarChart accessibilityLayer data={data} margin={{ top: 20, right: 0, left: -20, bottom: 5 }} barCategoryGap="20%">
          <XAxis
            dataKey="name"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
          />
          <Tooltip 
            cursor={false}
            content={
                <ChartTooltipContent 
                    formatter={(value) => (
                        <div className="flex items-center gap-1.5">
                            <DhiramSymbol />
                            <span>{Number(value).toFixed(2)}</span>
                        </div>
                    )} 
                />
            }
          />
          <Bar dataKey="income" fill="var(--color-income)" />
          <Bar dataKey="expense" fill="var(--color-expense)" />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
