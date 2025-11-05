'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';

interface SpendingChartProps {
  data: {
    name: string;
    total: number;
  }[];
}

const chartConfig = {
  total: {
    label: "Total",
  },
};

export default function SpendingChart({ data }: SpendingChartProps) {
  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          accessibilityLayer
          data={data}
          margin={{
            top: 20,
            right: 20,
            bottom: 20,
            left: 20,
          }}
        >
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
            tickFormatter={(value) => `د.إ${value}`}
          />
          <Tooltip
            cursor={false}
            content={<ChartTooltipContent
              labelFormatter={(label) => { return data.find(d => d.name === label)?.name; }}
              formatter={(value) => `د.إ${Number(value).toFixed(2)}`}
            />}
            
          />
          <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
