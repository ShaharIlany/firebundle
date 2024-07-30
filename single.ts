import { parseAndDownload } from "./parseAndDownload";

const getVersion = (packageName: string) => {
    const [name, version] = packageName.split("@").filter(part => part.length > 0)
    return [name, version ?? "latest"]
}

export const single = async (packageName: string) => {
    const [name, version] = getVersion(packageName)
    console.log(`Downloading ${name} (v: ${version})`)
    await parseAndDownload(name, {
        [name]: version
    })
}