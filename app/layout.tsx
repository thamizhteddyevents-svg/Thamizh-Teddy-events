import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Thamizh Teddy Events | Making Every Celebration Magical",
  description: "Premium event planning and celebration services across Tamil Nadu and Puducherry.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
