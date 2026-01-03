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
  prismaConfig,
  axiosClient,
  queryProvider,
  providersComponent,
} from "./templates/base.js";

import {
  exampleApiHandler,
  exampleApiIdHandler,
  examplePage,
  hubPage,
} from "./templates/examples.js";

import { localDbFile } from "./templates/local-db.js";
import {
  drizzleConfig,
  drizzleClient,
  drizzleSchema,
} from "./templates/drizzle.js";
import { dockerfile, ciWorkflow, envExample } from "./templates/devops.js";
import {
  vitestConfig,
  vitestSetup,
  playwrightConfig,
  exampleTest,
  exampleE2E,
} from "./templates/testing.js";
import { generateReadme } from "./templates/readme.js";
import { mitLicense, apacheLicense } from "./templates/docs.js";
import {
  nextAuthFile,
  nextAuthApiRoute,
  clerkMiddleware,
  nextAuthPage,
  clerkAuthPage,
  nextAuthEnv,
  clerkEnv,
} from "./templates/auth.js";
import { formSchema, exampleForm } from "./templates/forms.js";
import { orvalConfig } from "./templates/orval.js";
import { messagesEn, i18nConfig, intlMiddleware } from "./templates/intl.js";
import {
  detectPackageManager,
  getInstallCommand,
  getDlxCommand,
  PackageManager,
} from "./lib/pm.js";
import { addProviderToLayout, configureTailwindForHeroUI } from "./lib/ast.js";
import { DependencyCollector } from "./lib/deps.js";
import prompts from "prompts";

export const scaffoldProject = async (
  projectName: string,
  config: ProjectConfig
) => {
  const projectPath = path.resolve(process.cwd(), projectName);
  const pm = detectPackageManager();
  const deps = new DependencyCollector();

  // Check if directory already exists
  if (await fs.pathExists(projectPath)) {
    console.log(
      chalk.red(
        `\nError: Directory "${projectName}" already exists. Please choose a different name or remove the existing directory.\n`
      )
    );
    process.exit(1);
  }

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
      "--no-turbopack",
      "--no-react-compiler", // Suppress React Compiler prompt
    ],
    process.cwd()
  );

  await cleanupDefaultFiles(projectPath);

  // Generate all files (no installations yet)
  console.log(chalk.blue("\nGenerating project files...\n"));

  if (config.orm === "prisma") await setupPrisma(projectPath, deps);
  if (config.orm === "drizzle") await setupDrizzle(projectPath, deps);
  if (config.reactQuery) await setupReactQuery(projectPath, deps);
  if (config.axios) await setupAxios(projectPath, deps);

  await setupUI(projectPath, config.ui, deps);

  if (config.framerMotion) await setupFramerMotion(projectPath, deps);
  if (config.lucide) await setupLucide(projectPath, deps);

  if (config.examples !== "none") {
    await setupExamples(projectPath, config);
  }

  await setupProviders(projectPath, config);

  if (config.docker || config.ci) await setupDevOps(projectPath, config);

  // Create .env.example (Environment Variables)
  await fs.writeFile(
    path.join(projectPath, ".env.example"),
    envExample(
      config.orm,
      config.examples === "auth" || config.examples === "both"
    )
  );

  if (config.husky) await setupQuality(projectPath, deps);

  if (config.vitest || config.playwright)
    await setupTesting(projectPath, config, deps);

  if (config.storybook) await setupStorybook(projectPath, pm, deps);

  await setupDocumentation(projectPath, config, pm, projectName);

  if (config.auth !== "none") await setupAuth(projectPath, config, deps);
  if (config.forms) await setupForms(projectPath, deps);
  if (config.intl) await setupIntl(projectPath, deps);
  if (config.orval) await setupOrval(projectPath, deps);

  // Batch installation logic
  console.log(chalk.blue("\nFiles generated successfully!"));

  const { deps: regularDeps, devDeps } = deps.getAll();
  const totalDeps = regularDeps.length + devDeps.length;

  if (totalDeps > 0) {
    console.log(chalk.cyan(`\nCollected ${totalDeps} dependencies:`));
    if (regularDeps.length > 0) {
      console.log(
        chalk.white("  Dependencies:"),
        regularDeps.slice(0, 5).join(", ") +
        (regularDeps.length > 5 ? ` +${regularDeps.length - 5} more` : "")
      );
    }
    if (devDeps.length > 0) {
      console.log(
        chalk.white("  Dev Dependencies:"),
        devDeps.slice(0, 5).join(", ") +
        (devDeps.length > 5 ? ` +${devDeps.length - 5} more` : "")
      );
    }

    let shouldInstall = config.install;

    if (shouldInstall === undefined) {
      const response = await prompts(
        {
          type: "confirm",
          name: "shouldInstall",
          message: "Install dependencies now?",
          initial: true,
        },
        {
          onCancel: () => {
            console.log(
              chalk.yellow("\nSkipping installation. To install later:")
            );
            console.log(chalk.cyan(`  cd ${projectName}`));
            console.log(chalk.cyan(`  ${pm} install`));
            process.exit(0);
          },
        }
      );
      shouldInstall = response.shouldInstall;
    }

    if (shouldInstall) {
      const spinner = ora("Installing dependencies...").start();

      try {
        // Install regular dependencies
        if (regularDeps.length > 0) {
          const install = getInstallCommand(pm, regularDeps, false);
          await runCommand(install.command, install.args, projectPath);
        }

        // Install dev dependencies
        if (devDeps.length > 0) {
          const installDev = getInstallCommand(pm, devDeps, true);
          await runCommand(installDev.command, installDev.args, projectPath);
        }

        spinner.succeed("Dependencies installed successfully");

        if (config.orm === "prisma") {
          const prismaSpinner = ora("Generating Prisma Client...").start();
          await runCommand("npx", ["prisma", "generate"], projectPath);
          await runCommand("npx", ["prisma", "db", "push"], projectPath);
          prismaSpinner.succeed("Prisma Client generated and DB pushed");
        }

        if (config.orm === "drizzle") {
          const drizzleSpinner = ora("Pushing Drizzle Schema...").start();
          await runCommand("npx", ["drizzle-kit", "push"], projectPath);
          drizzleSpinner.succeed("Drizzle Schema pushed");
        }

        if (config.playwright) {
          const playwrightSpinner = ora(
            "Installing Playwright browsers..."
          ).start();
          const dlx = getDlxCommand(pm);
          await runCommand(
            dlx.command,
            [...dlx.args, "playwright", "install", "--with-deps"],
            projectPath
          );
          playwrightSpinner.succeed("Playwright browsers installed");
        }
      } catch (error) {
        spinner.fail("Installation failed");
        console.log(chalk.red("\nError:"), error);
        console.log(chalk.yellow("\nYou can install dependencies manually:"));
        console.log(chalk.cyan(`  cd ${projectName}`));
        console.log(chalk.cyan(`  ${pm} install`));
      }
    } else {
      console.log(chalk.yellow("\nSkipping installation. To install later:"));
      console.log(chalk.cyan(`  cd ${projectName}`));
      console.log(chalk.cyan(`  ${pm} install`));
    }
  }

  console.log("\n");

  // Success Message
  console.log(
    boxen(
      chalk.green.bold(" SUCCESS! ") +
      "\n\n" +
      `Your Next.js project ${chalk.cyan.bold(
        projectName
      )} has been created!\n` +
      chalk.gray("━".repeat(60)) +
      "\n\n" +
      chalk.yellow.bold(" Quick Start:\n") +
      chalk.white(
        `  ${chalk.cyan("1.")} cd ${chalk.magenta(projectName)}\n`
      ) +
      chalk.white(
        `  ${chalk.cyan("2.")} ${chalk.magenta(
          pm === "npm" ? "npm run dev" : pm + " dev"
        )}\n`
      ) +
      chalk.white(
        `  ${chalk.cyan("3.")} Open ${chalk.magenta(
          "http://localhost:3000"
        )}\n\n`
      ) +
      chalk.yellow.bold("📦 Useful Commands:\n") +
      chalk.white(
        `  ${chalk.cyan("Build:")}       ${chalk.magenta(
          pm === "npm" ? "npm run build" : pm + " build"
        )}\n`
      ) +
      chalk.white(
        `  ${chalk.cyan("Lint:")}        ${chalk.magenta(
          pm === "npm" ? "npm run lint" : pm + " lint"
        )}\n`
      ) +
      (config.vitest
        ? chalk.white(
          `  ${chalk.cyan("Test:")}        ${chalk.magenta(
            pm === "npm" ? "npm test" : pm + " test"
          )}\n`
        )
        : "") +
      (config.playwright
        ? chalk.white(
          `  ${chalk.cyan("E2E Test:")}    ${chalk.magenta(
            pm === "npm" ? "npm run test:e2e" : pm + " test:e2e"
          )}\n`
        )
        : "") +
      (config.storybook
        ? chalk.white(
          `  ${chalk.cyan("Storybook:")}   ${chalk.magenta(
            pm === "npm" ? "npm run storybook" : pm + " storybook"
          )}\n`
        )
        : "") +
      "\n" +
      chalk.yellow.bold(" Documentation:\n") +
      chalk.white(
        `  ${chalk.cyan("•")} Check out ${chalk.magenta(
          "README.md"
        )} for detailed setup\n`
      ) +
      (config.orm === "prisma" || config.orm === "drizzle"
        ? chalk.white(
          `  ${chalk.cyan("•")} Configure ${chalk.magenta(
            ".env"
          )} for database connection\n`
        )
        : "") +
      (config.auth !== "none"
        ? chalk.white(
          `  ${chalk.cyan("•")} Set up ${chalk.magenta(
            config.auth === "next-auth" ? "NextAuth" : "Clerk"
          )} environment variables\n`
        )
        : "") +
      chalk.white(
        `  ${chalk.cyan("•")} Review ${chalk.magenta(
          ".env.example"
        )} for all config options\n\n`
      ) +
      chalk.yellow.bold(" Pro Tips:\n") +
      chalk.white(
        `  ${chalk.cyan("•")} Star the repo: ${chalk.blue.underline(
          "https://github.com/PrabothCharith/nxt-gen-cli.git"
        )}\n`
      ) +
      chalk.white(
        `  ${chalk.cyan("•")} Report issues or suggest features on GitHub\n`
      ) +
      chalk.white(
        `  ${chalk.cyan(
          "•"
        )} Share your feedback to help improve nxt-gen!\n\n`
      ) +
      chalk.gray("━".repeat(60)) +
      "\n" +
      chalk.white("Happy coding! ") +
      chalk.gray("Built by ") +
      chalk.cyan.bold("Praboth Charith\n") +
      chalk.blue.underline("https://praboth.me"),
      {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "green",
        align: "left",
      }
    )
  );

  // Beautiful ASCII Art Header
  console.log("\n");
  console.log(
    chalk
      .hex("#eb5939")
      .bold(
        "  ╔═════════════════════════════════════════════════════════════════════╗"
      )
  );
  console.log(
    chalk
      .hex("#eb5939")
      .bold(
        "  ║                                                                     ║"
      )
  );
  console.log(
    chalk.hex("#eb5939").bold("  ║     ") +
    chalk
      .hex("#eb5939")
      .bold("███╗   ██╗██╗  ██╗████████╗      ██████╗ ███████╗███╗   ██╗") +
    chalk.hex("#eb5939").bold("     ║")
  );
  console.log(
    chalk.hex("#eb5939").bold("  ║     ") +
    chalk
      .hex("#eb5939")
      .bold("████╗  ██║╚██╗██╔╝╚══██╔══╝     ██╔════╝ ██╔════╝████╗  ██║") +
    chalk.hex("#eb5939").bold("     ║")
  );
  console.log(
    chalk.hex("#eb5939").bold("  ║     ") +
    chalk
      .hex("#eb5939")
      .bold("██╔██╗ ██║ ╚███╔╝    ██║        ██║  ███╗█████╗  ██╔██╗ ██║") +
    chalk.hex("#eb5939").bold("     ║")
  );
  console.log(
    chalk.hex("#eb5939").bold("  ║     ") +
    chalk
      .hex("#eb5939")
      .bold("██║╚██╗██║ ██╔██╗    ██║        ██║   ██║██╔══╝  ██║╚██╗██║") +
    chalk.hex("#eb5939").bold("     ║")
  );
  console.log(
    chalk.hex("#eb5939").bold("  ║     ") +
    chalk
      .hex("#eb5939")
      .bold("██║ ╚████║██╔╝ ██╗   ██║███████╗╚██████╔╝███████╗██║ ╚████║") +
    chalk.hex("#eb5939").bold("     ║")
  );
  console.log(
    chalk.hex("#eb5939").bold("  ║     ") +
    chalk
      .hex("#eb5939")
      .bold("╚═╝  ╚═══╝╚═╝  ╚═╝   ╚═╝╚══════╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝") +
    chalk.hex("#eb5939").bold("     ║")
  );
  console.log(
    chalk
      .hex("#eb5939")
      .bold(
        "  ║                                                                     ║"
      )
  );
  console.log(
    chalk
      .hex("#eb5939")
      .bold(
        "  ╚═════════════════════════════════════════════════════════════════════╝"
      )
  );
  console.log("\n");
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

async function setupPrisma(projectPath: string, deps: DependencyCollector) {
  const spinner = ora("Setting up Prisma...").start();

  deps.addDevDep("prisma@dev");
  deps.addDevDep("dotenv");
  deps.addDep("@prisma/client@dev");
  deps.addDep("@prisma/adapter-libsql");
  deps.addDep("@libsql/client@0.8.1");

  await fs.ensureDir(path.join(projectPath, "prisma"));
  await fs.writeFile(
    path.join(projectPath, "prisma/schema.prisma"),
    prismaSchema
  );

  // Write prisma.config.ts (required for Prisma 7)
  await fs.writeFile(path.join(projectPath, "prisma.config.ts"), prismaConfig);

  await fs.ensureDir(path.join(projectPath, "src/lib"));
  await fs.writeFile(path.join(projectPath, "src/lib/prisma.ts"), prismaClient);

  // Add DATABASE_URL to .env
  const envPath = path.join(projectPath, ".env");
  // Check if .env exists, if not create it
  if (!(await fs.pathExists(envPath))) {
    await fs.writeFile(envPath, "");
  }

  await fs.appendFile(envPath, '\nDATABASE_URL="file:./dev.db"\n');

  spinner.succeed("Prisma setup complete");
}

async function setupDrizzle(projectPath: string, deps: DependencyCollector) {
  const spinner = ora("Setting up Drizzle...").start();

  deps.addDevDep("drizzle-kit");
  deps.addDevDep("dotenv");
  deps.addDep("drizzle-orm");
  deps.addDep("@libsql/client");

  // drizzle.config.ts
  await fs.writeFile(
    path.join(projectPath, "drizzle.config.ts"),
    drizzleConfig
  );

  // src/db/schema.ts
  await fs.ensureDir(path.join(projectPath, "src/db"));
  await fs.writeFile(path.join(projectPath, "src/db/schema.ts"), drizzleSchema);

  // src/lib/db.ts
  await fs.ensureDir(path.join(projectPath, "src/lib"));
  await fs.writeFile(path.join(projectPath, "src/lib/db.ts"), drizzleClient);

  // Add DATABASE_URL to .env
  const envPath = path.join(projectPath, ".env");
  if (!(await fs.pathExists(envPath))) {
    await fs.writeFile(envPath, "");
  }

  await fs.appendFile(envPath, '\nDATABASE_URL="file:./dev.db"\n');

  spinner.succeed("Drizzle setup complete");
}

async function setupReactQuery(projectPath: string, deps: DependencyCollector) {
  const spinner = ora("Setting up React Query...").start();

  deps.addDep("@tanstack/react-query");

  await fs.ensureDir(path.join(projectPath, "src/components/providers"));
  await fs.writeFile(
    path.join(projectPath, "src/components/providers/query-provider.tsx"),
    queryProvider
  );

  spinner.succeed("React Query setup complete");
}

async function setupAxios(projectPath: string, deps: DependencyCollector) {
  const spinner = ora("Setting up Axios...").start();

  deps.addDep("axios");

  await fs.ensureDir(path.join(projectPath, "src/lib"));
  await fs.writeFile(path.join(projectPath, "src/lib/axios.ts"), axiosClient);

  spinner.succeed("Axios setup complete");
}

async function setupUI(
  projectPath: string,
  ui: string,
  deps: DependencyCollector
) {
  if (ui === "none") return;
  const spinner = ora(`Setting up UI (${ui})...`).start();

  if (ui === "shadcn" || ui === "both") {
    deps.addDeps([
      "class-variance-authority",
      "clsx",
      "tailwind-merge",
      "lucide-react",
    ]);

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
    deps.addDeps(["@heroui/react", "framer-motion"]);

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

async function setupFramerMotion(
  projectPath: string,
  deps: DependencyCollector
) {
  deps.addDep("framer-motion");
}

async function setupLucide(projectPath: string, deps: DependencyCollector) {
  deps.addDep("lucide-react");
}

async function setupExamples(projectPath: string, config: ProjectConfig) {
  // If CRUD example
  if (config.examples === "crud" || config.examples === "both") {
    // Setup Local DB if not using an ORM
    if (config.orm === "none") {
      await fs.ensureDir(path.join(projectPath, "src/lib"));
      await fs.writeFile(path.join(projectPath, "src/lib/db.ts"), localDbFile);
    }

    // API Route
    await fs.ensureDir(path.join(projectPath, "src/app/api/posts"));
    await fs.writeFile(
      path.join(projectPath, "src/app/api/posts/route.ts"),
      exampleApiHandler(config.orm)
    );

    // Dynamic API Route ([id])
    await fs.ensureDir(path.join(projectPath, "src/app/api/posts/[id]"));
    await fs.writeFile(
      path.join(projectPath, "src/app/api/posts/[id]/route.ts"),
      exampleApiIdHandler(config.orm)
    );

    // Page
    await fs.ensureDir(path.join(projectPath, "src/app/posts"));
    await fs.writeFile(
      path.join(projectPath, "src/app/posts/page.tsx"),
      examplePage(config.reactQuery, config.axios)
    );
  }

  // Auth example
  if (config.examples === "auth" || config.examples === "both") {
    await fs.ensureDir(path.join(projectPath, "src/app/auth"));

    let pageContent = "";
    if (config.auth === "next-auth") {
      pageContent = nextAuthPage;
    } else if (config.auth === "clerk") {
      pageContent = clerkAuthPage;
    } else {
      // Fallback if no auth provider selected but example requested
      pageContent = `
export default function AuthPage() {
    return <div>Please select an authentication provider (NextAuth or Clerk) to view this example.</div>
}
`;
    }

    await fs.writeFile(
      path.join(projectPath, "src/app/auth/page.tsx"),
      pageContent
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

  // Dynamic Home Page Generation
  // If examples are selected, we overwrite the default page.tsx with the appropriate entry point
  if (config.examples && config.examples !== "none") {
    let homePageContent = "";

    if (config.examples === "auth" && config.auth !== "none") {
      // Auth Only: Show Auth Dashboard as Home
      if (config.auth === "next-auth") {
        homePageContent = nextAuthPage; // This now has callbackUrl=/
      } else if (config.auth === "clerk") {
        homePageContent = clerkAuthPage;
      }
    } else if (config.examples === "crud") {
      // CRUD Only: Show Posts Manager as Home
      homePageContent = examplePage(config.reactQuery, config.axios);
    } else if (config.examples === "both") {
      // Both: Show Hub Page
      homePageContent = hubPage;
    }

    if (homePageContent) {
      // We overwrite the existing page.tsx
      await fs.writeFile(
        path.join(projectPath, "src/app/page.tsx"),
        homePageContent
      );
    }
  }

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

async function setupQuality(projectPath: string, deps: DependencyCollector) {
  const spinner = ora("Setting up Code Quality tools...").start();

  deps.addDevDeps(["husky", "lint-staged"]);

  // Setup lint-staged in package.json
  const packageJsonPath = path.join(projectPath, "package.json");
  const pkg = await fs.readJson(packageJsonPath);

  pkg["lint-staged"] = {
    "*.{ts,tsx}": "eslint --cache --fix",
  };

  // Add prepare script for Husky
  if (!pkg.scripts) pkg.scripts = {};
  pkg.scripts.prepare = "husky";

  await fs.writeJson(packageJsonPath, pkg, { spaces: 2 });

  // Create Husky directory and pre-commit hook
  await fs.ensureDir(path.join(projectPath, ".husky"));
  await fs.writeFile(
    path.join(projectPath, ".husky/pre-commit"),
    "npx lint-staged\n"
  );

  spinner.succeed("Code Quality tools setup complete");
}

async function setupTesting(
  projectPath: string,
  config: ProjectConfig,
  deps: DependencyCollector
) {
  const spinner = ora("Setting up Testing environment...").start();

  if (config.vitest) {
    deps.addDevDeps([
      "vitest",
      "@vitejs/plugin-react",
      "jsdom",
      "@testing-library/react",
      "@testing-library/jest-dom",
    ]);

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
    deps.addDevDep("@playwright/test");

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

async function setupStorybook(
  projectPath: string,
  pm: PackageManager,
  deps: DependencyCollector
) {
  const spinner = ora("Setting up Storybook...").start();

  try {
    const dlx = getDlxCommand(pm);
    // --yes to skip prompts, --skip-install to prevent double installation
    await runCommand(
      dlx.command,
      [...dlx.args, "storybook@latest", "init", "--yes", "--skip-install"],
      projectPath
    );

    // Install dependencies manually
    const install = getInstallCommand(pm, [], false);
    await runCommand(install.command, install.args, projectPath);

    spinner.succeed("Storybook setup complete");
  } catch (error) {
    spinner.warn("Storybook setup skipped (requires manual setup)");
    console.log(
      chalk.yellow(
        "\nTo set up Storybook manually, run:\n" +
        `  cd ${path.basename(projectPath)}\n` +
        `  npx storybook@latest init\n`
      )
    );
  }
}

async function setupDocumentation(
  projectPath: string,
  config: ProjectConfig,
  pm: PackageManager,
  projectName: string
) {
  const spinner = ora("Generating documentation...").start();

  // README
  await fs.writeFile(
    path.join(projectPath, "README.md"),
    generateReadme(projectName, pm, config)
  );

  // LICENSE
  const year = new Date().getFullYear();
  const author = "The Authors";

  if (config.license === "MIT") {
    await fs.writeFile(
      path.join(projectPath, "LICENSE"),
      mitLicense(year, author)
    );
  } else if (config.license === "Apache") {
    await fs.writeFile(
      path.join(projectPath, "LICENSE"),
      apacheLicense(year, author)
    );
  }

  spinner.succeed("Documentation generated");
}

async function setupAuth(
  projectPath: string,
  config: ProjectConfig,
  deps: DependencyCollector
) {
  const spinner = ora("Setting up Authentication...").start();

  if (config.auth === "next-auth") {
    deps.addDep("next-auth");

    // Files
    await fs.ensureDir(path.join(projectPath, "src/lib"));
    await fs.writeFile(path.join(projectPath, "src/lib/auth.ts"), nextAuthFile);

    await fs.ensureDir(
      path.join(projectPath, "src/app/api/auth/[...nextauth]")
    );
    await fs.writeFile(
      path.join(projectPath, "src/app/api/auth/[...nextauth]/route.ts"),
      nextAuthApiRoute
    );

    // Env
    await fs.appendFile(path.join(projectPath, ".env"), nextAuthEnv);
    await fs.appendFile(path.join(projectPath, ".env.example"), nextAuthEnv);
  } else if (config.auth === "clerk") {
    deps.addDep("@clerk/nextjs");

    // Middleware
    await fs.writeFile(
      path.join(projectPath, "src/middleware.ts"),
      clerkMiddleware
    );

    // Env
    await fs.appendFile(path.join(projectPath, ".env"), clerkEnv);
    await fs.appendFile(path.join(projectPath, ".env.example"), clerkEnv);
  }

  spinner.succeed("Authentication setup setup complete");
}

async function setupForms(projectPath: string, deps: DependencyCollector) {
  const spinner = ora("Setting up Forms & Validation...").start();

  deps.addDeps(["react-hook-form", "zod", "@hookform/resolvers"]);

  await fs.ensureDir(path.join(projectPath, "src/lib"));
  await fs.writeFile(path.join(projectPath, "src/lib/schemas.ts"), formSchema);

  await fs.ensureDir(path.join(projectPath, "src/components/examples"));
  await fs.writeFile(
    path.join(projectPath, "src/components/examples/contact-form.tsx"),
    exampleForm
  );

  spinner.succeed("Forms & Validation setup complete");
}

async function setupIntl(projectPath: string, deps: DependencyCollector) {
  const spinner = ora("Setting up Internationalization...").start();

  deps.addDep("next-intl");

  // Messages
  await fs.ensureDir(path.join(projectPath, "messages"));
  await fs.writeFile(path.join(projectPath, "messages/en.json"), messagesEn);

  // Config
  await fs.ensureDir(path.join(projectPath, "src"));
  await fs.writeFile(path.join(projectPath, "src/i18n.ts"), i18nConfig);

  // Middleware
  await fs.writeFile(
    path.join(projectPath, "src/middleware.ts"),
    intlMiddleware
  );

  spinner.succeed("Internationalization setup complete");
}

async function setupOrval(projectPath: string, deps: DependencyCollector) {
  const spinner = ora("Setting up Orval...").start();

  deps.addDevDep("orval");

  await fs.writeFile(
    path.join(projectPath, "orval.config.ts"),
    orvalConfig
  );

  // Add gen script
  const packageJsonPath = path.join(projectPath, "package.json");
  const pkg = await fs.readJson(packageJsonPath);
  if (!pkg.scripts) pkg.scripts = {};
  pkg.scripts.gen = "orval";
  await fs.writeJson(packageJsonPath, pkg, { spaces: 2 });

  spinner.succeed("Orval setup complete");
}
