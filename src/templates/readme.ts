import { ProjectConfig } from "../prompts.js";
import { PackageManager } from "../lib/pm.js";

export const generateReadme = (
  projectName: string,
  pm: PackageManager,
  config: ProjectConfig
): string => {
  const runCmd = pm === "npm" ? "npm run" : pm;
  const execCmd = pm === "npm" ? "npx" : pm === "yarn" ? "yarn" : `${pm} dlx`;

  const getRunScript = (script: string) =>
    pm === "npm" ? `npm run ${script}` : `${pm} ${script}`;

  let readme = `# ${projectName}

This project was bootstrapped with [nxt-gen-cli](https://github.com/PrabothCharith/nxt-gen-cli).

## Tech Stack

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | [Next.js 14+](https://nextjs.org/) | The React Framework for the Web |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | JavaScript with syntax for types |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | A utility-first CSS framework |
`;

  // UI Components
  if (config.ui === "shadcn") {
    readme += `| **UI Library** | [Shadcn UI](https://ui.shadcn.com/) | Beautifully designed components | \n`;
  } else if (config.ui === "heroui") {
    readme += `| **UI Library** | [HeroUI](https://heroui.com/) | Accessible and customizable UI library | \n`;
  } else if (config.ui === "both") {
    readme += `| **UI Library** | [Shadcn UI](https://ui.shadcn.com/) & [HeroUI](https://heroui.com/) | Dual UI component libraries | \n`;
  }

  // Icons & Animations
  if (config.lucide) {
    readme += `| **Icons** | [Lucide React](https://lucide.dev/) | Beautiful & consistent icons | \n`;
  }
  if (config.framerMotion) {
    readme += `| **Animations** | [Framer Motion](https://www.framer.com/motion/) | Production-ready animation library | \n`;
  }

  // Data Fetching
  if (config.reactQuery) {
    readme += `| **State Mgmt** | [TanStack Query](https://tanstack.com/query/latest) | Powerful asynchronous state management | \n`;
  }
  if (config.axios) {
    readme += `| **HTTP Client** | [Axios](https://axios-http.com/) | Promise based HTTP client | \n`;
  }

  // Database
  if (config.orm === "prisma") {
    readme += `| **ORM** | [Prisma](https://www.prisma.io/) | Next-generation Node.js and TypeScript ORM | \n`;
    readme += `| **Database** | SQLite (LibSQL) | Local database with LibSQL adapter | \n`;
  } else if (config.orm === "drizzle") {
    readme += `| **ORM** | [Drizzle](https://orm.drizzle.team/) | TypeScript ORM that loves SQL | \n`;
    readme += `| **Database** | SQLite (LibSQL) | Local database with LibSQL adapter | \n`;
  }

  // Auth
  if (config.auth === "next-auth") {
    readme += `| **Auth** | [Auth.js](https://authjs.dev/) | Authentication for Next.js | \n`;
  } else if (config.auth === "clerk") {
    readme += `| **Auth** | [Clerk](https://clerk.com/) | Complete user management | \n`;
  }

  // Forms
  if (config.forms) {
    readme += `| **Forms** | [RHF](https://react-hook-form.com/) + [Zod](https://zod.dev/) | Performant forms with schema validation | \n`;
  }

  // I18n
  if (config.intl) {
    readme += `| **I18n** | [next-intl](https://next-intl-docs.vercel.app/) | Internationalization for Next.js | \n`;
  }

  // Testing
  if (config.vitest) {
    readme += `| **Testing** | [Vitest](https://vitest.dev/) | Blazing fast unit test framework | \n`;
  }
  if (config.playwright) {
    readme += `| **E2E Testing** | [Playwright](https://playwright.dev/) | Reliable end-to-end testing | \n`;
  }

  // Storybook
  if (config.storybook) {
    readme += `| **Docs** | [Storybook](https://storybook.js.org/) | Frontend workshop for UI development | \n`;
  }

  readme += `

## Getting Started

### Prerequisites

- Node.js 18+ installed
- ${pm} package manager installed

### Installation

1.  **Clone the repository:**
    \`\`\`bash
    git clone <your-repo-url>
    cd ${projectName}
    \`\`\`

2.  **Install dependencies:**
    \`\`\`bash
    ${pm} install
    \`\`\`
`;

  // Environment Variables Section
  const hasEnv = config.orm !== "none" || config.auth !== "none" || config.intl;
  if (hasEnv) {
    readme += `
3.  **Set up environment variables:**

    Create a \`.env\` file in the root directory based on \`.env.example\`:

    \`\`\`bash
    cp .env.example .env
    \`\`\`

    **Configuration Guide:**

`;
    if (config.orm !== "none") {
      readme += `    - \`DATABASE_URL\`: Connection string for your database.
      - Default: \`"file:./dev.db"\` (Local SQLite)
      - Production: Set this to your actual database URL (e.g., Turso, Postgres, MySQL).
\n`;
    }

    if (config.auth === "next-auth") {
      readme += `    - \`AUTH_SECRET\`: A random string used to hash tokens.
      - Generate: \`npx auth secret\`
    - \`AUTH_GITHUB_ID\` & \`AUTH_GITHUB_SECRET\`: OAuth credentials for GitHub (if used).
    - \`AUTH_GOOGLE_ID\` & \`AUTH_GOOGLE_SECRET\`: OAuth credentials for Google (if used).
\n`;
    }
    if (config.auth === "clerk") {
      readme += `    - \`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY\`: Your Clerk Publishable Key.
    - \`CLERK_SECRET_KEY\`: Your Clerk Secret Key.
      - Get these from your [Clerk Dashboard](https://dashboard.clerk.com/).
\n`;
    }
  }

  // Database Setup
  if (config.orm === "prisma") {
    readme += `
4.  **Initialize Database (Prisma):**
    \`\`\`bash
    ${execCmd} prisma generate   # Generate Client
    ${execCmd} prisma db push    # Push schema to DB
    \`\`\`
`;
  } else if (config.orm === "drizzle") {
    readme += `
4.  **Initialize Database (Drizzle):**
    \`\`\`bash
    ${getRunScript("db:push")}   # Push schema to DB
    \`\`\`
`;
  }

  readme += `
5.  **Run the development server:**
    \`\`\`bash
    ${getRunScript("dev")}
    \`\`\`

    Open [http://localhost:3000](http://localhost:3000) with your browser.

## Available Scripts

| Script | Description |
| :--- | :--- |
| \`${getRunScript("dev")}\` | Starts the development server in watch mode |
| \`${getRunScript(
    "build"
  )}\` | Compiles the application for production deployment |
| \`${getRunScript("start")}\` | Starts the production server (requires build) |
| \`${getRunScript(
    "lint"
  )}\` | Analyzes code for potential errors using ESLint |
`;

  if (config.orm === "prisma") {
    readme += `| \`${execCmd} prisma studio\` | Opens a GUI to view and edit database records |
| \`${execCmd} prisma generate\` | Regenerates the Prisma Client (run after schema changes) |
| \`${execCmd} prisma db push\` | Synchronizes the database state with your Prisma schema |
`;
  }
  if (config.orm === "drizzle") {
    readme += `| \`${getRunScript(
      "db:push"
    )}\` | Pushes schema changes to the database |
| \`${getRunScript(
      "db:studio"
    )}\` | Opens Drizzle Studio to inspect the database |
`;
  }
  if (config.vitest) {
    readme += `| \`${getRunScript(
      "test"
    )}\` | Runs unit tests using Vitest | \n`;
  }
  if (config.playwright) {
    readme += `| \`${getRunScript(
      "test:e2e"
    )}\` | Runs end-to-end tests using Playwright | \n`;
  }
  if (config.storybook) {
    readme += `| \`${getRunScript(
      "storybook"
    )}\` | Starts the Storybook development server |
| \`${getRunScript(
      "build-storybook"
    )}\` | Builds the Storybook static site | \n`;
  }
  if (config.husky) {
    readme += `| \`prepare\` | Sets up Husky git hooks | \n`;
  }

  // --- FEATURE GUIDES ---

  if (config.orm !== "none") {
    readme += `
## Database Management
`;
    if (config.orm === "prisma") {
      readme += `
This project uses **Prisma** as the ORM.

- **Schema**: Defined in \`prisma/schema.prisma\`.
- **Migrations**: Since we use \`db push\` for rapid prototyping with SQLite, actual migration files are not generated. For production with other DBs, use \`prisma migrate dev\`.
- **Studio**: Run \`${execCmd} prisma studio\` to view your data interactively.
`;
    } else {
      readme += `
This project uses **Drizzle ORM**.

- **Schema**: Defined in \`src/db/schema.ts\`.
- **Config**: Settings are in \`drizzle.config.ts\`.
- **Client**: Database connection logic in \`src/lib/db.ts\`.
- **Studio**: Run \`${getRunScript(
        "db:studio"
      )}\` to view your data interactively.
`;
    }
  }

  if (config.auth !== "none") {
    readme += `
## Authentication
`;
    if (config.auth === "next-auth") {
      readme += `
User authentication is handled by **Auth.js (NextAuth)**.

- **Configuration**: \`src/lib/auth.ts\` contains the providers and callback logic.
- **Providers**: By default, the template may include GitHub or Google. Add more in the config file.
- **Middleware**: Protected routes are managed in \`src/middleware.ts\`.
`;
    } else {
      readme += `
User authentication is managed by **Clerk**.

- **Middleware**: \`src/middleware.ts\` protects routes using \`clerkMiddleware\`.
- **Components**: Use \`<SignIn />\`, \`<SignUp />\`, and \`<UserButton />\` components provided by Clerk.
`;
    }
  }

  if (config.ui !== "none") {
    readme += `
## UI & Styling
`;
    if (config.ui === "shadcn" || config.ui === "both") {
      readme += `
### Shadcn UI

- **Components**: Located in \`src/components/ui\`.
- **Adding Components**: Use the CLI to add new ones:
  \`\`\`bash
  npx shadcn-ui@latest add button input
  \`\`\`
- **Theming**: Customize colors in \`src/app/globals.css\`.
`;
    }
    if (config.ui === "heroui" || config.ui === "both") {
      readme += `
### HeroUI

- **Provider**: The app is wrapped in \`<HeroUIProvider>\` within \`src/components/providers.tsx\`.
- **Usage**: Import components directly from \`@heroui/react\`.
`;
    }
  }

  if (config.vitest || config.playwright) {
    readme += `
## Testing
`;
    if (config.vitest) {
      readme += `
### Unit Testing (Vitest)
- **Run Tests**: \`${getRunScript("test")}\`
- **Files**: Look for \`__tests__\` folders or \`*.test.tsx\` files.
- **Tooling**: Uses React Testing Library for component testing.
`;
    }
    if (config.playwright) {
      readme += `
### E2E Testing (Playwright)
- **Run Tests**: \`${getRunScript("test:e2e")}\`
- **UI Mode**: \`${execCmd} playwright test --ui\`
- **Files**: Defined in \`e2e/\` directory.
`;
    }
  }

  if (config.storybook) {
    readme += `
## Storybook
Display your UI components in isolation.
- **Run**: \`${getRunScript("storybook")}\`
- **Files**: Stories are defined in \`src/**/*.stories.tsx\`.
`;
  }

  if (config.docker) {
    readme += `
## Docker

- **Build Image**: \`docker build -t ${projectName} .\`
- **Run Container**: \`docker run -p 3000:3000 ${projectName}\`
`;
  }

  readme += `
## Project Structure

\`\`\`
src/
├── app/              # Next.js App Router (Pages & API)
├── components/       # React Components
│   ├── ui/           # Reusable UI elements (Shadcn/HeroUI)
│   └── providers/    # Context providers (Theme, Auth, Query)
├── lib/              # Utilities, specific libs (db, auth, utils)
${config.orm === "drizzle" ? "├── db/               # Drizzle schema\n" : ""}${
    config.intl ? "├── i18n/             # I18n configuration\n" : ""
  }└── styles/           # Global CSS and Tailwind config
\`\`\`

---

Generated by [nxt-gen-cli](https://github.com/PrabothCharith/nxt-gen-cli)
`;

  return readme;
};
