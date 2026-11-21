import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fintrack Stocks - Institutional Equity Portfolio Tracker',
  description: 'Stock market portfolio tracker with FIFO tax-lot accounting, splits & rebalancing',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-900 text-slate-100 antialiased">{children}</body>
    </html>
  );
}
