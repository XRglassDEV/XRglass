import './globals.css';
import type { ReactNode } from 'react';
import AnimatedBackground from '@/components/AnimatedBackground';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'XRglass — Wallet Intelligence',
  description: 'AI-powered wallet security, fraud detection & trust scoring.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen text-slate-900">
        <AnimatedBackground />
        <Header />
        <main>{children}</main>
        <Footer />
        {/* GSAP CDN (for safety on Vercel edge) */}
        <script defer src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
      </body>
    </html>
  );
}
