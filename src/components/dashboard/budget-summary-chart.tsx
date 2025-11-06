
'use client';
import { useMemo } from 'react';
import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip, Legend } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { DhiramSymbol } from '@/components/ui/dhiram-symbol';
import type { Category } from '@/lib/types';
import { getIconByName } from '@/lib/data';
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

export default function BudgetSummaryChart({ data, categories }: BudgetSummaryChartProps) {
  const chartData = useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      fill: COLORS[index % COLORS.length],
    }));
  }, [data]);
  
  const totalSpent = useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.total, 0);
  }, [data]);

  const chartConfig = useMemo(() => {
    const config: any = {
      total: { label: 'Total' },
    };
    chartData.forEach(item => {
        const category = categories.find(c => c.name === item.name);
        const Icon = category ? getIconByName(category.icon) : null;
        config[item.name] = { 
            label: item.name, 
            color: item.fill,
            icon: Icon ? () => <Icon className={cn('h-4 w-4', category.color)} /> : undefined,
        };
    });
    return config;
  }, [chartData, categories]);


  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square min-h-[250px] w-full max-w-[300px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            cursor={false}
            content={<ChartTooltipContent 
                hideLabel 
                indicator='dot'
                formatter={(value, name, item) => (
                    <div className='flex items-center gap-2'>
                        <div className="flex flex-col">
                            <span className='font-bold'>{item.payload.name}</span>
                            <span className='text-muted-foreground'>{((item.payload.total / totalSpent) * 100).toFixed(0)}%</span>
                        </div>
                        <div className="ml-auto flex items-center gap-1 font-bold">
                           <DhiramSymbol /> {item.payload.total.toFixed(2)}
                        </div>
                    </div>
                )}
            />}
          />
           <Pie
            data={chartData}
            dataKey="total"
            nameKey="name"
            innerRadius="65%"
            strokeWidth={2}
            startAngle={90}
            endAngle={450}
          >
             {chartData.map((entry) => (
              <Cell
                key={entry.name}
                fill={entry.fill}
                className="focus:outline-none"
              />
            ))}
          </Pie>
           <ChartLegend
            content={<ChartLegendContent nameKey="name" />}
            className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
