import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'NutriKitchen OS | K-12 School Lunch Nutrition & Inventory Management',
  description:
    'Comprehensive SaaS platform for school administrators, nutritionists, kitchen staff, and inventory managers.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
