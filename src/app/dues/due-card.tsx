
'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Due } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Check, Calendar as CalendarIcon, AlertTriangle, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DhiramSymbol } from '@/components/ui/dhiram-symbol';
import { format, isBefore, startOfToday } from 'date-fns';
import { toDate } from '@/lib/data';


interface DueCardProps {
  due: Due;
  onTogglePaid: (due: Due) => void;
}

export default function DueCard({ due, onTogglePaid }: DueCardProps) {
    const displayDate = due.instanceDate ? toDate(due.instanceDate) : toDate(due.dueDate);
    const isOverdue = !due.isPaid && isBefore(displayDate, startOfToday());
    
  return (
    <Card className={cn(
        "flex flex-col",
        due.isPaid && "bg-muted/50 text-muted-foreground",
        isOverdue && "border-destructive/50 bg-destructive/5"
    )}>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <div className='space-y-1.5'>
            <CardTitle className="font-headline text-lg">{due.dueName}</CardTitle>
            {due.isRecurring && (
                 <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Repeat className="h-3 w-3" />
                    <span>Recurring {due.frequency}</span>
                </div>
            )}
        </div>
        {isOverdue && <AlertTriangle className="h-5 w-5 text-destructive" />}
      </CardHeader>
      <CardContent className="space-y-2">
        <div className={cn("text-3xl font-bold flex items-center gap-1", isOverdue && "text-destructive")}>
            <DhiramSymbol className={cn("h-7 w-7", !isOverdue && "text-muted-foreground")} />
            {due.dueAmount.toFixed(2)}
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <CalendarIcon className="h-3 w-3" />
            <span>Due on {format(displayDate, 'LLL dd, yyyy')}</span>
        </div>
      </CardContent>
      <CardFooter className="mt-auto">
        <Button 
            className="w-full" 
            variant={due.isPaid ? 'secondary' : 'default'}
            onClick={() => onTogglePaid(due)}
            disabled={due.isPaid}
        >
            {due.isPaid ? (
                <>
                    <Check className="mr-2 h-4 w-4" />
                    Paid on {due.paidDate ? format(toDate(due.paidDate), 'LLL dd') : ''}
                </>
            ) : (
                <>
                    <Check className="mr-2 h-4 w-4" />
                    Mark as Paid
                </>
            )}
        </Button>
      </CardFooter>
    </Card>
  );
}
