
'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Reminder } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Check, Calendar as CalendarIcon, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CurrencySymbol } from '@/components/ui/dynamic-currency';
import { format, isBefore, startOfToday } from 'date-fns';

interface ReminderCardProps {
  reminder: Reminder;
  onTogglePaid: (reminder: Reminder) => void;
}

export default function ReminderCard({ reminder, onTogglePaid }: ReminderCardProps) {
    const toDate = (date: any): Date => {
        if (date.toDate) return date.toDate();
        return new Date(date);
    };

    const reminderDate = toDate(reminder.reminderDate);
    const isOverdue = !reminder.isPaid && isBefore(reminderDate, startOfToday());
    
  return (
    <Card className={cn(
        "flex flex-col",
        reminder.isPaid && "bg-muted/50 text-muted-foreground",
        isOverdue && "border-destructive/50 bg-destructive/5"
    )}>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="font-headline text-lg">{reminder.reminderName}</CardTitle>
        {isOverdue && <AlertTriangle className="h-5 w-5 text-destructive" />}
      </CardHeader>
      <CardContent className="space-y-2">
        <div className={cn("text-3xl font-bold flex items-center gap-1", isOverdue && "text-destructive")}>
            <CurrencySymbol className={cn("h-7 w-7", !isOverdue && "text-muted-foreground")} />
            {reminder.reminderAmount.toFixed(2)}
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <CalendarIcon className="h-3 w-3" />
            <span>Due on {format(reminderDate, 'LLL dd, yyyy')}</span>
        </div>
      </CardContent>
      <CardFooter className="mt-auto">
        <Button 
            className="w-full" 
            variant={reminder.isPaid ? 'secondary' : 'default'}
            onClick={() => onTogglePaid(reminder)}
        >
            <Check className="mr-2 h-4 w-4" />
            {reminder.isPaid ? 'Mark as Unpaid' : 'Mark as Paid'}
        </Button>
      </CardFooter>
    </Card>
  );
}
