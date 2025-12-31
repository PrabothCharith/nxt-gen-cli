/**
 * Dependency collector for batching package installations
 */
export class DependencyCollector {
  private dependencies: Set<string> = new Set();
  private devDependencies: Set<string> = new Set();

  addDep(pkg: string): void {
    this.dependencies.add(pkg);
  }

  addDevDep(pkg: string): void {
    this.devDependencies.add(pkg);
  }

  addDeps(pkgs: string[]): void {
    pkgs.forEach((pkg) => this.dependencies.add(pkg));
  }

  addDevDeps(pkgs: string[]): void {
    pkgs.forEach((pkg) => this.devDependencies.add(pkg));
  }

  getDeps(): string[] {
    return Array.from(this.dependencies);
  }

  getDevDeps(): string[] {
    return Array.from(this.devDependencies);
  }

  getAll(): { deps: string[]; devDeps: string[] } {
    return {
      deps: this.getDeps(),
      devDeps: this.getDevDeps(),
    };
  }

  isEmpty(): boolean {
    return this.dependencies.size === 0 && this.devDependencies.size === 0;
  }

  getTotalCount(): number {
    return this.dependencies.size + this.devDependencies.size;
  }
}
