# Features Checklist & Roadmap

This document correlates to the planned improvements for `nxt-gen-cli`.

### Package Management
- [x] **Multi-Manager Support**: Detect and support `pnpm`, `yarn`, and `bun` in addition to `npm`.

### Core Stability
- [ ] **AST-Based Scaffolding**: Migrate from regex-based file editing to AST transforms (using `ts-morph`) for safer `layout.tsx` and config modifications.
- [x] **Validation**: Implement stricter input validation for project names.

### Testing & Quality
- [x] **Integrated Testing**: Include optional setup for **Vitest** and **React Testing Library**.
- [x] **E2E Testing**: Add optional **Playwright** configuration.
- [x] **Code Quality**: Add boilerplate for `husky` and `lint-staged` pre-commit hooks.

### CI/CD & DevOps
- [x] **GitHub Actions**: Generate a default CI pipeline (`.github/workflows/ci.yml`) for the user's new project.
- [x] **Docker Support**: Add option to generate a production-ready `Dockerfile`.
- [ ] **Automated Versioning**: Implement release workflow using Changesets or Semantic Release.

### Documentation & Extras
- [x] **Storybook**: Add an option to scaffold Storybook for component development.
- [x] **Environment Variables**: Auto-generate `.env.example` based on selected integrations.

### CLI Experience & UX (Tool Polish)
- [x] **Visual Overhaul**: Implement `gradient-string` and `figlet` for a premium startup banner.
- [x] **Rich Feedback**: Use `boxen` to display summary messages and next steps in a clean, framed layout.
- [x] **Update Notifications**: Integrate `update-notifier` to alert users of new CLI versions.

### Feature Expansion (New Scaffolding Options)
- [ ] **Authentication**: Add first-class scaffolding for **Auth.js (NextAuth)** and **Clerk**.
- [ ] **Forms & Validation**: Add option to pre-configure **React Hook Form** with **Zod** resolvers.
- [ ] **Internationalization**: Add scaffolding for `next-intl` for multi-language support.
