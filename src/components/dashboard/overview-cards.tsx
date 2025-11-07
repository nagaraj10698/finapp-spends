
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CurrencySymbol } from '../ui/dynamic-currency';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrency } from '../providers/currency-provider';

interface OverviewCardsProps {
  totals: {
    income: number;
    expenses: number;
    savings: number;
  };
}

export default function OverviewCards({ totals }: OverviewCardsProps) {
  const { formatCurrency } = useCurrency();
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          <ArrowUp className="text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(totals.income)}
          </div>
          <p className="text-xs text-muted-foreground">Total income recorded in period</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <ArrowDown className="text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-500">
             {formatCurrency(totals.expenses)}
          </div>
          <p className="text-xs text-muted-foreground">Total expenses recorded in period</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Savings</CardTitle>
          <CurrencySymbol className="text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={cn("text-2xl font-bold", totals.savings < 0 ? "text-red-500" : "text-green-500")}>
            {formatCurrency(totals.savings)}
          </div>
          <p className="text-xs text-muted-foreground">Your balance for the period</p>
        </CardContent>
      </Card>
    </>
  );
}
