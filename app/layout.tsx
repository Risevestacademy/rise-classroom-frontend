
import './globals.css';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { ClarityInit } from '@/lib/analytics/ClarityInit';

const geist = Geist({subsets:['latin'],variable:'--font-sans'});


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>
        <ClarityInit />
        {children}
      </body>
    </html>
  );
}