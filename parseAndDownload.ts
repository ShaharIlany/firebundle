import { mkdir, rm } from "node:fs/promises";
import { writeFileSync, readFileSync } from "node:fs";
import { createWriteStream, WriteStream } from "node:fs";
import { exec } from "node:child_process"
import { win32 } from "node:path";
import { download } from "./download";
import { create } from "tar";
import { sleep } from "./sleep";
import { Presets, MultiBar } from "cli-progress"
import pLimit from 'p-limit';
import { getRegistryUrl } from "./npm";
import cliSpinners from "cli-spinners";
import { promisify } from "node:util";
import ora from "ora";

const execAsync = promisify(exec);
const spinner = ora({ text: 'Scanning dependencies', spinner: cliSpinners.bouncingBar })

const limit = pLimit(10);

const multibar = new MultiBar({
    clearOnComplete: false,
    hideCursor: true,
    format: ' {bar} | {filename} | {percentage}%',
}, Presets.shades_grey);

const downloadTarball = async (url: string, filename: string, stream: WriteStream) => {
    const bar = multibar.create(100, 0, { filename })
    await download(url, stream, (current, total) => {
        bar.setTotal(total)
        bar.update(current)
    })
    bar.update(bar.getTotal())
    await sleep(500)
    multibar.remove(bar)
}

export const parseAndDownload = async (firebundleName: string, packages: Record<string, string>) => {
    const CURRENT_TIME = `${+new Date()}`;
    const TEMP_DIRECTORY = `.tmp_${CURRENT_TIME}`
    const TEMP_PACKAGE_JSON = `${TEMP_DIRECTORY}/package.json`
    const TEMP_PACKAGE_LOCK_JSON = `${TEMP_DIRECTORY}/package-lock.json`

    const PACKAGE_JSON_CONTENT = {
        dependencies: packages
    }

    await mkdir(TEMP_DIRECTORY)
    await writeFileSync(TEMP_PACKAGE_JSON, JSON.stringify(PACKAGE_JSON_CONTENT, undefined, 2))
    const REGISTRY_URL = await getRegistryUrl()
    spinner.start()
    await execAsync("npm i --package-lock-only", {
        cwd: process.cwd() + "/" + TEMP_DIRECTORY,
    });
    spinner.stop()
    console.log("Scanning dependencies")
    const packageLockJson = JSON.parse(readFileSync(TEMP_PACKAGE_LOCK_JSON, {
        encoding: "utf8",
    }))
    if (!("packages" in packageLockJson)) {
        console.log("No dependencies found")
        return
    }
    await mkdir(TEMP_DIRECTORY + "/tarball")
    const downloadLinks: Promise<void>[] = []
    for (const packageDetailsKey of Object.keys(packageLockJson.packages)) {
        if (packageDetailsKey.length > 0) {
            const packageDetails = packageLockJson.packages[packageDetailsKey]
            if ("resolved" in packageDetails) {
                const url: string = packageDetails.resolved
                const savePath = url.replace(REGISTRY_URL, "")
                await mkdir(TEMP_DIRECTORY + win32.dirname(`/tarball/${savePath}`), { recursive: true });
                const file = createWriteStream(TEMP_DIRECTORY + `/tarball/${savePath}`)
                downloadLinks.push(limit(() => downloadTarball(url, savePath, file)))
            }
        }
    }



    console.log(`Resolved ${downloadLinks.length} dependencies. Starting download process`)
    console.log()
    await Promise.all(downloadLinks)
    multibar.stop()

    const fileExtension = ".tgz"
    const fileName = `${firebundleName}_${CURRENT_TIME}${fileExtension}`
    console.log(`Saving ${fileExtension} file`)
    await create({ file: fileName, C: TEMP_DIRECTORY + "/tarball", gzip: true }, ["."])
    await sleep(1000)
    console.log(`Done - Saved to ./${fileName}`)

    await rm(TEMP_DIRECTORY, { recursive: true, force: true })
}