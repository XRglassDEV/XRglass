import './globals.css';
import type { ReactNode } from 'react';
import AnimatedBackground from '@/components/AnimatedBackground';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = { title:'XRglass — Wallet Intelligence', description:'AI wallet security & fraud detection.' };

export default function RootLayout({ children }:{ children:ReactNode }){
  return (
    <html lang="en">
      <body className="min-h-screen text-slate-900">
        <AnimatedBackground/>
        <Header/>
        <main>{children}</main>
        <Footer/>
        <script defer src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
      </body>
    </html>
  );
}
