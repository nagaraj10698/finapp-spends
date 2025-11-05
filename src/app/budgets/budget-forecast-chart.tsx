
'use client';

import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend, LabelList } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { DhiramSymbol } from '@/components/ui/dhiram-symbol';

interface BudgetForecastChartProps {
  data: {
    name: string;
    open: number;
    overdue: number;
    closed: number;
  }[];
}

const chartConfig = {
  open: {
    label: "Open",
    color: "hsl(var(--chart-1))",
  },
  overdue: {
    label: "Overdue",
    color: "hsl(var(--chart-2))",
  },
  closed: {
      label: "Closed",
      color: "hsl(var(--chart-3))",
  }
};

const CustomLabel = (props: any) => {
    const { x, y, stroke, value } = props;
    if (value === 0) return null;
    return (
      <text x={x} y={y} dy={-4} fill={stroke} fontSize={10} textAnchor="middle">
        {value}
      </text>
    );
};

export default function BudgetForecastChart({ data }: BudgetForecastChartProps) {

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
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
            <Line type="monotone" dataKey="open" stroke={chartConfig.open.color} strokeWidth={2} activeDot={{ r: 8 }}>
                <LabelList dataKey="open" content={<CustomLabel />} />
            </Line>
            <Line type="monotone" dataKey="overdue" stroke={chartConfig.overdue.color} strokeWidth={2} >
                <LabelList dataKey="overdue" content={<CustomLabel />} />
            </Line>
             <Line type="monotone" dataKey="closed" stroke={chartConfig.closed.color} strokeWidth={2} >
                <LabelList dataKey="closed" content={<CustomLabel />} />
            </Line>
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
