
'use client';
import { useMemo, useState } from 'react';
import { Bell } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import type { Transaction, Budget, Category } from '@/lib/types';
import { collection } from 'firebase/firestore';
import { getNotifications } from '@/lib/data';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';


export default function Notifications() {
  const { firestore, user } = useFirebase();
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);

  const transactionsCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'transactions') : null, [firestore, user]);
  const budgetsCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'budgets') : null, [firestore, user]);

  const { data: allTransactions, isLoading: transactionsLoading } = useCollection<Transaction>(transactionsCollection);
  const { data: allBudgets, isLoading: budgetsLoading } = useCollection<Budget>(budgetsCollection);

  const allNotifications = useMemo(() => {
    return getNotifications(allTransactions, allBudgets);
  }, [allTransactions, allBudgets]);

  const unreadNotifications = useMemo(() => {
    return allNotifications.filter(n => !readNotificationIds.includes(n.id));
  }, [allNotifications, readNotificationIds]);

  const handleMarkAllRead = () => {
    const allIds = allNotifications.map(n => n.id);
    setReadNotificationIds(prev => [...new Set([...prev, ...allIds])]);
  };
  
  const handleMarkAsRead = (notificationId: string) => {
    setReadNotificationIds(prev => [...new Set([...prev, notificationId])]);
  };


  if (transactionsLoading || budgetsLoading) {
    return (
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
            <Bell className="h-5 w-5" />
        </Button>
    )
  }
  
  const hasUnread = unreadNotifications.length > 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
          <Bell className="h-5 w-5" />
          {hasUnread && (
            <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-primary animate-pulse"></span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 font-medium border-b">
            Notifications
        </div>
         <ScrollArea className="h-[300px]">
            {hasUnread ? (
                <div className="divide-y">
                    {unreadNotifications.map((notif) => (
                        <Link key={notif.id} href={notif.href} className="block hover:bg-muted" onClick={() => handleMarkAsRead(notif.id)}>
                            <div className="p-4 space-y-1">
                                <p className={cn("font-semibold text-sm", notif.type === 'overdue' && 'text-destructive')}>{notif.title}</p>
                                <p className="text-xs text-muted-foreground">{notif.description}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            ): (
                <div className="p-4 text-sm text-center text-muted-foreground">
                    You&apos;re all caught up!
                </div>
            )}
         </ScrollArea>
         {hasUnread && (
            <div className='p-2 border-t'>
                <Button variant="link" size="sm" className="w-full" onClick={handleMarkAllRead}>Mark all as read</Button>
            </div>
         )}
      </PopoverContent>
    </Popover>
  );
}
