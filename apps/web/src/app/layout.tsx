import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { Providers } from './providers';
import { Nav } from '@/components/ui/nav';

export const metadata: Metadata = {
  title: 'Conduit',
  description: 'Reliable webhook delivery — end to end, with proof.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Nav />
          <main className="mx-auto max-w-6xl px-6 py-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
