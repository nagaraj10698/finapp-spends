
'use client';

import {
  Wallet,
  LayoutDashboard,
  User,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import AddTransactionDialog from '@/app/transactions/add-transaction-dialog';
import { Button } from './ui/button';

const navItems = [
  { href: '/budgets', label: 'Wallet', icon: Wallet },
  { href: '/', label: 'Report', icon: LayoutDashboard },
  { href: '/profile', label: 'Account', icon: User },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-20 bg-background border-t pb-safe">
      <div className="grid h-full grid-cols-4 max-w-lg mx-auto font-medium">
        <Link
          href={navItems[0].href}
          className={cn(
            'inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group',
            pathname === navItems[0].href
              ? 'text-primary'
              : 'text-muted-foreground'
          )}
        >
          <navItems[0].icon className="w-5 h-5 mb-2" />
          <span className="text-sm">{navItems[0].label}</span>
        </Link>

        <Link
            href={navItems[1].href}
            className={cn(
                "inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group",
                pathname === navItems[1].href ? "text-primary" : "text-muted-foreground"
            )}
        >
            <navItems[1].icon className="w-5 h-5 mb-2" />
            <span className="text-sm">{navItems[1].label}</span>
        </Link>

        <div className="inline-flex flex-col items-center justify-center">
            <AddTransactionDialog>
                <Button size="icon" className="w-14 h-14 rounded-full shadow-lg -translate-y-4">
                    <Plus className="w-6 h-6" />
                </Button>
            </AddTransactionDialog>
        </div>

        <Link
          href={navItems[2].href}
          className={cn(
            'inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group',
            pathname === navItems[2].href
              ? 'text-primary'
              : 'text-muted-foreground'
          )}
        >
          <navItems[2].icon className="w-5 h-5 mb-2" />
          <span className="text-sm">{navItems[2].label}</span>
        </Link>
      </div>
    </div>
  );
}
