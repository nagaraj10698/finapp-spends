
'use client';

import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { DhiramSymbol } from '@/components/ui/dhiram-symbol';

interface BudgetForecastChartProps {
  data: {
    name: string;
    spent: number;
    budget: number;
  }[];
}

const chartConfig = {
  spent: {
    label: "Spent",
    color: "hsl(var(--chart-2))",
  },
  budget: {
    label: "Budget",
    color: "hsl(var(--chart-1))",
  },
};

export default function BudgetForecastChart({ data }: BudgetForecastChartProps) {

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid vertical={false} />
            <XAxis
                dataKey="name"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
            />
            <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `AED ${value}`}
            />
            <Tooltip 
                cursor={{ fill: 'hsl(var(--muted))' }} 
                content={<ChartTooltipContent 
                    formatter={(value, name) => (
                        <div className='flex flex-col'>
                            <span className='capitalize'>{name}</span>
                            <span className='font-bold flex items-center gap-1'><DhiramSymbol />{Number(value).toFixed(2)}</span>
                        </div>
                    )}
                />}
            />
            <Legend />
            <Bar dataKey="budget" fill={chartConfig.budget.color} radius={[4, 4, 0, 0]} />
            <Bar dataKey="spent" fill={chartConfig.spent.color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
