
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
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CurrencySymbol } from '@/components/ui/dynamic-currency';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface BudgetCardProps {
  budget: Budget;
  category: Category | undefined;
  onEdit: () => void;
  onDelete: () => void;
}

export default function BudgetCard({ budget, category, onEdit, onDelete }: BudgetCardProps) {
  const Icon = category ? getIconByName(category.icon) : null;
  
  const isExpense = budget.type === 'Expense';
  
  // Use 'spent' for expenses and 'received' for income
  const amount = isExpense ? (budget.spent ?? 0) : (budget.received ?? 0);
  const target = budget.budgetAmount;
  
  const remaining = target - amount;
  const progress = target > 0 ? (amount / target) * 100 : 0;
  
  const description = isExpense ? "Monthly Budget" : "Monthly Target";
  const amountPrefix = isExpense ? "Spent" : "Received";
  const remainingPrefix = isExpense 
    ? (remaining >= 0 ? 'Remaining' : 'Overspent')
    : (remaining <= 0 ? 'Surplus' : 'Shortfall');


  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-4">
        <div className="space-y-1">
            <div className="flex items-center gap-2">
                {category && Icon && <Icon className={cn('h-5 w-5', category.color)} />}
                <CardTitle className="font-headline text-lg">{budget.name}</CardTitle>
            </div>
             <CardDescription>{description}</CardDescription>
        </div>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Edit</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
            <div className="flex justify-between items-baseline">
                <span className="text-sm text-muted-foreground">{amountPrefix}</span>
                <span className="text-sm text-muted-foreground">
                    <span className={cn(isExpense && remaining < 0 && "text-destructive", !isExpense && remaining < 0 && "text-green-500")}>
                        {remainingPrefix}
                    </span>
                    <span className="font-semibold flex items-baseline gap-1">
                      <CurrencySymbol className="text-xs"/>
                      {Math.abs(remaining).toFixed(2)}
                    </span>
                </span>
            </div>
            <Progress value={progress} className={cn(
                isExpense && progress >= 100 && "[&>div]:bg-destructive",
                isExpense && progress < 100 && "[&>div]:bg-green-500",
                !isExpense && progress >= 100 && "[&>div]:bg-green-500"
            )} />
            <div className="flex items-baseline gap-1">
              <div className="text-lg font-bold flex items-baseline gap-1">
                <CurrencySymbol className="text-base" />
                {amount.toFixed(2)}
              </div>
               <span className="text-sm text-muted-foreground font-normal"> of </span> 
               <div className="flex items-baseline gap-1">
                <CurrencySymbol className="text-sm" />
                {target.toFixed(2)}
               </div>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
