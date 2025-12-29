export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

export function detectPackageManager(): PackageManager {
  const userAgent = process.env.npm_config_user_agent;
  if (!userAgent) return "npm";
  if (userAgent.startsWith("pnpm")) return "pnpm";
  if (userAgent.startsWith("yarn")) return "yarn";
  if (userAgent.startsWith("bun")) return "bun";
  return "npm";
}

export function getInstallCommand(
  pm: PackageManager,
  packages: string[],
  isDev: boolean
): { command: string; args: string[] } {
  // If no packages, it's a general install
  if (packages.length === 0) {
    return { command: pm, args: ["install"] };
  }

  // npm uses 'install', others use 'add' (mostly)
  // yarn add, pnpm add, bun add. npm install.
  const cmd = pm === "npm" ? "install" : "add";

  const args = [cmd];

  if (isDev) {
    args.push("-D");
  }

  args.push(...packages);

  return { command: pm, args };
}

export function getDlxCommand(pm: PackageManager): {
  command: string;
  args: string[];
} {
  switch (pm) {
    case "pnpm":
      return { command: "pnpm", args: ["dlx"] };
    case "bun":
      return { command: "bun", args: ["x"] };
    // Yarn 1 (classic) relies on npx effectively, or global installs.
    // Modern yarn uses yarn dlx. Assuming npx is safe fallback or we use npx for yarn/npm.
    case "yarn":
      return { command: "npx", args: [] };
    default:
      return { command: "npx", args: [] };
  }
}
