'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Wallet,
  Landmark,
  FilePieChart,
  Settings,
  HelpCircle,
  PlusCircle,
  MinusCircle,
} from 'lucide-react';
import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import Logo from './logo';
import AddExpenseDialog from '@/app/transactions/add-expense-dialog';
import AddIncomeDialog from '@/components/dashboard/add-income-dialog';
import { Button } from '@/components/ui/button';

const menuItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: Landmark },
  { href: '/budgets', label: 'Budgets', icon: Wallet },
  { href: '/insights', label: 'Insights', icon: FilePieChart },
];

const bottomMenuItems = [
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/help', label: 'Help', icon: HelpCircle },
];

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <div className="flex flex-col gap-2 px-2 py-2">
          <AddIncomeDialog>
            <Button size="sm" className="w-full">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Income
            </Button>
          </AddIncomeDialog>
          <AddExpenseDialog>
             <Button variant="secondary" size="sm" className="w-full">
                <MinusCircle className="mr-2 h-4 w-4" /> Add Expense
            </Button>
          </AddExpenseDialog>
        </div>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          {bottomMenuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
