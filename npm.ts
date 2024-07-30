import { exec } from "node:child_process"
import { promisify } from "node:util";

const execAsync = promisify(exec);

export const getRegistryUrl = async () => {
    const { stdout } = await execAsync("npm config get registry")
    return stdout.replaceAll("\n", "");
}