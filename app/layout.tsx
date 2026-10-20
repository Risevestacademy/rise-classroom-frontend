
import './globals.css';
import { cn } from "@/lib/utils";
import { ClarityInit } from '@/lib/analytics/ClarityInit';
import { QueryProvider } from '@/components/QueryProvider';
import { tomatoGrotesk, workSans } from './fonts';
import { Metadata } from 'next';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Turn learning into real progress`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    'Rise Classroom',
    'Rise Academy',
    'learning platform',
    'cohort-based learning',
    'learning management system',
    'online classroom',
    'live classes',
    'curriculum management',
    'educators',
  ],
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Turn learning into real progress`,
    description: SITE_DESCRIPTION,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Turn learning into real progress`,
    description: SITE_DESCRIPTION,
  },
  robots: { index: true, follow: true },
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
