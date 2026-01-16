import { Command } from "commander";
import prompts from "prompts";
import chalk from "chalk";
import path from "path";
import fs from "fs-extra";

import updateNotifier from "update-notifier";
import { createRequire } from "module";
import { initialPrompt } from "./prompts.js";
import { validateProjectName } from "./lib/validation.js";
import { PACKAGE_MANAGERS } from "./lib/pm.js";

const require = createRequire(import.meta.url);
const pkg = require("../package.json");

export async function main() {
  const program = new Command();

  // Update Notifier
  // updateNotifier({ pkg }).notify();
  console.log("CLI Starting...");

  // Banner
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

  program
    .name("nxt-gen-cli")
    .description("Create Next.js Project with Custom Features")
    .version(pkg.version)
    .argument("[name]", "Project name")
    .option("--pm <type>", "Package Manager (npm, pnpm, yarn, bun)")
    .option("--orm <type>", "ORM (prisma, drizzle, none)")
    .option("--react-query [boolean]", "Install React Query")
    .option("--axios [boolean]", "Install Axios")
    .option("--ui <type>", "UI Library (shadcn, heroui, both, none)")
    .option("--framer-motion [boolean]", "Install Framer Motion")
    .option("--lucide [boolean]", "Install Lucide React")
    .option("--examples <type>", "Examples (crud, auth, both, none)")
    .option("--docker [boolean]", "Add Docker Support")
    .option("--ci [boolean]", "Add CI/CD (GitHub Actions)")
    .option("--husky [boolean]", "Add Husky & Lint-staged")
    .option("--vitest [boolean]", "Add Vitest")
    .option("--playwright [boolean]", "Add Playwright")
    .option("--storybook [boolean]", "Add Storybook")
    .option("--forms [boolean]", "Add Forms (RHF + Zod)")
    .option("--intl [boolean]", "Add Internationalization (next-intl)")
    .option("--auth <type>", "Auth Provider (next-auth, clerk, none)")
    .option("--license <type>", "License (MIT, Apache, none)")
    .option("--no-install", "Skip dependency installation")
    .action(async (name, options) => {
      let projectName = name;

      if (!projectName) {
        const response = await prompts({
          type: "text",
          name: "name",
          message: "What is the name of your project?",
          initial: "my-app",
        });
        projectName = response.name;
      }

      if (!projectName) {
        console.log(chalk.red("Project name is required."));
        process.exit(1);
      }

      if (!validateProjectName(projectName)) {
        console.log(
          chalk.red(
            "Invalid project name. It must respect npm naming conventions (lowercase, no spaces, etc)."
          )
        );
        process.exit(1);
      }

      // Normalize and validate pm option
      if (options.pm) {
        if (!PACKAGE_MANAGERS.includes(options.pm as any)) {
          console.log(
            chalk.red(
              `Invalid package manager: ${options.pm}. Must be one of: ${PACKAGE_MANAGERS.join(", ")}`
            )
          );
          process.exit(1);
        }
        options.packageManager = options.pm as any;
        delete options.pm;
      }

      const config = await initialPrompt(options);
      console.log(chalk.blue("Selected Configuration:"), config);

      try {
        const { scaffoldProject } = await import("./scaffold.js");
        await scaffoldProject(projectName, config);
      } catch (error) {
        console.error(chalk.red("Failed to create project:"), error);
        process.exit(1);
      }
    });

  program.parse(process.argv);
}
