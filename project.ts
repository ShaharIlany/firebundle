import { parseAndDownload } from "./parseAndDownload";
import { readFileSync } from "node:fs";

export const project = async (packageJsonPath: string) => {
    const packageJsonContent = JSON.parse(readFileSync(packageJsonPath, {
        encoding: "utf8",
    }))
    const toDownload = {
        ...packageJsonContent.devDependencies ?? {},
        ...packageJsonContent.peerDependencies ?? {},
        ...packageJsonContent.dependencies ?? {},
    }
    console.log(`Downloading ${Object.keys(toDownload).length} packages`)
    await parseAndDownload(packageJsonContent.name ?? "firebundle", toDownload)
}