
export enum ServerFileType {

    Json,
    Binary
}

export enum WriteType {

    Write,
    Append,
    WriteIntoSeparateFiles
}



export function readFileFromServer(filePath: string | URL, fileType: ServerFileType): Promise<Buffer | {}> {

    return new Promise((resolve, reject) => {

        const req = new XMLHttpRequest();
        req.open("GET", filePath, true);

        switch (fileType) {
            case ServerFileType.Json:
                req.responseType = "json";
                break;
            case ServerFileType.Binary:
                req.responseType = "arraybuffer";
                break;

            default:
                throw Error(`Unknown file type '${filePath}'`);
        }

        req.onload = (event) => {

            const result = req.response;

            if (result) {
                resolve(result);
            } else {
                reject(event);
            }
        };

        req.send(null);
    });

};

export async function writeLargeArrayBuffferToFile(
    filePath: string,
    data: (
        Uint8Array | Int8Array | Uint16Array | Int16Array | Uint32Array |
        Int32Array | BigUint64Array | BigInt64Array | Float32Array | Float64Array |
        Buffer
    ),
    writeType: WriteType
) {

    const fs = await import("fs");
    const bufferModule = await import("buffer");
    const maxBufferSize = bufferModule.constants.MAX_LENGTH / 2 - 1;
    const writeBufferElementsCount = Math.floor(maxBufferSize / data.BYTES_PER_ELEMENT);
    let mode = (writeType == WriteType.Append ? "a" : "w")

    let offset = 0;
    let id = 0;

    while (offset < data.length - 1) {

        console.log("#");

        let finalPath = filePath;

        if (writeType == WriteType.WriteIntoSeparateFiles) {

            finalPath = filePath.replace("${FILE_ID}", id + "");
        }

        fs.writeFileSync(finalPath, data.subarray(offset, offset + writeBufferElementsCount), { flag: mode });
        
        if (writeType == WriteType.Write) {
            mode = "a";
        }

        offset += writeBufferElementsCount;
        id ++;
    }

}