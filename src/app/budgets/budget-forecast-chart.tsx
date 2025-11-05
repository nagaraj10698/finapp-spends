
'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
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
        <BarChart data={data} >
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
            <Bar dataKey="upcoming" stackId="a" fill={chartConfig.upcoming.color} radius={[4, 4, 0, 0]} />
            <Bar dataKey="unpaid" stackId="a" fill={chartConfig.unpaid.color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
