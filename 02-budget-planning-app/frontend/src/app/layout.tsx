import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Budget Planning App | Fintrack Financial Suite',
  description: 'Envelope budgeting, zero-based financial allocation, and debt elimination workspace.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
