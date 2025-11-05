
'use client';
import { useState, useMemo, useEffect, useRef } from 'react';
import type { Transaction, Category } from '@/lib/types';
import { format, addDays, isSameDay, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { getCategoryByName, getIconByName } from '@/lib/data';
import { DhiramSymbol } from '@/components/ui/dhiram-symbol';
import { useToast } from '@/hooks/use-toast';
import { updateTransactionStatus } from '@/app/actions';
import { useFirebase } from '@/firebase';
import { Check } from 'lucide-react';

interface UpcomingBillsTimelineProps {
  bills: Transaction[];
  categories: Category[];
}

export default function UpcomingBillsTimeline({ bills, categories }: UpcomingBillsTimelineProps) {
  const today = startOfDay(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const { toast } = useToast();
  const { user } = useFirebase();
  const dateButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const dates = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => addDays(today, i));
  }, [today]);

  useEffect(() => {
    // Scroll to today's date on initial load
    const todayStr = format(today, 'yyyy-MM-dd');
    const button = dateButtonRefs.current[todayStr];
    if (button) {
      button.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [today]);


  const billsByDate = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    bills.forEach(bill => {
      const dateStr = format(startOfDay(bill.date as Date), 'yyyy-MM-dd');
      if (!map.has(dateStr)) {
        map.set(dateStr, []);
      }
      map.get(dateStr)!.push(bill);
    });
    return map;
  }, [bills]);

  const selectedDayBills = useMemo(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return billsByDate.get(dateStr) || [];
  }, [selectedDate, billsByDate]);
  
  const handleMarkAsPaid = async (transaction: Transaction) => {
    if (!user) {
        toast({
            variant: "destructive",
            title: "Not Authenticated",
            description: "You must be logged in to update a transaction."
        });
        return;
    }
    const result = await updateTransactionStatus(transaction.id, 'Paid', user.uid);
    if (result.success) {
        toast({
            title: "Transaction Updated",
            description: `${transaction.description} marked as Paid.`
        });
    } else {
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: result.error
        });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex space-x-2 pb-4">
          {dates.map(date => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const hasBill = billsByDate.has(dateStr);
            return (
              <Button
                key={dateStr}
                ref={el => dateButtonRefs.current[dateStr] = el}
                variant={isSameDay(date, selectedDate) ? 'default' : 'outline'}
                className={cn('h-auto flex flex-col items-center justify-center p-2 rounded-lg relative', hasBill && !isSameDay(date, selectedDate) && 'border-primary')}
                onClick={() => setSelectedDate(date)}
              >
                <span className="text-xs">{format(date, 'E')}</span>
                <span className="text-lg font-bold">{format(date, 'd')}</span>
                <span className="text-xs">{format(date, 'MMM')}</span>
                {hasBill && <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />}
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
              const category = getCategoryByName(bill.category, categories);
              const Icon = category ? getIconByName(category.icon) : null;
              return (
                <div key={bill.id} className="flex items-center gap-4 group">
                    <div className={cn("h-10 w-10 rounded-full flex items-center justify-center", category?.color?.replace('text-', 'bg-')?.replace('-500', '-100'))}>
                        {Icon && <Icon className={cn("h-5 w-5", category.color)} />}
                    </div>
                    <div className="flex-grow">
                        <p className="font-semibold">{bill.description}</p>
                        <p className="text-sm text-muted-foreground">{bill.category}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-semibold flex items-center gap-1"><DhiramSymbol />{Math.abs(bill.amount).toFixed(2)}</p>
                    </div>
                    <Button size="sm" variant="outline" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleMarkAsPaid(bill)}>
                        <Check className="mr-2 h-4 w-4" />
                        Mark as Paid
                    </Button>
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
