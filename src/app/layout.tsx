import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import MotionProvider from "@/components/motion-provider";
import MotionPage from "@/components/motion-page";

export const metadata: Metadata = {
  title: 'ElderScrollsIdle',
  description: 'Idle RPG в мире The Elder Scrolls.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Literata:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <MotionProvider>
          <MotionPage>
            {children}
          </MotionPage>
        </MotionProvider>
        <Toaster />
      </body>
    </html>
  );
}
