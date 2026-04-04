import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Titan Restaurant AI",
  description: "Simple business intelligence for small restaurants",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-black text-white">
        <header className="border-b border-white/10">
          <nav className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="text-lg font-bold">
              Titan Restaurant AI
            </Link>

            <div className="flex items-center gap-4 text-sm">
              <Link href="/" className="hover:text-gray-300">
                Home
              </Link>
              <Link href="/login" className="hover:text-gray-300">
                Login
              </Link>
              <Link href="/dashboard" className="hover:text-gray-300">
                Dashboard
              </Link>
              <Link href="/profit-overview" className="hover:text-gray-300">
                Profit Overview
              </Link>
              <Link href="/sales-analytics" className="hover:text-gray-300">
                Sales Analytics
              </Link>
              <Link href="/sales-reconciliation" className="hover:text-gray-300">
                Sales Reconciliation
              </Link>
              <Link href="/sales-truth-review" className="hover:text-gray-300">
                Sales Truth Review
              </Link>
              <Link href="/sales-imports" className="hover:text-gray-300">
                Sales Imports
              </Link>
              <Link href="/expense-analytics" className="hover:text-gray-300">
                Expense Analytics
              </Link>
              <Link href="/expense-imports" className="hover:text-gray-300">
                Expense Imports
              </Link>
              <Link href="/uploads" className="hover:text-gray-300">
                Uploads
              </Link>
              <Link href="/upload/sales" className="hover:text-gray-300">
                Sales
              </Link>
              <Link href="/upload/expenses" className="hover:text-gray-300">
                Expenses
              </Link>
            </div>
          </nav>
        </header>

        {children}
      </body>
    </html>
  );
}
