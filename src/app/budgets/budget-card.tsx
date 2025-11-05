import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getCategoryByName } from '@/lib/data';
import type { Budget } from '@/lib/types';
import { cn } from '@/lib/utils';
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BudgetCardProps {
  budget: Budget;
}

export default function BudgetCard({ budget }: BudgetCardProps) {
  const category = getCategoryByName(budget.name);
  const progress = (budget.spent / budget.limit) * 100;
  const remaining = budget.limit - budget.spent;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          {category && <category.icon className={cn('h-6 w-6', category.color)} />}
          <CardTitle className="font-headline text-lg">{budget.name}</CardTitle>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Spent</span>
          <span>Limit</span>
        </div>
        <div className="flex justify-between font-medium">
          <span>د.إ{budget.spent.toFixed(2)}</span>
          <span>د.إ{budget.limit.toFixed(2)}</span>
        </div>
        <Progress value={progress} />
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">
          {remaining >= 0
            ? `د.إ${remaining.toFixed(2)} remaining`
            : `د.إ${Math.abs(remaining).toFixed(2)} over budget`}
        </p>
      </CardFooter>
    </Card>
  );
}
