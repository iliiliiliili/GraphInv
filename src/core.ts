import { TypedArray } from "osigma/core/ograph";

export enum ServerFileType {

    Json,
    Binary
}

export enum WriteType {

    Write,
    Append,
    WriteIntoSeparateFiles
}


export const bufferToTypedArrayNode = (buffer: Buffer, array: TypedArray) => {

    if (array instanceof Int8Array) {

        return new Int8Array(
            buffer.buffer,
            buffer.byteOffset,
            buffer.length
        )
    }
    if (array instanceof Uint8Array) {

        return new Uint8Array(
            buffer.buffer,
            buffer.byteOffset,
            buffer.length
        )
    }
    if (array instanceof Uint8ClampedArray) {

        return new Uint8ClampedArray(
            buffer.buffer,
            buffer.byteOffset,
            buffer.length
        )
    }
    if (array instanceof Int16Array) {

        return new Int16Array(
            buffer.buffer,
            buffer.byteOffset,
            buffer.length / 2
        )
    }
    if (array instanceof Uint16Array) {

        return new Uint16Array(
            buffer.buffer,
            buffer.byteOffset,
            buffer.length / 2
        )
    }
    if (array instanceof Int32Array) {

        return new Int32Array(
            buffer.buffer,
            buffer.byteOffset,
            buffer.length / 4
        )
    }
    if (array instanceof Uint32Array) {

        return new Uint32Array(
            buffer.buffer,
            buffer.byteOffset,
            buffer.length / 4
        )
    }
    if (array instanceof Float32Array) {

        return new Float32Array(
            buffer.buffer,
            buffer.byteOffset,
            buffer.length / 4
        )
    }
    if (array instanceof Float64Array) {

        return new Float64Array(
            buffer.buffer,
            buffer.byteOffset,
            buffer.length / 8
        )
    }

    throw Error(`Array ${array} is not of a known type for buffer to TypedArray conversion`);
}

export const bufferToTypedArrayWeb = (buffer: Buffer, array: TypedArray) => {

    if (array instanceof Int8Array) {

        return new Int8Array(buffer)
    }
    if (array instanceof Uint8Array) {

        return new Uint8Array(buffer)
    }
    if (array instanceof Uint8ClampedArray) {

        return new Uint8ClampedArray(buffer)
    }
    if (array instanceof Int16Array) {

        return new Int16Array(buffer)
    }
    if (array instanceof Uint16Array) {

        return new Uint16Array(buffer)
    }
    if (array instanceof Int32Array) {

        return new Int32Array(buffer)
    }
    if (array instanceof Uint32Array) {

        return new Uint32Array(buffer)
    }
    if (array instanceof Float32Array) {

        return new Float32Array(buffer)
    }
    if (array instanceof Float64Array) {

        return new Float64Array(buffer)
    }

    throw Error(`Array ${array} is not of a known type for buffer to TypedArray conversion`);
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
        TypedArray |
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