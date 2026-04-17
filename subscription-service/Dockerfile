FROM node:22-alpine AS deps
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=deps /app/node_modules ./node_modules
COPY src ./src
COPY tsconfig.json tsconfig.build.json nest-cli.json package.json ./

USER appuser

# HTTP
EXPOSE 8081
# gRPC
EXPOSE 50051

CMD ["pnpm", "start"]
