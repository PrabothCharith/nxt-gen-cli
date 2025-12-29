export const prismaSchema = `
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client"
}

datasource db {
  provider = "sqlite"
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  createdAt DateTime @default(now())
}
`;

export const prismaClient = `
import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;
`;

export const axiosClient = `
import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});
`;

export const queryProvider = `
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
`;

export const providersComponent = (config: {
  ui: string;
  reactQuery: boolean;
  auth?: string;
}) => `
'use client';

import * as React from 'react';
${
  config.reactQuery
    ? "import QueryProvider from '@/components/providers/query-provider';"
    : ""
}
${
  config.ui === "heroui" || config.ui === "both"
    ? "import { HeroUIProvider } from '@heroui/react';"
    : ""
}
${
  config.auth === "next-auth"
    ? "import { SessionProvider } from 'next-auth/react';"
    : ""
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      ${config.auth === "next-auth" ? "<SessionProvider>" : ""}
      ${config.reactQuery ? "<QueryProvider>" : ""}
        ${
          config.ui === "heroui" || config.ui === "both"
            ? "<HeroUIProvider>"
            : ""
        }
          {children}
        ${
          config.ui === "heroui" || config.ui === "both"
            ? "</HeroUIProvider>"
            : ""
        }
      ${config.reactQuery ? "</QueryProvider>" : ""}
      ${config.auth === "next-auth" ? "</SessionProvider>" : ""}
    </>
  );
}
`;
