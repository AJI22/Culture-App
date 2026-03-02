/**
 * Root layout: fonts (Playfair/Cormorant for headings, Inter/Source Sans for body), ClerkProvider when configured.
 * Clerk only wraps app when NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is set (pk_...) so build succeeds without env.
 */
import type { Metadata } from "next";
import {
  Playfair_Display,
  Cormorant_Garamond,
  Inter,
  Source_Sans_3,
} from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Refined private event experience",
  description:
    "A refined private event platform for large, tiered cultural gatherings. WhatsApp-native invites, RSVP tracking, and delegated routing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const content = (
    <html
      lang="en"
      className={`${playfair.variable} ${cormorant.variable} ${inter.variable} ${sourceSans.variable}`}
    >
      <body className="min-h-screen bg-[#F8F4EC] text-[#1a1a1a] antialiased">
        {children}
      </body>
    </html>
  );
  /** Only enable Clerk when a valid publishable key is present (avoids build-time errors when env is missing). */
  if (clerkKey && clerkKey.startsWith("pk_"))
    return <ClerkProvider publishableKey={clerkKey}>{content}</ClerkProvider>;
  return content;
}
