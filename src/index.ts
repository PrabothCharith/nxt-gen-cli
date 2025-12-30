import { Command } from "commander";
import prompts from "prompts";
import chalk from "chalk";
import path from "path";
import fs from "fs-extra";

import updateNotifier from "update-notifier";
import { createRequire } from "module";
import { initialPrompt } from "./prompts.js";
import { validateProjectName } from "./lib/validation.js";

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
    .option("--prisma", "Install Prisma")
    .option("--react-query", "Install React Query")
    .option("--axios", "Install Axios")
    .option("--ui <type>", "UI Library (shadcn, heroui, both, none)")
    .option("--framer-motion", "Install Framer Motion")
    .option("--lucide", "Install Lucide React")
    .option("--examples <type>", "Examples (crud, auth, both, none)")
    .option("--docker", "Add Docker Support")
    .option("--ci", "Add CI/CD (GitHub Actions)")
    .option("--husky", "Add Husky & Lint-staged")
    .option("--vitest", "Add Vitest")
    .option("--playwright", "Add Playwright")
    .option("--storybook", "Add Storybook")
    .option("--forms", "Add Forms (RHF + Zod)")
    .option("--intl", "Add Internationalization (next-intl)")
    .option("--auth <type>", "Auth Provider (next-auth, clerk, none)")
    .option("--license <type>", "License (MIT, Apache, none)")
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
