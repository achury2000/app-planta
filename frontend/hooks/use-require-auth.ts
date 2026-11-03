import { useRouter } from "expo-router";
import { useCallback } from "react";

import { useAuth } from "../context/AuthContext";

/** Ejecuta la acción si hay sesión; si no, abre la pantalla de acceso. */
export function useGate() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  return useCallback(
    (action: () => void) => {
      if (isAuthenticated) action();
      else router.push("/auth");
    },
    [isAuthenticated, router],
  );
}
