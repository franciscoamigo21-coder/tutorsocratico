"use client";

import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
  type User as FirebaseUser,
} from "firebase/auth";
import type { Role } from "@ase-ia/shared";
import { getFirebaseAuth, googleProvider, isFirebaseConfigured } from "../lib/firebase";
import { setAuthToken } from "../lib/api";

export interface AuthState {
  user: FirebaseUser | null;
  role: Role | null;
  loading: boolean;
  configured: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

/**
 * Maneja el inicio de sesión con Google y mantiene el ID token sincronizado con
 * el cliente de la API. El rol se lee de los custom claims del token.
 */
export function useAuth(): AuthState {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const result = await u.getIdTokenResult();
        setAuthToken(result.token);
        setRole((result.claims.role as Role) ?? null);
      } else {
        setAuthToken(null);
        setRole(null);
      }
      setLoading(false);
    });
  }, []);

  async function signIn() {
    const auth = getFirebaseAuth();
    if (!auth) return;
    await signInWithPopup(auth, googleProvider);
  }

  async function signOut() {
    const auth = getFirebaseAuth();
    if (!auth) return;
    await fbSignOut(auth);
  }

  return {
    user,
    role,
    loading,
    configured: isFirebaseConfigured,
    signIn,
    signOut,
  };
}
