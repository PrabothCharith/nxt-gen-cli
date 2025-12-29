import prompts from "prompts";

export interface ProjectConfig {
  prisma: boolean;
  reactQuery: boolean;
  axios: boolean;
  ui: "shadcn" | "heroui" | "both" | "none";
  framerMotion: boolean;
  lucide: boolean;
  examples: "crud" | "auth" | "both" | "none";
  docker: boolean;
  ci: boolean;
  husky: boolean;
  vitest: boolean;
  playwright: boolean;
  storybook: boolean;

  forms: boolean;
  intl: boolean;
  license: "MIT" | "Apache" | "none";
  auth: "next-auth" | "clerk" | "none";
}

export async function initialPrompt(
  options: Partial<ProjectConfig> = {}
): Promise<ProjectConfig> {
  const defaults: ProjectConfig = {
    prisma: false,
    reactQuery: false,
    axios: false,
    ui: "none",
    framerMotion: false,
    lucide: true,
    examples: "none",
    docker: false,
    ci: false,
    husky: false,
    vitest: false,
    playwright: false,
    storybook: false,
    forms: false,
    intl: false,
    license: "none",
    auth: "none",
    ...options,
  };

  const response = await prompts(
    [
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
      {
        type: options.docker !== undefined ? null : "confirm",
        name: "docker",
        message: "Generate Dockerfile for containerization?",
        initial: false,
      },
      {
        type: options.ci !== undefined ? null : "confirm",
        name: "ci",
        message: "Add GitHub Actions CI workflow?",
        initial: true,
      },
      {
        type: options.husky !== undefined ? null : "confirm",
        name: "husky",
        message: "Setup Husky and Lint-staged for code quality?",
        initial: true,
      },
      {
        type: options.vitest !== undefined ? null : "confirm",
        name: "vitest",
        message: "Install Vitest & React Testing Library?",
        initial: false,
      },
      {
        type: options.playwright !== undefined ? null : "confirm",
        name: "playwright",
        message: "Install Playwright for E2E testing?",
        initial: false,
      },
      {
        type: options.storybook !== undefined ? null : "confirm",
        name: "storybook",
        message: "Initialize Storybook?",
        initial: false,
      },

      {
        type: options.forms !== undefined ? null : "confirm",
        name: "forms",
        message: "Setup Forms (React Hook Form + Zod)?",
        initial: true,
      },
      {
        type: options.intl !== undefined ? null : "confirm",
        name: "intl",
        message: "Add Internationalization (next-intl)?",
        initial: false,
      },
      {
        type: options.license !== undefined ? null : "select",
        name: "license",
        message: "Choose a license for your project:",
        choices: [
          { title: "MIT", value: "MIT" },
          { title: "Apache 2.0", value: "Apache" },
          { title: "None", value: "none" },
        ],
      },

      {
        type: options.auth !== undefined ? null : "select",
        name: "auth",
        message: "Authentication Provider:",
        choices: [
          { title: "Auth.js (NextAuth)", value: "next-auth" },
          { title: "Clerk", value: "clerk" },
          { title: "None", value: "none" },
        ],
      },
    ],
    {
      onCancel: () => {
        console.log("\nOperation cancelled by user.");
        process.exit(0);
      },
    }
  );

  return { ...defaults, ...response };
}
