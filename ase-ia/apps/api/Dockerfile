# ASE-IA API · imagen para Cloud Run / contenedores.
# Build desde la raíz del monorepo:  docker build -f apps/api/Dockerfile .
FROM node:20-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /repo

# Manifiestos (mejor cacheo de capas)
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/

RUN pnpm install --frozen-lockfile --filter @ase-ia/api...

# Código y build
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter @ase-ia/shared build && pnpm --filter @ase-ia/api build

ENV NODE_ENV=production
ENV API_PORT=8080
EXPOSE 8080
WORKDIR /repo/apps/api
CMD ["node", "dist/index.js"]
