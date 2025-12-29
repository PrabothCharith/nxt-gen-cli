export const dockerfile = `# Base image
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* bun.lockb* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  elif [ -f bun.lockb ]; then bun install --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi


# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN \
  if [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  elif [ -f bun.lockb ]; then bun run build; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD HOSTNAME="0.0.0.0" node server.js
`;

export const ciWorkflow = `# GitHub Actions CI/CD Pipeline
name: CI

on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4

    - name: Detect package manager
      id: detect-package-manager
      run: |
        if [ -f "\${{ github.workspace }}/yarn.lock" ]; then
          echo "manager=yarn" >> $GITHUB_OUTPUT
          echo "command=install" >> $GITHUB_OUTPUT
          echo "runner=yarn" >> $GITHUB_OUTPUT
          exit 0
        elif [ -f "\${{ github.workspace }}/package.json" ]; then
          echo "manager=npm" >> $GITHUB_OUTPUT
          echo "command=ci" >> $GITHUB_OUTPUT
          echo "runner=npx --no-install" >> $GITHUB_OUTPUT
          exit 0
        else
          echo "Unable to determine package manager"
          exit 1
        fi

    - name: Setup Node
      uses: actions/setup-node@v4
      with:
        node-version: "20"
        cache: \${{ steps.detect-package-manager.outputs.manager }}

    - name: Install dependencies
      run: \${{ steps.detect-package-manager.outputs.manager }} \${{ steps.detect-package-manager.outputs.command }}

    - name: Lint
      run: \${{ steps.detect-package-manager.outputs.manager }} run lint

    - name: Build
      run: \${{ steps.detect-package-manager.outputs.manager }} run build
`;

export const envExample = (prisma: boolean, auth: boolean) => {
  let content = `# Environment Variables\n\n`;

  if (prisma) {
    content += `# Prisma Database URL
# DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"
# DATABASE_URL="file:./dev.db"
`;
  }

  if (auth) {
    content += `\n# Authentication Secrets
# NEXTAUTH_SECRET="your-secret-key"
# NEXTAUTH_URL="http://localhost:3000"
`;
  }

  return content;
};
