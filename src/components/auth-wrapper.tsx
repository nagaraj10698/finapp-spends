'use client';

import { useUser } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import AuthLayout from '@/app/auth/layout';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import AppLayout from './app-layout';


export default function AuthWrapper({ children }: { children: React.ReactNode }) {
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
    // This case is handled by the useEffect redirect, but as a fallback,
    // we show a loader while redirecting.
    return (
         <div className="flex min-h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  return <AppLayout>{children}</AppLayout>;
}
