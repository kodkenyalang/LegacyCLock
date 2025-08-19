import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { LegacyClockProvider } from '@/hooks/use-legacy-clock';
import { ThirdwebProvider } from 'thirdweb/react';

export const metadata: Metadata = {
  title: 'LegacyClock',
  description: 'A decentralized application for wills and inheritance',
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
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet"></link>
      </head>
      <body className="font-body antialiased">
        <ThirdwebProvider>
          <LegacyClockProvider>
            {children}
            <Toaster />
          </LegacyClockProvider>
        </ThirdwebProvider>
      </body>
    </html>
  );
}
