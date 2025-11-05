import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DhiramSymbol } from '../ui/dhiram-symbol';
import { ArrowUp, ArrowDown, PlusCircle } from 'lucide-react';
import { Button } from '../ui/button';
import AddIncomeDialog from './add-income-dialog';

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
            {totals.income.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">+20.1% from last month</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <DhiramSymbol className="text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold flex items-center gap-1">
             <DhiramSymbol />
            {totals.expenses.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">+180.1% from last month</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
          <ArrowUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold flex items-center gap-1">
            <DhiramSymbol />{totals.savings.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">+19% from last month</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Spending Trend</CardTitle>
          <ArrowDown className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">-14%</div>
          <p className="text-xs text-muted-foreground">
            Compared to last month
          </p>
        </CardContent>
      </Card>
    </>
  );
}
