import "./globals.css";
import { GeistSans } from "geist/font/sans";

export const metadata = {
  title: "binge next",
  description: "a search engine for tv shows",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={GeistSans.className}>
      <body>{children}</body>
    </html>
  );
}
