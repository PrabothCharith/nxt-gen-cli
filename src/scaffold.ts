import path from "path";
import fs from "fs-extra";
import { ProjectConfig } from "./prompts";
import { runCommand } from "./lib/utils";
import chalk from "chalk";
import ora from "ora";
import {
  prismaSchema,
  prismaClient,
  axiosClient,
  queryProvider,
  providersComponent,
} from "./templates/base";
import { exampleApiHandler, examplePage } from "./templates/examples";
import {
  nextAuthFile,
  nextAuthRoute,
  nextAuthMiddleware,
  clerkMiddleware,
} from "./templates/auth";
import { profileFormExample } from "./templates/forms";
import {
  i18nRequest,
  i18nMiddleware,
  englishMessages,
  germanMessages,
} from "./templates/i18n";

export const scaffoldProject = async (
  projectName: string,
  config: ProjectConfig
) => {
  const projectPath = path.resolve(process.cwd(), projectName);

  console.log(
    chalk.blue(`\nInitializing Next.js project in ${projectName}...\n`)
  );

  await runCommand(
    "npx",
    [
      "create-next-app@latest",
      projectName,
      "--typescript",
      "--tailwind",
      "--eslint",
      "--app",
      "--src-dir",
      "--import-alias",
      "@/*",
      "--use-npm",
    ],
    process.cwd()
  );

  await cleanupDefaultFiles(projectPath);

  if (config.prisma) await setupPrisma(projectPath);
  if (config.reactQuery) await setupReactQuery(projectPath);
  if (config.axios) await setupAxios(projectPath);

  if (config.auth !== "none") await setupAuth(projectPath, config);
  if (config.forms) await setupForms(projectPath, config);
  if (config.i18n) await setupI18n(projectPath, config);

  await setupUI(projectPath, config.ui);

  if (config.framerMotion) await setupFramerMotion(projectPath);
  if (config.lucide) await setupLucide(projectPath);

  if (config.examples !== "none") {
    await setupExamples(projectPath, config);
  }

  await setupProviders(projectPath, config);

  if (config.unitTesting) await setupUnitTesting(projectPath);
  if (config.e2eTesting) await setupE2ETesting(projectPath);
  if (config.codeQuality) await setupCodeQuality(projectPath);

  console.log(chalk.green(`\nSuccessfully created project ${projectName}!\n`));
  console.log(chalk.cyan(`Created by Praboth Charith (https://praboth.me)\n`));
};

async function cleanupDefaultFiles(projectPath: string) {
  const pagePath = path.join(projectPath, "src/app/page.tsx");
  await fs.writeFile(
    pagePath,
    `
export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1 className="text-4xl font-bold">Welcome to ${path.basename(
        projectPath
      )}</h1>
    </div>
  );
}
`
  );

  // const cssPath = path.join(projectPath, 'src/app/globals.css');
  // await fs.writeFile(cssPath, `
  // @tailwind base;
  // @tailwind components;
  // @tailwind utilities;
  // `);

  await fs.remove(path.join(projectPath, "public/next.svg"));
  await fs.remove(path.join(projectPath, "public/vercel.svg"));
}

async function setupPrisma(projectPath: string) {
  const spinner = ora("Setting up Prisma...").start();
  await runCommand("npm", ["install", "prisma", "--save-dev"], projectPath);
  await runCommand("npm", ["install", "@prisma/client"], projectPath);
  await runCommand("npx", ["prisma", "init"], projectPath);

  await fs.writeFile(
    path.join(projectPath, "prisma/schema.prisma"),
    prismaSchema
  );
  await fs.ensureDir(path.join(projectPath, "src/lib"));
  await fs.writeFile(path.join(projectPath, "src/lib/prisma.ts"), prismaClient);

  spinner.succeed("Prisma setup complete");
}

async function setupReactQuery(projectPath: string) {
  const spinner = ora("Setting up React Query...").start();
  await runCommand("npm", ["install", "@tanstack/react-query"], projectPath);

  await fs.ensureDir(path.join(projectPath, "src/components/providers"));
  await fs.writeFile(
    path.join(projectPath, "src/components/providers/query-provider.tsx"),
    queryProvider
  );

  spinner.succeed("React Query setup complete");
}

async function setupAxios(projectPath: string) {
  const spinner = ora("Setting up Axios...").start();
  await runCommand("npm", ["install", "axios"], projectPath);

  await fs.ensureDir(path.join(projectPath, "src/lib"));
  await fs.writeFile(path.join(projectPath, "src/lib/axios.ts"), axiosClient);

  spinner.succeed("Axios setup complete");
}

async function setupUI(projectPath: string, ui: string) {
  if (ui === "none") return;
  const spinner = ora(`Setting up UI (${ui})...`).start();

  if (ui === "shadcn" || ui === "both") {
    await runCommand(
      "npm",
      [
        "install",
        "class-variance-authority",
        "clsx",
        "tailwind-merge",
        "lucide-react",
      ],
      projectPath
    );

    await fs.ensureDir(path.join(projectPath, "src/lib"));
    await fs.writeFile(
      path.join(projectPath, "src/lib/utils.ts"),
      `
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`
    );
  }

  if (ui === "heroui" || ui === "both") {
    const installArgs = ["install", "@heroui/react", "framer-motion"];
    await runCommand("npm", installArgs, projectPath);

    // Handle Tailwind Config (v4 might not include it)
    const tailwindConfigPath = path.join(projectPath, "tailwind.config.ts");
    const configExists = await fs.pathExists(tailwindConfigPath);

    if (!configExists) {
      // Create a fresh config compatible with HeroUI
      await fs.writeFile(
        tailwindConfigPath,
        `
import type { Config } from "tailwindcss";
import {heroui} from '@heroui/react';

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [heroui()],
};
export default config;
`
      );
    } else {
      let tailwindConfig = await fs.readFile(tailwindConfigPath, "utf-8");

      // Add import
      if (!tailwindConfig.includes("@heroui/react")) {
        tailwindConfig =
          "import {heroui} from '@heroui/react';\n" + tailwindConfig;
      }

      // Add plugin
      if (tailwindConfig.includes("plugins: [")) {
        if (!tailwindConfig.includes("heroui()")) {
          tailwindConfig = tailwindConfig.replace(
            "plugins: [",
            "plugins: [heroui(),"
          );
        }
      } else {
        console.warn(
          "Could not inject HeroUI plugin into tailwind.config.ts automatically. Please check manually."
        );
      }

      // Add content
      if (tailwindConfig.includes("content: [")) {
        if (!tailwindConfig.includes("@heroui/theme")) {
          tailwindConfig = tailwindConfig.replace(
            "content: [",
            'content: [\n    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",'
          );
        }
      }

      await fs.writeFile(tailwindConfigPath, tailwindConfig);
    }
  }
  spinner.succeed("UI setup complete");
}

async function setupFramerMotion(projectPath: string) {
  await runCommand("npm", ["install", "framer-motion"], projectPath);
}

async function setupLucide(projectPath: string) {
  await runCommand("npm", ["install", "lucide-react"], projectPath);
}

async function setupExamples(projectPath: string, config: ProjectConfig) {
  // If CRUD example
  if (config.examples === "crud" || config.examples === "both") {
    // API Route
    await fs.ensureDir(path.join(projectPath, "src/app/api/posts"));
    await fs.writeFile(
      path.join(projectPath, "src/app/api/posts/route.ts"),
      exampleApiHandler(config.prisma)
    );

    // Page
    await fs.ensureDir(path.join(projectPath, "src/app/posts"));
    await fs.writeFile(
      path.join(projectPath, "src/app/posts/page.tsx"),
      examplePage(config.reactQuery, config.axios)
    );
  }

  // Auth example (Basic skeleton)
  if (config.examples === "auth" || config.examples === "both") {
    // Just a placeholder page
    await fs.ensureDir(path.join(projectPath, "src/app/auth"));
    await fs.writeFile(
      path.join(projectPath, "src/app/auth/page.tsx"),
      `
export default function AuthPage() {
    return <div>Auth Page Placeholder (Extend with NextAuth/Clerk)</div>
}
`
    );
  }
}

async function setupProviders(projectPath: string, config: ProjectConfig) {
  // 1. Write providers component
  await fs.ensureDir(path.join(projectPath, "src/components"));
  await fs.writeFile(
    path.join(projectPath, "src/components/providers.tsx"),
    providersComponent(config)
  );

  // 2. Wrap layout
  const layoutPath = path.join(projectPath, "src/app/layout.tsx");
  let layoutContent = await fs.readFile(layoutPath, "utf-8");

  // Add import
  layoutContent =
    "import { Providers } from '@/components/providers';\n" + layoutContent;

  // Wrap children
  // This is simple string replacement. A valid layout usually has {children} inside body.
  layoutContent = layoutContent.replace(
    "{children}",
    "<Providers>{children}</Providers>"
  );

  await fs.writeFile(layoutPath, layoutContent);
}

async function setupUnitTesting(projectPath: string) {
  const spinner = ora("Setting up Vitest & React Testing Library...").start();

  await runCommand(
    "npm",
    [
      "install",
      "vitest",
      "@vitejs/plugin-react",
      "@testing-library/react",
      "@testing-library/dom",
      "@testing-library/jest-dom",
      "jsdom",
      "--save-dev",
    ],
    projectPath
  );

  // vital.config.ts
  await fs.writeFile(
    path.join(projectPath, "vitest.config.ts"),
    `
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'
 
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/tests/setup.ts',
    alias: {
        '@': path.resolve(__dirname, './src')
    }
  },
})
`
  );

  // setup file
  await fs.ensureDir(path.join(projectPath, "src/tests"));
  await fs.writeFile(
    path.join(projectPath, "src/tests/setup.ts"),
    `
import '@testing-library/jest-dom'
`
  );

  // Add script to package.json
  const packageJsonPath = path.join(projectPath, "package.json");
  const packageJson = await fs.readJson(packageJsonPath);
  packageJson.scripts.test = "vitest";
  packageJson.scripts["test:watch"] = "vitest";
  packageJson.scripts["test:ui"] = "vitest --ui";
  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

  spinner.succeed("Unit testing setup complete");
}

async function setupE2ETesting(projectPath: string) {
  const spinner = ora("Setting up Playwright...").start();

  // We can't easily run 'npm init playwright' non-interactively without side effects sometimes,
  // so we'll install manually and write the config.

  await runCommand(
    "npm",
    ["install", "@playwright/test", "--save-dev"],
    projectPath
  );

  await fs.writeFile(
    path.join(projectPath, "playwright.config.ts"),
    `
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
`
  );

  await fs.ensureDir(path.join(projectPath, "e2e"));
  await fs.writeFile(
    path.join(projectPath, "e2e/example.spec.ts"),
    `
import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Create Next App/);
});
`
  );

  // Add scripts
  const packageJsonPath = path.join(projectPath, "package.json");
  const packageJson = await fs.readJson(packageJsonPath);
  packageJson.scripts["test:e2e"] = "playwright test";
  packageJson.scripts["test:e2e:ui"] = "playwright test --ui";
  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

  spinner.succeed("E2E testing setup complete");
}

async function setupCodeQuality(projectPath: string) {
  const spinner = ora("Setting up Husky & Lint-staged...").start();

  await runCommand(
    "npm",
    ["install", "husky", "lint-staged", "--save-dev"],
    projectPath
  );

  // Initialize husky
  await runCommand("npx", ["husky", "init"], projectPath);

  // Create pre-commit hook
  // 'husky init' creates .husky/pre-commit with "npm test". We want lint-staged.
  await fs.writeFile(
    path.join(projectPath, ".husky/pre-commit"),
    "npx lint-staged\n"
  );

  // Add lint-staged config to package.json
  const packageJsonPath = path.join(projectPath, "package.json");
  const packageJson = await fs.readJson(packageJsonPath);
  packageJson["lint-staged"] = {
    "*.{js,ts,jsx,tsx}": [
      "eslint --fix",
      "prettier --write", // Assuming prettier might be there, or just eslint
    ],
  };
  // Ensure prettier is installed if we use it, but for now let's just stick to what we know is there + safe defaults
  // Safe default for next.js is just next lint
  packageJson["lint-staged"] = {
    "*.{ts,tsx}": ["eslint --fix"],
  };

  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

  spinner.succeed("Code quality setup complete");
}

async function setupAuth(projectPath: string, config: ProjectConfig) {
  const spinner = ora("Setting up Authentication...").start();

  if (config.auth === "next-auth") {
    await runCommand("npm", ["install", "next-auth@beta"], projectPath);

    // auth.ts
    await fs.writeFile(path.join(projectPath, "src/auth.ts"), nextAuthFile);

    // API route
    await fs.ensureDir(
      path.join(projectPath, "src/app/api/auth/[...nextauth]")
    );
    await fs.writeFile(
      path.join(projectPath, "src/app/api/auth/[...nextauth]/route.ts"),
      nextAuthRoute
    );

    // Middleware
    await fs.writeFile(
      path.join(projectPath, "src/middleware.ts"),
      nextAuthMiddleware
    );
  } else if (config.auth === "clerk") {
    await runCommand("npm", ["install", "@clerk/nextjs"], projectPath);

    // Middleware
    await fs.writeFile(
      path.join(projectPath, "src/middleware.ts"),
      clerkMiddleware
    );

    // Wrap layout with ClerkProvider
    const layoutPath = path.join(projectPath, "src/app/layout.tsx");
    let layoutContent = await fs.readFile(layoutPath, "utf-8");

    if (!layoutContent.includes("ClerkProvider")) {
      layoutContent =
        "import { ClerkProvider } from '@clerk/nextjs';\n" + layoutContent;
      // Wrap generic html tag
      layoutContent = layoutContent.replace("<html", "<ClerkProvider>\n<html");
      layoutContent = layoutContent.replace(
        "</html>",
        "</html>\n</ClerkProvider>"
      );

      await fs.writeFile(layoutPath, layoutContent);
    }
  }

  spinner.succeed("Authentication setup complete");
}

async function setupForms(projectPath: string, config: ProjectConfig) {
  const spinner = ora("Setting up Forms & Validation...").start();

  await runCommand(
    "npm",
    ["install", "react-hook-form", "zod", "@hookform/resolvers"],
    projectPath
  );

  await fs.ensureDir(path.join(projectPath, "src/components"));
  await fs.writeFile(
    path.join(projectPath, "src/components/profile-form.tsx"),
    profileFormExample
  );

  spinner.succeed("Forms & Validation setup complete");
}

async function setupI18n(projectPath: string, config: ProjectConfig) {
  const spinner = ora("Setting up Internationalization...").start();
  await runCommand("npm", ["install", "next-intl"], projectPath);

  // 1. Move app files to [locale]
  const appDir = path.join(projectPath, "src/app");
  const localeDir = path.join(appDir, "[locale]");
  await fs.ensureDir(localeDir);

  if (await fs.pathExists(path.join(appDir, "page.tsx"))) {
    await fs.move(
      path.join(appDir, "page.tsx"),
      path.join(localeDir, "page.tsx")
    );
  }

  if (await fs.pathExists(path.join(appDir, "layout.tsx"))) {
    await fs.move(
      path.join(appDir, "layout.tsx"),
      path.join(localeDir, "layout.tsx")
    );

    // Fix imports in new layout file
    // e.g. import ... from "./globals.css" -> "../globals.css"
    // or import { Providers } from "@/components/..." -> this uses alias, so it is fine.
    // Main concern is "./globals.css"

    const newLayoutPath = path.join(localeDir, "layout.tsx");
    let layoutContent = await fs.readFile(newLayoutPath, "utf-8");
    layoutContent = layoutContent.replace(
      '"./globals.css"',
      '"../globals.css"'
    );
    layoutContent = layoutContent.replace(
      "'./globals.css'",
      "'../globals.css'"
    );
    await fs.writeFile(newLayoutPath, layoutContent);
  }

  // 2. Create i18n/request.ts
  await fs.ensureDir(path.join(projectPath, "src/i18n"));
  await fs.writeFile(
    path.join(projectPath, "src/i18n/request.ts"),
    i18nRequest
  );

  // 3. Messages
  await fs.ensureDir(path.join(projectPath, "messages"));
  await fs.writeFile(
    path.join(projectPath, "messages/en.json"),
    englishMessages
  );
  await fs.writeFile(
    path.join(projectPath, "messages/de.json"),
    germanMessages
  );

  // 4. Middleware
  const middlewarePath = path.join(projectPath, "src/middleware.ts");
  if (await fs.pathExists(middlewarePath)) {
    console.warn(
      chalk.yellow(
        "Middleware already exists (from Auth?). Skipped creating i18n middleware. Please manually configure next-intl middleware."
      )
    );
  } else {
    await fs.writeFile(middlewarePath, i18nMiddleware);
  }

  spinner.succeed("Internationalization setup complete");
}
