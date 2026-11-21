import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fintrack Banking - Simulated Internet Banking & Core Ledger',
  description: 'Full-stack simulated internet banking platform with double-entry core ledger',
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
