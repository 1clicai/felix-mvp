import type { Metadata } from "next";
import "./globals.css";
import { ReactNode } from "react";
import { TokenProvider, TokenGate } from "../components/token-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export const metadata: Metadata = {
  title: "Felix PPS Dashboard",
  description: "MVP shell for managing projects, connectors, and prompts",
};

const queryClient = new QueryClient();

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TokenProvider>
          <QueryClientProvider client={queryClient}>
            <TokenGate>{children}</TokenGate>
          </QueryClientProvider>
        </TokenProvider>
      </body>
    </html>
  );
}
