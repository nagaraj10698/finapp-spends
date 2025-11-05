
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DhiramSymbol } from '../ui/dhiram-symbol';
import { ArrowUp, ArrowDown, PlusCircle, TrendingUp } from 'lucide-react';
import { Button } from '../ui/button';
import AddIncomeDialog from './add-income-dialog';
import { cn } from '@/lib/utils';

interface OverviewCardsProps {
  totals: {
    income: number;
    expenses: number;
    savings: number;
  };
}

export default function OverviewCards({ totals }: OverviewCardsProps) {
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          <AddIncomeDialog>
            <Button variant="ghost" size="sm" className="p-1 h-auto">
              <PlusCircle className="h-4 w-4" />
            </Button>
          </AddIncomeDialog>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold flex items-center gap-1">
            <DhiramSymbol />
            {totals.income.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground">Total income recorded</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <DhiramSymbol className="text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold flex items-center gap-1 text-red-500">
             <DhiramSymbol />
            {totals.expenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground">Total expenses recorded</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
          <ArrowUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className={cn("text-2xl font-bold flex items-center gap-1", totals.savings < 0 ? "text-red-500" : "text-green-500")}>
            <DhiramSymbol />{totals.savings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground">Your current balance</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Spending Trend</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">N/A</div>
          <p className="text-xs text-muted-foreground">
            No trend data available yet
          </p>
        </CardContent>
      </Card>
    </>
  );
}
