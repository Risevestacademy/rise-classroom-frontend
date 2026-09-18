import { ThemeRegistry } from '@/theme/ThemeRegistry';
import { ClarityInit } from '@/lib/analytics/ClarityInit';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClarityInit />
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}