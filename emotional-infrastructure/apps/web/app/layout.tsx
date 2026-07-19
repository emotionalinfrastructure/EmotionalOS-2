import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Emotional Infrastructure Governance Runtime",
  description: "Candidate governance architecture / reference implementation dashboard.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="layout">
          <Nav />
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
