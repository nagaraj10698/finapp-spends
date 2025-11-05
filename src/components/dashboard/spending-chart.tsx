
'use client';

import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { DhiramSymbol } from '../ui/dhiram-symbol';
import { getCategoryByName, getIconByName } from '@/lib/data';
import { cn } from '@/lib/utils';
import type { Category } from '@/lib/types';

interface SpendingChartProps {
  data: {
    name: string;
    total: number;
  }[];
  categories: Category[];
}

const chartConfig = {
  total: {
    label: "Total",
  },
};

const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
    '#8884d8',
    '#82ca9d',
    '#ffc658',
    '#ff8042',
    '#00C49F',
    '#FFBB28',
    '#FF8042'
];

const CustomTooltipContent = ({ active, payload, categories }: any) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }
  const { name, value } = payload[0];
  const category = getCategoryByName(name, categories);
  const Icon = category ? getIconByName(category.icon) : null;


  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      <div className="flex items-center gap-2">
         {category && Icon && <Icon className={cn("h-4 w-4", category.color)} />}
        <span className="font-semibold">{name}</span>
      </div>
      <div className="flex flex-col space-y-1 mt-1">
        <span className="font-bold text-muted-foreground flex items-center gap-1">
            <DhiramSymbol />
            {Number(value).toFixed(2)}
        </span>
      </div>
    </div>
  );
};

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent * 100 < 5) return null;

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};


export default function SpendingChart({ data, categories }: SpendingChartProps) {
  const totalSpent = data.reduce((acc, curr) => acc + curr.total, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-4">
        <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                <Tooltip
                    cursor={false}
                    content={<CustomTooltipContent categories={categories} />}
                />
                <Pie
                    data={data}
                    dataKey="total"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={2}
                    labelLine={false}
                    label={renderCustomizedLabel}
                >
                    {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                </PieChart>
            </ResponsiveContainer>
        </ChartContainer>

        <div className="flex flex-col gap-4 text-sm">
            {data.map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span>{entry.name}</span>
                    </div>
                    <div className="font-medium flex items-center gap-1">
                        <DhiramSymbol className="h-3 w-3" />
                        {entry.total.toFixed(2)}
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
}
