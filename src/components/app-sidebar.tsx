
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
  { href: '/transactions', label: 'Transactions', icon: ArrowRightLeft },
  { href: '/budgets', label: 'Budgets', icon: Wallet },
];

const bottomMenuItems: any[] = [
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { isMobile, state } = useSidebar();
  
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
                isActive={pathname.startsWith(item.href) && (item.href === '/' ? pathname === '/' : true)}
                tooltip={!isMobile ? item.label : undefined}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}


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
