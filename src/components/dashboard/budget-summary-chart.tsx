
'use client';
import { useMemo } from 'react';
import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip, Legend } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { DhiramSymbol } from '@/components/ui/dhiram-symbol';
import type { Category } from '@/lib/types';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import { cn } from '@/lib/utils';


interface BudgetSummaryChartProps {
  data: {
    name: string;
    total: number;
  }[];
  categories: Category[];
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(347, 89%, 71%)",
  "hsl(260, 100%, 80%)",
];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};


export default function BudgetSummaryChart({ data, categories }: BudgetSummaryChartProps) {
  const chartData = useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      fill: COLORS[index % COLORS.length],
    }));
  }, [data]);
  
  const totalBudgeted = useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.total, 0);
  }, [data]);

  const chartConfig = useMemo(() => {
    const config: any = {};
    chartData.forEach(item => {
        config[item.name] = { 
            label: item.name, 
            color: item.fill,
        };
    });
    return config;
  }, [chartData]);


  if (chartData.length === 0) {
    return (
      <div className="flex h-full min-h-[250px] w-full items-center justify-center rounded-lg border-2 border-dashed p-4 text-center">
        <p className="text-sm text-muted-foreground">No expense budgets set.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center w-full">
      <ChartContainer
        config={chartConfig}
        className="mx-auto aspect-square min-h-[250px] w-full max-w-[300px] relative"
      >
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Tooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="total"
              nameKey="name"
              innerRadius="60%"
              strokeWidth={2}
              labelLine={false}
              label={renderCustomizedLabel}
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={entry.fill}
                  className="focus:outline-none"
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-xs text-muted-foreground">Total</span>
              <div className="flex items-baseline font-bold">
                <DhiramSymbol className="text-lg" />
                <span className="text-2xl">{totalBudgeted.toFixed(0)}</span>
              </div>
        </div>
      </ChartContainer>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm mt-4">
            {chartData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{backgroundColor: item.fill}} />
                    <span className="text-muted-foreground">{item.name}</span>
                    <span className="font-semibold flex items-center gap-0.5"><DhiramSymbol className="text-xs"/>{item.total.toFixed(0)}</span>
                </div>
            ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
