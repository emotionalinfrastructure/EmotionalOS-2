# Build context is the monorepo root (emotional-infrastructure/) because
# this is an npm workspaces project -- see deployments/docker/docker-compose.yml.
FROM node:20-slim AS builder
WORKDIR /repo

COPY package.json package-lock.json* ./
COPY apps/web/package.json apps/web/package.json
COPY packages/shared-schemas/package.json packages/shared-schemas/package.json
COPY packages/audit-ledger/package.json packages/audit-ledger/package.json
COPY packages/policy-engine/package.json packages/policy-engine/package.json
COPY packages/eis-sdk/package.json packages/eis-sdk/package.json

RUN npm install

COPY apps/web apps/web
COPY packages packages

ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

RUN npm run build --workspace=apps/web

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV DOCS_DIR=/app/docs

COPY --from=builder /repo/apps/web/.next/standalone ./
COPY --from=builder /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /repo/apps/web/public ./apps/web/public
COPY docs /app/docs

EXPOSE 3000
ENV PORT=3000
CMD ["node", "apps/web/server.js"]
