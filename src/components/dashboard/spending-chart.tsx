'use client';

import { Pie, PieChart, ResponsiveContainer, Legend, Tooltip, Cell } from 'recharts';
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

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};


export default function SpendingChart({ data, categories }: SpendingChartProps) {
  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <ResponsiveContainer width="100%" height={350}>
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
            innerRadius={80}
            outerRadius={120}
            fill="#8884d8"
            paddingAngle={5}
            labelLine={false}
            label={renderCustomizedLabel}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Legend wrapperStyle={{fontSize: '0.8rem'}} />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
