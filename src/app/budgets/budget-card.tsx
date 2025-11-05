
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getIconByName } from '@/lib/data';
import type { Budget, Category } from '@/lib/types';
import { cn } from '@/lib/utils';
import { MoreVertical, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DhiramSymbol } from '@/components/ui/dhiram-symbol';
import { format } from 'date-fns';

interface BudgetCardProps {
  budget: Budget;
  category: Category | undefined;
}

export default function BudgetCard({ budget, category }: BudgetCardProps) {
  const Icon = category ? getIconByName(category.icon) : null;

  const toDate = (date: any) => {
    if (date.toDate) return date.toDate();
    return new Date(date);
  }

  const startDate = toDate(budget.budgetStartDate);
  const endDate = toDate(budget.budgetEndDate);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="space-y-1">
            <div className="flex items-center gap-2">
                {category && Icon && <Icon className={cn('h-5 w-5', category.color)} />}
                <CardTitle className="font-headline text-lg">{budget.name}</CardTitle>
            </div>
            <CardDescription>{budget.type}</CardDescription>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            <MoreVertical className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-3xl font-bold flex items-center gap-1">
            <DhiramSymbol className="h-7 w-7" />
            {budget.budgetAmount.toFixed(2)}
        </div>
        <div className="text-xs text-muted-foreground">
            {budget.isRecurring ? 'Recurring' : `From ${format(startDate, 'LLL dd')} to ${format(endDate, 'LLL dd')}`}
        </div>
      </CardContent>
      {budget.isRecurring && (
        <CardFooter>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Repeat className="h-3 w-3" />
                <span>This is a recurring planned expense.</span>
            </div>
        </CardFooter>
      )}
    </Card>
  );
}
