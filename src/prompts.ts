import prompts from "prompts";

export interface ProjectConfig {
  prisma: boolean;
  reactQuery: boolean;
  axios: boolean;
  ui: "shadcn" | "heroui" | "both" | "none";
  auth: "next-auth" | "clerk" | "none";
  forms: boolean;
  i18n: boolean;
  framerMotion: boolean;
  lucide: boolean;
  unitTesting: boolean;
  e2eTesting: boolean;
  codeQuality: boolean;
  examples: "crud" | "auth" | "both" | "none";
}

export async function initialPrompt(
  options: Partial<ProjectConfig> = {}
): Promise<ProjectConfig> {
  const defaults: ProjectConfig = {
    prisma: false,
    reactQuery: false,
    axios: false,
    ui: "none",
    auth: "none",
    forms: false,
    i18n: false,
    framerMotion: false,
    lucide: true,
    unitTesting: false,
    e2eTesting: false,
    codeQuality: false,
    examples: "none",
    ...options,
  };

  const response = await prompts([
    {
      type: options.prisma !== undefined ? null : "confirm",
      name: "prisma",
      message: "Do you want install Prisma ORM for database operations?",
      initial: true,
    },
    {
      type: options.reactQuery !== undefined ? null : "confirm",
      name: "reactQuery",
      message: "React Query (TanStack Query) for state management?",
      initial: true,
    },
    {
      type: options.axios !== undefined ? null : "confirm",
      name: "axios",
      message: "Axios for API requests?",
      initial: true,
    },
    {
      type: options.ui !== undefined ? null : "select",
      name: "ui",
      message: "Schadcn or HeroUI for UI components?",
      choices: [
        { title: "Schadcn", value: "shadcn" },
        { title: "HeroUI", value: "heroui" },
        { title: "Both", value: "both" },
        { title: "None", value: "none" },
      ],
    },
    {
      type: options.auth !== undefined ? null : "select",
      name: "auth",
      message: "Authentication solution?",
      choices: [
        { title: "Auth.js (NextAuth)", value: "next-auth" },
        { title: "Clerk", value: "clerk" },
        { title: "None", value: "none" },
      ],
    },
    {
      type: options.forms !== undefined ? null : "confirm",
      name: "forms",
      message: "React Hook Form + Zod for validation?",
      initial: true,
    },
    {
      type: options.i18n !== undefined ? null : "confirm",
      name: "i18n",
      message: "Internationalization (next-intl)?",
      initial: false,
    },
    {
      type: options.framerMotion !== undefined ? null : "confirm",
      name: "framerMotion",
      message: "Framer Motion for animations?",
      initial: true,
    },
    {
      type: options.lucide !== undefined ? null : "confirm",
      name: "lucide",
      message: "Lucide React for icons?",
      initial: true,
    },
    {
      type: options.unitTesting !== undefined ? null : "confirm",
      name: "unitTesting",
      message: "Vitest + React Testing Library for unit testing?",
      initial: true,
    },
    {
      type: options.e2eTesting !== undefined ? null : "confirm",
      name: "e2eTesting",
      message: "Playwright for E2E testing?",
      initial: true,
    },
    {
      type: options.codeQuality !== undefined ? null : "confirm",
      name: "codeQuality",
      message: "Husky + lint-staged for code quality?",
      initial: true,
    },
    {
      type: options.examples !== undefined ? null : "select",
      name: "examples",
      message: "Example processes and pages?",
      initial: "none",
      choices: [
        { title: "CRUD Operations Example", value: "crud" },
        { title: "Authentication Example", value: "auth" },
        { title: "Both", value: "both" },
        { title: "None", value: "none" },
      ],
    },
  ]);

  return { ...defaults, ...response };
}
