
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Wallet,
  Landmark,
  Settings,
  TrendingUp,
  ArrowRightLeft,
  FileQuestion,
  Bell,
  User,
  ChevronDown,
} from 'lucide-react';
import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
  useSidebar,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarGroup,
} from '@/components/ui/sidebar';
import Logo from './logo';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const mainMenuItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
];

const bottomMenuItems = [
    { href: '/budgets', label: 'Budgets', icon: Wallet },
    { href: '/dues', label: 'Dues', icon: Bell },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { isMobile, state } = useSidebar();
  const isTransactionsActive = pathname.startsWith('/transactions') || pathname.startsWith('/expenses') || pathname.startsWith('/income');
  
  const [isTransactionsOpen, setIsTransactionsOpen] = useState(isTransactionsActive);

  return (
    <>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {mainMenuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                variant="sidebar"
                asChild
                isActive={pathname === item.href}
                tooltip={!isMobile ? item.label : undefined}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          
           <Collapsible open={isTransactionsOpen} onOpenChange={setIsTransactionsOpen}>
             <SidebarMenuItem>
                <div className='flex items-center justify-between w-full'>
                    <SidebarMenuButton
                        variant="sidebar"
                        asChild
                        isActive={isTransactionsActive && pathname === '/transactions'}
                        tooltip={!isMobile ? "Transactions" : undefined}
                        className={cn("flex-grow", state === "collapsed" && "justify-center")}
                    >
                        <Link href="/transactions" className='flex items-center gap-2'>
                        <ArrowRightLeft />
                        <span className={cn(state === 'collapsed' && 'hidden')}>Transactions</span>
                        </Link>
                    </SidebarMenuButton>
                     <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon" className={cn("h-8 w-8 shrink-0", state === "collapsed" && "hidden")}>
                            <ChevronDown className={cn("h-4 w-4 transition-transform", isTransactionsOpen && "rotate-180")} />
                        </Button>
                    </CollapsibleTrigger>
                </div>
            </SidebarMenuItem>

            <CollapsibleContent>
              <SidebarMenuSub>
                <SidebarMenuSubItem>
                  <SidebarMenuSubButton asChild isActive={pathname === '/income'}>
                    <Link href="/income"><TrendingUp /> Income</Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
                <SidebarMenuSubItem>
                  <SidebarMenuSubButton asChild isActive={pathname === '/expenses'}>
                    <Link href="/expenses"><Landmark /> Expenses</Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              </SidebarMenuSub>
            </CollapsibleContent>
          </Collapsible>


          {bottomMenuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                variant="sidebar"
                asChild
                isActive={pathname === item.href}
                tooltip={!isMobile ? item.label : undefined}
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
            <SidebarMenuItem>
              <SidebarMenuButton
                variant="sidebar"
                asChild
                isActive={pathname.startsWith('/settings') || pathname === '/profile'}
                tooltip={!isMobile ? 'Settings' : undefined}
              >
                <Link href={'/settings'}>
                  <Settings />
                  <span>{'Settings'}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
