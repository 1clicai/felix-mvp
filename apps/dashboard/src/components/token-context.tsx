"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

interface TokenContextValue {
  token: string | null;
  setToken: (value: string) => void;
  clearToken: () => void;
  apiBase: string;
  hydrated: boolean;
}

const TokenContext = createContext<TokenContextValue | undefined>(undefined);

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export function TokenProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("felix_token");
    if (saved) setTokenState(saved);
    setHydrated(true);
  }, []);

  const setToken = (value: string) => {
    setTokenState(value);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("felix_token", value);
    }
  };

  const clearToken = () => {
    setTokenState(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("felix_token");
    }
  };

  const value = useMemo(
    () => ({ token, setToken, clearToken, apiBase: API_BASE, hydrated }),
    [token, hydrated],
  );

  return <TokenContext.Provider value={value}>{children}</TokenContext.Provider>;
}

export function useTokenContext() {
  const ctx = useContext(TokenContext);
  if (!ctx) throw new Error("useTokenContext must be used inside TokenProvider");
  return ctx;
}

export function TokenGate({ children }: { children: React.ReactNode }) {
  const { token, setToken, hydrated, clearToken } = useTokenContext();
  const [input, setInput] = useState("");

  useEffect(() => {
    if (token) setInput(token);
  }, [token]);

  if (!hydrated) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <p>Loading…</p>
      </main>
    );
  }

  if (!token) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (input.trim().length < 10) return;
            setToken(input.trim());
          }}
          style={{
            background: "#0f172a",
            padding: "2rem",
            borderRadius: "1rem",
            width: "min(420px, 90vw)",
            boxShadow: "0 15px 40px rgba(0,0,0,0.45)",
          }}
        >
          <h1 style={{ marginTop: 0 }}>Enter API Token</h1>
          <p style={{ color: "#94a3b8" }}>
            Paste a bearer token from the backend auth endpoint to access tenant resources.
          </p>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={4}
            style={{ width: "100%", marginTop: "1rem", padding: "0.75rem", borderRadius: "0.75rem" }}
            placeholder="Bearer token"
          />
          <button
            type="submit"
            style={{
              marginTop: "1rem",
              width: "100%",
              padding: "0.85rem",
              borderRadius: "0.75rem",
              border: 0,
              background: "#22d3ee",
              color: "#082f49",
              fontWeight: 600,
            }}
          >
            Continue
          </button>
        </form>
      </main>
    );
  }

  return (
    <div>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 2rem",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(15,23,42,0.8)",
          position: "sticky",
          top: 0,
          zIndex: 10,
          backdropFilter: "blur(12px)",
        }}
      >
        <div>
          <strong>Felix PPS</strong>
          <span style={{ marginLeft: "0.75rem", color: "#94a3b8", fontSize: "0.9rem" }}>MVP Shell</span>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <code style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
            {token.slice(0, 6)}…{token.slice(-4)}
          </code>
          <button
            type="button"
            onClick={clearToken}
            style={{
              border: "1px solid rgba(255,255,255,0.15)",
              background: "transparent",
              color: "#f8fafc",
              padding: "0.35rem 0.9rem",
              borderRadius: "999px",
            }}
          >
            Switch token
          </button>
        </div>
      </header>
      {children}
    </div>
  );
}
