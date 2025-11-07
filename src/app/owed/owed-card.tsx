
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
import { Calendar } from 'lucide-react';
import { DhiramSymbol } from '@/components/ui/dhiram-symbol';
import { format } from 'date-fns';

interface OwedCardProps {
  owed: Owed;
  category: Category | undefined;
}

export default function OwedCard({ owed, category }: OwedCardProps) {
  const Icon = category ? getIconByName(category.icon) : null;
  const dueDate = owed.instanceDate;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
            {category && Icon && <Icon className={cn('h-5 w-5', category.color)} />}
            <CardTitle className="font-headline text-lg">{owed.description}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
            <div className="flex items-baseline gap-1 text-2xl font-bold">
              <DhiramSymbol className="text-xl" />
              {Math.abs(owed.amount).toFixed(2)}
            </div>
             <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Due on {format(dueDate, 'MMMM do, yyyy')}</span>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
