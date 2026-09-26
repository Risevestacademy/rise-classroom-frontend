
import './globals.css';
import { cn } from "@/lib/utils";
import { ClarityInit } from '@/lib/analytics/ClarityInit';
import { tomatoGrotesk, workSans } from './fonts';


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn(tomatoGrotesk.variable, workSans.variable, 'font-tomato')}>
      <body>
        <ClarityInit />
        {children}
      </body>
    </html>
  );
}
