
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
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DhiramSymbol } from '@/components/ui/dhiram-symbol';
import { Progress } from '@/components/ui/progress';

interface BudgetCardProps {
  budget: Budget;
  category: Category | undefined;
}

export default function BudgetCard({ budget, category }: BudgetCardProps) {
  const Icon = category ? getIconByName(category.icon) : null;
  const spent = budget.spent ?? 0;
  const limit = budget.budgetAmount;
  const remaining = limit - spent;
  const progress = limit > 0 ? (spent / limit) * 100 : 0;


  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-4">
        <div className="space-y-1">
            <div className="flex items-center gap-2">
                {category && Icon && <Icon className={cn('h-5 w-5', category.color)} />}
                <CardTitle className="font-headline text-lg">{budget.name}</CardTitle>
            </div>
             <CardDescription>Monthly Budget</CardDescription>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            <MoreVertical className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
            <div className="flex justify-between items-baseline">
                <span className="text-sm text-muted-foreground">Spent</span>
                <span className="text-sm text-muted-foreground">
                    <span className={cn(remaining < 0 && "text-destructive")}>
                        {remaining >= 0 ? 'Remaining' : 'Overspent'}
                    </span>
                    <span className="font-semibold flex items-center gap-1">
                      <DhiramSymbol className="h-3 w-3"/>
                      {Math.abs(remaining).toFixed(2)}
                    </span>
                </span>
            </div>
            <Progress value={progress} className={cn(progress > 100 && "[&>div]:bg-destructive")} />
            <div className="text-lg font-bold flex items-center gap-1">
              <DhiramSymbol className="h-4 w-4" />
              {spent.toFixed(2)}
               <span className="text-sm text-muted-foreground font-normal"> of </span> 
              <DhiramSymbol className="h-4 w-4" />
              {limit.toFixed(2)}
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
