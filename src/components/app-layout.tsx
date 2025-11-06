'use client';
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import AppSidebar from '@/components/app-sidebar';
import { UserNav } from '@/components/user-nav';
import { Menu } from 'lucide-react';
import Notifications from '@/components/notifications';
import Logo from '@/components/logo';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <Sidebar>
              <AppSidebar />
            </Sidebar>
            <SidebarInset className="flex flex-col">
              <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                 <div className="md:hidden">
                    <Logo />
                </div>
                <div className='hidden md:flex' />
                <div className='flex items-center gap-2'>
                  <Notifications />
                  <UserNav />
                   <SidebarTrigger variant="ghost" size="icon" className="md:hidden">
                        <Menu />
                        <span className="sr-only">Toggle Sidebar</span>
                    </SidebarTrigger>
                </div>
              </header>
              <main className="flex-1 overflow-auto p-4 sm:px-6 sm:py-0">
                {children}
              </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
