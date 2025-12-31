export function validateProjectName(name: string): boolean {
  const nameRegex =
    /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;
  return nameRegex.test(name);
}
