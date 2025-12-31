import { execa } from "execa";
import ora from "ora";

export const runCommand = async (
  command: string,
  args: string[],
  cwd: string
) => {
  const spinner = ora(`Running: ${command} ${args.join(" ")}`).start();
  try {
    spinner.stop();
    await execa(command, args, { cwd, stdio: "inherit" });
    spinner.succeed();
  } catch (error) {
    spinner.fail(`Failed to execute ${command}`);
    throw error;
  }
};
