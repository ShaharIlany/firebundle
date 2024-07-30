import { get } from "node:https"
import { WriteStream } from "node:fs"

export const download = (url: string, stream: WriteStream, onData?: (current: number, total: number) => void): Promise<void> => new Promise<void>((resolve, reject) => {
    get(url, function (response) {
        var len = parseInt(response.headers['content-length'] ?? "0", 10);
        var cur = 0;
        var total = len;
        response.pipe(stream);
        response.on("data", function (chunk) {
            if (onData) {
                cur += chunk.length;
                onData(cur, total)
            }
        });
        stream.on("finish", () => {
            stream.close();
            resolve()
        });
        stream.on("error", () => reject())
    });
})