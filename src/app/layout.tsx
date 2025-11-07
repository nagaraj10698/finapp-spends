
import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase';
import AuthWrapper from '@/components/auth-wrapper';
import { CurrencyProvider } from '@/components/providers/currency-provider';


export const metadata: Metadata = {
  title: 'Spends',
  description: 'Track your spending and save money.',
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
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
            <CurrencyProvider>
                <AuthWrapper>{children}</AuthWrapper>
            </CurrencyProvider>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
