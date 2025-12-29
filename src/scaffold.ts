import path from "path";
import fs from "fs-extra";
import { ProjectConfig } from "./prompts.js";
import { runCommand } from "./lib/utils.js";
import chalk from "chalk";
import ora from "ora";
import boxen from "boxen";
import {
  prismaSchema,
  prismaClient,
  axiosClient,
  queryProvider,
  providersComponent,
} from "./templates/base.js";

import { exampleApiHandler, examplePage } from "./templates/examples.js";
import { dockerfile, ciWorkflow, envExample } from "./templates/devops.js";
import {
  vitestConfig,
  vitestSetup,
  playwrightConfig,
  exampleTest,
  exampleE2E,
} from "./templates/testing.js";
import {
  detectPackageManager,
  getInstallCommand,
  getDlxCommand,
  PackageManager,
} from "./lib/pm.js";
import { addProviderToLayout, configureTailwindForHeroUI } from "./lib/ast.js";

export const scaffoldProject = async (
  projectName: string,
  config: ProjectConfig
) => {
  const projectPath = path.resolve(process.cwd(), projectName);
  const pm = detectPackageManager();

  console.log(
    chalk.blue(
      `\nInitializing Next.js project in ${projectName} using ${pm}...\n`
    )
  );

  const { command: dlxCmd, args: dlxArgs } = getDlxCommand(pm);

  await runCommand(
    dlxCmd,
    [
      ...dlxArgs,
      "create-next-app@latest",
      projectName,
      "--typescript",
      "--tailwind",
      "--eslint",
      "--app",
      "--src-dir",
      "--import-alias",
      "@/*",
      `--use-${pm}`,
    ],
    process.cwd()
  );

  await cleanupDefaultFiles(projectPath);

  if (config.prisma) await setupPrisma(projectPath, pm);
  if (config.reactQuery) await setupReactQuery(projectPath, pm);
  if (config.axios) await setupAxios(projectPath, pm);

  await setupUI(projectPath, config.ui, pm);

  if (config.framerMotion) await setupFramerMotion(projectPath, pm);
  if (config.lucide) await setupLucide(projectPath, pm);

  if (config.examples !== "none") {
    await setupExamples(projectPath, config);
  }

  await setupProviders(projectPath, config);

  if (config.docker || config.ci) await setupDevOps(projectPath, config);

  // Create .env.example (Environment Variables)
  await fs.writeFile(
    path.join(projectPath, ".env.example"),
    envExample(
      config.prisma,
      config.examples === "auth" || config.examples === "both"
    )
  );

  if (config.husky) await setupQuality(projectPath, pm);

  if (config.vitest || config.playwright)
    await setupTesting(projectPath, config, pm);
  if (config.storybook) await setupStorybook(projectPath, pm);

  console.log(
    boxen(
      `${chalk.green.bold("Success!")} Project ${chalk.cyan(
        projectName
      )} created.\n\n` +
        `${chalk.yellow("Next steps:")}\n` +
        `  cd ${projectName}\n` +
        `  ${pm === "npm" ? "npm run dev" : pm + " dev"}`,
      {
        padding: 1,
        margin: 1,
        borderStyle: "double",
        borderColor: "green",
      }
    )
  );

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

async function setupPrisma(projectPath: string, pm: PackageManager) {
  const spinner = ora("Setting up Prisma...").start();

  const installDev = getInstallCommand(pm, ["prisma"], true);
  await runCommand(installDev.command, installDev.args, projectPath);

  const installClient = getInstallCommand(pm, ["@prisma/client"], false);
  await runCommand(installClient.command, installClient.args, projectPath);

  const dlx = getDlxCommand(pm);
  await runCommand(dlx.command, [...dlx.args, "prisma", "init"], projectPath);

  await fs.writeFile(
    path.join(projectPath, "prisma/schema.prisma"),
    prismaSchema
  );
  await fs.ensureDir(path.join(projectPath, "src/lib"));
  await fs.writeFile(path.join(projectPath, "src/lib/prisma.ts"), prismaClient);

  spinner.succeed("Prisma setup complete");
}

async function setupReactQuery(projectPath: string, pm: PackageManager) {
  const spinner = ora("Setting up React Query...").start();

  const install = getInstallCommand(pm, ["@tanstack/react-query"], false);
  await runCommand(install.command, install.args, projectPath);

  await fs.ensureDir(path.join(projectPath, "src/components/providers"));
  await fs.writeFile(
    path.join(projectPath, "src/components/providers/query-provider.tsx"),
    queryProvider
  );

  spinner.succeed("React Query setup complete");
}

async function setupAxios(projectPath: string, pm: PackageManager) {
  const spinner = ora("Setting up Axios...").start();

  const install = getInstallCommand(pm, ["axios"], false);
  await runCommand(install.command, install.args, projectPath);

  await fs.ensureDir(path.join(projectPath, "src/lib"));
  await fs.writeFile(path.join(projectPath, "src/lib/axios.ts"), axiosClient);

  spinner.succeed("Axios setup complete");
}

async function setupUI(projectPath: string, ui: string, pm: PackageManager) {
  if (ui === "none") return;
  const spinner = ora(`Setting up UI (${ui})...`).start();

  if (ui === "shadcn" || ui === "both") {
    const install = getInstallCommand(
      pm,
      ["class-variance-authority", "clsx", "tailwind-merge", "lucide-react"],
      false
    );
    await runCommand(install.command, install.args, projectPath);

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
    const install = getInstallCommand(
      pm,
      ["@heroui/react", "framer-motion"],
      false
    );
    await runCommand(install.command, install.args, projectPath);

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
      await configureTailwindForHeroUI(projectPath);
    }
  }
  spinner.succeed("UI setup complete");
}

async function setupFramerMotion(projectPath: string, pm: PackageManager) {
  const install = getInstallCommand(pm, ["framer-motion"], false);
  await runCommand(install.command, install.args, projectPath);
}

async function setupLucide(projectPath: string, pm: PackageManager) {
  const install = getInstallCommand(pm, ["lucide-react"], false);
  await runCommand(install.command, install.args, projectPath);
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

  // 2. Wrap layout using AST
  await addProviderToLayout(projectPath);
}

async function setupDevOps(projectPath: string, config: ProjectConfig) {
  const spinner = ora("Setting up DevOps...").start();

  if (config.docker) {
    await fs.writeFile(path.join(projectPath, "Dockerfile"), dockerfile);
    // Add .dockerignore
    await fs.writeFile(
      path.join(projectPath, ".dockerignore"),
      `Dockerfile
.dockerignore
node_modules
npm-debug.log
README.md
.next
.git`
    );
  }

  if (config.ci) {
    await fs.ensureDir(path.join(projectPath, ".github/workflows"));
    await fs.writeFile(
      path.join(projectPath, ".github/workflows/ci.yml"),
      ciWorkflow
    );
  }

  spinner.succeed("DevOps setup complete");
}

async function setupQuality(projectPath: string, pm: PackageManager) {
  const spinner = ora("Setting up Code Quality tools...").start();

  // Install husky and lint-staged
  const installDeps = getInstallCommand(pm, ["husky", "lint-staged"], true);
  await runCommand(installDeps.command, installDeps.args, projectPath);

  // Initialize Husky
  if (pm === "npm") {
    await runCommand("npx", ["husky", "init"], projectPath);
  } else {
    // pnpm dlx husky init, etc.
    // husky init updates package.json scripts "prepare": "husky" and creates .husky/pre-commit
    const dlx = getDlxCommand(pm);
    await runCommand(dlx.command, [...dlx.args, "husky", "init"], projectPath);
  }

  // Setup lint-staged in package.json
  const packageJsonPath = path.join(projectPath, "package.json");
  const pkg = await fs.readJson(packageJsonPath);

  // Let's just use "next lint" or "eslint"
  pkg["lint-staged"] = {
    "*.{ts,tsx}": "eslint --cache --fix",
  };

  await fs.writeJson(packageJsonPath, pkg, { spaces: 2 });

  // Add pre-commit hook content for lint-staged
  // husky init creates 'npm test' in pre-commit by default in v9
  const preCommitPath = path.join(projectPath, ".husky/pre-commit");
  await fs.writeFile(preCommitPath, "npx lint-staged");

  spinner.succeed("Code Quality tools setup complete");
}

async function setupTesting(
  projectPath: string,
  config: ProjectConfig,
  pm: PackageManager
) {
  const spinner = ora("Setting up Testing environment...").start();

  if (config.vitest) {
    const installDev = getInstallCommand(
      pm,
      [
        "vitest",
        "@vitejs/plugin-react",
        "jsdom",
        "@testing-library/react",
        "@testing-library/jest-dom",
      ],
      true
    );
    await runCommand(installDev.command, installDev.args, projectPath);

    await fs.writeFile(
      path.join(projectPath, "vitest.config.ts"),
      vitestConfig
    );
    await fs.writeFile(path.join(projectPath, "vitest.setup.ts"), vitestSetup);

    // Add test script
    const pkgPath = path.join(projectPath, "package.json");
    const pkg = await fs.readJson(pkgPath);
    pkg.scripts.test = "vitest";
    await fs.writeJson(pkgPath, pkg, { spaces: 2 });

    // Example test
    await fs.ensureDir(path.join(projectPath, "__tests__"));
    await fs.writeFile(
      path.join(projectPath, "__tests__/page.test.tsx"),
      exampleTest
    );
  }

  if (config.playwright) {
    // pnpm create playwright or init?
    // Using 'npm init playwright@latest' is interactive.
    // We should manually scaffold basic configs to avoid prompts or use --yes/--quiet if possible.
    // Installing deps manually and writing config is safer for non-interactive.

    const installDev = getInstallCommand(pm, ["@playwright/test"], true);
    await runCommand(installDev.command, installDev.args, projectPath);

    // Install browsers
    const dlx = getDlxCommand(pm);
    await runCommand(
      dlx.command,
      [...dlx.args, "playwright", "install", "--with-deps"],
      projectPath
    );

    await fs.writeFile(
      path.join(projectPath, "playwright.config.ts"),
      playwrightConfig
    );

    await fs.ensureDir(path.join(projectPath, "e2e"));
    await fs.writeFile(
      path.join(projectPath, "e2e/example.spec.ts"),
      exampleE2E
    );

    // Add e2e script
    const pkgPath = path.join(projectPath, "package.json");
    const pkg = await fs.readJson(pkgPath);
    pkg.scripts["test:e2e"] = "playwright test";
    await fs.writeJson(pkgPath, pkg, { spaces: 2 });
  }

  spinner.succeed("Testing setup complete");
}

async function setupStorybook(projectPath: string, pm: PackageManager) {
  const spinner = ora("Setting up Storybook...").start();

  // Storybook init is complex and best left to its own CLI.
  // npx storybook@latest init --type nextjs

  const dlx = getDlxCommand(pm);
  // --yes to skip prompts
  await runCommand(
    dlx.command,
    [...dlx.args, "storybook@latest", "init", "--yes"],
    projectPath
  );

  spinner.succeed("Storybook setup complete");
}
