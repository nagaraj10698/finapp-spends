
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

  const unreadNotificationsCount = useMemo(() => {
    return allNotifications.filter(n => !readNotificationIds.includes(n.id)).length;
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
  
  const hasUnread = unreadNotificationsCount > 0;
  const hasNotifications = allNotifications.length > 0;

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
        <div className="p-4 font-medium border-b flex justify-between items-center">
            <span>Notifications</span>
            {hasUnread && (
              <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={handleMarkAllRead}>Mark all as read</Button>
            )}
        </div>
         <ScrollArea className="h-[300px]">
            {hasNotifications ? (
                <div className="divide-y">
                    {allNotifications.map((notif) => {
                        const isRead = readNotificationIds.includes(notif.id);
                        return (
                            <Link 
                                key={notif.id} 
                                href={notif.href} 
                                className={cn("block hover:bg-muted/50 transition-colors", isRead && "opacity-60")}
                                onClick={() => handleMarkAsRead(notif.id)}
                            >
                                <div className={cn("p-4 space-y-1 relative", !isRead && "bg-accent/50")}>
                                    {!isRead && <span className="absolute left-2 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary" />}
                                    <p className={cn("font-semibold text-sm", notif.type === 'overdue' && 'text-destructive')}>{notif.title}</p>
                                    <p className="text-xs text-muted-foreground">{notif.description}</p>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            ): (
                <div className="p-4 text-sm text-center text-muted-foreground">
                    You're all caught up!
                </div>
            )}
         </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
