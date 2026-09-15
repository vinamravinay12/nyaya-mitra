# Build the monorepo, then ship only the server and its runtime dependencies.
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/core/package.json ./packages/core/
COPY packages/server/package.json ./packages/server/
COPY packages/client/package.json ./packages/client/
RUN npm ci

COPY tsconfig.base.json ./
COPY packages/core ./packages/core
COPY packages/server ./packages/server

# Building the server project also builds `core`, which it references.
RUN npx tsc -b packages/server

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/core/package.json ./packages/core/
COPY packages/server/package.json ./packages/server/
COPY packages/client/package.json ./packages/client/
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/packages/core/dist ./packages/core/dist
COPY --from=build /app/packages/server/dist ./packages/server/dist

USER node

# Cloud Run supplies PORT; config.ts reads it and falls back to 8080.
EXPOSE 8080
CMD ["node", "packages/server/dist/index.js"]
