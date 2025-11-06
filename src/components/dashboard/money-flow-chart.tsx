
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
        <BarChart accessibilityLayer data={data} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="name"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tickFormatter={(value) => value.slice(0, 3)}
          />
          <YAxis 
             tickFormatter={(value) => `AED ${Number(value) / 1000}k`}
             tickLine={false}
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
           <Legend />
          <Bar dataKey="income" fill="var(--color-income)" radius={4} />
          <Bar dataKey="expense" fill="var(--color-expense)" radius={4} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
