
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
} from '@/components/ui/sidebar';
import Logo from './logo';

const menuItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: ArrowRightLeft },
  { href: '/expenses', label: 'Expenses', icon: Landmark },
  { href: '/income', label: 'Income', icon: TrendingUp },
  { href: '/budgets', label: 'Budgets', icon: Wallet },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { isMobile } = useSidebar();

  return (
    <>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
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
