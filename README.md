# nxt-gen-cli

A command-line tool for scaffolding Next.js projects with a customizable tech stack. Skip the repetitive setup and get straight to building.

## Overview

nxt-gen-cli streamlines Next.js project creation by automating the installation and configuration of commonly used libraries. Customize your stack with best-in-class tools for database, networking, UI, testing, and more through an interactive prompt or command-line flags.

## Installation

With npx **(Recommended)**:

```bash
npx nxt-gen-cli my-project
```

Or install globally **(Beta)**:

```bash
npm install -g nxt-gen-cli
```

## Quick Start
    
### Interactive Mode

Run the CLI without arguments to use the interactive prompt:

```bash
nxt-gen-cli
```

You will be guided through selecting your project name and preferred stack options.

### Command-Line Mode

Specify options directly for non-interactive usage:

```bash
nxt-gen-cli my-project --orm prisma --react-query --axios --ui shadcn --framer-motion --lucide
```

## Features

### Database (ORM)

| Feature | Description                                                         |
| ------- | ------------------------------------------------------------------- |
| Prisma  | Full Prisma ORM setup with schema template and client configuration |
| Drizzle | Drizzle ORM setup with Drizzle Kit and schema configuration         |
| None    | Skip ORM setup                                                      |

### State Management and API

| Feature     | Description                                         |
| ----------- | --------------------------------------------------- |
| React Query | TanStack Query with provider component ready to use |
| Axios       | Pre-configured Axios client instance                |

### UI Libraries

| Option | Description                                                             |
| ------ | ----------------------------------------------------------------------- |
| shadcn | Tailwind CSS utilities with class-variance-authority and tailwind-merge |
| HeroUI | Complete HeroUI setup with Tailwind configuration                       |
| Both   | Install both shadcn utilities and HeroUI                                |
| None   | Skip UI library installation                                            |

### Forms

| Feature         | Description                                                                      |
| --------------- | -------------------------------------------------------------------------------- |
| React Hook Form | Performant, flexible and extensible forms with easy-to-use validation            |
| Zod             | TypeScript-first schema declaration and validation library (integrated with RHF) |

### Authentication

| Option   | Description                                       |
| -------- | ------------------------------------------------- |
| NextAuth | Complete authentication for Next.js (now Auth.js) |
| Clerk    | Complete user management and authentication       |
| None     | Skip authentication setup                         |

### Internationalization

| Feature   | Description                                                         |
| --------- | ------------------------------------------------------------------- |
| next-intl | Internationalization for Next.js with complete setup and middleware |

### DevOps

| Feature | Description                                       |
| ------- | ------------------------------------------------- |
| Docker  | Dockerfile and .dockerignore for containerization |
| CI/CD   | GitHub Actions workflow for building and linting  |

### Testing

| Feature    | Description                                     |
| ---------- | ----------------------------------------------- |
| Vitest     | Blazing fast unit test framework                |
| Playwright | Reliable end-to-end testing for modern web apps |

### Code Quality

| Feature     | Description                          |
| ----------- | ------------------------------------ |
| Husky       | Modern native Git hooks made easy    |
| Lint-staged | Run linters against staged git files |

### Additional Libraries

| Feature       | Description                                               |
| ------------- | --------------------------------------------------------- |
| Framer Motion | Animation library for React                               |
| Lucide React  | Icon library with tree-shakable icons                     |
| Storybook     | Frontend workshop for building UI components in isolation |

### Example Templates

| Option | Description                                                    |
| ------ | -------------------------------------------------------------- |
| CRUD   | Sample API route and page demonstrating create/read operations |
| Auth   | Authentication page placeholder or sign-in examples            |
| Both   | Include both example templates                                 |
| None   | Skip example generation                                        |

## CLI Options

```
Usage: nxt-gen-cli [name] [options]

Arguments:
  name                    Project name (prompted if not provided)

Options:
  --orm <type>            ORM: prisma, drizzle, none
  --react-query           Install React Query (TanStack Query)
  --axios                 Install Axios HTTP client
  --ui <type>             UI Library: shadcn, heroui, both, none
  --framer-motion         Install Framer Motion
  --lucide                Install Lucide React icons
  --examples <type>       Examples: crud, auth, both, none
  --docker                Add Docker Support
  --ci                    Add CI/CD (GitHub Actions)
  --husky                 Add Husky & Lint-staged
  --vitest                Add Vitest
  --playwright            Add Playwright
  --storybook             Add Storybook
  --forms                 Add Forms (RHF + Zod)
  --intl                  Add Internationalization (next-intl)
  --auth <type>           Auth Provider: next-auth, clerk, none
  --license <type>        License: MIT, Apache, none
  --no-install            Skip dependency installation
  -V, --version           Output version number
  -h, --help              Display help information
```

## Project Structure

After scaffolding, your project will have a structured organization based on the selected options.

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

## Base Stack

Every project created with nxt-gen-cli includes:

- Next.js with App Router
- TypeScript
- Tailwind CSS
- ESLint
- `src/` directory structure
- `@/*` import alias

## Examples

### Full Stack Project

```bash
nxt-gen-cli my-app --orm prisma --react-query --axios --ui both --framer-motion --lucide --examples both --auth next-auth
```

### Minimal API Project

```bash
nxt-gen-cli api-service --orm drizzle --axios --docker --ci
```

### Frontend-Only Project

```bash
nxt-gen-cli landing-page --ui shadcn --framer-motion --lucide --storybook
```

## Requirements

- Node.js 18.17.0 or later
- npm 9.0.0 or later

## Contributing

Contributions are welcome. Please open an issue to discuss proposed changes before submitting a pull request.

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

MIT License. See [LICENSE.md](LICENSE.md) for details.

## Author

Praboth Charith - [praboth.me](https://praboth.me)

## Links

- [Website](https://praboth.me/nxt-gen-cli)
- [GitHub Repository](https://github.com/PrabothCharith/nxt-gen-cli)
- [Issue Tracker](https://github.com/PrabothCharith/nxt-gen-cli/issues)
- [npm Package](https://www.npmjs.com/package/nxt-gen-cli)
