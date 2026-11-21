import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fintrack Invoicing - Accounts Receivable & Billing Studio',
  description: 'Enterprise invoicing platform with sequential numbering and frozen snapshot immutability',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
