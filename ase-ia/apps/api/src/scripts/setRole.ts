/**
 * Asigna rol y establecimiento a un usuario (custom claims de Firebase).
 *
 * Uso:
 *   pnpm --filter @ase-ia/api set-role -- <uid> <role> [schoolId]
 *   role ∈ student | teacher | guardian
 *
 * Requiere Firebase configurado en .env. Tras ejecutarlo, el usuario debe
 * volver a iniciar sesión para que el nuevo claim viaje en su token.
 */
import { ROLES, type Role } from "@ase-ia/shared";
import { isAuthConfigured, setUserRole } from "../services/auth/firebaseAdmin.js";

async function main() {
  const [uid, role, schoolId = "jjp"] = process.argv.slice(2);

  if (!uid || !role) {
    console.error("Uso: set-role -- <uid> <role> [schoolId]");
    process.exit(1);
  }
  if (!ROLES.includes(role as Role)) {
    console.error(`Rol inválido "${role}". Válidos: ${ROLES.join(", ")}`);
    process.exit(1);
  }
  if (!isAuthConfigured()) {
    console.error("Firebase Auth no está configurado en .env");
    process.exit(1);
  }

  await setUserRole(uid, role as Role, schoolId);
  console.log(`✓ ${uid} → role=${role}, schoolId=${schoolId}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
