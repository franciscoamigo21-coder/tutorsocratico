import type { Role } from "@ase-ia/shared";
import { config } from "../../config/index.js";

/**
 * Integración con Firebase Admin para verificar tokens de Google OAuth y
 * gestionar los custom claims (role, schoolId).
 *
 * firebase-admin se importa de forma diferida (dynamic import) para que el
 * servidor pueda arrancar en modo desarrollo SIN credenciales ni la
 * dependencia cargada en memoria.
 */

export interface DecodedToken {
  uid: string;
  email?: string;
  name?: string;
  role?: Role;
  schoolId?: string;
}

let cachedAuth: unknown = null;

export function isAuthConfigured(): boolean {
  const { projectId, clientEmail, privateKey } = config.firebase;
  return Boolean(projectId && clientEmail && privateKey);
}

async function getAuth(): Promise<any> {
  if (cachedAuth) return cachedAuth;
  if (!isAuthConfigured()) return null;

  const { initializeApp, cert, getApps } = await import("firebase-admin/app");
  const { getAuth: adminGetAuth } = await import("firebase-admin/auth");

  const app =
    getApps().length > 0
      ? getApps()[0]
      : initializeApp({
          credential: cert({
            projectId: config.firebase.projectId,
            clientEmail: config.firebase.clientEmail,
            privateKey: config.firebase.privateKey,
          }),
        });

  cachedAuth = adminGetAuth(app);
  return cachedAuth;
}

/** Verifica un ID token de Firebase. Devuelve null si Auth no está configurada. */
export async function verifyIdToken(idToken: string): Promise<DecodedToken | null> {
  const auth = await getAuth();
  if (!auth) return null;
  const decoded = await auth.verifyIdToken(idToken);
  return {
    uid: decoded.uid,
    email: decoded.email,
    name: decoded.name,
    role: decoded.role as Role | undefined,
    schoolId: decoded.schoolId as string | undefined,
  };
}

/**
 * Asigna rol y establecimiento a un usuario (custom claims). Operación de
 * administración: se invoca desde el script set-role o desde el panel (M7).
 */
export async function setUserRole(
  uid: string,
  role: Role,
  schoolId: string,
): Promise<void> {
  const auth = await getAuth();
  if (!auth) throw new Error("Firebase Auth no está configurado.");
  await auth.setCustomUserClaims(uid, { role, schoolId });
}
