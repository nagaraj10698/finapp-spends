
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getIconByName } from '@/lib/data';
import type { Owed, Category } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Calendar, Check, MoreVertical, Edit } from 'lucide-react';
import { CurrencySymbol } from '@/components/ui/dynamic-currency';
import { format, isBefore, startOfToday } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface OwedCardProps {
  owed: Owed;
  category: Category | undefined;
  onPay: (owed: Owed) => void;
  onEdit: (owed: Owed) => void;
  isProcessing: boolean;
}

export default function OwedCard({ owed, category, onPay, onEdit, isProcessing }: OwedCardProps) {
  const Icon = category ? getIconByName(category.icon) : null;
  const dueDate = owed.instanceDate;
  const isOverdue = isBefore(dueDate, startOfToday());

  return (
    <Card className={cn("flex flex-col", isOverdue && "border-destructive/50 bg-destructive/5")}>
      <CardHeader className="pb-4 flex flex-row items-start justify-between">
        <div className="space-y-1">
            <div className="flex items-center gap-2">
                {category && Icon && <Icon className={cn('h-5 w-5', category.color)} />}
                <CardTitle className="font-headline text-lg">{owed.description}</CardTitle>
            </div>
        </div>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(owed)}>
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Edit</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
            <div className={cn("flex items-baseline gap-1 text-2xl font-bold", isOverdue && "text-destructive")}>
              <CurrencySymbol className="text-xl" />
              {Math.abs(owed.amount).toFixed(2)}
            </div>
             <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Due on {format(dueDate, 'MMMM do, yyyy')}</span>
            </div>
        </div>
      </CardContent>
       <CardFooter className="mt-auto">
        <Button 
            className="w-full" 
            onClick={() => onPay(owed)}
            disabled={isProcessing}
        >
            <Check className="mr-2 h-4 w-4" />
            Mark as Paid
        </Button>
      </CardFooter>
    </Card>
  );
}
