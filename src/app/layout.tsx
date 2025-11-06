
'use client';
import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import AppSidebar from '@/components/app-sidebar';
import { UserNav } from '@/components/user-nav';
import { Menu, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FirebaseClientProvider, useUser } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import AuthLayout from './auth/layout';
import Notifications from '@/components/notifications';
import Logo from '@/components/logo';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import MobileBottomNav from '@/components/mobile-nav';
import { useIsMobile } from '@/hooks/use-mobile';


// Metadata can't be in a client component, so we export it from a server component context
// but since the root layout now needs to be a client component because of usePathname,
// we can't export it from here. The best practice is to have a server component wrapper.
// For simplicity here, we'll just remove it for now as it's not critical.
// export const metadata: Metadata = {
//   title: 'Spends',
//   description: 'Track your spending and save money.',
// };

function AppLayout({ children }: { children: React.ReactNode }) {
    const isMobile = useIsMobile();
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
              {isMobile && <MobileBottomNav />}
            </SidebarInset>
        </SidebarProvider>
    )
}

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  const isAuthPage = pathname === '/login' || pathname === '/signup';

  useEffect(() => {
    if (!isUserLoading && !user && !isAuthPage) {
      router.push('/login');
    }
  }, [isUserLoading, user, isAuthPage, router]);

  if (isUserLoading && !isAuthPage) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isAuthPage) {
    return <AuthLayout>{children}</AuthLayout>;
  }

  if (!user) {
    // This case should be handled by the useEffect redirect, but as a fallback,
    // we can show a loader or null while redirecting.
    return (
         <div className="flex min-h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  return <AppLayout>{children}</AppLayout>;
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Spends</title>
        <meta name="description" content="Track your spending and save money." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&family=Space+Grotesk:wght@300..700&display=swap"
          rel="stylesheet"
        />
        {/* <!-- Google tag (gtag.js) --> */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-MEQNZSXB9M"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-MEQNZSXB9M');
            `,
          }}
        />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-body antialiased',
          '[--font-body:_"PT_Sans"] [--font-headline:_"Space_Grotesk"]'
        )}
      >
        <FirebaseClientProvider>
          <AuthWrapper>{children}</AuthWrapper>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
