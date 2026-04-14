import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import ChatAssistant from "@/components/ChatAssistant";

export const metadata: Metadata = {
  title: "BLR Intelligence — Bengaluru Business Platform",
  description: "AI-powered business intelligence, discovery, and market analysis for Bengaluru",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ display: "flex", minHeight: "100vh", background: "#0e0e13" }}>
        <Sidebar />
        <main style={{
          flex: 1,
          padding: "2.5rem 2.5rem 3rem",
          maxWidth: "1350px",
          margin: "0 auto",
          width: "100%",
        }}>
          {children}
        </main>
        <ChatAssistant />
      </body>
    </html>
  );
}
