
'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { DhiramSymbol } from '../ui/dhiram-symbol';

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

const CustomTooltipContent = (props: any) => {
  if (!props.active || !props.payload || props.payload.length === 0) {
    return null;
  }
  const { payload, label } = props;
  const value = payload[0].value;

  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col space-y-1">
          <span className="text-[0.70rem] uppercase text-muted-foreground">{label}</span>
          <span className="font-bold text-muted-foreground flex items-center gap-1">
            <DhiramSymbol />
            {Number(value).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
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
            tickFormatter={(value) => {
              const num = Number(value);
              if (num >= 1000) return `Dh${(num/1000).toFixed(0)}k`
              return `Dh${value}`
            }}
          />
          <Tooltip
            cursor={false}
            content={<CustomTooltipContent />}
            
          />
          <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
