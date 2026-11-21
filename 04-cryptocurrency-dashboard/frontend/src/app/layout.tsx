import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fintrack Crypto - Market Monitoring & Portfolio Tracker',
  description: 'Cryptocurrency real-time market dashboard with 18-decimal precision portfolio tracking',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased">{children}</body>
    </html>
  );
}
