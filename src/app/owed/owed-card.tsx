
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
import { Calendar, Check } from 'lucide-react';
import { DhiramSymbol } from '@/components/ui/dhiram-symbol';
import { format, isBefore, startOfToday } from 'date-fns';
import { Button } from '@/components/ui/button';

interface OwedCardProps {
  owed: Owed;
  category: Category | undefined;
  onPay: (owed: Owed) => void;
  isProcessing: boolean;
}

export default function OwedCard({ owed, category, onPay, isProcessing }: OwedCardProps) {
  const Icon = category ? getIconByName(category.icon) : null;
  const dueDate = owed.instanceDate;
  const isOverdue = isBefore(dueDate, startOfToday());

  return (
    <Card className={cn("flex flex-col", isOverdue && "border-destructive/50 bg-destructive/5")}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
            {category && Icon && <Icon className={cn('h-5 w-5', category.color)} />}
            <CardTitle className="font-headline text-lg">{owed.description}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
            <div className={cn("flex items-baseline gap-1 text-2xl font-bold", isOverdue && "text-destructive")}>
              <DhiramSymbol className="text-xl" />
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
