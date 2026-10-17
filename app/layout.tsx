
import './globals.css';
import { cn } from "@/lib/utils";
import { ClarityInit } from '@/lib/analytics/ClarityInit';
import { QueryProvider } from '@/components/QueryProvider';
import { tomatoGrotesk, workSans } from './fonts';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rise Classroom',
  description: 'The Rise Classroom is a platform for learning and collaboration.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn(tomatoGrotesk.variable, workSans.variable, 'font-tomato')}>
      <body>
        <ClarityInit />
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
