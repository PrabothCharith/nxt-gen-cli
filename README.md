# nxt-gen-cli

<div align="center">

![npm](https://img.shields.io/npm/v/nxt-gen-cli?style=flat-square&color=000000)
![license](https://img.shields.io/npm/l/nxt-gen-cli?style=flat-square&color=000000)
![downloads](https://img.shields.io/npm/dt/nxt-gen-cli?style=flat-square&color=000000)
![stars](https://img.shields.io/github/stars/PrabothCharith/nxt-gen-cli?style=flat-square&color=000000)

<br />

<h1>The Ultimate Next.js Scaffold CLI</h1>

<p>
  <b>Skip the repetitive setup. Build your dream stack in seconds.</b>
</p>

[Website](https://praboth.me/nxt-gen-cli) • [Report Bug](https://github.com/PrabothCharith/nxt-gen-cli/issues) • [Request Feature](https://github.com/PrabothCharith/nxt-gen-cli/issues)

</div>

---

## Overview

**nxt-gen-cli** is a powerful command-line tool designed to streamline the creation of Next.js applications. It automates the configuration of essential tools and libraries, allowing you to focus on building features, not configuration.

Whether you need a full-stack application with **Prisma** and **Auth.js**, or a lightweight frontend with **Shadcn UI**, nxt-gen-cli has you covered.

## Installation

Run directly with `npx` to always use the latest version (Recommended):

```bash
npx nxt-gen-cli@latest
```

Or install globally:

```bash
npm install -g nxt-gen-cli
```

## Quick Start

### Interactive Mode

Simply run the command and follow the prompts:

```bash
npx nxt-gen-cli
```

You will be guided to select your preferred tools:
-   **ORM**: Prisma, Drizzle, or None
-   **UI Library**: Shadcn UI, HeroUI, Both, or None
-   **Authentication**: NextAuth.js (Auth.js), Clerk, or None
-   **State Management**: React Query, Axios
-   **Validation**: Zod + React Hook Form
-   **Testing**: Vitest, Playwright
-   **Extras**: Docker, Storybook, i18n, etc.

### Command-Line Flags

For power users, skip the prompts by passing flags directly:

```bash
# Create a full-stack app with pnpm
npx nxt-gen-cli my-app --pm pnpm --orm prisma --ui shadcn --auth next-auth --react-query

# Create a minimal API service with yarn
npx nxt-gen-cli api-service --pm yarn --orm drizzle --docker --ci

# Create a project with bun
npx nxt-gen-cli my-bun-app --pm bun --ui shadcn --react-query
```

## Features

### Database & ORM
| Feature     | Description                                            |
| ----------- | ------------------------------------------------------ |
| **Prisma**  | Full Prisma ORM setup with schema template and client. |
| **Drizzle** | Lightweight, type-safe SQL ORM with Drizzle Kit.       |

### UI & Styling
| Feature           | Description                                           |
| ----------------- | ----------------------------------------------------- |
| **Shadcn UI**     | Beautiful, accessible components built with Radix UI. |
| **HeroUI**        | Modern, fast, and accessible UI library.              |
| **Framer Motion** | Production-ready animation library for React.         |
| **Lucide React**  | Clean, consistent, and tree-shakable icons.           |

### Authentication
| Feature         | Description                                   |
| --------------- | --------------------------------------------- |
| **NextAuth.js** | Complete authentication solution for Next.js. |
| **Clerk**       | Complete user management and authentication.  |

### Core & Infrastructure
| Feature         | Description                                            |
| --------------- | ------------------------------------------------------ |
| **React Query** | Powerful asynchronous state management.                |
| **Axios**       | Promise based HTTP client for the browser and node.js. |
| **Forms**       | Integrated React Hook Form + Zod validation.           |
| **i18n**        | Internationalization support with `next-intl`.         |

### Quality & DevOps
| Feature     | Description                                           |
| ----------- | ----------------------------------------------------- |
| **Testing** | Vitest for unit tests, Playwright for E2E.            |
| **CI/CD**   | GitHub Actions workflows for build and lint.          |
| **Docker**  | Containerization with standardized Dockerfile.        |
| **Husky**   | Git hooks for pre-commit linting and commit messages. |

## CLI Options

```text
Usage: nxt-gen-cli [name] [options]

Arguments:
  name                    Project name (prompted if not provided)

Options:
  --pm <type>             Package Manager: npm, pnpm, yarn, bun
  --orm <type>            ORM: prisma, drizzle, none
  --auth <type>           Auth Provider: next-auth, clerk, none
  --ui <type>             UI Library: shadcn, heroui, both, none
  --react-query           Install React Query (TanStack Query)
  --axios                 Install Axios HTTP client
  --forms                 Add Forms (RHF + Zod)
  --intl                  Add Internationalization (next-intl)
  --docker                Add Docker Support
  --ci                    Add CI/CD (GitHub Actions)
  --husky                 Add Husky & Lint-staged
  --vitest                Add Vitest
  --playwright            Add Playwright
  --storybook             Add Storybook
  --framer-motion         Install Framer Motion
  --lucide                Install Lucide React icons
  --examples <type>       Examples: crud, auth, both, none
  --license <type>        License: MIT, Apache, none
  --no-install            Skip dependency installation
  -h, --help              Display help information
```

## Project Structure

```bash
my-project/
├── .github/
│   └── workflows/
│       └── ci.yml             # if --ci
├── .husky/                    # if --husky
├── e2e/
│   └── example.spec.ts        # if --playwright
├── messages/
│   └── en.json                # if --intl
├── prisma/
│   └── schema.prisma          # if --orm prisma
├── public/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/          # if --auth next-auth
│   │   │   └── posts/         # if --examples crud
│   │   ├── auth/              # if --examples auth
│   │   ├── posts/             # if --examples crud
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── examples/          # if --forms
│   │   ├── providers/
│   │   │   └── query-provider.tsx # if --react-query
│   │   └── providers.tsx
│   ├── db/
│   │   └── schema.ts          # if --orm drizzle
│   ├── lib/
│   │   ├── auth.ts            # if --auth next-auth
│   │   ├── axios.ts           # if --axios
│   │   ├── db.ts              # if --orm drizzle
│   │   ├── prisma.ts          # if --orm prisma
│   │   ├── schemas.ts         # if --forms
│   │   └── utils.ts           # if --ui shadcn
│   ├── i18n.ts                # if --intl
│   └── middleware.ts          # if --auth clerk OR --intl
├── .dockerignore              # if --docker
├── .env
├── Dockerfile                 # if --docker
├── drizzle.config.ts          # if --orm drizzle
├── next.config.mjs
├── package.json
├── playwright.config.ts       # if --playwright
├── prisma.config.ts           # if --orm prisma
├── tailwind.config.ts
├── tsconfig.json
└── vitest.config.ts           # if --vitest
```

## Contributing

Contributions are welcome! Please open an issue to discuss proposed changes before submitting a pull request.

1.  Fork the repository
2.  Create a feature branch (`git checkout -b feature/amazing-feature`)
3.  Commit your changes (`git commit -m 'Add some amazing feature'`)
4.  Push to the branch (`git push origin feature/amazing-feature`)
5.  Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE.md` for more information.

## Author

**Praboth Charith**
-   Website: [praboth.me](https://praboth.me)
-   GitHub: [@PrabothCharith](https://github.com/PrabothCharith)
