import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Beebox Catalog Assistant',
  description: 'Ask about SKU codes, prices, supplier info, and tier pricing for Beebox, Trigem, Beelife, and Suki packaging products.',
  openGraph: {
    title: 'Beebox Catalog Assistant',
    description: 'RAG chatbot over the Beebox packaging catalog.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
