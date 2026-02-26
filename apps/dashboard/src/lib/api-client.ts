"use client";

import { useCallback } from "react";
import { useTokenContext } from "../components/token-context";

export interface ApiResponse<T> {
  data: T;
}

export function useApiClient() {
  const { token, apiBase } = useTokenContext();

  return useCallback(
    async <T>(path: string, options: RequestInit = {}): Promise<T> => {
      if (!token) throw new Error("Missing token");
      const response = await fetch(`${apiBase}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...(options.headers || {}),
        },
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const message = (body as { message?: string }).message ?? response.statusText;
        throw new Error(message || "Request failed");
      }

      if (response.status === 204) {
        return {} as T;
      }

      return (await response.json()) as T;
    },
    [token, apiBase],
  );
}
