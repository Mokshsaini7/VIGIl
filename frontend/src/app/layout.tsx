import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'VIGIL — Voice Integrity & Impersonation Guard',
  description: 'AI-Powered Voice Security & Impersonation Defense System for Smart India Hackathon 2026',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0B0F17] text-gray-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
