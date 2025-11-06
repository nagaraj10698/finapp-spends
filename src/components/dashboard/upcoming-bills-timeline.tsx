
'use client';
import { useState, useMemo, useEffect, useRef } from 'react';
import type { Due, Category } from '@/lib/types';
import { format, addDays, isSameDay, startOfDay, isBefore, isAfter } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { getCategoryByName, getIconByName, toDate } from '@/lib/data';
import { DhiramSymbol } from '@/components/ui/dhiram-symbol';
import { AlertTriangle } from 'lucide-react';
import { useFirebase } from '@/firebase';
import { processDuePayment } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';


interface UpcomingBillsTimelineProps {
  bills: Due[];
  categories: Category[];
}

export default function UpcomingBillsTimeline({ bills, categories }: UpcomingBillsTimelineProps) {
  const dateButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const { user } = useFirebase();
  const { toast } = useToast();
  const [today, setToday] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  
  useEffect(() => {
    const todayDate = startOfDay(new Date());
    setToday(todayDate);
    setSelectedDate(todayDate);
  }, []);

  useEffect(() => {
    if (today) {
      const todayStr = format(today, 'yyyy-MM-dd');
      const button = dateButtonRefs.current[todayStr];
      if (button) {
        button.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [today, bills]);


  const dates = useMemo(() => {
    if (!today) return [];
    const startDate = addDays(today, -7);
    return Array.from({ length: 30 }, (_, i) => addDays(startDate, i));
  }, [today]);

  const billsByDate = useMemo(() => {
    const map = new Map<string, Due[]>();
    bills.forEach(bill => {
      const instanceDate = toDate(bill.instanceDate || bill.dueDate);
      const dateStr = format(instanceDate, 'yyyy-MM-dd');
      if (!map.has(dateStr)) {
        map.set(dateStr, []);
      }
      map.get(dateStr)!.push(bill);
    });
    return map;
  }, [bills]);

  const selectedDayBills = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return billsByDate.get(dateStr) || [];
  }, [selectedDate, billsByDate]);
  
  const handlePayDue = async (due: Due) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
        return;
    }
    setIsProcessing(due.id);
    try {
        await processDuePayment(user.uid, due);
        toast({ title: 'Payment Processed', description: `${due.dueName} has been marked as paid and a transaction was created.`});
    } catch (error) {
        console.error("Failed to process payment:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to process payment.' });
    } finally {
        setIsProcessing(null);
    }
  }
  
  if (!today || !selectedDate) {
    return <div className="h-[250px] w-full animate-pulse rounded-lg bg-muted" />;
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex space-x-2 pb-4">
          {dates.map(date => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const dayBills = billsByDate.get(dateStr) || [];
            const isAnyPaid = dayBills.some(b => {
                const instanceDate = toDate(b.instanceDate || b.dueDate);
                const instanceDateStr = instanceDate.toISOString().split('T')[0];
                return b.isPaid || (b.isRecurring && b.paidInstances?.[instanceDateStr]);
            });
            const isAnyUnpaid = dayBills.some(b => {
                 const instanceDate = toDate(b.instanceDate || b.dueDate);
                const instanceDateStr = instanceDate.toISOString().split('T')[0];
                return !b.isPaid && !(b.isRecurring && b.paidInstances?.[instanceDateStr]);
            });
            const isAnyOverdue = dayBills.some(b => {
                const instanceDate = toDate(b.instanceDate || b.dueDate);
                const instanceDateStr = instanceDate.toISOString().split('T')[0];
                return !b.isPaid && !(b.isRecurring && b.paidInstances?.[instanceDateStr]) && isBefore(instanceDate, today);
            });
            const hasBill = dayBills.length > 0;

            return (
              <Button
                key={dateStr}
                ref={el => dateButtonRefs.current[dateStr] = el}
                variant={isSameDay(date, selectedDate) ? 'default' : 'outline'}
                className={cn(
                    'h-auto flex flex-col items-center justify-center p-2 rounded-lg relative transition-all',
                    !isSameDay(date, selectedDate) && {
                        'border-primary/50 text-primary-foreground': hasBill && isAnyUnpaid && isAfter(date, today),
                        'border-destructive/80 text-destructive-foreground': hasBill && isAnyOverdue,
                        'border-green-500/50 text-green-500': hasBill && !isAnyUnpaid,
                    }
                )}
                onClick={() => setSelectedDate(date)}
              >
                <span className="text-xs">{format(date, 'E')}</span>
                <span className="text-lg font-bold">{format(date, 'd')}</span>
                <span className="text-xs">{format(date, 'MMM')}</span>
                {hasBill && isAnyUnpaid && (
                     <span className={cn(
                        "absolute top-1 right-1 h-2 w-2 rounded-full",
                        isAnyOverdue ? "bg-destructive" : "bg-primary"
                     )} />
                )}
              </Button>
            )
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      
      <ScrollArea className="flex-grow mt-4">
        {selectedDayBills.length > 0 ? (
          <div className="space-y-4">
            {selectedDayBills.map(bill => {
              const category = categories.find(c => c.id === bill.categoryId);
              const Icon = category ? getIconByName(category.icon) : null;
              const instanceDate = toDate(bill.instanceDate || bill.dueDate);
              const instanceDateStr = instanceDate.toISOString().split('T')[0];
              const isPaid = bill.isPaid || (bill.isRecurring && bill.paidInstances?.[instanceDateStr]);
              const isOverdue = !isPaid && isBefore(instanceDate, today);

              return (
                <div key={`${bill.id}-${instanceDateStr}`} className="flex items-center gap-4 group">
                    <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center",
                        isOverdue && !isPaid && 'bg-destructive/10',
                        !isOverdue && !isPaid && 'bg-primary/10',
                        isPaid && 'bg-green-500/10'
                    )}>
                        {isOverdue && !isPaid ? <AlertTriangle className="h-5 w-5 text-destructive" /> : (Icon && <Icon className={cn("h-5 w-5", isPaid ? 'text-green-500' : category?.color)} />)}
                    </div>
                    <div className="flex-grow">
                        <p className={cn("font-semibold", isPaid && "line-through text-muted-foreground")}>{bill.dueName}</p>
                        <p className="text-sm text-muted-foreground">{category?.name}</p>
                    </div>
                    <div className="text-right">
                        <p className={cn("font-semibold flex items-center gap-1", isOverdue && !isPaid && "text-destructive", isPaid && "text-muted-foreground")}><DhiramSymbol />{Math.abs(bill.dueAmount).toFixed(2)}</p>
                    </div>
                    {!isPaid && (
                        <Button size="sm" onClick={() => handlePayDue(bill)} disabled={isProcessing === bill.id}>
                            {isProcessing === bill.id ? 'Paying...': 'Pay'}
                        </Button>
                    )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No bills due on {format(selectedDate, 'PPP')}.</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
