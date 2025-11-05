
'use client';

import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { DhiramSymbol } from '@/components/ui/dhiram-symbol';

interface BudgetForecastChartProps {
  data: {
    name: string;
    upcoming: number;
    unpaid: number;
  }[];
}

const chartConfig = {
  upcoming: {
    label: "Upcoming",
    color: "hsl(var(--chart-1))",
  },
  unpaid: {
    label: "Unpaid",
    color: "hsl(var(--chart-2))",
  },
};

export default function BudgetForecastChart({ data }: BudgetForecastChartProps) {

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
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
            <Line type="monotone" dataKey="upcoming" stroke={chartConfig.upcoming.color} strokeWidth={2} activeDot={{ r: 8 }} />
            <Line type="monotone" dataKey="unpaid" stroke={chartConfig.unpaid.color} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
